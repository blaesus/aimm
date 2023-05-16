import { Repository } from "@prisma/client";

export function getRepoUrl(repo: Repository): string {
    switch (repo.registry) {
        case "GitHub": {
            return `https://github.com/${repo.idInRegistry}`
        }
        case "Civitai": {
            return `https://civitai.com/models/${repo.idInRegistry}`
        }
        case "GitLab": {
            return `https://gitlab.com/${repo.idInRegistry}`
        }
        case "Huggingface": {
            return `https://huggingface.co/${repo.idInRegistry}`
        }
        case "AimmHub": {
            return `https://aimm.dev/${repo.idInRegistry}`
        }
    }
}
