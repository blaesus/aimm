use std::error::Error;
use std::fs::File;
use std::io::Read;

use reqwest;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

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

#[derive(Debug, Deserialize)]
struct Repository_FileRecordApiItem {
    id: String,
    name: String,
    registry: String,
    idInRegistry: String,
    favour: u64,
}

#[derive(Debug, Deserialize)]
struct Revision_FileRecordApiItem {
    id: String,
    idInRegistry: String,
    repo: Repository_FileRecordApiItem,
}

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
    let api_url = format!("https://api.apm.run/api/files?sha256={}", sha256);
    let response: FileResponse = reqwest::blocking::get(&api_url)?.json()?;
    return Ok(response.0);
}

fn main() {
    let ai_extensions = vec!["safetensors", "pt"];

    let ai_files = {
        let mut files = Vec::new();
        let mut stack = Vec::new();
        stack.push(std::env::current_dir().unwrap());
        while let Some(dir) = stack.pop() {
            for entry in std::fs::read_dir(dir).unwrap() {
                let entry = entry.unwrap();
                let path = entry.path();
                if path.is_dir() {
                    stack.push(path);
                } else {
                    match path.extension() {
                        None => continue,
                        Some(extension) => {
                            if ai_extensions
                                .iter()
                                .any(|ext| extension.eq_ignore_ascii_case(ext))
                            {
                                let relative_path =
                                    path.strip_prefix(std::env::current_dir().unwrap()).unwrap();
                                files.push(relative_path.to_owned());
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
