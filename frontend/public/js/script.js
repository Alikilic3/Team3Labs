// =========================
// Variabelen
// =========================
let currentRound = 0;
let xp = 0;
let correctAnswer = "";

const totalRounds = 5;
const maxBlur = 8;
const blurStep = 2;

let wrongAttempts = 0;
const maxWrongAttempts = 5;

const API_KEY = "b905995aec7348d6b85e65a0731fffd1";

// =========================
// DOM elementen
// =========================
const blurredImage = document.getElementById("blurredImage");
const guessInput = document.getElementById("guessInput");
const checkBtn = document.getElementById("checkBtn");
const feedback = document.getElementById("feedback");
const xpSpan = document.getElementById("xp");
const moodSpan = document.getElementById("mood");
const roundSpan = document.getElementById("round");

let currentBlur = maxBlur;

// =========================
// Random game ophalen
// =========================
async function fetchRandomGame() {
  const page = Math.floor(Math.random() * 20) + 1;

  const res = await fetch(
    `https://api.rawg.io/api/games?key=${API_KEY}&page=${page}&page_size=20`,
  );

  const data = await res.json();

  const randomGame =
    data.results[Math.floor(Math.random() * data.results.length)];

  return randomGame;
}
// =========================
// Start ronde
// =========================
async function startRound() {
  if (currentRound >= totalRounds) {
      saveScore(xp);
      showScoreboard();
    return;
  

    blurredImage.style.display = "none";
    guessInput.disabled = true;
    checkBtn.disabled = true;

    return;
  }

  const game = await fetchRandomGame();

  correctAnswer = game.name.toLowerCase();

  blurredImage.src = game.background_image;

  guessInput.value = "";
  feedback.textContent = "";

  wrongAttempts = 0;

  currentBlur = maxBlur;
  blurredImage.style.filter = ` blur(${currentBlur}px)`;

  roundSpan.textContent = currentRound + 1;
}

// =========================
// Check antwoord
// =========================
checkBtn.addEventListener("click", () => {
  const answer = guessInput.value.trim().toLowerCase();

  if (!answer) return;

  if (correctAnswer.includes(answer)) {
    feedback.textContent = "Correct!";
    feedback.classList.remove("wrong");
    feedback.classList.add("correct");

    xp += 10;
    moodSpan.textContent = "";

    blurredImage.style.filter = "blur(0px)";

    currentRound++;

    setTimeout(startRound, 1200);
  } else {
    wrongAttempts++;

    feedback.textContent = ` Fout! Poging ${wrongAttempts}/5`;
    feedback.classList.remove("correct");
    feedback.classList.add("wrong");

    moodSpan.textContent = "";

    xp = Math.max(0, xp - 2);

    currentBlur = Math.max(0, currentBlur - blurStep);
    blurredImage.style.filter = ` blur(${currentBlur}px)`;

    if (wrongAttempts >= maxWrongAttempts) {
      feedback.textContent = `Het juiste antwoord was: ${correctAnswer}`;

      blurredImage.style.filter = "blur(0px)";

      currentRound++;

      setTimeout(startRound, 2000);
    }
  }

  xpSpan.textContent = xp;
});
// =========================
// Enter toets
// =========================
guessInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    checkBtn.click();
  }
});



function saveScore(score) {
  const scores = JSON.parse(localStorage.getItem("scores")) || [];

  scores.push({
    xp: score,
    date: new Date().toLocaleString()
  });

  localStorage.setItem("scores", JSON.stringify(scores));
}

function showScoreboard() {
  const scores = JSON.parse(localStorage.getItem("scores")) || [];

  let html = "<h2>Scorebord</h2>";

  if (scores.length === 0) {
    html += "<p>Nog geen scores</p>";
  } else {
    html += "<ul>";

    scores
      .sort((a, b) => b.xp - a.xp)
      .forEach(score => {
        html += `<li>${score.xp} XP - ${score.date}</li>`;
      });

    html += "</ul>";
  }

  html += '<button class="btn-primary-custom" onclick="location.reload()">Opnieuw spelen</button>';

  document.querySelector(".guess-container").innerHTML = html;
}
// =========================
// Start spel
// =========================
startRound();
// test yunus
