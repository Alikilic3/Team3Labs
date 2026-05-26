// Selecteer de uitlogknop (zorg dat deze ID overeenkomt met je header-app.ejs)
const logoutBtn = document.getElementById("logoutBtn") as HTMLButtonElement | null;
const userNameDisplay = document.getElementById("userNameDisplay") as HTMLElement | null;

// ===========================
// UI Updaten (Gebruikersnaam tonen)
// ===========================
function updateHeaderUser(): void {
    const userName = localStorage.getItem("userName");
    
    if (userName && userNameDisplay) {
        userNameDisplay.textContent = userName;
    }
}

// ===========================
// Uitlog Logica
// ===========================
function handleLogout(e: Event): void {
    e.preventDefault();

    // 1. Verwijder alle gebruikersgegevens uit de browser
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userXp");

    // 2. We sturen een verzoek naar de server (indien er backend-sessies opgeruimd moeten worden)
    // Daarna sturen we de gebruiker terug naar de startpagina
    fetch("/logout", {
        method: "POST"
    }).then(() => {
        window.location.href = "/";
    }).catch(error => {
        console.error("Fout bij uitloggen:", error);
        // Zelfs als de server faalt, sturen we de gebruiker toch weg omdat de localStorage leeg is
        window.location.href = "/";
    });
}

// ===========================
// Event Listeners koppelen
// ===========================
if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
}

// Roep direct aan bij het laden om de UI goed te zetten
updateHeaderUser();