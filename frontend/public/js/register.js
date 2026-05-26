document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const errorMsgElement = document.getElementById("errorMsg");

    // Stop het script als het formulier niet op de pagina staat
    if (!registerForm) return;

    // --- HELPER FUNCTIES ---
    const displayError = (message) => {
        errorMsgElement.textContent = message;
        errorMsgElement.style.display = "block";
    };

    const clearError = () => {
        errorMsgElement.style.display = "none";
        errorMsgElement.textContent = "";
    };

    const validateForm = (telefoon, password, passwordConfirm) => {
        // Controleer of de telefoon uit cijfers bestaat (een '+' aan het begin mag)
        if (!/^\+?\d+$/.test(telefoon)) {
            return "Ongeldig telefoonnummer. Gebruik uitsluitend cijfers (een '+' aan het begin is toegestaan).";
        }
        
        // Controleer of het wachtwoord lang genoeg is
        if (password.length < 5) {
            return "Je wachtwoord moet uit minimaal 5 tekens bestaan.";
        }
        
        // Controleer of beide wachtwoorden identiek zijn
        if (password !== passwordConfirm) {
            return "De ingevoerde wachtwoorden komen niet overeen.";
        }

        return null; // Geen fouten gevonden
    };


    // --- HOOFD LOGICA: FORMULIER VERZENDEN ---
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault(); // Voorkom dat de pagina herlaadt
        clearError(); // Maak eventuele oude foutmeldingen schoon

        // 1. Haal de waarden uit de velden (.trim() haalt onzichtbare spaties weg)
        const name = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const telefoon = document.getElementById("telefoon").value.trim();
        const password = document.getElementById("password").value;
        const passwordConfirm = document.getElementById("password-confirm").value;

        // 2. Valideer de invoer met onze helper-functie
        const errorMessage = validateForm(telefoon, password, passwordConfirm);
        if (errorMessage) {
            return displayError(errorMessage);
        }

        // 3. Stuur de gegevens veilig naar de backend
        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, telefoon, password }) 
            });

            // Als de server een fout geeft (bijv. e-mail bestaat al)
            if (!response.ok) {
                const responseData = await response.json();
                return displayError(responseData.error || "Registratie is mislukt. Controleer je gegevens.");
            }

            // Alles is gelukt! Stuur de gebruiker door naar de inlogpagina
            window.location.href = "/login";

        } catch (error) {
            console.error("Registratiefout:", error);
            displayError("Kan momenteel geen verbinding maken met de server. Probeer het later opnieuw.");
        }
    });
});