const express = require("express");
const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // sert index.html

let messageVersESP32 = "";
let messageDeESP32 = "";

// ===== STATUT DE L'ESP32 =====
let dernierContact = 0;   // heure du dernier contact de l'ESP32

app.get("/statut", (req, res) => {
  const ecoule = Date.now() - dernierContact;
  if (ecoule < 5000) {
    res.send("en ligne");
  } else {
    res.send("hors ligne");
  }
});
// =============================

// ===== COMPTEUR DE 1 À 10 =====
let compteur = 0;
let file = [];

setInterval(() => {
  compteur++;
  if (compteur > 10) compteur = 1;
  file.push(compteur);
  if (file.length > 20) file.shift();
}, 1000);

app.get("/compteur", (req, res) => {
  dernierContact = Date.now();          // l'ESP32 vient de nous contacter
  if (file.length > 0) {
    res.send(String(file.shift()));
  } else {
    res.send("");
  }
});
// ===============================

app.post("/envoyer", (req, res) => {
  messageVersESP32 = req.body.message;
  res.send("ok");
});

app.get("/lire", (req, res) => {
  dernierContact = Date.now();          // l'ESP32 vient de nous contacter
  res.send(messageVersESP32);
});

app.post("/depuis-esp32", (req, res) => {
  dernierContact = Date.now();          // l'ESP32 vient de nous contacter
  messageDeESP32 = req.body.message;
  res.send("ok");
});

app.get("/recevoir", (req, res) => {
  res.send(messageDeESP32);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Serveur démarré sur le port " + port));
