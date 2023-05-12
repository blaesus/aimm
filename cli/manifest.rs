use std::collections::HashMap;
use std::error::Error;
use std::fs::File;
use std::io::{Read, Write};

use serde::{Deserialize, Serialize};
use serde_json;

pub enum ManifestItemType {
    File,
    Git,
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize, Serialize)]
pub struct ModuleManifestItem {
    pub name: String,
    pub path: String,
    pub sha256: String,
    pub url: String,
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize, Serialize)]
pub struct AimmModuleManifest {
    pub manifestVersion: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub license: String,
    pub authors: Vec<String>,
    pub items: HashMap<String, ModuleManifestItem>,
    pub submodules: HashMap<String, AimmModuleManifest>,
}

impl AimmModuleManifest {
    pub fn read_from_file(path: &str) -> Result<Self, Box<dyn Error>> {
        let mut file = File::open(path)?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)?;
        let manifest: AimmModuleManifest = serde_json::from_str(&contents)?;
        Ok(manifest)
    }
    pub fn save_to_file(&self, path: &str) -> Result<(), Box<dyn Error>> {
        let mut file = File::create(path)?;
        let contents = serde_json::to_string_pretty(&self)?;
        file.write_all(contents.as_bytes())?;
        Ok(())
    }
}
