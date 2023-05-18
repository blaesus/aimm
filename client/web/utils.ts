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
    const params = new URLSearchParams(pathName);
    console.info(params)
    if (pathName.startsWith(SEARCH)) {
        return {
            page: "search",
        }
    }
    return {};
}

export function throttle<A>(callback: (args?: A) => void, limit: number = 500): (args?: A) => void {
    let waiting = false;                      // Initially, we're not waiting
    return function (args?: A) {                      // We return a throttled function
        if (!waiting) {                       // If we're not waiting
            callback(args);  // Execute users function
            waiting = true;                   // Prevent future invocations
            setTimeout(function () {          // After a period of time
                waiting = false;              // And allow future invocations
            }, limit);
        }
    }
}
