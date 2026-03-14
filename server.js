const express = require("express");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Maakt al je bestanden bereikbaar in de browser
app.use(express.static(__dirname));

// Zoekroute
app.get("/api/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({ error: "Geen zoekterm opgegeven." });
    }

    const apiKey = process.env.RAWG_API_KEY;

    const rawgUrl = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=9`;

    const response = await fetch(rawgUrl);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Fout bij ophalen van RAWG data:", error);
    res
      .status(500)
      .json({ error: "Er liep iets mis bij het ophalen van de games." });
  }
});

app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});
