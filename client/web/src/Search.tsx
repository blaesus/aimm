import React from "react";
import { Button } from "./Button";
import { Repository } from "@prisma/client";
import { getRepoUrl } from "./utils";

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
                    if (e.key === "Enter") getRepos();
                }}
            />
            <Button
                onClick={getRepos}
            >
                Search
            </Button>

            <div>
                {
                    repos.map((repo: Repository) => (
                        <div key={repo.id}>
                            <span>{repo.registry} | </span>
                            <a href={getRepoUrl(repo)}>{repo.name}</a>
                        </div>
                    ))
                }
            </div>

        </div>
    );
}
