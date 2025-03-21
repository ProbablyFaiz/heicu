import { resolve } from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: "../",
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
