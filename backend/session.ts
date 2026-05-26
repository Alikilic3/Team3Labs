import dotenv from "dotenv";
dotenv.config();

import session from "express-session";
import MongoStore from "connect-mongo";
import { User } from "./types";

const mongoStore = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI!,
    dbName: "gamehub",
    collectionName: "sessions"
});

mongoStore.on("error", (error) => {
    console.error(error);
});

declare module "express-session" {
    export interface SessionData {
        user?: User;
    }
}

export default session({
    secret: process.env.SESSION_SECRET ?? "geheim-sleutel",
    store: mongoStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
});