import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

// Library build configuration: produces ESM and CJS bundles in `dist/`
export default defineConfig({
  plugins: [react(), dts({ insertTypesEntry: true })],
  // build: {
  //   lib: {
  //     entry: "src/index.ts",
  //     name: "@hoseinh/react-ocr",
  //     fileName: "index",
  //     formats: ["es", "cjs"],
  //   },
  //   rollupOptions: {
  //     // Externalize peer deps — consumers provide React
  //     external: ["react", "react-dom"],
  //     output: {
  //       globals: {
  //         react: "React",
  //         "react-dom": "ReactDOM",
  //       },
  //     },
  //   },
  // },
  server: {
    host: "127.0.0.1",
    port: 3001,
  },
});

