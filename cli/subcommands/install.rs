use std::fs::File;
use std::path::Path;

use url::Url;

use crate::args::{InstallArgs, InstallFromManifestMode};
use crate::manifest::{AimmModuleManifest, ModuleManifestItem};
use crate::utils::sha256_file;

fn get_filename_in_header(response: &reqwest::blocking::Response) -> Option<String> {
    let content_disposition = response
        .headers()
        .get(reqwest::header::CONTENT_DISPOSITION)?
        .to_str()
        .ok()?;

    println!("content_disposition {}", content_disposition);
    Some(
        content_disposition
            .split("filename=")
            .nth(1)?
            .replace("\"", "")
            .to_string(),
    )
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

struct NewPackageArgs {
    remote_path: String,
    local_path: Option<String>,
}

fn install_new_package(args: &NewPackageArgs) {
    let remote_path = &args.remote_path;
    let local_path = &args.local_path;

    let probably_git = is_path_probably_git(remote_path);
    println!("probably git: {} {}", remote_path, probably_git);
    if probably_git {
        unimplemented!()
    } else {
        // Download file
        let mut response = reqwest::blocking::get(remote_path).unwrap();
        // Check content disposition
        let header_filename = get_filename_in_header(&response).unwrap_or(String::new());

        println!("header filename {}", header_filename);

        let url = Url::parse(remote_path).unwrap();
        let filename = {
            if header_filename.len() > 0 {
                &header_filename
            } else {
                url.path_segments().unwrap().last().unwrap()
            }
        };
        let final_local_path: String = {
            match local_path {
                Some(local_path) => {
                    let path = Path::new(local_path);
                    if path.is_dir() {
                        let full_path = path.join(filename);
                        full_path.to_str().unwrap().to_owned()
                    } else {
                        local_path.to_owned()
                    }
                }
                None => filename.to_owned(),
            }
        };
        let mut dest = {
            let path = Path::new(&final_local_path);
            if let Some(parent) = path.parent() {
                std::fs::create_dir_all(parent).unwrap();
            }
            println!("Saving to {}", path.display());
            File::create(&path).unwrap()
        };
        std::io::copy(&mut response, &mut dest).unwrap();

        // Load manifest from local file
        let mut manifest = AimmModuleManifest::read_from_file("aimm.json").unwrap();
        let sha = sha256_file(&final_local_path).unwrap();
        manifest.items.insert(
            remote_path.clone(),
            ModuleManifestItem {
                name: filename.to_string(),
                path: final_local_path,
                sha256: sha,
                url: remote_path.clone(),
            },
        );
        manifest.save_to_file("aimm.json").unwrap();
    }
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

pub fn install(args: &InstallArgs) {
    let InstallArgs {
        remote_path,
        local_path,
        manifest,
        mode,
        target,
    } = args;
    if let Some(remote_path) = remote_path {
        let local_path = local_path.clone();
        install_new_package(&NewPackageArgs {
            remote_path: remote_path.clone(),
            local_path,
        });
    } else {
        let manifest_name = manifest;
        let manifest_text = std::fs::read_to_string(manifest_name).unwrap();
        let parsed = serde_json::from_str::<AimmModuleManifest>(&manifest_text).unwrap();
        let mode = mode.clone().unwrap_or_default();
        install_from_manifest(parsed, mode)
    }
}
