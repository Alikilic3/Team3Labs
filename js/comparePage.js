// =========================
// Variabelen
// =========================
const API_KEY = "b905995aec7348d6b85e65a0731fffd1"; // Jouw test-key

// =========================
// DOM elementen
// =========================
const searchInput1 = document.getElementById("searchInput1");
const searchInput2 = document.getElementById("searchInput2");
const compareBtn = document.getElementById("compareBtn");
const compareResults = document.getElementById("compareResults");

// =========================
// Hulpfunctie: Platform Icoontjes
// =========================
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

// =========================
// Data ophalen voor 1 game
// =========================
async function fetchTopGame(query) {
  const res = await fetch(`https://api.rawg.io/api/games?key=${API_KEY}&search=${query}&page_size=1`);
  const data = await res.json();
  
  if (data.results && data.results.length > 0) {
    return data.results[0];
  }
  return null;
}

// =========================
// Vergelijk Logica
// =========================
async function handleCompare() {
  const query1 = searchInput1.value.trim();
  const query2 = searchInput2.value.trim();

  if (!query1 || !query2) {
    compareResults.innerHTML = "<p>Vul in beide velden een game in!</p>";
    return;
  }

  compareResults.innerHTML = "<p>Games vergelijken...</p>";

  try {
    const [game1, game2] = await Promise.all([
      fetchTopGame(query1),
      fetchTopGame(query2)
    ]);

    if (!game1 || !game2) {
      compareResults.innerHTML = "<p>Een van de games (of beide) kon niet worden gevonden.</p>";
      return;
    }

    renderComparison(game1, game2);
  } catch (error) {
    compareResults.innerHTML = "<p>Er is een fout opgetreden bij het vergelijken.</p>";
    console.error(error);
  }
}

// =========================
// Resultaten Renderen
// =========================
function renderComparison(game1, game2) {
  const g1RatingColor = game1.rating > game2.rating ? 'green' : (game1.rating < game2.rating ? 'red' : 'white');
  const g2RatingColor = game2.rating > game1.rating ? 'green' : (game2.rating < game1.rating ? 'red' : 'white');

  compareResults.innerHTML = `
      <section class="project-card compare-card">
        <img src="${game1.background_image || 'assets/images/placeholder.jpg'}" alt="${game1.name}">
        <div class="project-content">
          <h2 class="game-title">${game1.name}</h2>
          
          <div class="stat-list">
            <div class="stat-row">
              <span class="stat-label"><i class="bi bi-star-fill text-warning"></i> Score</span>
              <span class="stat-value" style="color: ${g1RatingColor}; font-weight: 900;">${game1.rating}</span>
            </div>
            
            <div class="stat-row">
              <span class="stat-label"><i class="bi bi-controller"></i> Platforms</span>
              <span class="stat-value platform-icons">${getPlatformIcons(game1.parent_platforms)}</span>
            </div>
            
            <div class="stat-row">
              <span class="stat-label"><i class="bi bi-clock-history"></i> Speeltijd</span>
              <span class="stat-value">${game1.playtime} uur</span>
            </div>
            
            <div class="stat-row">
              <span class="stat-label"><i class="bi bi-calendar-event"></i> Release</span>
              <span class="stat-value">${game1.released || 'Onbekend'}</span>
            </div>
          </div>
        </div>
      </section>
  
      <section class="project-card compare-card">
        <img src="${game2.background_image || 'assets/images/placeholder.jpg'}" alt="${game2.name}">
        <div class="project-content">
          <h2 class="game-title">${game2.name}</h2>
          
          <div class="stat-list">
            <div class="stat-row">
              <span class="stat-label"><i class="bi bi-star-fill text-warning"></i> Score</span>
              <span class="stat-value" style="color: ${g2RatingColor}; font-weight: 900;">${game2.rating}</span>
            </div>
            
            <div class="stat-row">
              <span class="stat-label"><i class="bi bi-controller"></i> Platforms</span>
              <span class="stat-value platform-icons">${getPlatformIcons(game2.parent_platforms)}</span>
            </div>
            
            <div class="stat-row">
              <span class="stat-label"><i class="bi bi-clock-history"></i> Speeltijd</span>
              <span class="stat-value">${game2.playtime} uur</span>
            </div>
            
            <div class="stat-row">
              <span class="stat-label"><i class="bi bi-calendar-event"></i> Release</span>
              <span class="stat-value">${game2.released || 'Onbekend'}</span>
            </div>
          </div>
        </div>
      </section>
  `;
}

// Event Listeners
compareBtn.addEventListener("click", handleCompare);