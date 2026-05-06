import { MongoClient, ObjectId } from "mongodb";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

app.use(express.json());
app.use(express.static("."));

// ===========================
// Interfaces
// ===========================
interface User {
    _id?: ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    current_game_id?: number;
    current_game_name?: string;
    xp: number;
}

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

        const newUser: User = {
            name,
            email,
            passwordHash: password,
            xp: 0
        };

        const result = await client.db("gamehub").collection("users").insertOne(newUser);
        res.json({ message: "Registratie gelukt!", userId: result.insertedId });

    } catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});

// ===========================
// Inloggen
// ===========================
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await client.db("gamehub").collection<User>("users").findOne({ email, passwordHash: password });
        if (!user) {
            res.status(401).json({ error: "Fout email of wachtwoord" });
            return;
        }

        res.json({ message: "Ingelogd!", userId: user._id, name: user.name, xp: user.xp });

    } catch (e) {
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

    } catch (e) {
        console.error("Fout bij verbinden:", e);
    }
}
// ===========================
// Favorieten ophalen
// ===========================
app.get("/api/favorites/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const favorites = await client.db("gamehub")
            .collection("favorites")
            .find({ userId })
            .toArray();
        res.json(favorites);
    } catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});

// ===========================
// Favoriet toevoegen
// ===========================
app.post("/api/favorites", async (req, res) => {
    try {
        const { userId, game } = req.body;
        const existing = await client.db("gamehub")
            .collection("favorites")
            .findOne({ userId, "game.id": game.id });

        if (existing) {
            res.status(400).json({ error: "Al in favorieten" });
            return;
        }

        await client.db("gamehub")
            .collection("favorites")
            .insertOne({ userId, game });
        res.json({ message: "Toegevoegd!" });
    } catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});

// ===========================
// Favoriet verwijderen
// ===========================
app.delete("/api/favorites/:userId/:gameId", async (req, res) => {
    try {
        const { userId, gameId } = req.params;
        await client.db("gamehub")
            .collection("favorites")
            .deleteOne({ userId, "game.id": Number(gameId) });
        res.json({ message: "Verwijderd!" });
    } catch (e) {
        res.status(500).json({ error: "Serverfout" });
    }
});
main();