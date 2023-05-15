import React from "react";
import { Button } from "./Button";
import { Registry, Repository } from "@prisma/client";
import { getRepoUrl } from "./utils";
import "./Search.css";
import { read } from "fs";

interface RepoMetaInfo {
    tags: string[];
}

type RepoRaw = { [key in string]: any };

function readRaw(registry: Registry, rawInput?: string): Partial<RepoMetaInfo> {
    const raw: RepoRaw = JSON.parse(rawInput ?? "{}");
    switch (registry) {
        case "Civitai": {
            return {
                tags: raw.tags ?? [],
            };
        }
        case "Huggingface": {
            return {
                tags: raw.tags ?? [],
            };
        }
        default: {
            return {};
        }
    }
}


function RepoCard(props: {
    repo: Repository,
}) {
    const {repo} = props;
    const meta = readRaw(repo.registry, repo.raw as string);

    return (
        <div key={repo.id} className="RepoCard">
            <span>{repo.registry} | </span>
            <a href={getRepoUrl(repo)}>{repo.name}</a>
            <div>
                {repo.subtype}
            </div>
            <div>
                {meta.tags}
            </div>
        </div>
    );
}

export function Search() {
    const [search, setSearch] = React.useState("");
    const [repos, setRepos] = React.useState([]);

    async function getRepos() {
        const response = await fetch(`/api/search/${search}`);
        const data = await response.json() as any;
        setRepos(data.repos);

    }

    return (
        <div className="Search">
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={e => {
                    if (e.key === "Enter") {
                        getRepos();
                    }
                }}
            />
            <Button
                onClick={getRepos}
            >
                Search
            </Button>

            <div>
                {
                    repos.map((repo: Repository) => <RepoCard key={repo.id} repo={repo}/>)
                }
            </div>

        </div>
    );
}
