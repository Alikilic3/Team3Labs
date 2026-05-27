// Popup Logica
function openPopup() {
  const modal = document.getElementById("unavailableModal");
  if (modal) modal.classList.add("show");
}

function closePopup() {
  const modal = document.getElementById("unavailableModal");
  if (modal) modal.classList.remove("show");
}
// Navigatie / Hamburger Menu Logica
document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mainNav = document.getElementById("mainNav");
  if (hamburgerBtn && mainNav) {
    hamburgerBtn.addEventListener("click", () => {
      mainNav.classList.toggle("show-menu");
    });
  }
});

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

if (themeToggle) {
    if (localStorage.getItem("theme") === "light") {
        document.body.classList.add("light-mode");
        themeIcon.className = "bi bi-sun-fill";
    }

    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("light-mode");
        if (document.body.classList.contains("light-mode")) {
            localStorage.setItem("theme", "light");
            themeIcon.className = "bi bi-sun-fill";
        } else {
            localStorage.setItem("theme", "dark");
            themeIcon.className = "bi bi-moon-fill";
        }
    });
}
