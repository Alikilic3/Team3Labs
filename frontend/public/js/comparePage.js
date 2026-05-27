// ==========================================
// 1. DOM ELEMENTEN
// ==========================================
const DOM = {
    input1: document.getElementById("searchInput1"),
    input2: document.getElementById("searchInput2"),
    btnCompare: document.getElementById("compareBtn"),
    btnReset: document.getElementById("resetBtn"),
    resultsArea: document.getElementById("compareResults"),
    defaultArea: document.getElementById("defaultGamesArea"),
    grid: document.getElementById("topGamesGrid"),
    gridTitle: document.getElementById("gridTitle"),
    modal: document.getElementById("gameModal"),
    modalBody: document.getElementById("modalBody"),
    modalClose: document.getElementById("closeModal")
};

let searchTimeout; // Voor de live-search delay

// ==========================================
// 2. API CALLS (Praten met jouw server.ts)
// ==========================================
async function fetchAPI(endpoint) {
    try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("API Error");
        return await res.json();
    } catch (error) {
        console.error(`Fout bij laden van ${endpoint}:`, error);
        return null;
    }
}

// ==========================================
// 3. UI RENDER FUNCTIES (Grid & Vergelijking)
// ==========================================
function renderGrid(games) {
    DOM.grid.innerHTML = "";
    if (!games || games.length === 0) {
        DOM.grid.innerHTML = "<p class='text-center w-100'>Geen games gevonden...</p>";
        return;
    }

    games.forEach(game => {
        const img = game.background_image || 'assets/images/placeholder.jpg';
        DOM.grid.innerHTML += `
            <article class="project-card d-flex flex-column overflow-hidden">
                <img src="${img}" alt="${game.name}" class="clickable-game-img" data-id="${game.id}" title="Klik voor details" style="width: 100%; height: 150px; object-fit: cover; cursor: pointer;">
                <div class="project-content p-3 d-flex flex-column justify-content-between flex-grow-1">
                    <div>
                        <h3 class="fs-5 text-white mb-2">${game.name}</h3>
                        <p class="text-secondary mb-3"><i class="bi bi-star-fill text-warning"></i> ${game.rating || 'N/A'}</p>
                    </div>
                    <button class="btn btn-outline w-100 add-to-compare-btn" data-gamename="${game.name}">
                        <i class="bi bi-plus-circle"></i> Kies voor vergelijk
                    </button>
                </div>
            </article>
        `;
    });

    attachGridEventListeners();
    updateButtonStates();
}

function renderCompare(game1, game2) {
    const getColor = (r1, r2) => r1 > r2 ? '#28a745' : (r1 < r2 ? '#dc3545' : 'inherit');
    const color1 = getColor(game1.rating, game2.rating);
    const color2 = getColor(game2.rating, game1.rating);

    DOM.resultsArea.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; width: 100%;">
            ${createCompareCard(game1, color1)}
            ${createCompareCard(game2, color2)}
        </div>
    `;
}

function createCompareCard(game, ratingColor) {
    const img = game.background_image || 'assets/images/placeholder.jpg';
    return `
        <section class="project-card compare-card">
            <img src="${img}" alt="${game.name}" style="width: 100%; height: 200px; object-fit: cover;">
            <div class="project-content p-4">
                <h2 class="game-title border-bottom pb-2 mb-3">${game.name}</h2>
                <div class="d-flex flex-column gap-2">
                    <div><i class="bi bi-star-fill text-warning"></i> <strong>Score:</strong> <span style="color:${ratingColor}; font-weight:bold;">${game.rating || 'N/A'}</span></div>
                    <div><i class="bi bi-calendar-event text-info"></i> <strong>Release:</strong> ${game.released || 'Onbekend'}</div>
                    <div><i class="bi bi-tags-fill text-success"></i> <strong>Genre:</strong> ${getNames(game.genres)}</div>
                    <div><i class="bi bi-pc-display text-primary"></i> <strong>Platforms:</strong> ${getPlatformIcons(game.parent_platforms)}</div>
                    <div><i class="bi bi-clock-history text-secondary"></i> <strong>Speeltijd:</strong> ${game.playtime ? game.playtime + ' uur' : 'Onbekend'}</div>
                    <div><i class="bi bi-building text-light"></i> <strong>Uitgever:</strong> ${getNames(game.publishers || game.developers)}</div>
                </div>
            </div>
        </section>
    `;
}

// ==========================================
// 4. LOGICA & EVENT HANDLERS
// ==========================================
async function loadPopularGames() {
    const data = await fetchAPI("/api/popular-2025");
    if (data) renderGrid(data.results.slice(0, 8));
}

function handleLiveSearch(e) {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);

    if (!query) {
        DOM.gridTitle.innerHTML = '<i class="bi bi-fire text-danger"></i> Populaire Games in 2025';
        loadPopularGames();
        return;
    }

    searchTimeout = setTimeout(async () => {
        DOM.gridTitle.innerHTML = `<i class="bi bi-search"></i> Zoekresultaten voor "${query}"`;
        resetViewToGrid();
        const data = await fetchAPI(`/api/search?q=${encodeURIComponent(query)}`);
        if (data) renderGrid(data.results.slice(0, 12));
    }, 400);
}

function toggleGameForCompare(gameName) {
    const v1 = DOM.input1.value.trim();
    const v2 = DOM.input2.value.trim();

    if (v1 === gameName) DOM.input1.value = "";
    else if (v2 === gameName) DOM.input2.value = "";
    else if (!v1) DOM.input1.value = gameName;
    else DOM.input2.value = gameName;

    updateButtonStates();

    if (DOM.input1.value && DOM.input2.value) {
        executeComparison();
        document.querySelector(".compare-search-area").scrollIntoView({ behavior: "smooth" });
    } else {
        resetViewToGrid();
    }
}

async function executeComparison() {
    const q1 = DOM.input1.value.trim();
    const q2 = DOM.input2.value.trim();

    if (!q1 || !q2) return;

    DOM.defaultArea.style.display = "none";
    DOM.resultsArea.style.display = "block";
    DOM.resultsArea.innerHTML = '<p class="text-center"><i class="bi bi-hourglass-split"></i> Games vergelijken...</p>';

    const [game1, game2] = await Promise.all([
        fetchAPI(`/api/compare?q=${encodeURIComponent(q1)}`),
        fetchAPI(`/api/compare?q=${encodeURIComponent(q2)}`)
    ]);

    if (!game1 || !game2) {
        DOM.resultsArea.innerHTML = '<p class="text-center text-danger"><i class="bi bi-x-circle-fill"></i> Een van de games kon niet worden gevonden.</p>';
        return;
    }

    renderCompare(game1, game2);
}

async function openModal(gameId) {
    const game = await fetchAPI(`/api/games/${gameId}`);
    if (!game) return;

    DOM.modalBody.innerHTML = `
        <img src="${game.background_image || 'https://via.placeholder.com/800x300'}" style="width:100%; border-radius:8px;">
        <h2 class="mt-3">${game.name}</h2>
        <p class="mt-3" style="line-height:1.6;">${game.description_raw || "Geen beschrijving beschikbaar."}</p>
        <div class="mt-4 d-flex flex-wrap gap-3" style="font-size:0.9rem;">
            <p><strong>Release:</strong> ${game.released || "Onbekend"}</p>
            <p><strong>Score:</strong> ${game.rating}</p>
            <p><strong>Speeltijd:</strong> ${game.playtime} uur</p>
        </div>
    `;
    DOM.modal.classList.remove("hidden");
}

// ==========================================
// 5. HULPFUNCTIES & INTERACTIES
// ==========================================
function updateButtonStates() {
    const v1 = DOM.input1.value.trim();
    const v2 = DOM.input2.value.trim();

    document.querySelectorAll(".add-to-compare-btn").forEach(btn => {
        const name = btn.getAttribute("data-gamename");
        if (name === v1 || name === v2) {
            btn.innerHTML = '<i class="bi bi-x-circle"></i> Verwijder';
            btn.style.cssText = "color: #dc3545; border-color: #dc3545; background: rgba(220, 53, 69, 0.1);";
        } else {
            btn.innerHTML = '<i class="bi bi-plus-circle"></i> Kies voor vergelijk';
            btn.style.cssText = "";
        }
    });
}

function resetViewToGrid() {
    DOM.resultsArea.style.display = "none";
    DOM.resultsArea.innerHTML = "";
    DOM.defaultArea.style.display = "block";
}

function getNames(arr) {
    return (!arr || arr.length === 0) ? 'Onbekend' : arr.map(i => i.name).join(', ');
}

function getPlatformIcons(platforms) {
    if (!platforms) return '<i class="bi bi-question-circle"></i>';
    const icons = { pc: 'windows', playstation: 'playstation', xbox: 'xbox', nintendo: 'nintendo-switch', mac: 'apple', android: 'android2' };
    return platforms.map(p => {
        const icon = icons[p.platform.slug] || 'controller';
        return `<i class="bi bi-${icon}" title="${p.platform.name}"></i> `;
    }).join('');
}

function attachGridEventListeners() {
    // Vergelijk knoppen
    document.querySelectorAll(".add-to-compare-btn").forEach(btn => {
        btn.addEventListener("click", (e) => toggleGameForCompare(e.target.closest("button").dataset.gamename));
    });

    // NIEUW: Koppel klik-event aan de afbeelding voor de Modal
    document.querySelectorAll(".clickable-game-img").forEach(img => {
        img.addEventListener("click", (e) => {
            const gameId = e.target.dataset.id;
            openModal(gameId); // Roept de functie aan die de API ophaalt en modal toont
        });
    });
}

// ==========================================
// 6. INITIALISATIE (Start Applicatie)
// ==========================================
DOM.input1.addEventListener("input", handleLiveSearch);
DOM.input2.addEventListener("input", handleLiveSearch);
DOM.btnCompare.addEventListener("click", executeComparison);

DOM.btnReset.addEventListener("click", () => {
    DOM.input1.value = "";
    DOM.input2.value = "";
    DOM.gridTitle.innerHTML = '<i class="bi bi-fire text-danger"></i> Populaire Games in 2025';
    resetViewToGrid();
    loadPopularGames();
});

DOM.modalClose.addEventListener("click", () => DOM.modal.classList.add("hidden"));
DOM.modal.addEventListener("click", (e) => { if (e.target === DOM.modal) DOM.modal.classList.add("hidden"); });

// Laad standaard games bij opstarten
document.addEventListener("DOMContentLoaded", loadPopularGames);