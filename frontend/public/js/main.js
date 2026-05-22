// =========================
// Popup Logica (Voor onbeschikbare features/projecten)
// =========================
function openPopup() {
  const modal = document.getElementById("unavailableModal");
  if (modal) modal.classList.add("show");
}

function closePopup() {
  const modal = document.getElementById("unavailableModal");
  if (modal) modal.classList.remove("show");
}

// =========================
// Navigatie / Hamburger Menu Logica
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const mainNav = document.getElementById("mainNav");

  // Toggle het menu open/dicht op kleine schermen
  if (hamburgerBtn && mainNav) {
    hamburgerBtn.addEventListener("click", () => {
      mainNav.classList.toggle("show-menu");
    });
  }
});
