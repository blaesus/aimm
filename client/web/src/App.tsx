import React from "react";
import "./App.css";
import { Admin } from "./Admin";
import { Search } from "./Search";

function App() {
    return (
        <div className="App">
            <Search />
            <Admin />
        </div>
    );
}

export default App;
