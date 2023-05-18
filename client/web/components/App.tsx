import React, { useReducer } from "react";
import "./App.css";
import { SearchPage } from "./SearchPage/SearchPage";
import { Admin } from "./Admin";
import { TopBar } from "./TopBar/TopBar";
import { getInitialClientState, reducer } from "../reducer/state";

function App() {
    const initialState = getInitialClientState();

    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <div className="App">
            <TopBar state={state} dispatch={dispatch} />
            <div className="NonTopBarContent">
                <SearchPage />
                <Admin />
            </div>
        </div>
    );
}

export default App;
