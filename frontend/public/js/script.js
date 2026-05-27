// DOM elementen
const blurredImage = document.getElementById("blurredImage");
const placeholder = document.getElementById("placeholder");
const guessInput = document.getElementById("guessInput");
const checkBtn = document.getElementById("checkBtn");
const feedback = document.getElementById("feedback");
const xpSpan = document.getElementById("xp");
const roundSpan = document.getElementById("round");
const attemptsDisplay = document.getElementById("attempts-display");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const inputContainer = document.getElementById("inputContainer");
const scoreboard = document.getElementById("scoreboard");
const scoreboardList = document.getElementById("scoreboardList");
const playAgainBtn = document.getElementById("playAgainBtn");
const hintBtn = document.getElementById("hintBtn");
const hintBox = document.getElementById("hintBox");

// Variabelen
const totalRounds = 5;
const maxAttempts = 5;
const blurLevels = [10, 8, 6, 3, 0];
const xpPerAttempt = [50, 30, 20, 10, 5];

let currentRound = 0;
let totalXp = 0;
let correctAnswer = "";
let wrongAttempts = 0;
let gameStarted = false;
let currentGame = null;
let hintUsed = false;

// Hulpfuncties
function getUserId() {
    return SESSION_USER_ID || "";
}

function updateAttemptsDisplay() {
    let display = "";
    for (let i = 0; i < maxAttempts; i++) {
        display += i < wrongAttempts ? "●" : "○";
    }
    attemptsDisplay.textContent = display;
}


// Random game ophalen via backend
async function fetchRandomGame() {
    const response = await fetch("/api/random-game");
    if (!response.ok) throw new Error("Fout bij ophalen game");
    return await response.json();
}

// Start ronde
async function startRound() {
    if (currentRound >= totalRounds) {
        await endGame();
        return;
    }

    try {
        const game = await fetchRandomGame();
        currentGame = game;
        correctAnswer = game.name.toLowerCase();
        hintUsed = false;

        blurredImage.src = game.background_image;
        blurredImage.style.display = "block";
        blurredImage.style.filter = `blur(${blurLevels[0]}px)`;
        placeholder.style.display = "none";

        if (hintBtn) hintBtn.style.display = "flex";
        if (hintBox) {
            hintBox.style.display = "none";
            hintBox.innerHTML = "";
        }

        guessInput.value = "";
        feedback.textContent = "";
        feedback.className = "guess-feedback";
        wrongAttempts = 0;

        currentRound++;
        roundSpan.textContent = currentRound;
        updateAttemptsDisplay();

        inputContainer.style.display = "flex";
        guessInput.focus();
    } catch (e) {
        feedback.textContent = "Er ging iets fout bij het laden van een game.";
    }
}

// Antwoord controleren
async function checkAnswer() {
    const answer = guessInput.value.trim().toLowerCase();
    if (!answer || answer.length < 3) {
        feedback.textContent = "Typ minstens 3 tekens!";
        feedback.className = "guess-feedback wrong";
        return;
    }

    const normalize = (str) => str.toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .trim();

    const normalizedAnswer = normalize(answer);
    const normalizedCorrect = normalize(correctAnswer);
    const mainTitle = normalize(correctAnswer.split(":")[0].trim());

    const isCorrect =
        normalizedAnswer === normalizedCorrect ||
        normalizedAnswer === mainTitle ||
        (normalizedAnswer.length >= 5 && normalizedCorrect.startsWith(normalizedAnswer));

    if (isCorrect) {
        const baseXp = xpPerAttempt[wrongAttempts];
        const earnedXp = hintUsed ? Math.max(0, baseXp - 3) : baseXp;
        totalXp += earnedXp;
        xpSpan.textContent = totalXp;

        feedback.textContent = `✅ Correct! +${earnedXp} XP`;
        feedback.className = "guess-feedback correct";

        blurredImage.style.filter = "blur(0px)";
        inputContainer.style.display = "none";
        if (hintBtn) hintBtn.style.display = "none";

        setTimeout(startRound, 1200);
    } else {
        wrongAttempts++;
        updateAttemptsDisplay();

        if (wrongAttempts >= maxAttempts) {
            feedback.textContent = `❌ Het antwoord was: ${correctAnswer}`;
            feedback.className = "guess-feedback wrong";
            blurredImage.style.filter = "blur(0px)";
            inputContainer.style.display = "none";
            if (hintBtn) hintBtn.style.display = "none";
            setTimeout(startRound, 1400);
        } else {
            feedback.textContent = `❌ Fout! Poging ${wrongAttempts}/${maxAttempts}`;
            feedback.className = "guess-feedback wrong";
            blurredImage.style.filter = `blur(${blurLevels[wrongAttempts]}px)`;
            guessInput.value = "";
            guessInput.focus();
        }
    }
}

// Einde van het spel
async function endGame() {
    inputContainer.style.display = "none";
    blurredImage.style.display = "none";
    placeholder.style.display = "none";
    if (hintBtn) hintBtn.style.display = "none";
    if (hintBox) hintBox.style.display = "none";

    try {
        await fetch("/api/xp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ xp: totalXp })
        });
    } catch (e) {
        console.error("Fout bij opslaan XP:", e);
    }

    try {
        const response = await fetch("/api/scoreboard");
        const scores = await response.json();
        scoreboardList.innerHTML = "";
        scores.forEach((score, index) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="score-rank">#${index + 1}</span>
                <span class="score-name">${score.name}</span>
                <span class="score-xp">${score.xp} XP</span>
            `;
            scoreboardList.appendChild(li);
        });
        scoreboard.style.display = "block";
    } catch (e) {
        console.error("Fout bij laden scorebord:", e);
    }

    feedback.textContent = `🎉 Spel voorbij! Je hebt ${totalXp} XP verdiend!`;
    feedback.className = "guess-feedback correct";

    startBtn.disabled = true;
    resetBtn.disabled = false;
}

// Reset
function resetGame() {
    currentRound = 0;
    totalXp = 0;
    wrongAttempts = 0;
    gameStarted = false;
    currentGame = null;
    hintUsed = false;

    xpSpan.textContent = "0";
    roundSpan.textContent = "0";
    updateAttemptsDisplay();

    blurredImage.style.display = "none";
    blurredImage.src = "";
    placeholder.style.display = "flex";
    inputContainer.style.display = "none";
    scoreboard.style.display = "none";
    feedback.textContent = "";
    feedback.className = "guess-feedback";
    guessInput.value = "";

    if (hintBtn) hintBtn.style.display = "none";
    if (hintBox) {
        hintBox.style.display = "none";
        hintBox.innerHTML = "";
    }

    startBtn.disabled = false;
    resetBtn.disabled = true;
}

// Hint
hintBtn.addEventListener("click", () => {
    if (!currentGame || hintUsed) return;
    hintUsed = true;

    const genres = currentGame.genres ? currentGame.genres.map(g => g.name).join(", ") : "Onbekend";
    const released = currentGame.released ? currentGame.released.split("-")[0] : "Onbekend";
    const platforms = currentGame.parent_platforms
        ? currentGame.parent_platforms.map(p => p.platform.name).join(", ")
        : "Onbekend";
    const firstLetter = correctAnswer.charAt(0).toUpperCase();
    const wordCount = correctAnswer.split(" ").length;

    hintBox.innerHTML = `
        <p><i class="bi bi-tag-fill"></i> Genre: <strong>${genres}</strong></p>
        <p><i class="bi bi-calendar-event"></i> Jaar: <strong>${released}</strong></p>
        <p><i class="bi bi-controller"></i> Platform: <strong>${platforms}</strong></p>
        <p></i>Het spel begint met: <strong>${firstLetter}</strong></p>
        <p><i class="bi bi-text-left"></i> Aantal woorden: <strong>${wordCount}</strong></p>
    `;
    hintBox.style.display = "block";

    feedback.textContent = "💡 Hint gebruikt! (-10 XP straf bij correct antwoord)";
    feedback.className = "guess-feedback wrong";
});

// Event listeners
startBtn.addEventListener("click", () => {
    if (!gameStarted) {
        gameStarted = true;
        resetBtn.disabled = false;
        startBtn.disabled = true;
        startRound();
    }
});

resetBtn.addEventListener("click", resetGame);
checkBtn.addEventListener("click", checkAnswer);

guessInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") checkAnswer();
});

playAgainBtn.addEventListener("click", () => {
    resetGame();
});