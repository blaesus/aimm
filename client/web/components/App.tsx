import React from "react";
import "./App.css";
import { SearchPage } from "./SearchPage/SearchPage";
import { Admin } from "./Admin";

function App() {
    return (
        <div className="App">
            <SearchPage />
            <Admin />
        </div>
    );
}

export default App;
