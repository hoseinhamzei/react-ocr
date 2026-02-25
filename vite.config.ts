import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // dts generates .d.ts files for TypeScript support
    dts({ 
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['src/**/*.test.tsx', 'src/**/*.test.ts', 'src/setupTests.ts', 'src/main.tsx', 'src/App.tsx'],
      tsconfigPath: './tsconfig.app.json',
      rollupTypes: true
    })
  ],
  build: {
    // Library entry configuration
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "@hoseinh/react-ocr",
      fileName: (format) => `index.${format}.js`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      // Externalize peer dependencies so they aren't bundled into your library
      external: (id) => {
        return id === 'react' || id.startsWith('react/') || id === 'react-dom' || id.startsWith('react-dom/');
      },
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
        // Ensure CSS is extracted nicely if needed
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'index.css';
          return assetInfo.name as string;
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});