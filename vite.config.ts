import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// AstroBackend-in CORS siyahısı (appsettings.json -> Cors:AllowedOrigins) artıq
// localhost:5173-ü ehtiva edir, ona görə buranı Vite-in defolt portunda saxlayırıq
// — AstroBackend-in konfiqurasiyasında heç bir dəyişiklik lazım deyil.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
});
