function updateHeader() {
    const userName = localStorage.getItem("userName");
    const userId = localStorage.getItem("userId");
    const userAvatar = document.querySelector(".user-avatar");
    if (userAvatar && userName) {
        userAvatar.textContent = userName.charAt(0).toUpperCase();
        userAvatar.title = userName;
    }
    // Alleen doorsturen als we NIET op login of register pagina zijn
    const currentPage = window.location.pathname;
    const isAuthPage = currentPage.includes("login.html") ||
        currentPage.includes("register.html") ||
        currentPage.includes("index.html") ||
        currentPage.includes("intro.html");
    if (!userId && !isAuthPage) {
        window.location.href = "login.html";
    }
}
updateHeader();
