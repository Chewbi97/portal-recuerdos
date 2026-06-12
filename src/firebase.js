import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCHRPMhmT3S9LRNbF7GIih6K6KpEttjr00",
  authDomain: "portal-de-recuerdos.firebaseapp.com",
  projectId: "portal-de-recuerdos",
  storageBucket: "portal-de-recuerdos.firebasestorage.app",
  messagingSenderId: "630413457686",
  appId: "1:630413457686:web:9205b00c49177c22edf837",
  measurementId: "G-Z0292ZKV25",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);

export const VAPID_KEY =
  "BND0faE_dLQrMykI_Dgd6DBW8qpHnxvdh3kdIW2ozBbiSntCapogXIu-R4QF_VGuX0m8fX-wNhLdIeXdSAMv4XY";

// ── Verifica si el navegador/contexto soporta Firebase Messaging ──
// (requiere HTTPS o localhost — falla en http://192.168.x.x:3000)
let messagingPromise = null;
const getMessagingSafe = async () => {
  if (messagingPromise) return messagingPromise;
  messagingPromise = (async () => {
    try {
      const soportado = await isSupported();
      if (!soportado) return null;
      return getMessaging(app);
    } catch {
      return null;
    }
  })();
  return messagingPromise;
};

export const solicitarPermisoNotificaciones = async () => {
  try {
    const messaging = await getMessagingSafe();
    if (!messaging) {
      console.log(
        "Notificaciones no soportadas en este entorno (requiere HTTPS).",
      );
      return null;
    }

    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") return null;

    const registro = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );

    await new Promise((resolve) => {
      if (registro.active) {
        resolve();
      } else {
        const sw = registro.installing || registro.waiting;
        sw.addEventListener("statechange", (e) => {
          if (e.target.state === "activated") resolve();
        });
      }
    });

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registro,
    });

    if (token) {
      const { doc, setDoc } = await import("firebase/firestore");

      // ✅ Un documento por dispositivo usando el token como ID
      // Si el token ya existe simplemente lo sobreescribe (no duplica)
      await setDoc(doc(db, "notificaciones", "dispositivos", "tokens", token), {
        token,
        updatedAt: new Date().toISOString(),
      });

      console.log("Token guardado:", token.substring(0, 20) + "...");
      return token;
    }
  } catch (error) {
    console.error("Error:", error);
  }
  return null;
};

export const enviarNotificacion = async (titulo, cuerpo) => {
  try {
    const { collection, getDocs } = await import("firebase/firestore");

    // ✅ Leer todos los documentos de la subcolección tokens
    const snapshot = await getDocs(
      collection(db, "notificaciones", "dispositivos", "tokens"),
    );

    if (snapshot.empty) return;

    // Obtener tokens únicos (cada doc tiene su token como ID)
    const tokens = snapshot.docs.map((d) => d.data().token).filter(Boolean);

    if (tokens.length === 0) return;

    const response = await fetch(
      "https://us-central1-portal-de-recuerdos.cloudfunctions.net/enviarNotificacion",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens, titulo, cuerpo }),
      },
    );

    console.log("Notificación enviada:", await response.json());
  } catch (error) {
    console.error("Error enviando notificación:", error);
  }
};
