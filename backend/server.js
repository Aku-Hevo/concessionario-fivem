const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
app.set("trust proxy", 1); // necessario dietro Render

// --- CORS verso frontend Vercel ---
app.use(cors({
  origin: "https://concessionario-fivem.vercel.app",
  credentials: true
}));

app.use(express.json());

// --- SESSIONE sicura ---
app.use(session({
  secret: "supersecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,    // HTTPS
    sameSite: "none"
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// --- DATABASE SQLite ---
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
);

CREATE TABLE IF NOT EXISTS users (
  discord_id TEXT PRIMARY KEY,
  username TEXT,
  role TEXT
);
`);

// --- CONFIG DISCORD ---
const config = {
  clientID: "1488241628576485466",  // tuo client ID
  clientSecret: "3KrH4qLkrZy_HdwuE0IvN3Gzp_KZvJmr", // tuo client secret
  callbackURL: "https://concessionario-fivem.onrender.com/auth/discord/callback"
};

passport.use(new DiscordStrategy({
  clientID: config.clientID,
  clientSecret: config.clientSecret,
  callbackURL: config.callbackURL,
  scope: ["identify"]
}, (accessToken, refreshToken, profile, done) => {
  // Inserisce o aggiorna utente nel db
  db.run(
    "INSERT OR REPLACE INTO users (discord_id, username, role) VALUES (?, ?, COALESCE((SELECT role FROM users WHERE discord_id=?), 'Membro'))",
    [profile.id, profile.username, profile.id],
    err => { if(err) console.error(err); }
  );
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// --- ROUTE ---

app.get("/", (req, res) => res.send("Backend PRO attivo ✅"));

// --- LOGIN Discord ---
app.get("/auth/discord", passport.authenticate("discord"));

app.get("/auth/discord/callback", (req, res, next) => {
  passport.authenticate("discord", (err, user, info) => {
    if (err) {
      console.error("Errore OAuth reale:", err);
      return res.status(500).send(`Errore OAuth reale: ${err.message}`);
    }
    if (!user) {
      console.log("Nessun user ottenuto:", info);
      return res.redirect("/");
    }
    req.logIn(user, err => {
      if (err) {
        console.error("Errore login session:", err);
        return res.status(500).send(`Errore sessione reale: ${err.message}`);
      }
      return res.redirect("https://concessionario-fivem.vercel.app/dashboard");
    });
  })(req, res, next);
});

// --- API UTENTE ---
app.get("/api/user", (req, res) => {
  if(!req.user) return res.json(null);
  db.get("SELECT role FROM users WHERE discord_id=?", [req.user.id], (err, row) => {
    if(err) return res.status(500).json({error: err.message});
    res.json({username: req.user.username, id: req.user.id, role: row.role});
  });
});

// --- API AUTO ---
app.get("/api/cars", (req, res) => {
  db.all("SELECT * FROM cars", [], (err, rows) => {
    if(err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

app.post("/api/cars", (req, res) => {
  if(!req.user) return res.status(401).json({error:"Non autenticato"});
  const { tipo, persona, tipo_macchina, costo, targa } = req.body;
  db.run(
    "INSERT INTO cars (tipo, persona, tipo_macchina, costo, targa, inserito_da) VALUES (?, ?, ?, ?, ?, ?)",
    [tipo, persona, tipo_macchina, costo, targa, req.user.username],
    function(err) { if(err) return res.status(500).json({error:err.message}); res.json({id:this.lastID}); }
  );
});

app.delete("/api/cars/:id", (req,res) => {
  if(!req.user) return res.status(401).json({error:"Non autenticato"});
  db.get("SELECT inserito_da FROM cars WHERE id=?", [req.params.id], (err,row)=>{
    if(err) return res.status(500).json({error:err.message});
    // Solo Admin o chi ha inserito può eliminare
    db.get("SELECT role FROM users WHERE discord_id=?", [req.user.id], (err2,userRow)=>{
      if(err2) return res.status(500).json({error:err2.message});
      if(userRow.role !== "Admin" && row.inserito_da !== req.user.username)
        return res.status(403).json({error:"Non autorizzato"});
      db.run("DELETE FROM cars WHERE id=?", [req.params.id], err3=>{
        if(err3) return res.status(500).json({error:err3.message});
        res.sendStatus(200);
      });
    });
  });
});

// --- PORT ---
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log(`Server PRO online su port ${PORT}`));
