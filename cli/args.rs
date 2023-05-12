use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Option<SubCommands>,
}

#[derive(Parser, Debug)]
pub struct AddArgs {
    pub remote_path: String,
    pub local_path: Option<String>,
}

#[derive(Subcommand)]
pub enum SubCommands {
    /// does testing things
    Scan {
        #[arg(short, long)]
        root: Option<String>,
    },
    Add(AddArgs),
    Install {
        #[arg(short, long)]
        #[clap(default_value = "aimm.json")]
        manifest: String,

        #[arg(short, long)]
        #[clap(default_value = ".")]
        target: String,

        #[arg(short, long)]
        mode: Option<InstallFromManifestMode>,
    },
}

#[derive(Debug, Eq, PartialEq, Clone)]
pub enum InstallFromManifestMode {
    Keep,
    Update,
}

impl From<String> for InstallFromManifestMode {
    fn from(s: String) -> Self {
        match s.as_str() {
            "keep" => InstallFromManifestMode::Keep,
            "update" => InstallFromManifestMode::Update,
            _ => panic!("Unknown install mode {}", s),
        }
    }
}

impl Default for InstallFromManifestMode {
    fn default() -> Self {
        return InstallFromManifestMode::Keep;
    }
}
