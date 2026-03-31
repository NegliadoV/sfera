import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

// @ts-ignore - Next.ts compiler might not include WebWorker types by default
declare const self: any;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// --- Push Notifications ---
self.addEventListener("push", (event: any) => {
  let data: any = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Новое уведомление Horizon", body: event.data.text() };
    }
  }

  const title = data.title || "Horizon System";
  const options = {
    body: data.body || "У вас новое сообщение",
    icon: data.icon || "/logo.svg",
    badge: "/logo.svg",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event: any) => {
  event.notification.close();
  
  const urlToOpen = new URL(event.notification.data?.url || "/", self.location.origin).href;
  
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients: any[]) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
