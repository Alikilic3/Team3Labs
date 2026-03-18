const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const gamesGrid = document.getElementById("gamesGrid");
const API_KEY = "832eedeb890b48e0bbd42c3105728fe9";
async function searchGames() {
    const query = searchInput.value.trim();
    if (query === "") {
        gamesGrid.innerHTML = "<p>Typ eerst een game naam in.</p>";
        return;
    }
    try {
        const response = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        const data = await response.json();
        gamesGrid.innerHTML = "";
        for (const game of data.results) {
            gamesGrid.innerHTML += `
        <div class="game-card">
          <h3>${game.name}</h3>
          <img src="${game.background_image}" alt="${game.name}" width="200">
          <p>Released: ${game.released}</p>
          <p>Rating: ${game.rating}</p>
        </div>
      `;
        }
    }
    catch (error) {
        gamesGrid.innerHTML = "<p>Er ging iets fout bij het ophalen van games.</p>";
        console.log(error);
    }
}
searchBtn.addEventListener("click", searchGames);
export {};
