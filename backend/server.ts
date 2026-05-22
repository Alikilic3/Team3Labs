import express from "express";
import dotenv from "dotenv";
import path from "path";
import { connect, getUserByEmail, createUser, getFavoritesByUserId, addFavorite, removeFavorite, isFavorite } from "./database";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const RAWG_KEY = process.env.RAWG_API_KEY;
const RAWG_BASE_URL = "https://api.rawg.io/api";

// ===========================
// Middleware
// ===========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../frontend/public")));
app.use("/assets", express.static(path.join(__dirname, "../assets")));
app.use("/css", express.static(path.join(__dirname, "../css")));
app.use("/js", express.static(path.join(__dirname, "../js")));

// ===========================
// EJS instellen
// ===========================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ===========================
// Pagina routes (GET)
// ===========================
app.get("/", (req, res) => {
    res.render("index", { activePage: "index" });
});

app.get("/intro", (req, res) => {
    res.render("intro", { activePage: "intro" });
});

app.get("/login", (req, res) => {
    res.render("login", { activePage: "login" });
});

app.get("/register", (req, res) => {
    res.render("register", { activePage: "register" });
});

app.get("/search", (req, res) => {
    res.render("search", { activePage: "search" });
});

app.get("/collection", (req, res) => {
    res.render("collection", { activePage: "collection" });
});

app.get("/compare", (req, res) => {
    res.render("compare", { activePage: "compare" });
});

app.get("/guess", (req, res) => {
    res.render("guess", { activePage: "guess" });
});

// ===========================
// Logout
// ===========================
app.post("/logout", (req, res) => {
    res.redirect("/");
});

// ===========================
// API: Login
// ===========================
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await getUserByEmail(email);
        if (!user || user.passwordHash !== password) {
            res.status(401).json({ error: "Fout email of wachtwoord" });
            return;
        }
        res.json({ message: "Ingelogd!", userId: user._id, name: user.name, xp: user.xp });
    } catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});

// ===========================
// API: Registreren
// ===========================
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existing = await getUserByEmail(email);
        if (existing) {
            res.status(400).json({ error: "Email is al in gebruik" });
            return;
        }
        await createUser(name, email, password);
        res.json({ message: "Registratie gelukt!" });
    } catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});

// ===========================
// API: Favorieten
// ===========================
app.get("/api/favorites/:userId", async (req, res) => {
    try {
        const favorites = await getFavoritesByUserId(req.params.userId);
        res.json(favorites);
    } catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});

app.post("/api/favorites", async (req, res) => {
    try {
        const { userId, game } = req.body;
        const already = await isFavorite(userId, game.id);
        if (already) {
            res.status(400).json({ error: "Al in favorieten" });
            return;
        }
        await addFavorite(userId, game);
        res.json({ message: "Toegevoegd!" });
    } catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});

app.delete("/api/favorites/:userId/:gameId", async (req, res) => {
    try {
        await removeFavorite(req.params.userId, Number(req.params.gameId));
        res.json({ message: "Verwijderd!" });
    } catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});

// ===========================
// API: RAWG Proxy - Zoeken
// ===========================
app.get("/api/search", async (req, res) => {
    try {
        const query = req.query.q as string;
        const response = await fetch(`${RAWG_BASE_URL}/games?key=${RAWG_KEY}&search=${encodeURIComponent(query)}&page_size=20`);
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: "Fout bij ophalen games" });
    }
});

// ===========================
// API: RAWG Proxy - Game details
// ===========================
app.get("/api/games/:id", async (req, res) => {
    try {
        const response = await fetch(`${RAWG_BASE_URL}/games/${req.params.id}?key=${RAWG_KEY}`);
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: "Fout bij ophalen game details" });
    }
});

// ===========================
// API: RAWG Proxy - Vergelijken
// ===========================
app.get("/api/compare", async (req, res) => {
    try {
        const query = req.query.q as string;
        const response = await fetch(`${RAWG_BASE_URL}/games?key=${RAWG_KEY}&search=${encodeURIComponent(query)}&page_size=1`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            res.json(data.results[0]);
        } else {
            res.status(404).json({ error: "Game niet gevonden" });
        }
    } catch (e) {
        res.status(500).json({ error: "Fout bij ophalen game" });
    }
});

// ===========================
// Start server
// ===========================
app.listen(PORT, async () => {
    await connect();
    console.log(`Server draait op http://localhost:${PORT}`);
});