
const gamesGrid = document.getElementById("gamesGrid");
const sortSelect = document.getElementById("sort");
const headerCurrentGame = document.getElementById("headerCurrentGame");

// Hulpfunctie: Platform Icoontjes
function getPlatformIcons(parentPlatforms) {
  if (!parentPlatforms || parentPlatforms.length === 0) return '<i class="bi bi-question-circle"></i>';
  
  let iconsHTML = '';
  parentPlatforms.forEach(p => {
    const slug = p.platform.slug;
    if (slug === 'pc') iconsHTML += '<i class="bi bi-windows" title="PC"></i> ';
    else if (slug === 'playstation') iconsHTML += '<i class="bi bi-playstation" title="PlayStation"></i> ';
    else if (slug === 'xbox') iconsHTML += '<i class="bi bi-xbox" title="Xbox"></i> ';
    else if (slug === 'nintendo') iconsHTML += '<i class="bi bi-nintendo-switch" title="Nintendo"></i> ';
    else if (slug === 'mac') iconsHTML += '<i class="bi bi-apple" title="Mac"></i> ';
    else if (slug === 'android') iconsHTML += '<i class="bi bi-android2" title="Android"></i> ';
    else iconsHTML += `<i class="bi bi-controller" title="${p.platform.name}"></i> `;
  });
  return iconsHTML;
}

// Test Data (Nu mét totaal aantal trofeeën)
function initializeDummyData() {
  const collectionStr = localStorage.getItem("myCollection");
  let collection = collectionStr ? JSON.parse(collectionStr) : null;

  // Slimme check: als de oude lijst geen 'totalTrophies' heeft, wis hem dan even om errors te voorkomen
  if (collection && collection.length > 0 && collection[0].totalTrophies === undefined) {
    localStorage.removeItem("myCollection");
    collection = null;
  }

  if (!collection || collection.length === 0) {
    const dummyData = [
      { 
        id: 3498, name: "Grand Theft Auto V", rating: 4.47, released: "2013-09-17", 
        background_image: "https://media.rawg.io/media/games/20a/20aa03a10cda45239fe22d035c0ebe64.jpg", 
        status: "Playing", playtime: 124, completion: 65, trophies: 32, totalTrophies: 77,
        parent_platforms: [{platform: {slug: "pc"}}, {platform: {slug: "playstation"}}, {platform: {slug: "xbox"}}]
      },
      { 
        id: 3328, name: "The Witcher 3: Wild Hunt", rating: 4.66, released: "2015-05-18", 
        background_image: "https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg", 
        status: "Completed", playtime: 150, completion: 100, trophies: 55, totalTrophies: 78,
        parent_platforms: [{platform: {slug: "pc"}}, {platform: {slug: "playstation"}}, {platform: {slug: "xbox"}}, {platform: {slug: "nintendo"}}]
      },
      { 
        id: 4200, name: "Portal 2", rating: 4.61, released: "2011-04-18", 
        background_image: "https://media.rawg.io/media/games/2ba/2bac0e87cf45e5b508f227d281c9252a.jpg", 
        status: "Te spelen", playtime: 2, completion: 5, trophies: 1, totalTrophies: 51,
        parent_platforms: [{platform: {slug: "pc"}}, {platform: {slug: "mac"}}, {platform: {slug: "xbox"}}]
      }
    ];
    localStorage.setItem("myCollection", JSON.stringify(dummyData));
  }
}


// Data Ophalen en Renderen

function loadCollection() {
  const collectionStr = localStorage.getItem("myCollection");
  let collection = collectionStr ? JSON.parse(collectionStr) : [];

  const sortValue = sortSelect.value;
  if (sortValue === "rating") collection.sort((a, b) => b.rating - a.rating);
  if (sortValue === "name") collection.sort((a, b) => a.name.localeCompare(b.name));
  if (sortValue === "release") collection.sort((a, b) => new Date(b.released) - new Date(a.released));

  renderCollection(collection);
  updateCurrentGameHeader();
}

function renderCollection(games) {
  gamesGrid.innerHTML = "";

  if (games.length === 0) {
    gamesGrid.innerHTML = "<p>Je collectie is leeg. Ga naar Zoeken om games toe te voegen!</p>";
    return;
  }

  const currentGameId = localStorage.getItem("currentGameId");

  games.forEach(game => {
    const isCurrent = currentGameId == game.id;
    
    const currentBtnHtml = isCurrent 
      ? `<button class="btn btn-success btn-full"><i class="bi bi-check-circle"></i> Huidige Game</button>`
      : `<button class="btn btn-outline btn-full" onclick="setCurrentGame(${game.id}, '${game.name}')">Maak Huidige Game</button>`;

    let statusColor = "var(--text-muted)";
    if (game.status === "Playing") statusColor = "#2196F3"; // Blauw
    if (game.status === "Completed") statusColor = "#4CAF50"; // Groen
    if (game.status === "Te spelen") statusColor = "#FF9800"; // Oranje

    // Bereken de trofeeën die nog behaald moeten worden (veiligheidscheck voor als totaal ontbreekt)
    const totaalTrofeeen = game.totalTrophies || 50; 
    const behaaldeTrofeeen = game.trophies || 0;
    const teBehalen = Math.max(0, totaalTrofeeen - behaaldeTrofeeen);

    const cardHtml = `
      <article class="project-card">
        <img src="${game.background_image}" alt="${game.name}" class="game-cover" />
             
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
              <span class="stat-label"><i class="bi bi-clock-history"></i> Gespeeld</span>
              <span class="stat-value">${game.playtime} uur</span>
            </div>
            <div class="stat-row">
              <span class="stat-label"><i class="bi bi-pie-chart-fill" style="color: #00bcd4;"></i> Voltooid</span>
              <span class="stat-value">${game.completion}%</span>
            </div>
            
            <div class="stat-row">
              <span class="stat-label"><i class="bi bi-trophy-fill" style="color: #FFD700;"></i> Behaald</span>
              <span class="stat-value">${behaaldeTrofeeen} <span style="font-size: 0.8rem; color: #888; font-weight: normal;">/ ${totaalTrofeeen}</span></span>
            </div>
            <div class="stat-row">
              <span class="stat-label"><i class="bi bi-unlock-fill" style="color: #bbb;"></i> Te behalen</span>
              <span class="stat-value">${teBehalen}</span>
            </div>
            
            <div class="stat-row">
              <span class="stat-label"><i class="bi bi-bookmark-fill"></i> Status</span>
              <span class="stat-value" style="color: ${statusColor}; font-weight: bold;">${game.status || 'Onbekend'}</span>
            </div>
          </div>

          <div class="collection-actions">
            ${currentBtnHtml}
            <button class="btn btn-danger btn-full" onclick="removeFromCollection(${game.id})"><i class="bi bi-trash3"></i> Verwijderen</button>
          </div>
        </div>
      </article>
    `;
    gamesGrid.innerHTML += cardHtml;
  });
}

// =========================
// Acties & Start
// =========================
window.removeFromCollection = function(id) {
  let collection = JSON.parse(localStorage.getItem("myCollection")) || [];
  collection = collection.filter(game => game.id !== id);
  localStorage.setItem("myCollection", JSON.stringify(collection));
  
  if (localStorage.getItem("currentGameId") == id) {
    localStorage.removeItem("currentGameId");
    localStorage.removeItem("currentGameName");
  }

  loadCollection(); 
};

window.setCurrentGame = function(id, name) {
  localStorage.setItem("currentGameId", id);
  localStorage.setItem("currentGameName", name);
  loadCollection(); 
};

function updateCurrentGameHeader() {
  const currentName = localStorage.getItem("currentGameName");
  if (currentName && headerCurrentGame) {
    headerCurrentGame.textContent = currentName;
  } else if (headerCurrentGame) {
    headerCurrentGame.textContent = "Geen gekozen";
  }
}

sortSelect.addEventListener("change", loadCollection);

initializeDummyData();
loadCollection();