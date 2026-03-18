export interface PlatformDetails {
  id: number;
  name: string;
  slug: string; // bijv. 'pc', 'playstation', 'xbox', 'nintendo'
}

export interface Platform {
  platform: PlatformDetails;
}

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

export interface RawgResponse {
  results: Game[];
}

export interface GameDetail {
  id: number;
  name: string;
  background_image: string | null;
  description_raw: string;
  released: string | null;
  rating: number;
  playtime: number;
  metacritic: number | null;
}

export interface CardGame {
  id: number;
  name: string;
  background_image: string | null;
  rating: number;
  released: string | null;
  playtime: number;
  parent_platforms: { platform: { name: string } }[];
}
