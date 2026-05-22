"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();

const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;

// MongoDB connectie
const uri = process.env.MONGODB_URI;
const client = new mongodb_1.MongoClient(uri);

// RAWG API key komt uit .env, NIET hardcoded in client-code
const RAWG_API_KEY = process.env.RAWG_API_KEY;
const RAWG_BASE_URL = "https://api.rawg.io/api";

app.use(express_1.default.json());
app.use(express_1.default.static("."));

// ===========================
// Registreren
// ===========================
app.post("/api/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existing = await client.db("gamehub").collection("users").findOne({ email });
        if (existing) {
            res.status(400).json({ error: "Email is al in gebruik" });
            return;
        }
        const newUser = {
            name,
            email,
            passwordHash: password,
            xp: 0
        };
        const result = await client.db("gamehub").collection("users").insertOne(newUser);
        res.json({ message: "Registratie gelukt!", userId: result.insertedId });
    }
    catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});

// ===========================
// Inloggen
// ===========================
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await client.db("gamehub").collection("users").findOne({ email, passwordHash: password });
        if (!user) {
            res.status(401).json({ error: "Fout email of wachtwoord" });
            return;
        }
        res.json({ message: "Ingelogd!", userId: user._id, name: user.name, xp: user.xp });
    }
    catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});

// ===========================
// RAWG: Games zoeken (proxy)
// De API key blijft op de server, de client ziet hem nooit
// ===========================
app.get("/api/search", async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            res.status(400).json({ error: "Geen zoekterm opgegeven" });
            return;
        }
        const response = await fetch(`${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=12`);
        if (!response.ok) throw new Error(`RAWG fout: ${response.status}`);
        const data = await response.json();
        res.json(data);
    }
    catch (e) {
        res.status(500).json({ error: "Fout bij ophalen van games" });
    }
});

// ===========================
// RAWG: Game details ophalen (proxy)
// ===========================
app.get("/api/games/:id", async (req, res) => {
    try {
        const gameId = req.params.id;
        const response = await fetch(`${RAWG_BASE_URL}/games/${gameId}?key=${RAWG_API_KEY}`);
        if (!response.ok) throw new Error(`RAWG fout: ${response.status}`);
        const data = await response.json();
        res.json(data);
    }
    catch (e) {
        res.status(500).json({ error: "Fout bij ophalen van game details" });
    }
});

// ===========================
// RAWG: 1 game ophalen voor vergelijking (proxy)
// ===========================
app.get("/api/compare", async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            res.status(400).json({ error: "Geen zoekterm opgegeven" });
            return;
        }
        const response = await fetch(`${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=1`);
        if (!response.ok) throw new Error(`RAWG fout: ${response.status}`);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            res.json(data.results[0]);
        } else {
            res.status(404).json({ error: "Game niet gevonden" });
        }
    }
    catch (e) {
        res.status(500).json({ error: "Fout bij ophalen van game" });
    }
});

// ===========================
// Favorieten ophalen voor een gebruiker
// ===========================
app.get("/api/favorites/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const favorites = await client.db("gamehub").collection("favorites").find({ userId }).toArray();
        res.json(favorites);
    }
    catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});

// ===========================
// Favoriet toevoegen
// ===========================
app.post("/api/favorites", async (req, res) => {
    try {
        const { userId, game } = req.body;
        const existing = await client.db("gamehub").collection("favorites").findOne({ userId, "game.id": game.id });
        if (existing) {
            res.status(400).json({ error: "Al een favoriet" });
            return;
        }
        await client.db("gamehub").collection("favorites").insertOne({ userId, game });
        res.json({ message: "Toegevoegd aan favorieten" });
    }
    catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});

// ===========================
// Favoriet verwijderen
// ===========================
app.delete("/api/favorites/:userId/:gameId", async (req, res) => {
    try {
        const { userId, gameId } = req.params;
        await client.db("gamehub").collection("favorites").deleteOne({ userId, "game.id": Number(gameId) });
        res.json({ message: "Verwijderd uit favorieten" });
    }
    catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});

// ===========================
// Start server
// ===========================
async function main() {
    try {
        await client.connect();
        console.log("Verbonden met MongoDB!");
        app.listen(PORT, () => {
            console.log(`Server draait op http://localhost:${PORT}`);
        });
    }
    catch (e) {
        console.error("Fout bij verbinden:", e);
    }
}
main();