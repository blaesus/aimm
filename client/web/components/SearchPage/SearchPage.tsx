import React from "react";
import { FileRecord, Registry, Repository, Revision } from "@prisma/client";
import "./SearchPage.css";
import { SearchSuccess } from "../../../../data/aimmApi";
import { AnchorButton } from "../AnchorButton/AnchorButton";
import { RepoCard } from "../RepoCard/RepoCard";

export function SearchPage() {
    const [search, setSearch] = React.useState("");
    const [repos, setRepos] = React.useState<Repository[]>([]);
    const [revisions, setRevisions] = React.useState<Revision[]>([]);
    const [fileRecords, setFileRecords] = React.useState<FileRecord[]>([]);

    async function getRepos() {
        const response = await fetch(`/api/search/${search}`);
        const data = await response.json() as SearchSuccess;
        setRepos(data.repos);
        setRevisions(data.revisions);
        setFileRecords(data.fileRecords);
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
            <AnchorButton
                onClick={getRepos}
            >
                Search
            </AnchorButton>

            <div>
                {
                    repos.map((repo: Repository) =>
                        <RepoCard key={repo.id} repoId={repo.id} repos={repos} revisions={revisions}
                                  fileRecords={fileRecords}/>,
                    )
                }
            </div>

        </div>
    );
}
