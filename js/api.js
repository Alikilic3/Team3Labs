const API_KEY = "832eedeb890b48e0bbd42c3105728fe9";
const BASE_URL = "https://api.rawg.io/api";
export async function searchGames(query) {
    try {
        const response = await fetch(`${BASE_URL}/games?key=${API_KEY}&search=${query}`);
        if (!response.ok) {
            throw new Error(`Fout bij ophalen: ${response.status}`);
        }
        const data = await response.json();
        return data.results;
    }
    catch (error) {
        console.error("Er is een fout opgetreden:", error);
        return [];
    }
}
