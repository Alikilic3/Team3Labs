import { ObjectId } from "mongodb";

// ===========================
// Database interfaces
// ===========================

// Stelt een gebruiker voor in de database
export interface User {
    _id?: ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    xp: number;
}

// Stelt een favoriet spel voor in de database
export interface Favorite {
    _id?: ObjectId;
    userId: string;
    game: Game;
}

// ===========================
// RAWG API interfaces
// ===========================

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