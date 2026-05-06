const searchInput = document.getElementById("searchInput") as HTMLInputElement;
const searchBtn = document.getElementById("searchBtn") as HTMLButtonElement;
const gamesGrid = document.getElementById("gamesGrid") as HTMLDivElement;

const favoritesViewBtn = document.getElementById("favoritesViewBtn") as HTMLButtonElement;
const searchViewBtn = document.getElementById("searchViewBtn") as HTMLButtonElement;

const gameModal = document.getElementById("gameModal") as HTMLDivElement;
const modalBody = document.getElementById("modalBody") as HTMLDivElement;
const closeModal = document.getElementById("closeModal") as HTMLButtonElement;

const API_KEY = "832eedeb890b48e0bbd42c3105728fe9";

let currentGames: any[] = [];
let searchTimeout: number | undefined;

// ===========================
// Gebruiker ophalen
// ===========================
function getUserId(): string {
    return localStorage.getItem("userId") || "";
}

// ===========================
// Favorieten via API
// ===========================
async function getFavorites(): Promise<any[]> {
    const userId = getUserId();
    if (!userId) return [];

    const response = await fetch(`/api/favorites/${userId}`);
    const data = await response.json();
    return data.map((f: any) => f.game);
}

async function isFavorite(gameId: number): Promise<boolean> {
    const favorites = await getFavorites();
    return favorites.some((game: any) => game.id === gameId);
}

async function toggleFavorite(gameId: number): Promise<void> {
    const userId = getUserId();
    if (!userId) return;

    const favorite = await isFavorite(gameId);

    if (favorite) {
        await fetch(`/api/favorites/${userId}/${gameId}`, {
            method: "DELETE"
        });
    } else {
        const gameToAdd = currentGames.find((game) => game.id === gameId);
        if (!gameToAdd) return;

        await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, game: gameToAdd })
        });
    }

    if (favoritesViewBtn.classList.contains("active")) {
        renderFavorites();
    } else {
        renderGames(currentGames);
    }
}

// ===========================
// Games renderen
// ===========================
async function renderGames(games: any[]): Promise<void> {
    currentGames = games;
    gamesGrid.innerHTML = "";

    if (games.length === 0) {
        gamesGrid.innerHTML = "<p>Geen games gevonden.</p>";
        return;
    }

    for (const game of games) {
        const image = game.background_image
            ? game.background_image
            : "https://via.placeholder.com/600x300?text=Geen+afbeelding";

        const released = game.released ? game.released : "Onbekend";

        const platformIcons = game.parent_platforms
            ? game.parent_platforms.map((p: any) => getPlatformIcons(p.platform.name)).join("")
            : "";

        const favorite = await isFavorite(game.id);
        const favoriteIcon = favorite ? "bi-heart-fill" : "bi-heart";
        const favoriteClass = favorite ? "is-favorite" : "";

        gamesGrid.innerHTML += `
            <article class="game-card">
                <div class="game-card-image-wrapper">
                    <img 
                        class="game-card-image"
                        src="${image}" 
                        alt="${game.name}"
                        data-id="${game.id}"
                        onerror="this.src='https://via.placeholder.com/600x300?text=Geen+afbeelding'"
                    >
                    <button class="favorite-btn ${favoriteClass}" data-favorite-id="${game.id}">
                        <i class="bi ${favoriteIcon}"></i>
                    </button>
                </div>

                <div class="game-card-content">
                    <h3 class="game-card-title">${game.name}</h3>

                    <div class="game-card-info">
                        <div class="info-row">
                            <span class="info-label"><i class="bi bi-star-fill"></i> Score</span>
                            <span class="info-value">${game.rating}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label"><i class="bi bi-controller"></i> Platforms</span>
                            <span class="info-value platform-icons">${platformIcons}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label"><i class="bi bi-clock-history"></i> Speeltijd</span>
                            <span class="info-value">${game.playtime} uur</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label"><i class="bi bi-calendar-event"></i> Release</span>
                            <span class="info-value">${released}</span>
                        </div>
                    </div>

                    <button class="add-btn">
                        <i class="bi bi-plus-lg"></i>
                        Toevoegen aan collectie
                    </button>
                </div>
            </article>
        `;
    }
}

async function renderFavorites(): Promise<void> {
    favoritesViewBtn.classList.add("active");
    searchViewBtn.classList.remove("active");
    const favorites = await getFavorites();
    await renderGames(favorites);

    if (favorites.length === 0) {
        gamesGrid.innerHTML = "<p>Je hebt nog geen favoriete games.</p>";
    }
}

// ===========================
// Games zoeken
// ===========================
async function searchGames(): Promise<void> {
    const query = searchInput.value.trim();

    if (query === "") {
        renderFavorites();
        return;
    }

    try {
        favoritesViewBtn.classList.remove("active");
        searchViewBtn.classList.add("active");

        const response = await fetch(
            `https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(query)}`
        );

        if (!response.ok) throw new Error(response.statusText);

        const data = await response.json();
        await renderGames(data.results);
    } catch (error) {
        gamesGrid.innerHTML = "<p>Er ging iets fout bij het ophalen van games.</p>";
        console.log(error);
    }
}

function getPlatformIcons(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes("pc")) return `<i class="bi bi-windows"></i>`;
    if (lower.includes("playstation")) return `<i class="bi bi-playstation"></i>`;
    if (lower.includes("xbox")) return `<i class="bi bi-xbox"></i>`;
    if (lower.includes("nintendo")) return `<i class="bi bi-nintendo-switch"></i>`;
    return `<i class="bi bi-controller"></i>`;
}

async function openGameModal(gameId: number): Promise<void> {
    try {
        const response = await fetch(
            `https://api.rawg.io/api/games/${gameId}?key=${API_KEY}`
        );

        if (!response.ok) throw new Error(response.statusText);

        const game = await response.json();

        const image = game.background_image
            ? game.background_image
            : "https://via.placeholder.com/800x300?text=Geen+afbeelding";

        const released = game.released ? game.released : "Onbekend";
        const description = game.description_raw
            ? game.description_raw
            : "Geen beschrijving beschikbaar.";

        modalBody.innerHTML = `
            <img class="modal-image" src="${image}" alt="${game.name}">
            <h2 class="modal-title">${game.name}</h2>
            <p class="modal-description">${description}</p>

            <div class="modal-meta">
                <p><strong>Release:</strong> ${released}</p>
                <p><strong>Score:</strong> ${game.rating}</p>
                <p><strong>Metacritic:</strong> ${game.metacritic ?? "Geen score"}</p>
                <p><strong>Speeltijd:</strong> ${game.playtime} uur</p>
            </div>

            <button class="add-btn">
                <i class="bi bi-plus-lg"></i>
                Toevoegen aan collectie
            </button>
        `;

        gameModal.classList.remove("hidden");
    } catch (error) {
        console.log(error);
    }
}

// ===========================
// Event listeners
// ===========================
gamesGrid.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;

    const favoriteBtn = target.closest(".favorite-btn") as HTMLButtonElement | null;
    if (favoriteBtn) {
        const gameId = favoriteBtn.getAttribute("data-favorite-id");
        if (gameId) await toggleFavorite(Number(gameId));
        return;
    }

    const image = target.closest(".game-card-image") as HTMLImageElement | null;
    if (image) {
        const gameId = image.getAttribute("data-id");
        if (gameId) await openGameModal(Number(gameId));
    }
});

closeModal.addEventListener("click", () => {
    gameModal.classList.add("hidden");
});

gameModal.addEventListener("click", (event) => {
    if (event.target === gameModal) {
        gameModal.classList.add("hidden");
    }
});

searchBtn.addEventListener("click", searchGames);

searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(() => {
        if (searchInput.value.trim() === "") {
            renderFavorites();
        } else {
            searchGames();
        }
    }, 400);
});

favoritesViewBtn.addEventListener("click", () => {
    searchInput.value = "";
    renderFavorites();
});

searchViewBtn.addEventListener("click", () => {
    favoritesViewBtn.classList.remove("active");
    searchViewBtn.classList.add("active");

    if (searchInput.value.trim() !== "") {
        searchGames();
    } else {
        gamesGrid.innerHTML = "<p>Typ in de zoekbalk om games te zoeken.</p>";
    }
});

renderFavorites();