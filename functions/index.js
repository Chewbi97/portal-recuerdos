const functions = require("firebase-functions");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

exports.enviarNotificacion = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { tokens, titulo, cuerpo } = req.body;
    if (!tokens || !titulo || !cuerpo) {
      res.status(400).json({ error: "Faltan parámetros" });
      return;
    }

    const tokenList = Array.isArray(tokens) ? tokens : [tokens];
    const mensaje = {
      notification: { title: titulo, body: cuerpo },
      webpush: {
        notification: {
          title: titulo,
          body: cuerpo,
          icon: "/logo192.png"
        },
        fcmOptions: {
          link: "https://portalderecuerdosmys.web.app"
        }
      }
    };

    let exitosos = 0;
    let fallidos = 0;

    for (const token of tokenList) {
      try {
        await admin.messaging().send({ ...mensaje, token });
        exitosos++;
      } catch (err) {
        console.error("Error:", err.message);
        fallidos++;
      }
    }

    res.status(200).json({ exitosos, fallidos });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});