import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/dhis2": {
        target: "http://localhost:8081/", // 👈 Your DHIS2 server
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dhis2/, "/api"),
      },
    },
  },
});
