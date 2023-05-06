fn main() {
    let ai_extensions = vec![
        "safetensors",
        "pt",
    ];

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
                            if ai_extensions.iter().any(|ext| extension.eq_ignore_ascii_case(ext)) {
                                let relative_path = path.strip_prefix(std::env::current_dir().unwrap()).unwrap();
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
}
