import { ObjectId } from "mongodb";


// Database interfaces


// Stelt een gebruiker voor in de database
export interface User {
    _id?: ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    xp: number;
    currentGame?: Game | null;
}

export interface Favorite {
    _id?: ObjectId;
    userId: string;
    game: Game;
}


// Details van een platform (bv. PC, PlayStation)
export interface PlatformDetails {
    id: number;
    name: string;
    slug: string;
}

// Wrapper rond PlatformDetails (zo geeft RAWG het terug)
export interface Platform {
    platform: PlatformDetails;
}

// Een game zoals RAWG hem teruggeeft in zoekresultaten
export interface Game {
    id: number;
    name: string;
    background_image: string | null;
    rating: number;
    released: string | null;
    metacritic: number | null;
    playtime: number;
    parent_platforms: Platform[];
}

// Een game met volledige details (voor de modal)
export interface GameDetail {
    id: number;
    name: string;
    background_image: string | null;
    description_raw: string;
    released: string | null;
    rating: number;
    playtime: number;
    metacritic: number | null;
    parent_platforms: Platform[];
}

// Het antwoord van de RAWG zoek-API
export interface RawgResponse {
    results: Game[];
}

export interface CollectionEntry {
    _id?: ObjectId;
    userId: string;
    game: Game;
    status: "Backlog" | "Playing" | "Completed";
    nickname?: string;
    addedAt: Date;
}