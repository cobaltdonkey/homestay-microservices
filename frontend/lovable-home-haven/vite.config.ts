import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const proxiedPrefixes = [
  "/search",
  "/bookings",
  "/listings",
  "/availability",
  "/users",
  "/stays",
  "/deposit-resolutions",
];

const proxy = Object.fromEntries(
  proxiedPrefixes.map((prefix) => [
    prefix,
    {
      target: "http://127.0.0.1:8000",
      changeOrigin: true,
    },
  ])
);

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
