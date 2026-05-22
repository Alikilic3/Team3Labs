import { Collection, MongoClient } from "mongodb";
import dotenv from "dotenv";
import { User, Favorite } from "./types";

dotenv.config();

// ===========================
// Connectie
// ===========================
const uri = process.env.MONGODB_URI!;
export const client = new MongoClient(uri);

// ===========================
// Collections
// ===========================
export const usersCollection: Collection<User> = client.db("gamehub").collection<User>("users");
export const favoritesCollection: Collection<Favorite> = client.db("gamehub").collection<Favorite>("favorites");

// ===========================
// Afsluiten
// ===========================
async function exit() {
    try {
        await client.close();
        console.log("Verbinding met database gesloten");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

// ===========================
// Verbinden
// ===========================
export async function connect() {
    try {
        await client.connect();
        console.log("Verbonden met MongoDB!");
        process.on("SIGINT", exit);
    } catch (e) {
        console.error("Fout bij verbinden met database:", e);
        process.exit(1);
    }
}

// ===========================
// Users
// ===========================
export async function getUserByEmail(email: string) {
    return await usersCollection.findOne({ email });
}

export async function createUser(name: string, email: string, passwordHash: string) {
    const newUser: User = { name, email, passwordHash, xp: 0 };
    return await usersCollection.insertOne(newUser);
}

// ===========================
// Favorieten
// ===========================
export async function getFavoritesByUserId(userId: string) {
    return await favoritesCollection.find({ userId }).toArray();
}

export async function addFavorite(userId: string, game: any) {
    return await favoritesCollection.insertOne({ userId, game });
}

export async function removeFavorite(userId: string, gameId: number) {
    return await favoritesCollection.deleteOne({ userId, "game.id": gameId });
}

export async function isFavorite(userId: string, gameId: number) {
    const result = await favoritesCollection.findOne({ userId, "game.id": gameId });
    return result !== null;
}