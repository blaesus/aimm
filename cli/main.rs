use std::error::Error;
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};

use clap::{Parser, Subcommand};
use git2::{Repository, RepositoryInitOptions};
use reqwest;
use serde::{Deserialize, Serialize};
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

#[allow(non_snake_case)]
struct ModuleManifestItem {
    name: String,
    path: String,
    sha256: String,
    url: String,
}

#[allow(non_snake_case)]
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
    let api_url = format!("http://localhost:3030/files?sha256={}", sha256);
    let response: FileResponse = reqwest::blocking::get(&api_url)?.json()?;
    return Ok(response.0);
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
                                    let relative_path = path
                                        .strip_prefix(std::env::current_dir().unwrap())
                                        .unwrap();
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
    println!("files: {:#?}", ai_files);
    for file in ai_files {
        let sha = sha256_file(&file.to_string_lossy()).unwrap();
        let file_records = download_file_records(&sha).unwrap();
        let download_urls = file_records
            .iter()
            .map(|file_record| {
                (
                    file_record.downloadUrl.clone(),
                    file_record.revision.repo.favour,
                )
            })
            .collect::<Vec<(String, u64)>>();
        println!("{}: {}\n{:#?}", file.to_string_lossy(), sha, download_urls);
    }
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
        /// lists test values
        #[arg(short, long)]
        root: Option<String>,
    },
    Add {
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
            if let Some(root) = root {
                println!("root={}", root);
            } else {
                println!("no root");
            }
        }
        None => {}
    }

    // git_clone("https://github.com/eastmaple/easytrojan")
}
