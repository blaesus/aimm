use std::collections::HashMap;
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;

use git2::Repository;
use serde::Deserialize;

use crate::args::ScanArgs;
use crate::manifest::{AimmModuleManifest, ModuleManifestItem};
use crate::utils::sha256_file;

#[allow(non_snake_case)]
#[derive(Debug, Deserialize)]
struct Repository_FileRecordApiItem {
    id: String,
    name: String,
    registry: String,
    idInRegistry: String,
    favour: u64,
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize)]
struct Revision_FileRecordApiItem {
    id: String,
    idInRegistry: String,
    repo: Repository_FileRecordApiItem,
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize)]
struct FileRecordApiItem {
    id: String,
    hashA: String,
    downloadUrl: String,
    filename: String,
    revision: Revision_FileRecordApiItem,
}

#[derive(Debug, Deserialize)]
struct FileResponse(Vec<FileRecordApiItem>);

fn pick_file_records(file_records: &[FileRecordApiItem]) -> Option<&FileRecordApiItem> {
    file_records
        .iter()
        .max_by(|a, b| a.revision.repo.favour.cmp(&b.revision.repo.favour))
}

fn download_file_records(sha256: &str) -> Vec<FileRecordApiItem> {
    // let api_url = format!("http://localhost:4000/files?sha256={}", sha256);
    let api_url = format!("https://api.aimm.dev/files?sha256={}", sha256);
    println!("Getting {}", api_url);
    let Ok(response) = reqwest::blocking::get(&api_url) else {return vec![]};
    let Ok(json)= response.json::<FileResponse>() else {return vec![]};
    return json.0;
}

pub fn scan(args: &ScanArgs) {
    let root = PathBuf::from(args.root.as_ref().map(|r| r.as_str()).unwrap_or("."));
    let ai_extensions = vec![
        "safetensors",
        "pt",
        "pth",
        "bin",
        "bin.1",
        "bin.2",
        "bin.3",
        "bin.4",
    ];

    let base = root.clone();

    let ai_files = {
        let mut files = Vec::new();
        let mut directories = vec![root.clone()];
        while let Some(dir) = directories.pop() {
            // Check if dir is a git repo
            let is_git = dir.join(".git").exists();
            let is_git_submodule = is_git && (dir != root);
            if is_git_submodule {
                let repo = match Repository::open(dir) {
                    Ok(repo) => repo,
                    Err(e) => panic!("failed to init: {}", e),
                };
                println!("Found git repo: {:?}", repo.path());
                let head = repo.head().unwrap();
                let branch_name = head.shorthand().unwrap();
                println!("Current branch: {}", branch_name);
            } else {
                for entry in std::fs::read_dir(dir).unwrap() {
                    let entry = entry.unwrap();
                    let path = entry.path();
                    if path.is_dir() {
                        directories.push(path);
                    } else {
                        match path.extension() {
                            None => continue,
                            Some(extension) => {
                                let is_ai_file = ai_extensions
                                    .iter()
                                    .any(|ext| extension.eq_ignore_ascii_case(ext));
                                if is_ai_file {
                                    let relative_path = path.strip_prefix(&base).unwrap();
                                    files.push(relative_path.to_owned());
                                }
                            }
                        }
                    }
                }
            }
        }
        files
    };

    let current_dir = std::env::current_dir().unwrap().into_os_string();

    let mut manifest = AimmModuleManifest {
        manifestVersion: "0.1.0".to_owned(),
        name: current_dir.to_string_lossy().to_string(),
        version: "0.1.0".to_owned(),
        description: "".to_owned(),
        license: "NOTLICENSED".to_owned(),
        authors: vec![],
        items: HashMap::new(),
        submodules: HashMap::new(),
    };

    for file in ai_files {
        println!("file: {:?}", file);
        let sha = sha256_file(&file.to_string_lossy()).unwrap();
        let file_records = download_file_records(&sha);
        match pick_file_records(&file_records) {
            None => {
                println!("No file records found for {}", file.to_string_lossy());
                manifest.items.insert(
                    file.to_string_lossy().to_string(),
                    ModuleManifestItem {
                        name: file.file_name().unwrap().to_string_lossy().to_string(),
                        path: file.to_string_lossy().to_string(),
                        sha256: sha,
                        url: String::new(),
                    },
                );
            }
            Some(record) => {
                println!(
                    "Using {} for {}",
                    record.downloadUrl,
                    file.to_string_lossy()
                );
                manifest.items.insert(
                    record.downloadUrl.clone(),
                    ModuleManifestItem {
                        name: file.file_name().unwrap().to_string_lossy().to_string(),
                        path: file.to_string_lossy().to_string(),
                        sha256: sha,
                        url: record.downloadUrl.clone(),
                    },
                );
            }
        }
    }

    let manifest_json = serde_json::to_string_pretty(&manifest).unwrap();
    // write json to a file
    let mut file = File::create("aimm.json").unwrap();
    file.write_all(manifest_json.as_bytes()).unwrap();
}
