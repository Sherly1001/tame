import react from "@vitejs/plugin-react-swc";
import { defineConfig, splitVendorChunkPlugin } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), splitVendorChunkPlugin()],
  base: "/popup/dist",
  server: {
    fs: {
      allow: ["./src", "../scripts/src"],
    },
  },
});
