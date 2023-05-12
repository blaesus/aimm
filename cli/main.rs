mod args;
mod manifest;
mod subcommands;
mod utils;

use std::collections::HashMap;
use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use clap::Parser;
use git2::{Repository, RepositoryInitOptions};
use reqwest;
use serde::{Deserialize, Serialize};
use serde_json;
use url::{ParseError, Url};

use crate::args::{Cli, InstallFromManifestMode, SubCommands};
use crate::manifest::{AimmModuleManifest, ModuleManifestItem};
use crate::subcommands::add;
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

fn download_file_records(sha256: &str) -> Vec<FileRecordApiItem> {
    // let api_url = format!("http://localhost:4000/files?sha256={}", sha256);
    let api_url = format!("https://api.aimm.dev/files?sha256={}", sha256);
    println!("Getting {}", api_url);
    let Ok(response) = reqwest::blocking::get(&api_url) else {return vec![]};
    let Ok(json)= response.json::<FileResponse>() else {return vec![]};
    return json.0;
}

fn pick_file_records(file_records: &[FileRecordApiItem]) -> Option<&FileRecordApiItem> {
    file_records
        .iter()
        .max_by(|a, b| a.revision.repo.favour.cmp(&b.revision.repo.favour))
}

fn git_clone(url: &str) {
    // set the path where the cloned repository will be created
    let local_path = Path::new("./test");

    // perform the clone operation
    let _repo = git2::build::RepoBuilder::new()
        .fetch_options({
            let mut fetch_options = git2::FetchOptions::new();
            fetch_options
                .download_tags(git2::AutotagOption::All)
                .proxy_options({
                    let mut proxy_options = git2::ProxyOptions::new();
                    proxy_options.auto();
                    proxy_options
                })
                .update_fetchhead(true);
            fetch_options
        })
        .clone(url, local_path)
        .unwrap();
}

fn scan(root: PathBuf) {
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
        let mut directories = vec![root];
        while let Some(dir) = directories.pop() {
            // Check if dir is a git repo
            let git_dir = dir.join(".git");
            if git_dir.exists() {
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

fn install_from_manifest(manifest: AimmModuleManifest, mode: InstallFromManifestMode) {
    for (designation, item) in manifest.items {
        let expected_sha = item.sha256;
        if Path::new(&item.path).exists() {
            let existing_sha = sha256_file(&item.path).unwrap();
            if existing_sha == expected_sha {
                println!(
                    "Skipping {} because it already exists with SHA256 {}, as expected",
                    item.path, existing_sha
                );
                continue;
            } else {
                // File exists
                match mode {
                    InstallFromManifestMode::Keep => {
                        println!(
                            "Skipping {} because it already exists (SHA256 {}), even if we expected {}",
                            item.path, existing_sha, expected_sha
                        );
                        continue;
                    }
                    InstallFromManifestMode::Update => {
                        println!(
                            "Updating {} because it already exists (SHA256 {}), but we expected {}",
                            item.path, existing_sha, expected_sha
                        );
                        // Rename current file
                        let mut new_path = item.path.clone();
                        new_path.push_str(".old");
                        std::fs::rename(&item.path, &new_path).unwrap();
                    }
                    _ => (),
                }
            }
        }

        let webroot = Url::parse(&item.url).unwrap().host().unwrap().to_string();

        let headers = {
            let mut header_map = reqwest::header::HeaderMap::new();
            header_map.insert(reqwest::header::ORIGIN, webroot.parse().unwrap());
            header_map.insert(reqwest::header::REFERER, webroot.parse().unwrap());
            header_map
        };

        let client = reqwest::blocking::Client::builder()
            .user_agent(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36"
            )
            .build()
            .unwrap();

        println!("Getting {}", item.url);
        let mut response = client.get(&item.url).headers(headers).send().unwrap();
        let mut dest = {
            let path = Path::new(&item.path);
            if let Some(parent) = path.parent() {
                std::fs::create_dir_all(parent).unwrap();
            }
            println!("Saving to {}", path.display());
            File::create(&path).unwrap()
        };
        std::io::copy(&mut response, &mut dest).unwrap();
        // verify sha256
        let computed_sha = sha256_file(&item.path).unwrap();
        if computed_sha != expected_sha {
            eprintln!("SHA256 mismatch for {}", item.path);
        } else {
            println!(
                "SHA256 verified for {} with sha256 {}",
                item.path, computed_sha
            );
        }
    }
}

fn main() {
    let cli = Cli::parse();
    // You can check for the existence of subcommands, and if found use their
    // matches just as you would the top level cmd
    match &cli.command {
        Some(SubCommands::Add(args)) => add(args),
        Some(SubCommands::Scan { root }) => {
            let root = root.as_ref().map(|r| r.as_str()).unwrap_or(".");
            scan(PathBuf::from(root));
        }
        Some(SubCommands::Install {
            manifest,
            target,
            mode,
        }) => {
            let manifest_name = manifest;
            let manifest_text = std::fs::read_to_string(manifest_name).unwrap();
            let parsed = serde_json::from_str::<AimmModuleManifest>(&manifest_text).unwrap();
            let mode = mode.clone().unwrap_or_default();
            install_from_manifest(parsed, mode)
        }
        None => {}
    }
}
