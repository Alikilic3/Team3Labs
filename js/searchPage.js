// =========================
// Variabelen
// =========================
const API_KEY = "b905995aec7348d6b85e65a0731fffd1";

// =========================
// DOM elementen
// =========================
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsContainer = document.getElementById("resultsContainer");

// =========================
// Games ophalen (API)
// =========================
async function fetchGames(query) {
  try {
    resultsContainer.innerHTML = "<p>Games ophalen...</p>";
    
    const res = await fetch(
      `https://api.rawg.io/api/games?key=${API_KEY}&search=${query}&page_size=12`
    );
    const data = await res.json();
    
    renderGames(data.results);
  } catch (error) {
    resultsContainer.innerHTML = "<p>Er ging iets mis bij het ophalen van de games.</p>";
    console.error(error);
  }
}

// =========================
// Games tonen in HTML
// =========================
function renderGames(games) {
  resultsContainer.innerHTML = "";

  if (games.length === 0) {
    resultsContainer.innerHTML = "<p>Geen games gevonden. Probeer een andere naam.</p>";
    return;
  }

  games.forEach(game => {
    // We checken even of er een afbeelding is, anders een placeholder
    const imageUrl = game.background_image ? game.background_image : "assets/images/placeholder.jpg";
    
    const gameCard = `
      <section class="project-card">
        <img src="${imageUrl}" alt="${game.name}">
        <div class="project-content">
          <h2>${game.name}</h2>
          <p>Release: ${game.released || 'Onbekend'}</p>
          <p>Rating: ⭐ ${game.rating} / 5</p>
          <button class="btn btn-primary btn-full" onclick="addToCollection(${game.id}, '${game.name}')">
            + Toevoegen
          </button>
        </div>
      </section>
    `;
    resultsContainer.innerHTML += gameCard;
  });
}

// =========================
// Event Listeners
// =========================
searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (query) {
    fetchGames(query);
  }
});

searchInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});

// Tijdelijke functie voor de collectie knop
function addToCollection(id, name) {
  alert(`${name} (ID: ${id}) is toegevoegd aan je collectie!`);
}