// types.ts

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
