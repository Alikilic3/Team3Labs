import type { RawgResponse, GameDetail, CardGame } from "./types";

const searchInput = document.getElementById("searchInput") as HTMLInputElement;
const searchBtn = document.getElementById("searchBtn") as HTMLButtonElement;
const gamesGrid = document.getElementById("gamesGrid") as HTMLDivElement;

const favoritesViewBtn = document.getElementById(
  "favoritesViewBtn",
) as HTMLButtonElement;
const searchViewBtn = document.getElementById(
  "searchViewBtn",
) as HTMLButtonElement;

const gameModal = document.getElementById("gameModal") as HTMLDivElement;
const modalBody = document.getElementById("modalBody") as HTMLDivElement;
const closeModal = document.getElementById("closeModal") as HTMLButtonElement;

const API_KEY = "832eedeb890b48e0bbd42c3105728fe9";
const FAVORITES_KEY = "gamehub-favorites";

let currentGames: CardGame[] = [];
let searchTimeout: number | undefined;

function getFavorites(): CardGame[] {
  const stored = localStorage.getItem(FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveFavorites(favorites: CardGame[]): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function isFavorite(gameId: number): boolean {
  return getFavorites().some((game) => game.id === gameId);
}

function toggleFavorite(gameId: number): void {
  const favorites = getFavorites();
  const existing = favorites.find((game) => game.id === gameId);

  if (existing) {
    const updatedFavorites = favorites.filter((game) => game.id !== gameId);
    saveFavorites(updatedFavorites);
  } else {
    const gameToAdd = currentGames.find((game) => game.id === gameId);
    if (!gameToAdd) return;
    saveFavorites([...favorites, gameToAdd]);
  }

  if (favoritesViewBtn.classList.contains("active")) {
    renderFavorites();
  } else {
    renderGames(currentGames);
  }
}

function renderGames(games: CardGame[]): void {
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
      .map((p) => getPlatformIcons(p.platform.name))
      .join("");

    const favoriteIcon = isFavorite(game.id) ? "bi-heart-fill" : "bi-heart";
    const favoriteClass = isFavorite(game.id) ? "is-favorite" : "";

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
              <span class="info-label">
                <i class="bi bi-star-fill"></i>
                Score
              </span>
              <span class="info-value">${game.rating}</span>
            </div>

            <div class="info-row">
              <span class="info-label">
                <i class="bi bi-controller"></i>
                Platforms
              </span>
              <span class="info-value platform-icons">${platformIcons}</span>
            </div>

            <div class="info-row">
              <span class="info-label">
                <i class="bi bi-clock-history"></i>
                Speeltijd
              </span>
              <span class="info-value">${game.playtime} uur</span>
            </div>

            <div class="info-row">
              <span class="info-label">
                <i class="bi bi-calendar-event"></i>
                Release
              </span>
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

function renderFavorites(): void {
  favoritesViewBtn.classList.add("active");
  searchViewBtn.classList.remove("active");
  const favorites = getFavorites();
  renderGames(favorites);

  if (favorites.length === 0) {
    gamesGrid.innerHTML = "<p>Je hebt nog geen favoriete games.</p>";
  }
}

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
      `https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(query)}`,
    );

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const data: RawgResponse = await response.json();
    renderGames(data.results);
  } catch (error) {
    gamesGrid.innerHTML = "<p>Er ging iets fout bij het ophalen van games.</p>";
    console.log(error);
  }
}

function getPlatformIcons(name: string): string {
  const lower = name.toLowerCase();

  if (lower.includes("pc")) {
    return `<i class="bi bi-windows"></i>`;
  }

  if (lower.includes("playstation")) {
    return `<i class="bi bi-playstation"></i>`;
  }

  if (lower.includes("xbox")) {
    return `<i class="bi bi-xbox"></i>`;
  }

  if (lower.includes("nintendo")) {
    return `<i class="bi bi-nintendo-switch"></i>`;
  }

  return `<i class="bi bi-controller"></i>`;
}

async function openGameModal(gameId: number): Promise<void> {
  try {
    const response = await fetch(
      `https://api.rawg.io/api/games/${gameId}?key=${API_KEY}`,
    );

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const game: GameDetail = await response.json();

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

gamesGrid.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;

  const favoriteBtn = target.closest(
    ".favorite-btn",
  ) as HTMLButtonElement | null;
  if (favoriteBtn) {
    const gameId = favoriteBtn.getAttribute("data-favorite-id");
    if (gameId) {
      toggleFavorite(Number(gameId));
    }
    return;
  }

  const image = target.closest(".game-card-image") as HTMLImageElement | null;
  if (image) {
    const gameId = image.getAttribute("data-id");
    if (gameId) {
      openGameModal(Number(gameId));
    }
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
