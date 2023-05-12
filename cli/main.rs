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
use crate::subcommands::{add, install, scan};
use crate::utils::sha256_file;

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

fn main() {
    let cli = Cli::parse();
    // You can check for the existence of subcommands, and if found use their
    // matches just as you would the top level cmd
    match &cli.command {
        Some(SubCommands::Add(args)) => add(args),
        Some(SubCommands::Scan(args)) => scan(args),
        Some(SubCommands::Install(args)) => install(args),
        None => {}
    }
}
