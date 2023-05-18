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
    page?: PageName,
    searchKeyword?: string
}

export const SEARCH = "search";

export function parseUrl(url: string): PathState {
    const parsed = new URL(url);
    const params = new URLSearchParams(parsed.search);
    const pathName = parsed.pathname;
    const keyword = params.get(SEARCH);
    const state: PathState = {};
    if (keyword) {
        state.searchKeyword = keyword;
    }
    return state;
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
