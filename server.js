const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static(__dirname)); // sert index.html

let messageVersESP32 = "";
let messageDeESP32 = "";

// ===== COMPTEUR DE 1 À 10 =====
let compteur = 0;
let file = [];   // liste des nombres en attente pour l'ESP32

setInterval(() => {
  compteur++;
  if (compteur > 10) compteur = 1;   // après 10, on recommence à 1
  file.push(compteur);
  if (file.length > 20) file.shift(); // évite que la liste devienne trop longue
}, 1000);

// L'ESP32 récupère le prochain nombre de la liste
app.get("/compteur", (req, res) => {
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
  res.send(messageVersESP32);
});

app.post("/depuis-esp32", (req, res) => {
  messageDeESP32 = req.body.message;
  res.send("ok");
});

app.get("/recevoir", (req, res) => {
  res.send(messageDeESP32);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Serveur démarré sur le port " + port));
