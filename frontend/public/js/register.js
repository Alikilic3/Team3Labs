document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const errorMsgElement = document.getElementById("errorMsg");

    if (!registerForm) return;

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        errorMsgElement.style.display = "none";
        errorMsgElement.textContent = "";

        const name = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const passwordConfirm = document.getElementById("password-confirm").value;

        if (password.length < 5) {
            errorMsgElement.textContent = "Je wachtwoord moet uit minimaal 5 tekens bestaan.";
            errorMsgElement.style.display = "block";
            return;
        }

        if (password !== passwordConfirm) {
            errorMsgElement.textContent = "De ingevoerde wachtwoorden komen niet overeen.";
            errorMsgElement.style.display = "block";
            return;
        }

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            if (!response.ok) {
                const data = await response.json();
                errorMsgElement.textContent = data.error || "Registratie is mislukt.";
                errorMsgElement.style.display = "block";
                return;
            }

            window.location.href = "/login";
        } catch (error) {
            errorMsgElement.textContent = "Kan geen verbinding maken met de server.";
            errorMsgElement.style.display = "block";
        }
    });
});