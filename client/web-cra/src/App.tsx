import React from "react";
import "../../web2/components/App.css";
import { Admin } from "../../web2/components/Admin";
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
