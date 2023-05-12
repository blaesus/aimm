use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
pub struct Cli {
    #[command(subcommand)]
    pub command: Option<SubCommands>,
}

#[derive(Parser, Debug)]
pub struct ScanArgs {
    #[arg(short, long)]
    pub root: Option<String>,
}

#[derive(Parser, Debug)]
pub struct InstallArgs {
    pub remote_path: Option<String>,

    pub local_path: Option<String>,

    #[arg(long)]
    #[clap(default_value = "aimm.json")]
    pub manifest: String,

    #[arg(long)]
    #[clap(default_value = ".")]
    pub target: String,

    #[arg(long)]
    pub mode: Option<InstallFromManifestMode>,
}

#[derive(Subcommand)]
pub enum SubCommands {
    /// does testing things
    Scan(ScanArgs),
    Install(InstallArgs),
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
