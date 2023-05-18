import React from "react";
import { FileRecord, Registry, Repository, Revision } from "@prisma/client";
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
    const {repositories, revisions, fileRecords} = state.entities;
    const [itemLimit, setItemLimit] = React.useState(10);

    return (
        <div className="Search">
            <div>
                {
                    Object.values(repositories)
                          .filter(r => r.name.toLowerCase().includes(state.ui.pages.search.keyword.toLowerCase()))
                          .sort((a, b) => Number(b.favour) - Number(a.favour))
                          .slice(0, itemLimit)
                          .map((repo: Repository) =>
                              <RepoCard
                                  key={repo.id}
                                  repoId={repo.id}
                                  repositories={repositories}
                                  revisions={revisions}
                                  fileRecords={fileRecords}
                              />,
                          )
                }
                {
                    Object.keys(repositories).length >= itemLimit &&
                    <Button onClick={() => setItemLimit(Infinity)}>View all</Button>
                }
            </div>
        </div>
    );
}
