const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static(__dirname)); // sert index.html

let messageVersESP32 = "";   // message écrit sur la page web
let messageDeESP32 = "";     // message envoyé par l'ESP32

// La page web envoie un message à l'ESP32
app.post("/envoyer", (req, res) => {
  messageVersESP32 = req.body.message;
  res.send("ok");
});

// L'ESP32 lit le message de la page web
app.get("/lire", (req, res) => {
  res.send(messageVersESP32);
});

// L'ESP32 envoie un message à la page web
app.post("/depuis-esp32", (req, res) => {
  messageDeESP32 = req.body.message;
  res.send("ok");
});

// La page web lit le message de l'ESP32
app.get("/recevoir", (req, res) => {
  res.send(messageDeESP32);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Serveur démarré sur le port " + port));
