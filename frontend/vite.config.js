import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // Automatically updates the app when you push changes
      manifest: {
        name: "PulseChat",
        short_name: "PulseChat",
        description: "WhatsApp Style Chat App",
        theme_color: "#111b21", // Matches your sidebar background
        background_color: "#0b141a", // Matches your chat background
        display: "standalone", // Removes the browser URL bar
        orientation: "portrait",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
