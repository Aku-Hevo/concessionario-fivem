// server.js
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.set("trust proxy", 1); // fondamentale dietro Render

// CORS per frontend
app.use(cors({
  origin: "https://concessionario-fivem.vercel.app", 
  credentials: true
}));

app.use(express.json());

// SESSIONE sicura
app.use(session({
  secret: "supersecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,    // HTTPS obbligatorio
    sameSite: "none"
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// DATABASE SQLite
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

// CONFIG DISCORD OAuth2
const config = {
  clientID: "1488241628576485466", // tuo Client ID
  clientSecret: "Qvk0hAwEn9LfZWSdqwF9CSVGlh0zgB-L", // tuo Client Secret
  callbackURL: "https://concessionario-fivem.onrender.com/auth/discord/callback"
};

passport.use(new DiscordStrategy({
  clientID: config.clientID,
  clientSecret: config.clientSecret,
  callbackURL: config.callbackURL,
  scope: ["identify"]
}, (accessToken, refreshToken, profile, done) => {
  console.log("Login Discord effettuato:", profile.username);
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// --- ROUTE ---
app.get("/", (req, res) => res.send("Backend attivo ✅"));

// LOGIN Discord
app.get("/auth/discord", passport.authenticate("discord"));

// CALLBACK con debug dettagliato
app.get("/auth/discord/callback", (req, res, next) => {
  passport.authenticate("discord", (err, user, info) => {
    if (err) {
      console.error("Errore OAuth:", err);
      return res.status(500).send(`Errore OAuth interno: ${err.message}`);
    }
    if (!user) {
      console.log("Nessun user ottenuto:", info);
      return res.redirect("/");
    }

    req.logIn(user, err => {
      if (err) {
        console.error("Errore login session:", err);
        return res.status(500).send(`Errore sessione: ${err.message}`);
      }
      // Redirect al frontend dashboard
      return res.redirect("https://concessionario-fivem.vercel.app/dashboard");
    });
  })(req, res, next);
});

// API UTENTE
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

app.post("/api/cars", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Non autenticato" });

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

app.delete("/api/cars/:id", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Non autenticato" });

  db.run("DELETE FROM cars WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.sendStatus(200);
  });
});

// AVVIO SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server online su port ${PORT}`));
