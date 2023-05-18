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

export type PageName = "home" | "search" | "admin"
export interface PathState {
    page?: PageName
}

const SEARCH = "search";

export function parsePathName(pathName: string): PathState {
    if (pathName.startsWith(SEARCH)) {
        return {
            page: "search",
        }
    }
    return {};
}
