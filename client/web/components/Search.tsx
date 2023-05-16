import React from "react";
import { FileRecord, Registry, Repository, Revision } from "@prisma/client";
import "./Search.css";
import { SearchSuccess } from "../../../data/aimmApi";
import { getRepoUrl } from "../utils";
import { AnchorButton } from "./AnchorButton/AnchorButton";

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
    repoId: string,
    repos: Repository[],
    revisions: Revision[],
    fileRecords: FileRecord[]
}) {
    const {repoId, repos, revisions, fileRecords} = props;
    const repo = repos.find(r => r.id === repoId);
    if (!repo) {
        return null;
    }

    const repoRevisions = revisions.filter(r => r.repoId === repoId);

    const meta = readRaw(repo.registry, repo.raw as string);

    return (
        <div key={repo.id} className="RepoCard">
            <a href={getRepoUrl(repo)}>{repo.name}</a>
            <div>
                {repo.registry}
            </div>
            <div>
                {repo.subtype}
            </div>
            <div>
                {meta.tags?.map(tag => (
                    <span key={tag} className="TagLabel">{tag}</span>
                ))}
            </div>
            <div>
                {
                    repoRevisions.map(revision =>  {
                        const files = fileRecords.filter(r => r.revisionId === revision.id)
                        return (
                            <div key={revision.id}>
                                {revision.hashA}
                                {
                                    files.map(f => (
                                        <div key={f.hashA}>
                                            <a href={f.downloadUrl}>File {f.filename} {f.hashA} </a>
                                        </div>
                                    ))
                                }
                            </div>
                        )
                    })
                }
            </div>
        </div>
    );
}

export function Search() {
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
