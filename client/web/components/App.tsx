import React from "react";
import "./App.css";
import { SearchPage } from "./SearchPage/SearchPage";
import { Admin } from "./Admin";
import { TopBar } from "./TopBar/TopBar";

function App() {
    return (
        <div className="App">
            <TopBar />
            <div className="NonTopBarContent">
                <SearchPage />
                <Admin />
            </div>
        </div>
    );
}

export default App;
