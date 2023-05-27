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

export function getRepoOnRevisionUrl(repo: Repository, revision: string): string {
    switch (repo.registry) {
        case "GitHub": {
            return `https://github.com/${repo.idInRegistry}/tree/${revision}`
        }
        case "Civitai": {
            return `https://civitai.com/models/${repo.idInRegistry}?modelVersionId=${revision}`
        }
        case "GitLab": {
            return `https://gitlab.com/${repo.idInRegistry}/tree/${revision}`
        }
        case "Huggingface": {
            return `https://huggingface.co/${repo.idInRegistry}/tree/${revision}`
        }
        case "AimmHub": {
            return `https://aimm.dev/${repo.idInRegistry}/revisions/${revision}`
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

export function representDate(ms: number | bigint | null | undefined): string {
    if (!ms) {
        return "";
    }
    const date = new Date(Number(ms));
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month}-${day}`;
}
