const loginForm = document.getElementById("loginForm");
if (loginForm) {
    const loginErrorMsg = document.getElementById("errorMsg");
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
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
            window.location.href = "search.html";
        }
        catch (e) {
            loginErrorMsg.textContent = "Er ging iets fout, probeer opnieuw.";
            loginErrorMsg.style.display = "block";
        }
    });
}
