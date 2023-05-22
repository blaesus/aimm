import React, { useReducer, useEffect } from "react";
import "./App.css";
import { SearchPage } from "./SearchPage/SearchPage";
import { Admin } from "./Admin";
import { TopBar } from "./TopBar/TopBar";
import { getInitialClientState, reducer, UIState } from "../reducer/state";
import { SEARCH } from "../utils";
import { ClientStateContext } from "../context/state";

function serializeToPathName(state: UIState): string {
    if (state.pages.current === "home") {
        if (state.pages.search.keyword) {
            return `/?${SEARCH}=${state.pages.search.keyword}`
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



    function updateUIStateForUrl() {
        dispatch({
            type: "ChangeUrl",
            url: window.location.href,
        });
    }

    useEffect(() => {
        updateUIStateForUrl();
        window.addEventListener("popstate", (event) => {
            event.preventDefault();
            updateUIStateForUrl();
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
        <ClientStateContext.Provider value={{state, dispatch}}>
            <div className="App">
                <TopBar state={state} dispatch={dispatch}/>
                <div className="NonTopBarContent">
                    <SearchPage state={state} dispatch={dispatch} />
                    <Admin/>
                </div>
            </div>
        </ClientStateContext.Provider>
    );
}

export default App;
