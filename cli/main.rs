use std::error::Error;
use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use clap::{Parser, Subcommand};
use git2::{Repository, RepositoryInitOptions};
use reqwest;
use serde::{Deserialize, Serialize};
use serde_json;
use sha2::{Digest, Sha256};
use url::{ParseError, Url};

fn sha256_file(path: &str) -> Result<String, Box<dyn Error>> {
    let mut file = File::open(path)?;
    let mut buffer = [0; 32 * 1024]; // Create a buffer to read file content

    let mut hasher = Sha256::new(); // Create a new SHA256 hasher

    loop {
        let bytes_read = file.read(&mut buffer)?; // Read file content to buffer
        if bytes_read == 0 {
            break; // End of file
        }
        hasher.update(&buffer[..bytes_read]); // Hash the read bytes
    }

    let hash = hasher.finalize(); // Get the SHA256 hash value
    Ok(format!("{:x}", hash))
}

enum ManifestItemType {
    File,
    Git,
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize, Serialize)]
struct ModuleManifestItem {
    name: String,
    path: String,
    sha256: String,
    url: String,
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize, Serialize)]
struct AimmModuleManifest {
    manifestVersion: String,
    name: String,
    version: String,
    description: String,
    license: String,
    authors: Vec<String>,
    items: Vec<ModuleManifestItem>,
    subModules: Vec<AimmModuleManifest>,
}

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

fn download_file_records(sha256: &str) -> Result<Vec<FileRecordApiItem>, Box<dyn Error>> {
    // let api_url = format!("http://localhost:3030/files?sha256={}", sha256);
    let api_url = format!("http://api.apm.run/api/files?sha256={}", sha256);
    println!("Getting {}", api_url);
    let response: FileResponse = reqwest::blocking::get(&api_url)?.json()?;
    return Ok(response.0);
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
        items: vec![],
        subModules: vec![],
    };

    for file in ai_files {
        let sha = sha256_file(&file.to_string_lossy()).unwrap();
        let file_records = download_file_records(&sha).unwrap();
        match pick_file_records(&file_records) {
            None => {
                println!("No file records found for {}", file.to_string_lossy());
            }
            Some(record) => {
                println!(
                    "Using {} for {}",
                    record.downloadUrl,
                    file.to_string_lossy()
                );
                manifest.items.push(ModuleManifestItem {
                    name: file.file_name().unwrap().to_string_lossy().to_string(),
                    path: file.to_string_lossy().to_string(),
                    sha256: sha,
                    url: record.downloadUrl.clone(),
                });
            }
        }
    }

    let manifest_json = serde_json::to_string_pretty(&manifest).unwrap();
    // write json to a file
    let mut file = File::create("aimm.json").unwrap();
    file.write_all(manifest_json.as_bytes()).unwrap();
}

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Option<SubCommands>,
}

#[derive(Subcommand)]
enum SubCommands {
    /// does testing things
    Scan {
        root: Option<String>,
    },
    Add {
        target: Option<String>,
    },
    Install {
        target: Option<String>,
    },
}

fn is_path_probably_git(target: &str) -> bool {
    let git_services = vec!["github.com", "gitlab.com", "huggingface.co"];
    let url = Url::parse(target).unwrap();
    let ext = Path::new(url.path()).extension();
    println!("ext {:?}", ext);
    if url.scheme() == "git" {
        true
    } else {
        let is_git_capable_service = url
            .host()
            .map(|x| git_services.iter().any(|s| *s == x.to_string()))
            .unwrap_or(false);

        let path_extension = Path::new(url.path()).extension();

        return if !is_git_capable_service {
            false
        } else if let Some(ext) = path_extension {
            ext.to_str() == Some("git")
        } else {
            true // no extension, likely git repo, not a file
        };
    }
}

fn main() {
    let cli = Cli::parse();
    // You can check for the existence of subcommands, and if found use their
    // matches just as you would the top level cmd
    match &cli.command {
        Some(SubCommands::Add { target }) => {
            if let Some(target) = target {
                let probably_git = is_path_probably_git(target);
                println!("probably git: {} {}", target, probably_git)
            } else {
                eprintln!("Must specify add target")
            }
        }
        Some(SubCommands::Scan { root }) => {
            let root = root.as_ref().map(|r| r.as_str()).unwrap_or(".");
            scan(PathBuf::from(root));
        }
        Some(SubCommands::Install { target }) => {
            let root = target.as_ref().map(|r| r.as_str()).unwrap_or(".");
            let manifest_name = "aimm.json";
            let manifest_text = std::fs::read_to_string(manifest_name).unwrap();
            let parsed = serde_json::from_str::<AimmModuleManifest>(&manifest_text).unwrap();
            println!(":? {:?}", parsed);
        }
        None => {}
    }

    // git_clone("https://github.com/eastmaple/easytrojan")
}
