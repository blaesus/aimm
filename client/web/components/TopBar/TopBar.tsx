import React from "react";
import "./TopBar.css"
import { ClientState } from "../../reducer/state";
import { ClientAction } from "../../reducer/action";
import { SearchSuccess } from "../../../../data/aimmApi";
import { Button } from "../Button/Button";
import { throttle } from "../../utils";
export function TopBar(props: {
    state: ClientState,
    dispatch: React.Dispatch<ClientAction>,
}) {

    const [loading, setLoading] = React.useState(false);
    const [searchInput, setSearchInput] = React.useState("");
    async function confirmSearch() {
        if (loading) {
            return;
        }
        setLoading(true);
        const response = await fetch(`/api/search/${searchInput}`);
        const data = await response.json() as SearchSuccess;
        setLoading(false);
        dispatch({
            type: "ProvideEntities",
            ...data,
        })
    }
    const throttledGetSearch = throttle(confirmSearch, 1000);

    const { state, dispatch } = props
    return (
        <nav className="TopBar">
            aimm
            <div>
                <input
                    type="text"
                    value={searchInput}
                    onChange={event => setSearchInput(event.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            throttledGetSearch();
                        }
                    }}
                />
                <Button onClick={() => confirmSearch()}>Search!</Button>
            </div>
            <div>
                Menu
            </div>
        </nav>
    )
}
