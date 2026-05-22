const loginForm = document.getElementById("loginForm") as HTMLFormElement;

if (loginForm) {
    const loginErrorMsg = document.getElementById("errorMsg") as HTMLParagraphElement;

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = (document.getElementById("email") as HTMLInputElement).value;
        const password = (document.getElementById("password") as HTMLInputElement).value;

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                loginErrorMsg.textContent = data.error;
                loginErrorMsg.style.display = "block";
                return;
            }

            localStorage.setItem("userId", data.userId);
            localStorage.setItem("userName", data.name);
            localStorage.setItem("userXp", data.xp);

            window.location.href = "/search";

        } catch (e) {
            loginErrorMsg.textContent = "Er ging iets fout, probeer opnieuw.";
            loginErrorMsg.style.display = "block";
        }
    });
}