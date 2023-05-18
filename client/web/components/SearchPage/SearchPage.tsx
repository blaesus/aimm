import React from "react";
import { FileRecord, Registry, Repository, Revision } from "@prisma/client";
import "./SearchPage.css";
import { RepoCard } from "../RepoCard/RepoCard";
import { ClientState } from "../../reducer/state";
import { ClientAction } from "../../reducer/action";

export function SearchPage(props: {
    state: ClientState,
    dispatch: React.Dispatch<ClientAction>,
}) {
    const {state, dispatch} = props;
    const {repositories, revisions, fileRecords} = state.entities;

    return (
        <div className="Search">
            <div>
                {
                    Object.values(repositories)
                          .filter(r => r.name.toLowerCase().includes(state.ui.pages.search.keyword.toLowerCase()))
                          .sort((a, b) => Number(b.favour) - Number(a.favour))
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
            </div>
        </div>
    );
}
