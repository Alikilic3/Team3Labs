const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const gamesGrid = document.getElementById("gamesGrid");
const gameModal = document.getElementById("gameModal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");
const favoritesBtn = document.getElementById("favoritesBtn");
const pageTitle = document.getElementById("pageTitle");
const sidebarBtns = document.querySelectorAll(".sidebar-sub-btn");
const filterRating = document.getElementById("filterRating");
const filterSort = document.getElementById("filterSort");
const pagination = document.getElementById("pagination");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const paginationInfo = document.getElementById("paginationInfo");


let currentGames = [];
let searchTimeout;
let currentPage = 1;
let totalPages = 1;


function getUserId() {
    return SESSION_USER_ID || "";
}


function setActiveBtn(activeBtn) {
    favoritesBtn.classList.remove("active");
    sidebarBtns.forEach(btn => btn.classList.remove("active"));
    activeBtn.classList.add("active");
}


async function getFavorites() {
    const userId = getUserId();
    if (!userId) return [];
    const response = await fetch(`/api/favorites/${userId}`);
    const data = await response.json();
    return data.map(f => f.game);
}

async function isFavorite(gameId) {
    const favorites = await getFavorites();
    return favorites.some(game => game.id === gameId);
}

async function toggleFavorite(gameId) {
    const userId = getUserId();
    if (!userId) return;

    if (await isFavorite(gameId)) {
        await fetch(`/api/favorites/${userId}/${gameId}`, { method: "DELETE" });
    } else {
        const game = currentGames.find(g => g.id === gameId);
        if (!game) return;
        await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, game })
        });
    }

    const btn = document.querySelector(`.favorite-btn[data-favorite-id="${gameId}"]`);
    if (btn) {
        const isFav = await isFavorite(gameId);
        btn.querySelector("i").className = isFav ? "bi bi-heart-fill" : "bi bi-heart";
        isFav ? btn.classList.add("is-favorite") : btn.classList.remove("is-favorite");
    }
}

function getPlatformIcons(name) {
    const lower = name.toLowerCase();
    if (lower.includes("pc")) return `<i class="bi bi-windows"></i>`;
    if (lower.includes("playstation")) return `<i class="bi bi-playstation"></i>`;
    if (lower.includes("xbox")) return `<i class="bi bi-xbox"></i>`;
    if (lower.includes("nintendo")) return `<i class="bi bi-nintendo-switch"></i>`;
    return "";
}


async function renderGames(games) {
    games = games.filter(game => game.background_image);
    currentGames = games;
    gamesGrid.innerHTML = "";

    if (games.length === 0) {
        gamesGrid.innerHTML = "<p>Geen games gevonden.</p>";
        return;
    }

    // Filter op rating
    const minRating = filterRating.value;
    if (minRating) {
        games = games.filter(game => game.rating >= Number(minRating));
    }

    // Sortering
    const sort = filterSort.value;
    if (sort === "-rating") {
        games.sort((a, b) => b.rating - a.rating);
    } else if (sort === "-released") {
        games.sort((a, b) => new Date(b.released) - new Date(a.released));
    }

    for (const game of games) {
        const released = game.released ? game.released : "Onbekend";
        const platformIcons = game.parent_platforms
            ? game.parent_platforms.map(p => getPlatformIcons(p.platform.name)).join("")
            : "";
        const favorite = await isFavorite(game.id);
        const favoriteIcon = favorite ? "bi-heart-fill" : "bi-heart";
        const favoriteClass = favorite ? "is-favorite" : "";

        gamesGrid.innerHTML += `
            <article class="game-card">
                <div class="game-card-image-wrapper">
                    <img 
                        class="game-card-image"
                        src="${game.background_image}" 
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
                        <button class="icon-btn add-collection-btn" data-game-id="${game.id}" title="Toevoegen aan collectie">
                            <i class="bi bi-gift"></i>
                        </button>
                        <button class="icon-btn current-game-btn" data-game-id="${game.id}">
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

async function renderFavorites() {
    pageTitle.textContent = "Mijn Favorieten";
    setActiveBtn(favoritesBtn);
    pagination.style.display = "none";
    const favorites = await getFavorites();
    if (favorites.length === 0) {
        gamesGrid.innerHTML = "<p>Je hebt nog geen favoriete games.</p>";
        return;
    }
    await renderGames(favorites);
}

async function searchGames(page = 1) {
    const query = searchInput.value.trim();
    if (query === "") {
        renderFavorites();
        return;
    }
    try {
        currentPage = page;
        pageTitle.textContent = `Zoekresultaten voor "${query}"`;
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}`);
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        totalPages = Math.ceil(data.count / 20);
        await renderGames(data.results);
        updatePagination();
        document.querySelector(".search-main").scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
        gamesGrid.innerHTML = "<p>Er ging iets fout bij het ophalen van games.</p>";
    }
}
function updatePagination() {
    if (totalPages <= 1) {
        pagination.style.display = "none";
        return;
    }
    pagination.style.display = "flex";
    paginationInfo.textContent = `Pagina ${currentPage} van ${totalPages}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

async function openGameModal(gameId) {
    try {
        const response = await fetch(`/api/games/${gameId}`);
        if (!response.ok) throw new Error(response.statusText);
        const game = await response.json();
        const image = game.background_image || "https://via.placeholder.com/800x300?text=Geen+afbeelding";
        const released = game.released ? game.released : "Onbekend";
        const description = game.description_raw || "Geen beschrijving beschikbaar.";
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
        gamesGrid.innerHTML = "<p>Er ging iets fout.</p>";
    }
}

// Event Listener
gamesGrid.addEventListener("click", async (event) => {
    const target = event.target;

    // Favoriet knop
    const favoriteBtn = target.closest(".favorite-btn");
    if (favoriteBtn) {
        const gameId = Number(favoriteBtn.getAttribute("data-favorite-id"));
        await toggleFavorite(gameId);
        return;
    }

    // Aan collectie toevoegen
    const addCollectionBtn = target.closest(".add-collection-btn");
    if (addCollectionBtn) {
        const gameId = Number(addCollectionBtn.getAttribute("data-game-id"));
        const game = currentGames.find(g => g.id === gameId);
        if (!game) return;
        const userId = getUserId();
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
        return;
    }

    // Huidige game instellen
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
        alert(`${game.name} is ingesteld als huidige game!`);
        window.location.reload();
        return;
    }

    // Game modal openen
    const image = target.closest(".game-card-image");
    if (image) {
        await openGameModal(Number(image.getAttribute("data-id")));
    }
});

// Favorieten knop
favoritesBtn.addEventListener("click", renderFavorites);

// Sidebar knoppen
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
        } else if (filter === "platform-pc") {
            title = "PC Games";
            url = "/api/platform/pc";
        } else if (filter === "platform-playstation") {
            title = "PlayStation Games";
            url = "/api/platform/playstation";
        } else if (filter === "platform-xbox") {
            title = "Xbox Games";
            url = "/api/platform/xbox";
        } else if (filter === "platform-nintendo") {
            title = "Nintendo Games";
            url = "/api/platform/nintendo";
        } else if (filter === "action") {
            title = "Actie Games";
            url = "/api/genre/action";
        } else if (filter === "rpg") {
            title = "RPG Games";
            url = "/api/genre/rpg";
        } else if (filter === "sports") {
            title = "Sport Games";
            url = "/api/genre/sports";
        } else if (filter === "shooter") {
            title = "Shooter Games";
            url = "/api/genre/shooter";
        } else if (filter === "strategy") {
            title = "Strategie Games";
            url = "/api/genre/strategy";
        } else if (filter === "indie") {
            title = "Indie Games";
            url = "/api/genre/indie";
        } else if (filter === "adventure") {
            title = "Avontuur Games";
            url = "/api/genre/adventure";
        } else if (filter === "puzzle") {
            title = "Puzzel Games";
            url = "/api/genre/puzzle";
        }

        pageTitle.textContent = title;
        pagination.style.display = "none";
        try {
            const response = await fetch(url);
            const data = await response.json();
            await renderGames(data.results);
        } catch (e) {
            gamesGrid.innerHTML = "<p>Er ging iets fout.</p>";
        }
    });
});

// Filters
filterRating.addEventListener("change", () => renderGames(currentGames));
filterSort.addEventListener("change", () => renderGames(currentGames));

// Paginatie knoppen
prevBtn.addEventListener("click", () => {
    if (currentPage > 1) searchGames(currentPage - 1);
});

nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) searchGames(currentPage + 1);
});

// Zoeken
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

// Modal sluiten
closeModal.addEventListener("click", () => {
    gameModal.classList.add("hidden");
});

gameModal.addEventListener("click", (event) => {
    if (event.target === gameModal) {
        gameModal.classList.add("hidden");
    }
});

// Start
async function loadDefaultGames() {
    pageTitle.textContent = "Populaire Games";
    const popularBtn = document.querySelector('[data-filter="popular-2025"]');
    if (popularBtn) popularBtn.classList.add("active");
    try {
        const response = await fetch("/api/popular-2025");
        const data = await response.json();
        await renderGames(data.results);
    } catch (e) {
        gamesGrid.innerHTML = "<p>Er ging iets fout.</p>";
    }
}

loadDefaultGames();