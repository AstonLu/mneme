import { useState } from "react";
import AddCard from "./pages/AddCard";
import Review from "./pages/Review";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("review");

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">mneme</h1>
        <nav className="nav">
          <button
            className={page === "review" ? "nav-btn active" : "nav-btn"}
            onClick={() => setPage("review")}
          >
            複習
          </button>
          <button
            className={page === "add" ? "nav-btn active" : "nav-btn"}
            onClick={() => setPage("add")}
          >
            + 新增
          </button>
        </nav>
      </header>
      <main className="main">
        {page === "review"
          ? <Review />
          : <AddCard onDone={() => setPage("review")} />
        }
      </main>
    </div>
  );
}