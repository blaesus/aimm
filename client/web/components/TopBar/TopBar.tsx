import React, { useEffect, useState } from "react";
import "./TopBar.css";
import { ClientState } from "../../reducer/state";
import { ClientAction } from "../../reducer/action";
import { SearchParams, SearchSuccess } from "../../../../data/aimmApi";
import { Button } from "../Button/Button";
import { throttle } from "../../clientUtils";

function parseSearchInput(input: string): SearchParams {
    const params: SearchParams = {};
    const keywords = [];
    const segments = input.split(" ");
    for (const segment of segments) {
        if (segment.startsWith("registry:")) {
            params.registry = segment.slice("registry:".length);
        }
        else if (segment.startsWith("page:")) {
            params.page = Number(segment.slice("page:".length));
        }
        else if (segment.startsWith("pageSize:")) {
            params.pageSize = Number(segment.slice("pageSize:".length));
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
        segments.push(`page-size=${params.pageSize}`);
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

    const localDevEnvironement = window.location.hostname === "localhost";

    useEffect(() => {
        setSearchInput(state.ui.pages.search.keyword);
        if (Object.keys(state.entities.repositories).length === 0 && state.ui.pages.search.keyword) {
            console.info("Trigger")
            confirmSearch(state.ui.pages.search.keyword)
        }
    }, [state.ui.pages.search.keyword]);

    async function confirmSearch(searchInput: string) {
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

    const throttledConfirm = throttle<string>(confirmSearch, 1000);

    return (
        <nav className="TopBar">
            <span>
                aimm {localDevEnvironement && "(local dev)"}
            </span>
            <span>
                <input
                    type="text"
                    value={searchInput}
                    onChange={event => setSearchInput(event.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter") {
                            throttledConfirm(searchInput);
                        }
                    }}
                />
                <Button onClick={() => throttledConfirm(searchInput)}>Search!</Button>
            </span>
            <span>
                Menu
            </span>
        </nav>
    );
}
