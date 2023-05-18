import React from "react";
import "./TopBar.css"
import { ClientState } from "../../reducer/state";
import { ClientAction } from "../../reducer/action";
import { SearchSuccess } from "../../../../data/aimmApi";
import { Button } from "../Button/Button";
export function TopBar(props: {
    state: ClientState,
    dispatch: React.Dispatch<ClientAction>,
}) {
    async function getRepos() {
        const response = await fetch(`/api/search/${state.ui.pages.search.keyword}`);
        const data = await response.json() as SearchSuccess;
        dispatch({
            type: "ProvideEntities",
            ...data,
        })
    }

    const { state, dispatch } = props
    return (
        <nav className="TopBar">
            aimm
            <div>
                <input
                    type="text"
                    value={state.ui.pages.search.keyword}
                    onChange={e => dispatch({
                        type: "SearchInput",
                        keyword: e.target.value,
                    })}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            getRepos();
                        }
                    }}
                />
                <Button onClick={() => getRepos()}>Search!</Button>
            </div>
            <div>
                Menu
            </div>
        </nav>
    )
}
