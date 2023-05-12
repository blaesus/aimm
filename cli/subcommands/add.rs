use std::fs::File;
use std::path::Path;

use url::Url;

use crate::args::AddArgs;
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

pub fn add(args: &AddArgs) {
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
