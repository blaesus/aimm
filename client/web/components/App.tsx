import React, { useReducer, useEffect } from "react";
import "./App.css";
import { SearchPage } from "./SearchPage/SearchPage";
import { Admin } from "./Admin";
import { TopBar } from "./TopBar/TopBar";
import { getInitialClientState, reducer, UIState } from "../reducer/state";

function serializeToPathName(state: UIState): string {
    if (state.pages.current === "home") {
        if (state.pages.search.keyword) {
            return `/?search=${state.pages.search.keyword}`
        }
        else {
            return `/`
        }
    }
    else if (state.pages.current === "search") {
        return `/search`
    }
    else {
        return "/";
    }
}

function App() {
    const initialState = getInitialClientState();

    const [state, dispatch] = useReducer(reducer, initialState);

    function updateUIStateForPathName() {
        dispatch({
            type: "ChangePathname",
            pathname: window.location.pathname,
        });
    }

    useEffect(() => {
        updateUIStateForPathName();
        window.addEventListener("popstate", (event) => {
            event.preventDefault();
            updateUIStateForPathName();
        });
    }, []);

    useEffect(() => {
        const {ui} = state;
        const timer = window.setTimeout(() => {
            const nextPath = serializeToPathName(ui) || "/";
            if (location.pathname !== nextPath) {
                history.pushState(ui, "", nextPath);
            }
        });
        return () => clearTimeout(timer);
    }, [state.ui.pages]);


    useEffect(() => {
        document.title = state.ui.pages.current;
    }, [state.ui.pages]);


    return (
        <div className="App">
            <TopBar state={state} dispatch={dispatch}/>
            <div className="NonTopBarContent">
                <SearchPage state={state} dispatch={dispatch} />
                <Admin/>
            </div>
        </div>
    );
}

export default App;
