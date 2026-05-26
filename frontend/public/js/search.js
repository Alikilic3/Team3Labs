const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const gamesGrid = document.getElementById("gamesGrid");
const gameModal = document.getElementById("gameModal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");
const favoritesBtn = document.getElementById("favoritesBtn");
const pageTitle = document.getElementById("pageTitle");
const sidebarBtns = document.querySelectorAll(".sidebar-sub-btn");
const filterPlatform = document.getElementById("filterPlatform");
const filterRating = document.getElementById("filterRating");
const filterSort = document.getElementById("filterSort");

let currentGames = [];
let searchTimeout;
let cachedFavorites = [];
let cachedCollection = [];
let activeCurrentGameId = SESSION_CURRENT_GAME_ID;

// ===========================
// Gebruiker ophalen
// ===========================
function getUserId() {
    return SESSION_USER_ID || "";
}

// ===========================
// Actieve sidebar knop
// ===========================
function setActiveBtn(activeBtn) {
    favoritesBtn.classList.remove("active");
    sidebarBtns.forEach(btn => btn.classList.remove("active"));
    activeBtn.classList.add("active");
}

// ===========================
// Filters toepassen
// ===========================
function applyFilters(games) {
    let filtered = [...games];
    const platform = filterPlatform.value;
    const minRating = filterRating.value;

    if (platform) {
        filtered = filtered.filter(game =>
            game.parent_platforms?.some(p =>
                p.platform.slug?.includes(platform) ||
                p.platform.name?.toLowerCase().includes(platform)
            )
        );
    }

    if (minRating) {
        filtered = filtered.filter(game => game.rating >= Number(minRating));
    }

    const sort = filterSort.value;
    if (sort === "-rating") {
        filtered.sort((a, b) => b.rating - a.rating);
    } else if (sort === "-released") {
        filtered.sort((a, b) => new Date(b.released || 0).getTime() - new Date(a.released || 0).getTime());
    } else if (sort === "-playtime") {
        filtered.sort((a, b) => b.playtime - a.playtime);
    }

    return filtered;
}

// ===========================
// Favorieten laden
// ===========================
async function loadFavorites() {
    const userId = getUserId();
    if (!userId) return;
    const response = await fetch(`/api/favorites/${userId}`);
    const data = await response.json();
    cachedFavorites = data.map((f) => f.game);
}

function isFavorite(gameId) {
    return cachedFavorites.some((game) => game.id === gameId);
}

async function toggleFavorite(gameId) {
    const userId = getUserId();
    if (!userId) return;
    const favorite = isFavorite(gameId);
    if (favorite) {
        await fetch(`/api/favorites/${userId}/${gameId}`, { method: "DELETE" });
        cachedFavorites = cachedFavorites.filter(g => g.id !== gameId);
    } else {
        const gameToAdd = currentGames.find((game) => game.id === gameId);
        if (!gameToAdd) return;
        await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, game: gameToAdd })
        });
        cachedFavorites.push(gameToAdd);
    }

    const btn = document.querySelector(`.favorite-btn[data-favorite-id="${gameId}"]`);
    if (btn) {
        const icon = btn.querySelector("i");
        if (favorite) {
            icon.className = "bi bi-heart";
            btn.classList.remove("is-favorite");
        } else {
            icon.className = "bi bi-heart-fill";
            btn.classList.add("is-favorite");
        }
    }
}

// ===========================
// Collectie laden
// ===========================
async function loadCollectionCache() {
    const userId = getUserId();
    if (!userId) return;
    const response = await fetch(`/api/collection/${userId}`);
    const data = await response.json();
    cachedCollection = data.map((entry) => entry.game.id);
}

function isInCollection(gameId) {
    return cachedCollection.includes(gameId);
}

function isCurrentGame(gameId) {
    if (activeCurrentGameId === null || activeCurrentGameId === undefined) return false;
    return Number(activeCurrentGameId) === Number(gameId);
}

// ===========================
// Platform icons
// ===========================
function getPlatformIcons(name) {
    const lower = name.toLowerCase();
    if (lower.includes("pc")) return `<i class="bi bi-windows"></i>`;
    if (lower.includes("playstation")) return `<i class="bi bi-playstation"></i>`;
    if (lower.includes("xbox")) return `<i class="bi bi-xbox"></i>`;
    if (lower.includes("nintendo")) return `<i class="bi bi-nintendo-switch"></i>`;
    return "";
}

// ===========================
// Games renderen
// ===========================
async function renderGames(games) {
    games = games.filter(game => game.background_image);
    currentGames = games;
    const filtered = applyFilters(games);
    gamesGrid.innerHTML = "";
    if (filtered.length === 0) {
        gamesGrid.innerHTML = "<p>Geen games gevonden.</p>";
        return;
    }
    for (const game of filtered) {
        const image = game.background_image;
        const released = game.released ? game.released : "Onbekend";
        const platformIcons = game.parent_platforms
            ? game.parent_platforms.map((p) => getPlatformIcons(p.platform.name)).join("")
            : "";
        const favorite = isFavorite(game.id);
        const favoriteIcon = favorite ? "bi-heart-fill" : "bi-heart";
        const favoriteClass = favorite ? "is-favorite" : "";
        const inCollection = isInCollection(game.id);
        const collectionIcon = inCollection ? "bi-gift-fill" : "bi-gift";
        const collectionStyle = inCollection ? "background: #a855f7; border-color: #a855f7;" : "";
        const isCurrent = isCurrentGame(game.id);
        const currentStyle = isCurrent ? "border: 2px solid #a855f7;" : "";

        gamesGrid.innerHTML += `
            <article class="game-card">
                <div class="game-card-image-wrapper">
                    <img 
                        class="game-card-image"
                        src="${image}" 
                        alt="${game.name}"
                        data-id="${game.id}"
                        onerror="this.style.display='none'"
                    >
                </div>
                <div class="game-card-content">
                    <div class="platform-icons-row">
                        <div class="platform-icons-left">
                            ${platformIcons}
                        </div>
                        <button class="favorite-btn ${favoriteClass}" data-favorite-id="${game.id}">
                            <i class="bi ${favoriteIcon}"></i>
                        </button>
                    </div>
                    <h3 class="game-card-title">${game.name}</h3>
                    
                    <div class="game-card-actions-icons">
                        <button class="icon-btn add-collection-btn" data-game-id="${game.id}" title="Toevoegen aan collectie" style="${collectionStyle}">
                            <i class="bi ${collectionIcon}"></i>
                        </button>
                        <button class="icon-btn current-game-btn" data-game-id="${game.id}" style="${currentStyle}">
                            <i class="bi bi-joystick"></i>
                            <span>Stel in als huidige game</span>
                        </button>
                    </div>

                    <div class="game-card-info">
                        <div class="info-row">
                            <span class="info-label"><i class="bi bi-star-fill"></i> Score</span>
                            <span class="info-value">${game.rating}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label"><i class="bi bi-tag-fill"></i> Genre</span>
                            <span class="info-value">${game.genres ? game.genres.map(g => g.name).join(", ") : "Onbekend"}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label"><i class="bi bi-calendar-event"></i> Release</span>
                            <span class="info-value">${released}</span>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }
}

// ===========================
// Favorieten pagina
// ===========================
async function renderFavorites() {
    pageTitle.textContent = "Mijn Favorieten";
    setActiveBtn(favoritesBtn);
    await loadFavorites();
    await loadCollectionCache();
    await renderGames(cachedFavorites);
    if (cachedFavorites.length === 0) {
        gamesGrid.innerHTML = "<p>Je hebt nog geen favoriete games.</p>";
    }
}

// ===========================
// Games zoeken
// ===========================
async function searchGames() {
    const query = searchInput.value.trim();
    if (query === "") {
        renderFavorites();
        return;
    }
    try {
        pageTitle.textContent = `Zoekresultaten voor "${query}"`;
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        await renderGames(data.results);
    } catch (error) {
        gamesGrid.innerHTML = "<p>Er ging iets fout bij het ophalen van games.</p>";
    }
}

// ===========================
// Game modal
// ===========================
async function openGameModal(gameId) {
    try {
        const response = await fetch(`/api/games/${gameId}`);
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
    const target = event.target;

    const favoriteBtn = target.closest(".favorite-btn");
    if (favoriteBtn) {
        const gameId = favoriteBtn.getAttribute("data-favorite-id");
        if (gameId) await toggleFavorite(Number(gameId));
        return;
    }

    const addCollectionBtn = target.closest(".add-collection-btn");
    if (addCollectionBtn) {
        const gameId = Number(addCollectionBtn.getAttribute("data-game-id"));
        const game = currentGames.find(g => g.id === gameId);
        if (!game) return;
        const userId = getUserId();
        try {
            const response = await fetch("/api/collection", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, game, status: "Backlog" })
            });
            const data = await response.json();
            if (!response.ok) {
                alert(data.error);
                return;
            }
            addCollectionBtn.querySelector("i").className = "bi bi-gift-fill";
            addCollectionBtn.style.background = "#a855f7";
            addCollectionBtn.style.borderColor = "#a855f7";
            cachedCollection.push(gameId);
        } catch (e) {
            alert("Er ging iets fout!");
        }
        return;
    }

    const currentGameBtn = target.closest(".current-game-btn");
    if (currentGameBtn) {
        const gameId = Number(currentGameBtn.getAttribute("data-game-id"));
        const game = currentGames.find(g => g.id === gameId);
        if (!game) return;
        await fetch("/api/current-game", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ game })
        });
        activeCurrentGameId = gameId;
        currentGameBtn.style.border = "2px solid #a855f7";
        currentGameBtn.style.background = "";
        alert(`${game.name} is ingesteld als huidige game!`);
        window.location.reload();
        return;
    }

    const image = target.closest(".game-card-image");
    if (image) {
        const gameId = image.getAttribute("data-id");
        if (gameId) await openGameModal(Number(gameId));
    }
});

favoritesBtn.addEventListener("click", renderFavorites);

sidebarBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
        setActiveBtn(btn);
        const filter = btn.getAttribute("data-filter");
        let url = "";
        let title = "";

        if (filter === "best-of-year") {
            title = "Best of the Year";
            url = "/api/best-of-year";
        } else if (filter === "popular-2025") {
            title = "Popular in 2025";
            url = "/api/popular-2025";
        } else if (filter === "all-time-top") {
            title = "All Time Top 250";
            url = "/api/all-time-top";
        } else if (filter.startsWith("platform-")) {
            const platform = filter.replace("platform-", "");
            const platformNames = {
                pc: "PC Games",
                playstation: "PlayStation Games",
                xbox: "Xbox Games",
                nintendo: "Nintendo Games"
            };
            title = platformNames[platform] || platform;
            url = `/api/platform/${platform}`;
        } else {
            const genreNames = {
                action: "Actie Games",
                rpg: "RPG Games",
                sports: "Sport Games",
                shooter: "Shooter Games",
                strategy: "Strategie Games",
                indie: "Indie Games",
                adventure: "Avontuur Games",
                puzzle: "Puzzel Games"
            };
            title = genreNames[filter] || filter;
            url = `/api/genre/${filter}`;
        }

        pageTitle.textContent = title;
        await loadFavorites();
        await loadCollectionCache();
        try {
            const response = await fetch(url);
            const data = await response.json();
            await renderGames(data.results);
        } catch (e) {
            gamesGrid.innerHTML = "<p>Er ging iets fout.</p>";
        }
    });
});

[filterPlatform, filterRating, filterSort].forEach(filter => {
    filter.addEventListener("change", () => renderGames(currentGames));
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

closeModal.addEventListener("click", () => {
    gameModal.classList.add("hidden");
});

gameModal.addEventListener("click", (event) => {
    if (event.target === gameModal) {
        gameModal.classList.add("hidden");
    }
});

// ===========================
// Start
// ===========================
async function loadDefaultGames() {
    pageTitle.textContent = "Populaire Games";
    favoritesBtn.classList.remove("active");
    const popularBtn = document.querySelector('[data-filter="popular-2025"]');
    if (popularBtn) popularBtn.classList.add("active");
    await loadFavorites();
    await loadCollectionCache();
    try {
        const response = await fetch("/api/popular-2025");
        const data = await response.json();
        await renderGames(data.results);
    } catch (e) {
        gamesGrid.innerHTML = "<p>Er ging iets fout.</p>";
    }
}

loadDefaultGames();

console.log("SESSION_CURRENT_GAME_ID:", SESSION_CURRENT_GAME_ID);
console.log("Type:", typeof SESSION_CURRENT_GAME_ID);