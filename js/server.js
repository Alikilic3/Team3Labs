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
const uri = process.env.MONGODB_URI;
const client = new mongodb_1.MongoClient(uri);
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
