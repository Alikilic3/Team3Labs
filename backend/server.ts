import express from "express";
import { connect, getUserByEmail, createUser, login, getFavoritesByUserId, addFavorite, removeFavorite, isFavorite, setCurrentGame, getCollection, addToCollection, removeFromCollection, updateCollectionStatus } from "./database";
import dotenv from "dotenv";
import path from "path";
import sessionMiddleware from "./session";
import { secureMiddleware } from "./secureMiddleware";
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
app.use(sessionMiddleware);


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

app.get("/search", secureMiddleware, (req, res) => {
    console.log("currentGame:", req.session.user!.currentGame);
    console.log("currentGameId:", req.session.user!.currentGame?.id);
    res.render("search", { 
        activePage: "search",
        userId: req.session.user!._id!.toString(),
        currentGameId: req.session.user!.currentGame?.id || null
    });
});

app.get("/collection", secureMiddleware, (req, res) => {
    res.render("collection", { 
        activePage: "collection",
        userId: req.session.user!._id!.toString()
    });
});
app.get("/compare", secureMiddleware, (req, res) => {
    res.render("compare", { activePage: "compare" });
});

app.get("/guess", secureMiddleware, (req, res) => {
    res.render("guess", { activePage: "guess" });
});

// ===========================
// Logout
// ===========================
app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});
// ===========================
// API: Login
// ===========================
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await login(email, password);
        delete user.passwordHash;
        req.session.user = user;
        res.json({ message: "Ingelogd!", userId: user._id, name: user.name, xp: user.xp });
    } catch (e: any) {
        res.status(401).json({ error: e.message });
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

// Best of the year
app.get("/api/best-of-year", async (req, res) => {
    try {
        const year = new Date().getFullYear();
        const response = await fetch(`${RAWG_BASE_URL}/games?key=${RAWG_KEY}&dates=${year}-01-01,${year}-12-31&ordering=-rating&page_size=20`);
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: "Fout bij ophalen" });
    }
});

// Popular in 2025
app.get("/api/popular-2025", async (req, res) => {
    try {
        const response = await fetch(`${RAWG_BASE_URL}/games?key=${RAWG_KEY}&dates=2025-01-01,2025-12-31&ordering=-added&page_size=20`);
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: "Fout bij ophalen" });
    }
});

// All time top
app.get("/api/all-time-top", async (req, res) => {
    try {
        const response = await fetch(`${RAWG_BASE_URL}/games?key=${RAWG_KEY}&ordering=-rating&page_size=40`);
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: "Fout bij ophalen" });
    }
});

// Genre
app.get("/api/genre/:genre", async (req, res) => {
    try {
        const response = await fetch(`${RAWG_BASE_URL}/games?key=${RAWG_KEY}&genres=${req.params.genre}&ordering=-rating&page_size=20`);
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: "Fout bij ophalen genre games" });
    }
});

// Platform games
app.get("/api/platform/:platform", async (req, res) => {
    try {
        const platformSlugs: Record<string, number> = {
            pc: 4,
            playstation: 187,
            xbox: 186,
            nintendo: 7
        };
        const platformId = platformSlugs[req.params.platform];
        if (!platformId) {
            res.status(400).json({ error: "Ongeldig platform" });
            return;
        }
        const response = await fetch(`${RAWG_BASE_URL}/games?key=${RAWG_KEY}&platforms=${platformId}&ordering=-rating&page_size=20`);
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: "Fout bij ophalen platform games" });
    }
});
// ===========================
// Start server
// ===========================
app.listen(PORT, async () => {
    await connect();
    console.log(`Server draait op http://localhost:${PORT}`);
});
// ===========================
// API: Huidige game instellen
// ===========================
app.put("/api/current-game", secureMiddleware, async (req, res) => {
    try {
        const { game } = req.body;
        const userId = req.session.user!._id!.toString();
        await setCurrentGame(userId, game);
        req.session.user!.currentGame = game;
        res.json({ message: "Huidige game ingesteld!" });
    } catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});

// ===========================
// API: Collectie ophalen
// ===========================
app.get("/api/collection/:userId", secureMiddleware, async (req, res) => {
    try {
        const collection = await getCollection(req.params.userId as string);
        res.json(collection);
    } catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});

// ===========================
// API: Aan collectie toevoegen
// ===========================
app.post("/api/collection", secureMiddleware, async (req, res) => {
    try {
        const { userId, game, status, nickname } = req.body;
        await addToCollection(userId, game, status || "Backlog", nickname);
        res.json({ message: "Toegevoegd aan collectie!" });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

app.delete("/api/collection/:userId/:gameId", secureMiddleware, async (req, res) => {
    try {
        await removeFromCollection(req.params.userId as string, Number(req.params.gameId));
        res.json({ message: "Verwijderd uit collectie!" });
    } catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});

app.put("/api/collection/:userId/:gameId/status", secureMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        await updateCollectionStatus(req.params.userId as string, Number(req.params.gameId), status);
        res.json({ message: "Status bijgewerkt!" });
    } catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});