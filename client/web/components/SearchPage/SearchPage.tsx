import React from "react";
import "./SearchPage.css";
import { RepoCard } from "../RepoCard/RepoCard";
import { ClientState } from "../../reducer/state";
import { ClientAction } from "../../reducer/action";
import { Button } from "../Button/Button";

export function SearchPage(props: {
    state: ClientState,
    dispatch: React.Dispatch<ClientAction>,
}) {
    const {state, dispatch} = props;
    const {repositories, revisions, fileRecords, benchmarkResults, benchmarks} = state.entities;
    const [itemLimit, setItemLimit] = React.useState(10);

    const {matchedItems} = state.ui.pages.search;

    return (
        <div className="SearchPage">
            <div>
                {
                    matchedItems.reposByName.map(id => {
                        const repo = repositories[id];
                        if (!repo) {
                            console.warn(`Missing repo ${id}`);
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
                {
                    Object.keys(repositories).length >= itemLimit &&
                    <Button onClick={() => setItemLimit(Infinity)}>View all</Button>
                }
            </div>
        </div>
    );
}
