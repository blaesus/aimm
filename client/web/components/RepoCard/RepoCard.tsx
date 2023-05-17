import React from "react";
import { FileRecord, Registry, Repository, Revision } from "@prisma/client";
import { getRepoUrl } from "../../utils";

import "./RepoCard.css";
import { AnchorButton } from "../AnchorButton/AnchorButton";

interface RepoMetaInfo {
    tags: string[];
}

type RepoRaw = { [key in string]: any };

function readRepoRaw(registry: Registry, rawInput?: string): Partial<RepoMetaInfo> {
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

function RevisionCard(props: {
    revision: Revision,
    files: FileRecord[],
    defaultExpand?: boolean,
}) {
    const {revision, files} = props;
    const [expanded, setExpanded] = React.useState(props.defaultExpand ?? false);

    if (expanded) {
        return (
            <div key={revision.id} className="RevisionCard">
                {revision.hashA}
                {new Date(revision.updated.toString()).toString()}
                {
                    files.map(f => (
                        <div key={f.hashA}>
                            <a href={f.downloadUrl}>File {f.filename} {f.hashA} </a>
                        </div>
                    ))
                }
            </div>
        );
    }
    else {
        return (
            <div>
                <AnchorButton onClick={() => setExpanded(true)}>Expand</AnchorButton>
            </div>
        );
    }
}

export function RepoCard(props: {
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

    const meta = readRepoRaw(repo.registry, repo.raw as string);

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
                    repoRevisions.map((revision, i) => {
                        const files = fileRecords.filter(r => r.revisionId === revision.id);
                        return (
                            <RevisionCard
                                key={revision.id}
                                revision={revision}
                                defaultExpand={i === 0}
                                files={files}
                            />
                        );
                    })
                }
            </div>
        </div>
    );
}
