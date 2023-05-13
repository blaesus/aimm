mod args;
mod manifest;
mod subcommands;
mod utils;

use clap::Parser;

use crate::args::{Cli, SubCommands};
use crate::subcommands::{install, scan};

fn main() {
    let cli = Cli::parse();
    match &cli.command {
        Some(SubCommands::Scan(args)) => scan(args),
        Some(SubCommands::Install(args)) => install(args),
        None => {}
    }
}
