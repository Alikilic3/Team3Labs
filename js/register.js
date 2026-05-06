const registerForm = document.getElementById("registerForm") as HTMLFormElement;

if (registerForm) {
    const registerErrorMsg = document.getElementById("errorMsg") as HTMLParagraphElement;

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = (document.getElementById("username") as HTMLInputElement).value;
        const email = (document.getElementById("email") as HTMLInputElement).value;
        const password = (document.getElementById("password") as HTMLInputElement).value;
        const passwordConfirm = (document.getElementById("password-confirm") as HTMLInputElement).value;

        if (password !== passwordConfirm) {
            registerErrorMsg.textContent = "Wachtwoorden komen niet overeen!";
            registerErrorMsg.style.display = "block";
            return;
        }

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                registerErrorMsg.textContent = data.error;
                registerErrorMsg.style.display = "block";
                return;
            }

            window.location.href = "login.html";

        } catch (e) {
            registerErrorMsg.textContent = "Er ging iets fout, probeer opnieuw.";
            registerErrorMsg.style.display = "block";
        }
    });
}