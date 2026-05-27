import { Collection, MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import { User, Favorite, Game,CollectionEntry  } from "./types";
import bcrypt from "bcrypt";
dotenv.config();


// Connectie
const saltRounds = 10;
const uri = process.env.MONGODB_URI!;
export const client = new MongoClient(uri);


// Collections
export const usersCollection: Collection<User> = client.db("gamehub").collection<User>("users");
export const favoritesCollection: Collection<Favorite> = client.db("gamehub").collection<Favorite>("favorites");
export const collectionCollection: Collection<CollectionEntry> = client.db("gamehub").collection<CollectionEntry>("collection");
export async function getUserById(userId: string) {
    return await usersCollection.findOne({ _id: new ObjectId(userId) });
}

export async function updateXP(userId: string, xpToAdd: number) {
    return await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $inc: { xp: xpToAdd } }
    );
}

export async function getScoreboard() {
    return await usersCollection
        .find({}, { projection: { name: 1, xp: 1 } })
        .sort({ xp: -1 })
        .limit(10)
        .toArray();
}
// Afsluiten
async function exit() {
    try {
        await client.close();
        console.log("Verbinding met database gesloten");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

// Verbinden
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

// Users
export async function getUserByEmail(email: string) {
    return await usersCollection.findOne({ email });
}

export async function createUser(name: string, email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newUser: User = { name, email, passwordHash: hashedPassword, xp: 0 };
    return await usersCollection.insertOne(newUser);
}

// Favorieten
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

export async function login(email: string, password: string) {
    if (email === "" || password === "") {
        throw new Error("Email en wachtwoord zijn verplicht");
    }
    const user = await usersCollection.findOne({ email });
    if (!user) {
        throw new Error("Gebruiker niet gevonden");
    }
    const isCorrect = await bcrypt.compare(password, user.passwordHash!);
    if (!isCorrect) {
        throw new Error("Wachtwoord incorrect");
    }
    return user;
}

export async function setCurrentGame(userId: string, game: Game | null) {
    return await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { currentGame: game } }
    );
}

// Collectie
export async function getCollection(userId: string) {
    return await collectionCollection.find({ userId }).toArray();
}

export async function addToCollection(userId: string, game: Game, status: string, nickname?: string) {
    const existing = await collectionCollection.findOne({ userId, "game.id": game.id });
    if (existing) throw new Error("Game zit al in je collectie");
    return await collectionCollection.insertOne({
        userId,
        game,
        status: status as "Backlog" | "Playing" | "Completed",
        nickname,
        addedAt: new Date()
    });
}

export async function removeFromCollection(userId: string, gameId: number) {
    return await collectionCollection.deleteOne({ userId, "game.id": gameId });
}

export async function updateCollectionStatus(userId: string, gameId: number, status: string) {
    return await collectionCollection.updateOne(
        { userId, "game.id": gameId },
        { $set: { status: status as "Backlog" | "Playing" | "Completed" } }
    );
}