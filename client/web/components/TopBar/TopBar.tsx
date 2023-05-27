import React, { useEffect, useState } from "react";
import "./TopBar.css";
import { ClientState } from "../../reducer/state";
import { ClientAction } from "../../reducer/action";
import { SearchParams, SearchSuccess } from "../../../../data/aimmApi";
import { Button } from "../Button/Button";
import { throttle } from "../../utils";

function parseSearchInput(input: string): SearchParams {
    const params: SearchParams = {};
    const keywords = [];
    const segments = input.split(" ");
    for (const segment of segments) {
        if (segment.startsWith("registry:")) {
            params.registry = segment.slice("registry:".length);
        }
        else {
            keywords.push(segment);
        }
    }
    params.keyword = keywords.join(" ");
    return params;
}

function serializeParamsToQueryString(params: SearchParams): string {
    let segments = [];
    if (params.keyword) {
        segments.push(`keyword=${params.keyword}`);
    }
    if (params.registry) {
        segments.push(`registry=${params.registry}`);
    }
    if (params.page) {
        segments.push(`page=${params.page}`);
    }
    if (params.pageSize) {
        segments.push(`pageSize=${params.pageSize}`);
    }

    return `?${segments.join("&")}`;
}

export function TopBar(props: {
    state: ClientState,
    dispatch: React.Dispatch<ClientAction>,
}) {

    const {state, dispatch} = props;
    const [loading, setLoading] = React.useState(false);
    const [searchInput, setSearchInput] = React.useState("");

    useEffect(() => {
        setSearchInput(props.state.ui.pages.search.keyword);
    }, [state.ui.pages.search.keyword]);

    async function confirmSearch() {
        if (loading) {
            return;
        }
        setLoading(true);
        const queryString = serializeParamsToQueryString(parseSearchInput(searchInput));
        const response = await fetch(`/api/search/${queryString}`);
        const data = await response.json() as SearchSuccess;
        setLoading(false);
        dispatch({
            type: "ProvideEntities",
            ...data,
        });
        dispatch({
            type: "SearchSuccessAction",
            matchedItems: data,
        });
        dispatch({
            type: "SearchInput",
            keyword: searchInput,
        });
    }

    const throttledConfirm = throttle(confirmSearch, 1000);

    return (
        <nav className="TopBar">
            <span>
                aimm
            </span>
            <span>
                <input
                    type="text"
                    value={searchInput}
                    onChange={event => setSearchInput(event.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            throttledConfirm();
                        }
                    }}
                />
                <Button onClick={() => throttledConfirm()}>Search!</Button>
            </span>
            <span>
                Menu
            </span>
        </nav>
    );
}
