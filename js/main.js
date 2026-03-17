// Functie om de pop-up te openen
function openPopup() {
    const modal = document.getElementById('unavailableModal');
    modal.classList.add('show');
}

// Functie om de pop-up te sluiten
function closePopup() {
    const modal = document.getElementById('unavailableModal');
    modal.classList.remove('show');
}