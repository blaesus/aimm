use crate::args::{AddArgs, InstallArgs, InstallFromManifestMode};
use crate::manifest::AimmModuleManifest;
use crate::subcommands::add;
use crate::utils::sha256_file;
use std::fs::File;
use std::path::Path;
use url::Url;

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
        manifest,
        mode,
        target,
    } = args;
    let manifest_name = manifest;
    let manifest_text = std::fs::read_to_string(manifest_name).unwrap();
    let parsed = serde_json::from_str::<AimmModuleManifest>(&manifest_text).unwrap();
    let mode = mode.clone().unwrap_or_default();
    install_from_manifest(parsed, mode)
}
