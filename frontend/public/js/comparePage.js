const searchInput1 = document.getElementById("searchInput1");
const searchInput2 = document.getElementById("searchInput2");
const compareBtn = document.getElementById("compareBtn");
const resetBtn = document.getElementById("resetBtn");
const resultsArea = document.getElementById("compareResults");
const defaultArea = document.getElementById("defaultGamesArea");
const topGamesGrid = document.getElementById("topGamesGrid");
const gridTitle = document.getElementById("gridTitle");
const gameModal = document.getElementById("gameModal");
const modalBody = document.getElementById("modalBody");
const closeModal = document.getElementById("closeModal");

let searchTimeout;

async function fetchAPI(endpoint) {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Fout bij ophalen");
    return await response.json();
}

function getPlatformIcons(platforms) {
    if (!platforms || platforms.length === 0) return "Onbekend";
    let html = "";
    platforms.forEach(p => {
        const slug = p.platform.slug;
        if (slug === "pc") html += `<i class="bi bi-windows"></i> `;
        else if (slug === "playstation") html += `<i class="bi bi-playstation"></i> `;
        else if (slug === "xbox") html += `<i class="bi bi-xbox"></i> `;
        else if (slug === "nintendo") html += `<i class="bi bi-nintendo-switch"></i> `;
        else if (slug === "mac") html += `<i class="bi bi-apple"></i> `;
    });
    return html;
}

function renderGrid(games) {
    topGamesGrid.innerHTML = "";
    if (!games || games.length === 0) {
        topGamesGrid.innerHTML = "<p>Geen games gevonden.</p>";
        return;
    }

    games.forEach(game => {
        const img = game.background_image || "assets/images/placeholder.jpg";
        topGamesGrid.innerHTML += `
            <article class="project-card">
                <img src="${img}" alt="${game.name}" class="clickable-game-img" data-id="${game.id}">
                <div class="project-content">
                    <h3>${game.name}</h3>
                    <p><i class="bi bi-star-fill"></i> ${game.rating || "N/A"}</p>
                    <button class="btn btn-outline btn-full add-to-compare-btn" data-gamename="${game.name}">
                        <i class="bi bi-plus-circle"></i> Kies voor vergelijk
                    </button>
                </div>
            </article>
        `;
    });

    addGridListeners();
    updateButtonStates();
}

function createCompareCard(game, otherRating) {
    const ratingColor = game.rating > otherRating ? "#28a745" : game.rating < otherRating ? "#dc3545" : "inherit";
    const img = game.background_image || "assets/images/placeholder.jpg";
    const genres = game.genres ? game.genres.map(g => g.name).join(", ") : "Onbekend";

    return `
        <section class="project-card">
            <img src="${img}" alt="${game.name}" style="width: 100%; height: 200px; object-fit: cover;">
            <div class="project-content">
                <h2>${game.name}</h2>
                <p><i class="bi bi-star-fill"></i> Score: <strong style="color:${ratingColor}">${game.rating || "N/A"}</strong></p>
                <p><i class="bi bi-calendar-event"></i> Release: ${game.released || "Onbekend"}</p>
                <p><i class="bi bi-tags-fill"></i> Genre: ${genres}</p>
                <p><i class="bi bi-controller"></i> Platforms: ${getPlatformIcons(game.parent_platforms)}</p>
                <p><i class="bi bi-clock-history"></i> Speeltijd: ${game.playtime ? game.playtime + " uur" : "Onbekend"}</p>
            </div>
        </section>
    `;
}

function renderCompare(game1, game2) {
    resultsArea.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
            ${createCompareCard(game1, game2.rating)}
            ${createCompareCard(game2, game1.rating)}
        </div>
    `;
}

async function loadPopularGames() {
    try {
        const data = await fetchAPI("/api/popular-2025");
        if (data) renderGrid(data.results.slice(0, 8));
    } catch (e) {
        topGamesGrid.innerHTML = "<p>Er ging iets fout.</p>";
    }
}

function handleLiveSearch(e) {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);

    if (!query) {
        gridTitle.innerHTML = '<i class="bi bi-fire"></i> Populaire Games in 2025';
        loadPopularGames();
        return;
    }

    searchTimeout = setTimeout(async () => {
        gridTitle.innerHTML = `<i class="bi bi-search"></i> Zoekresultaten voor "${query}"`;
        resetView();
        try {
            const data = await fetchAPI(`/api/search?q=${encodeURIComponent(query)}`);
            if (data) renderGrid(data.results.slice(0, 12));
        } catch (e) {
            topGamesGrid.innerHTML = "<p>Er ging iets fout.</p>";
        }
    }, 400);
}

function toggleGameForCompare(gameName) {
    const v1 = searchInput1.value.trim();
    const v2 = searchInput2.value.trim();

    if (v1 === gameName) {
        searchInput1.value = "";
    } else if (v2 === gameName) {
        searchInput2.value = "";
    } else if (!v1) {
        searchInput1.value = gameName;
    } else {
        searchInput2.value = gameName;
    }

    updateButtonStates();

    if (searchInput1.value && searchInput2.value) {
        executeComparison();
    } else {
        resetView();
    }
}

async function executeComparison() {
    const q1 = searchInput1.value.trim();
    const q2 = searchInput2.value.trim();
    if (!q1 || !q2) return;

    defaultArea.style.display = "none";
    resultsArea.style.display = "block";
    resultsArea.innerHTML = "<p>Games vergelijken...</p>";

    try {
        const game1 = await fetchAPI(`/api/compare?q=${encodeURIComponent(q1)}`);
        const game2 = await fetchAPI(`/api/compare?q=${encodeURIComponent(q2)}`);

        if (!game1 || !game2) {
            resultsArea.innerHTML = "<p>Een van de games kon niet worden gevonden.</p>";
            return;
        }

        renderCompare(game1, game2);
    } catch (e) {
        resultsArea.innerHTML = "<p>Er ging iets fout bij het vergelijken.</p>";
    }
}

async function openModal(gameId) {
    try {
        const game = await fetchAPI(`/api/games/${gameId}`);
        if (!game) return;

        modalBody.innerHTML = `
            <img src="${game.background_image || ""}" style="width:100%; border-radius:8px;">
            <h2>${game.name}</h2>
            <p>${game.description_raw || "Geen beschrijving beschikbaar."}</p>
            <p><strong>Release:</strong> ${game.released || "Onbekend"}</p>
            <p><strong>Score:</strong> ${game.rating}</p>
            <p><strong>Speeltijd:</strong> ${game.playtime} uur</p>
        `;
        gameModal.classList.remove("hidden");
    } catch (e) {
        modalBody.innerHTML = "<p>Er ging iets fout.</p>";
    }
}

function updateButtonStates() {
    const v1 = searchInput1.value.trim();
    const v2 = searchInput2.value.trim();

    document.querySelectorAll(".add-to-compare-btn").forEach(btn => {
        const name = btn.getAttribute("data-gamename");
        if (name === v1 || name === v2) {
            btn.innerHTML = '<i class="bi bi-x-circle"></i> Verwijder';
            btn.classList.add("btn-danger");
            btn.classList.remove("btn-outline");
        } else {
            btn.innerHTML = '<i class="bi bi-plus-circle"></i> Kies voor vergelijk';
            btn.classList.remove("btn-danger");
            btn.classList.add("btn-outline");
        }
    });
}

function resetView() {
    resultsArea.style.display = "none";
    resultsArea.innerHTML = "";
    defaultArea.style.display = "block";
}

function addGridListeners() {
    document.querySelectorAll(".add-to-compare-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            toggleGameForCompare(btn.getAttribute("data-gamename"));
        });
    });

    document.querySelectorAll(".clickable-game-img").forEach(img => {
        img.addEventListener("click", () => {
            openModal(img.getAttribute("data-id"));
        });
    });
}

searchInput1.addEventListener("input", handleLiveSearch);
searchInput2.addEventListener("input", handleLiveSearch);
compareBtn.addEventListener("click", executeComparison);

resetBtn.addEventListener("click", () => {
    searchInput1.value = "";
    searchInput2.value = "";
    gridTitle.innerHTML = '<i class="bi bi-fire"></i> Populaire Games in 2025';
    resetView();
    loadPopularGames();
});

closeModal.addEventListener("click", () => {
    gameModal.classList.add("hidden");
});

gameModal.addEventListener("click", (e) => {
    if (e.target === gameModal) {
        gameModal.classList.add("hidden");
    }
});

loadPopularGames();