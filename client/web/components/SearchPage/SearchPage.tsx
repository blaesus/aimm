import React from "react";
import { FileRecord, Registry, Repository, Revision } from "@prisma/client";
import "./SearchPage.css";
import { FileList, RepoCard } from "../RepoCard/RepoCard";
import { ClientState } from "../../reducer/state";
import { ClientAction } from "../../reducer/action";
import { Button } from "../Button/Button";
import { match } from "assert";

export function SearchPage(props: {
    state: ClientState,
    dispatch: React.Dispatch<ClientAction>,
}) {
    const {state, dispatch} = props;
    const {repositories, revisions, fileRecords} = state.entities;
    const [itemLimit, setItemLimit] = React.useState(10);

    const {matchedItems} = state.ui.pages.search;

    return (
        <div className="SearchPage">
            <div>
                {
                    matchedItems.reposByName.map(id => {
                        const repo = repositories[id];
                        if (!repo) {
                            console.warn(`Missing repo ${id}`)
                            return null;
                        }
                        return (
                            <RepoCard
                                key={repo.id}
                                repoId={repo.id}
                                repositories={repositories}
                                revisions={revisions}
                                fileRecords={fileRecords}
                            />
                        );
                    })
                }
                <FileList
                    files={matchedItems.filesByHash.map(id => fileRecords[id]).filter(Boolean)}
                />
                {
                    Object.keys(repositories).length >= itemLimit &&
                    <Button onClick={() => setItemLimit(Infinity)}>View all</Button>
                }
            </div>
        </div>
    );
}
