import React from "react";
import { FileRecord, Registry, Repository, Revision } from "@prisma/client";
import { getRepoOnRevisionUrl, getRepoUrl } from "../../utils";

import "./RepoCard.css";
import { AnchorButton } from "../AnchorButton/AnchorButton";
import { HashTag } from "../HashTag/HashTag";
import { SizeTag } from "../SizeTag/SizeTag";
import { ObjectMap, ObjectWithId } from "../../../../data/sharedTypes";

interface RepoMetaInfo {
    tags: string[];
    description: string,
}

type RepoRaw = { [key in string]: any };

function readRepoRaw(registry: Registry, rawInput?: any): Partial<RepoMetaInfo> {
    const raw: RepoRaw = JSON.parse(rawInput ? rawInput.toString() : "{}");
    switch (registry) {
        case "Civitai": {
            return {
                tags: raw.tags ?? [],
                description: raw.description ?? "",
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

type RevisionMetaInfo = {
    lastUpdated: Date,
}

function readRevisionRaw(registry: Registry, rawInput?: any): Partial<RevisionMetaInfo> {
    const raw: RepoRaw = JSON.parse(rawInput ? rawInput.toString() : "{}");
    switch (registry) {
        case "Civitai": {
            return {
                lastUpdated: new Date(raw.updatedAt),
            };
        }
        case "Huggingface": {
            return {
                lastUpdated: new Date(raw.lastModified),
            };
        }
        default: {
            return {};
        }
    }
}

function FileRecordCard(props: {
    file: FileRecord
}) {
    const {file} = props;
    return (
        <a href={file.downloadUrl}>
            <div className="FileRecordCard">
                <span className="FilenameTag">{file.filename}</span>
                <SizeTag size={file.size}/>
                <HashTag hash={file.hashA}/>
            </div>
        </a>
    );
}

function FileList(props: {
    files: FileRecord[]
}) {
    const {files} = props;
    return (
        <div className="FileRecordList">
            {
                files.map(f => (
                    <FileRecordCard key={f.id} file={f}/>
                ))
            }
        </div>
    );
}

function RevisionCard(props: {
    revision: Revision,
    repository: Repository,
    registry: Registry,
    files: FileRecord[],
    defaultExpand?: boolean,
}) {
    const {revision, files, registry, repository} = props;
    const [expanded, setExpanded] = React.useState(props.defaultExpand ?? false);

    const meta = readRevisionRaw(registry, revision.raw);

    if (expanded) {
        return (
            <div key={revision.id} className="RevisionCard">
                <h3><a href={getRepoOnRevisionUrl(repository, revision.idInRegistry)}><HashTag hash={revision.hashA}/></a></h3>
                {meta.lastUpdated?.toISOString()}
                <FileList files={files}/>

                <div>
                    <h3>Install</h3>
                    <code>
                        aimm install {getRepoUrl(repository)}/tree/{revision.idInRegistry}
                    </code>
                </div>
            </div>
        );
    }
    else {
        return (
            <div>
                <h3>
                    <HashTag hash={revision.hashA}/>
                    <AnchorButton onClick={() => setExpanded(true)}>Expand</AnchorButton>
                </h3>
            </div>
        );
    }
}

export function RepoCard(props: {
    repoId: string,
    repositories: ObjectMap<Repository>,
    revisions: ObjectMap<Revision>,
    fileRecords: ObjectMap<FileRecord>,
}) {
    const {repoId, repositories, revisions, fileRecords} = props;
    const repo = repositories[repoId];
    if (!repo) {
        return null;
    }

    const repoRevisions = Object.values(revisions).filter(r => r.repoId === repoId);

    const meta = readRepoRaw(repo.registry, repo.raw as string);


    return (
        <div key={repo.id} className="RepoCard">
            <h2><a href={getRepoUrl(repo)}>{repo.name}</a></h2>
            <div>
                {repo.registry}
            </div>
            <div>
                {repo.subtype}
            </div>
            <div>
                {repo.favour.toString()}
            </div>
            <div>
                {meta.tags?.map(tag => (
                    <span key={tag} className="TagLabel">{tag}</span>
                ))}
            </div>
            <div>
                {
                    repoRevisions.map((revision, i) => {
                        const files = Object.values(fileRecords).filter(r => r.revisionId === revision.id);
                        return (
                            <RevisionCard
                                key={revision.id}
                                revision={revision}
                                repository={repo}
                                registry={repo.registry}
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
