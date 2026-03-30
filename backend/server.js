const express = require("express");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();


app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: "supersecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // sicuro solo in HTTPS
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
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

// DISCORD CONFIG (metteremo dopo)
const config = {
  clientID: "1488241628576485466",
  clientSecret: "Qvk0hAwEn9LfZWSdqwF9CSVGlh0zgB-L",
  callbackURL: "http://localhost:3000/auth/discord/callback"
};

passport.use(new DiscordStrategy({
  clientID: config.clientID,
  clientSecret: config.clientSecret,
  callbackURL: config.callbackURL,
  scope: ["identify"]
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// LOGIN
app.get("/auth/discord", passport.authenticate("discord"));

app.get("/auth/discord/callback",
  passport.authenticate("discord", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("http://localhost:5173");
  }
);

// USER
app.get("/api/user", (req, res) => {
  res.json(req.user || null);
});

// API AUTO
app.get("/api/cars", (req, res) => {
  db.all("SELECT * FROM cars", [], (err, rows) => {
    res.json(rows);
  });
});

app.post("/api/cars", (req, res) => {
  const { tipo, persona, tipo_macchina, costo, targa } = req.body;

  db.run(
    "INSERT INTO cars (tipo, persona, tipo_macchina, costo, targa, inserito_da) VALUES (?, ?, ?, ?, ?, ?)",
    [tipo, persona, tipo_macchina, costo, targa, req.user?.username || "unknown"]
  );

  res.sendStatus(200);
});

app.delete("/api/cars/:id", (req, res) => {
  db.run("DELETE FROM cars WHERE id = ?", [req.params.id]);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server online"));

