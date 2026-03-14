const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const gamesGrid = document.getElementById("gamesGrid");

function renderGames(games) {
  gamesGrid.innerHTML = "";

  if (!games || games.length === 0) {
    gamesGrid.innerHTML = "<p>Geen resultaten gevonden.</p>";
    return;
  }

  games.forEach((game) => {
    const image = game.background_image || "assets/images/cyberpunk.png";
    const released = game.released || "Onbekend";
    const rating = game.rating ? `⭐ ${game.rating}` : "⭐ Geen rating";

    const card = document.createElement("article");
    card.className = "game-card";

    card.innerHTML = `
      <img src="${image}" alt="Cover van ${game.name}" class="game-cover">
      <div class="game-info">
        <div class="game-header">
          <h3 class="game-title">${game.name}</h3>
          <span class="game-rating">${rating}</span>
        </div>
        <p class="game-meta">Released: ${released}</p>
        <button class="btn btn-danger btn-full add-remove-btn">
          + Toevoegen aan collectie
        </button>
      </div>
    `;

    gamesGrid.appendChild(card);
  });
}

async function searchGames() {
  const query = searchInput.value.trim();

  if (!query) {
    gamesGrid.innerHTML = "<p>Typ eerst een zoekterm in.</p>";
    return;
  }

  gamesGrid.innerHTML = "<p>Bezig met zoeken...</p>";

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    renderGames(data.results);
  } catch (error) {
    console.error("Zoekfout:", error);
    gamesGrid.innerHTML = "<p>Er liep iets mis tijdens het zoeken.</p>";
  }
}

searchBtn.addEventListener("click", searchGames);

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchGames();
  }
});
