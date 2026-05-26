const gamesGrid = document.getElementById("gamesGrid");
const sortSelect = document.getElementById("sort");

// ===========================
// Gebruiker ophalen
// ===========================
function getUserId() {
    return SESSION_USER_ID || "";
}

// ===========================
// Platform icoontjes
// ===========================
function getPlatformIcons(parentPlatforms) {
    if (!parentPlatforms || parentPlatforms.length === 0) return "";
    let iconsHTML = "";
    parentPlatforms.forEach(p => {
        const slug = p.platform.slug;
        if (slug === "pc") iconsHTML += `<i class="bi bi-windows" title="PC"></i> `;
        else if (slug === "playstation") iconsHTML += `<i class="bi bi-playstation" title="PlayStation"></i> `;
        else if (slug === "xbox") iconsHTML += `<i class="bi bi-xbox" title="Xbox"></i> `;
        else if (slug === "nintendo") iconsHTML += `<i class="bi bi-nintendo-switch" title="Nintendo"></i> `;
        else if (slug === "mac") iconsHTML += `<i class="bi bi-apple" title="Mac"></i> `;
    });
    return iconsHTML;
}

// ===========================
// Collectie ophalen
// ===========================
async function loadCollection() {
    const userId = getUserId();
    if (!userId) return;

    try {
        const response = await fetch(`/api/collection/${userId}`);
        let collection = await response.json();

        const sortValue = sortSelect.value;
        if (sortValue === "rating") collection.sort((a, b) => b.game.rating - a.game.rating);
        if (sortValue === "name") collection.sort((a, b) => a.game.name.localeCompare(b.game.name));
        if (sortValue === "release") collection.sort((a, b) => new Date(b.game.released) - new Date(a.game.released));

        renderCollection(collection);
    } catch (e) {
        gamesGrid.innerHTML = "<p>Er ging iets fout bij het ophalen van je collectie.</p>";
    }
}

// ===========================
// Collectie renderen
// ===========================
function renderCollection(collection) {
    gamesGrid.innerHTML = "";

    if (collection.length === 0) {
        gamesGrid.innerHTML = "<p>Je collectie is leeg. Ga naar Zoeken om games toe te voegen!</p>";
        return;
    }

    collection.forEach((entry, index) => {
        const game = entry.game;
        const status = entry.status || "Backlog";

        let statusColor = "#FF9800";
        if (status === "Playing") statusColor = "#2196F3";
        if (status === "Completed") statusColor = "#4CAF50";

        const cardHtml = `
            <article class="project-card">
                <img src="${game.background_image}" alt="" class="game-cover">
                <div class="project-content">
                    <h3 class="game-title">${game.name}</h3>
                    <div class="stat-list">
                        <div class="stat-row">
                            <span class="stat-label"><i class="bi bi-star-fill text-warning"></i> Score</span>
                            <span class="stat-value">${game.rating}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label"><i class="bi bi-controller"></i> Platforms</span>
                            <span class="stat-value platform-icons">${getPlatformIcons(game.parent_platforms)}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label"><i class="bi bi-bookmark-fill"></i> Status</span>
                            <span class="stat-value">
                                <select class="status-select" data-game-id="${game.id}" style="
                                    color: ${statusColor};
                                    background: #2a2a2d;
                                    border: 1px solid ${statusColor};
                                    border-radius: 8px;
                                    padding: 6px 12px;
                                    font-weight: 600;
                                    font-size: 0.9rem;
                                    cursor: pointer;
                                    outline: none;
                                ">
                                    <option value="Backlog" ${status === "Backlog" ? "selected" : ""}>📋 Backlog</option>
                                    <option value="Playing" ${status === "Playing" ? "selected" : ""}>🎮 Playing</option>
                                    <option value="Completed" ${status === "Completed" ? "selected" : ""}>✅ Completed</option>
                                </select>
                            </span>
                        </div>
                    </div>
                    <div class="collection-actions">
                        <button class="btn btn-outline btn-full set-current-btn" data-index="${index}">
                            <i class="bi bi-joystick"></i> Maak Huidige Game
                        </button>
                        <button class="btn btn-danger btn-full remove-btn" data-game-id="${game.id}">
                            <i class="bi bi-trash3"></i> Verwijderen
                        </button>
                    </div>
                </div>
            </article>
        `;
        gamesGrid.innerHTML += cardHtml;
    });

    // Status dropdowns
    document.querySelectorAll(".status-select").forEach(select => {
        select.addEventListener("change", async (e) => {
            const gameId = e.target.getAttribute("data-game-id");
            const status = e.target.value;
            const userId = getUserId();
            await fetch(`/api/collection/${userId}/${gameId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            const colors = { Playing: "#2196F3", Completed: "#4CAF50", Backlog: "#FF9800" };
            e.target.style.color = colors[status];
            e.target.style.borderColor = colors[status];
        });
    });

    // Verwijder knoppen
    document.querySelectorAll(".remove-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const gameId = btn.getAttribute("data-game-id");
            const userId = getUserId();
            await fetch(`/api/collection/${userId}/${gameId}`, { method: "DELETE" });
            loadCollection();
        });
    });

    // Huidige game knoppen
    document.querySelectorAll(".set-current-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const index = Number(btn.getAttribute("data-index"));
            const game = collection[index].game;
            await fetch("/api/current-game", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ game })
            });
            alert(`${game.name} is ingesteld als huidige game!`);
            window.location.reload();
        });
    });
}

// ===========================
// Sort
// ===========================
sortSelect.addEventListener("change", loadCollection);

// ===========================
// Start
// ===========================
loadCollection();