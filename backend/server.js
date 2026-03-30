const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.set("trust proxy", 1); // importante dietro Render

// CORS per frontend
app.use(cors({
  origin: "https://concessionario-fivem.vercel.app",
  credentials: true
}));

app.use(express.json());

// SESSIONE
app.use(session({
  secret: "supersecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,             // HTTPS obbligatorio su Render
    sameSite: "none"           // cross-site login
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// DATABASE
const db = new sqlite3.Database("./database.db");
db.run(`
CREATE TABLE IF NOT EXISTS cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT,
  persona TEXT,
  tipo_macchina TEXT,
  costo INTEGER,
  targa TEXT,
  inserito_da TEXT
)
`);

// Discord OAuth2
const config = {
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "https://concessionario-fivem.onrender.com/auth/discord/callback"
};

passport.use(new DiscordStrategy({
  clientID: config.clientID,
  clientSecret: config.clientSecret,
  callbackURL: config.callbackURL,
  scope: ["identify"]
}, (accessToken, refreshToken, profile, done) => {
  console.log("Discord profile:", profile.username);
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// HOME
app.get("/", (req, res) => {
  res.send("Backend attivo ✅");
});

// LOGIN Discord
app.get("/auth/discord", passport.authenticate("discord"));

app.get("/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("https://concessionario-fivem.vercel.app/dashboard");
  }
);

// UTENTE
app.get("/api/user", (req, res) => {
  res.json(req.user || null);
});

// API AUTO
app.get("/api/cars", (req, res) => {
  db.all("SELECT * FROM cars", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// CREA AUTO
app.post("/api/cars", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  const { tipo, persona, tipo_macchina, costo, targa } = req.body;
  db.run(
    "INSERT INTO cars (tipo, persona, tipo_macchina, costo, targa, inserito_da) VALUES (?, ?, ?, ?, ?, ?)",
    [tipo, persona, tipo_macchina, costo, targa, req.user.username],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// ELIMINA AUTO
app.delete("/api/cars/:id", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });

  db.run("DELETE FROM cars WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.sendStatus(200);
  });
});

// PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server online su port ${PORT}`));
