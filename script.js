let games = [];
let currentRound = 0;
let xp = 0;
const totalRounds = 5;
const maxBlur = 8;      // start blur in px
const blurStep = 2;     // blur vermindering per fout

// DOM-elementen
const blurredImage = document.getElementById("blurredImage");
const guessInput = document.getElementById("guessInput");
const checkBtn = document.getElementById("checkBtn");
const feedback = document.getElementById("feedback");
const xpSpan = document.getElementById("xp");
const moodSpan = document.getElementById("mood");
const roundSpan = document.getElementById("round");
const datalist = document.getElementById("suggestions");

// Huidige blur waarde
let currentBlur = maxBlur;

// =========================
// JSON laden
// =========================
fetch("games.json")
  .then(res => res.json())
  .then(data => {
    games = data;
    startRound();
  })
  .catch(err => console.error("Kan games.json niet laden:", err));

function startRound() {
  if (games.length === 0) return;

  if (currentRound >= totalRounds) {
    feedback.textContent = ` Game over! Je XP: ${xp}`;
    blurredImage.style.display = "none";
    guessInput.disabled = true;
    checkBtn.disabled = true;
    return;
  }

  // Kies random game
  const game = games[Math.floor(Math.random() * games.length)];
  blurredImage.src = game.image;
  blurredImage.dataset.answer = game.answer.toLowerCase();

  // Vul de autocomplete lijst
  datalist.innerHTML = "";
  game.suggestions.forEach(s => {
    const option = document.createElement("option");
    option.value = s;
    datalist.appendChild(option);
  });

  // Reset input, feedback en blur
  guessInput.value = "";
  feedback.textContent = "";
  currentBlur = maxBlur;
  blurredImage.style.filter = `blur(${currentBlur}px)`;
  blurredImage.classList.remove("revealed");

  // Update ronde
  roundSpan.textContent = currentRound + 1;
}

// =========================
// Check antwoord
// =========================
checkBtn.addEventListener("click", () => {
  const answer = guessInput.value.trim().toLowerCase();
  const correctAnswer = blurredImage.dataset.answer;

  if (!answer) return;

  if (answer === correctAnswer) {
    feedback.textContent = "✅ Correct!";
    feedback.classList.remove("wrong");
    feedback.classList.add("correct");
    xp += 10;
    moodSpan.textContent = "😃";
    blurredImage.classList.add("revealed");
    blurredImage.style.filter = "blur(0px)";
    currentRound++;
    setTimeout(startRound, 1000); // start volgende ronde
  } else {
    feedback.textContent = "❌ Fout! Probeer opnieuw.";
    feedback.classList.remove("correct");
    feedback.classList.add("wrong");
    moodSpan.textContent = "😕";
    xp = Math.max(0, xp - 2);

    // Blur verminderen
    currentBlur = Math.max(0, currentBlur - blurStep);
    blurredImage.style.filter = `blur(${currentBlur}px)`;
  }

  xpSpan.textContent = xp;
});

guessInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    checkBtn.click();
  }
});