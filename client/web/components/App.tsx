import React, { useReducer, useEffect } from "react";
import "./App.css";
import { SearchPage } from "./SearchPage/SearchPage";
import { Admin } from "./Admin";
import { TopBar } from "./TopBar/TopBar";
import { getInitialClientState, reducer } from "../reducer/state";

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
