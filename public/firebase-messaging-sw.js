importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCHRPMhmT3S9LRNbF7GIih6K6KpEttjr00",
  authDomain: "portal-de-recuerdos.firebaseapp.com",
  projectId: "portal-de-recuerdos",
  storageBucket: "portal-de-recuerdos.firebasestorage.app",
  messagingSenderId: "630413457686",
  appId: "1:630413457686:web:9205b00c49177c22edf837"
});

const messaging = firebase.messaging();

// ✅ NO llamar showNotification aquí — FCM ya lo hace automáticamente en background
// Solo lo usamos para personalizar si quisiéramos, pero sin duplicar
messaging.onBackgroundMessage((payload) => {
  // FCM ya muestra la notificación — aquí solo la personalizamos si es necesario
  // Si descomentamos showNotification se duplica, así que lo dejamos vacío
});

// ✅ Fix: abrir la página al hacer click en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = 'https://portalderecuerdosmys.web.app';
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});