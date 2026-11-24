import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import AddCard from "./pages/AddCard";
import Review from "./pages/Review";
import Gallery from "./pages/Gallery";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("review");
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);

  const fetchCards = async () => {
    setCardsLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "cards"));
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCardsLoading(false);
    }
  };

  useEffect(() => { fetchCards(); }, []);

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">mneme</h1>
        <nav className="nav">
          <button className={page === "review" ? "nav-btn active" : "nav-btn"} onClick={() => setPage("review")}>Discover</button>
          <button className={page === "gallery" ? "nav-btn active" : "nav-btn"} onClick={() => setPage("gallery")}>Gallery</button>
          <button className={page === "add" ? "nav-btn active" : "nav-btn"} onClick={() => setPage("add")}>+ Add</button>
        </nav>
      </header>
      <main className="main">
        {page === "review" && <Review cards={cards} setCards={setCards} loading={cardsLoading} />}
        {page === "gallery" && <Gallery cards={cards} loading={cardsLoading} />}
        {page === "add" && <AddCard onDone={() => { fetchCards(); setPage("review"); }} />}
      </main>
    </div>
  );
}
