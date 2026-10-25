const express = require("express");
const crypto = require("crypto");
const app = express();

const EMAIL_PROPRIETAIRE = "ouni_bouraoui@yahoo.ft";   // <-- METTEZ ICI L'E-MAIL DE L'ADMIN

app.use(express.json());
app.use(express.static(__dirname)); // sert index.html

let messageVersESP32 = "";
let messageDeESP32 = "";

// ===== CODES D'ACTIVATION =====
const SECRET = process.env.SECRET || "";

// Au démarrage : on affiche si les variables existent (sans afficher leur valeur)
console.log("Config -> SECRET:", !!SECRET, "| RESEND_API_KEY:", !!process.env.RESEND_API_KEY);

// Le code d'un e-mail est calculé avec votre SECRET : il est toujours le même pour un e-mail donné
function codePour(email) {
  return crypto.createHmac("sha256", SECRET)
    .update(email.trim().toLowerCase())
    .digest("hex")
    .slice(0, 10)
    .toUpperCase();
}

function verifierCle(req, res, next) {
  const email = req.headers["x-email"];
  const code = req.headers["x-code"];
  if (SECRET && email && code && code === codePour(email)) {
    next();
  } else {
    res.status(401).send("code invalide");
  }
}

// La page web teste son e-mail + code ici
app.get("/verifier", verifierCle, (req, res) => {
  res.send("ok");
});

// Limites anti-spam
let derniereDemande = {};
let demandesHeure = 0;
setInterval(() => { demandesHeure = 0; }, 3600000);

// Le visiteur demande un code : le serveur envoie un e-mail à l'admin
app.post("/demander-code", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  console.log("Demande d'activation reçue pour :", email);

  if (!email.includes("@") || email.length > 100) {
    console.log("Refusé : e-mail invalide");
    return res.status(400).send("email invalide");
  }
  if (!SECRET || !process.env.RESEND_API_KEY) {
    console.log("Refusé : config manquante -> SECRET:", !!SECRET, "| RESEND_API_KEY:", !!process.env.RESEND_API_KEY);
    return res.status(500).send("serveur non configure");
  }
  if (demandesHeure >= 20 || Date.now() - (derniereDemande[email] || 0) < 60000) {
    console.log("Refusé : trop de demandes");
    return res.status(429).send("trop de demandes");
  }
  derniereDemande[email] = Date.now();
  demandesHeure++;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Activation <onboarding@resend.dev>",
        to: EMAIL_PROPRIETAIRE,
        subject: "Demande d'activation : " + email,
        text: "Demande d'activation de : " + email +
              "\n\nCode d'activation : " + codePour(email) +
              "\n\nSi vous acceptez, envoyez ce code à cette personne."
      })
    });
    if (!r.ok) {
      console.log("Erreur Resend (" + r.status + ") :", await r.text());
      return res.status(500).send("erreur envoi");
    }
    console.log("E-mail envoyé à l'admin pour :", email);
    res.send("ok");
  } catch (e) {
    console.log("Erreur :", e);
    res.status(500).send("erreur envoi");
  }
});

// ===== STATUT DE L'ESP32 =====
let dernierContact = 0;

app.get("/statut", verifierCle, (req, res) => {
  const ecoule = Date.now() - dernierContact;
  res.send(ecoule < 5000 ? "en ligne" : "hors ligne");
});

// ===== COMPTEUR DE 1 À 10 =====
let compteur = 0;
let file = [];

setInterval(() => {
  compteur++;
  if (compteur > 10) compteur = 1;
  file.push(compteur);
  if (file.length > 20) file.shift();
}, 1000);

// ===== ROUTES UTILISÉES PAR L'ESP32 =====
app.get("/compteur", (req, res) => {
  dernierContact = Date.now();
  res.send(file.length > 0 ? String(file.shift()) : "");
});

app.get("/lire", (req, res) => {
  dernierContact = Date.now();
  res.send(messageVersESP32);
});

app.post("/depuis-esp32", (req, res) => {
  dernierContact = Date.now();
  messageDeESP32 = req.body.message;
  res.send("ok");
});

// ===== ROUTES UTILISÉES PAR LA PAGE WEB =====
app.post("/envoyer", verifierCle, (req, res) => {
  messageVersESP32 = req.body.message;
  res.send("ok");
});

app.get("/recevoir", verifierCle, (req, res) => {
  res.send(messageDeESP32);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Serveur démarré sur le port " + port));
