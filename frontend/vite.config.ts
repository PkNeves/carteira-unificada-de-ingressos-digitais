import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Plugin para remover console.log em produção
const removeConsolePlugin = () => {
  return {
    name: "remove-console",
    transform(code: string, id: string) {
      if (
        process.env.NODE_ENV === "production" &&
        (id.endsWith(".tsx") || id.endsWith(".ts"))
      ) {
        return {
          code: code.replace(/console\.(log|warn|info|debug)\([^)]*\);?/g, ""),
          map: null,
        };
      }
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), removeConsolePlugin()],
  server: {
    port: 5173,
  },
  build: {
    // Otimizações de build para mobile
    target: "esnext",
    minify: "esbuild", // Esbuild é mais rápido que terser
    cssMinify: true,
    rollupOptions: {
      output: {
        // Code splitting mais eficiente
        manualChunks: (id) => {
          // Separa node_modules em chunks menores
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "react-vendor";
            }
            if (id.includes("html-to-image")) {
              return "html-to-image"; // Chunk separado para lazy load
            }
            if (id.includes("axios")) {
              return "utils";
            }
            // Outras libs grandes em chunk separado
            return "vendor";
          }
        },
        // Otimiza nomes de chunks
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
    // Limite de chunk size reduzido para forçar code splitting
    chunkSizeWarningLimit: 600,
    // Gera source maps apenas em dev
    sourcemap: false,
    // Otimizações adicionais
    reportCompressedSize: true,
  },
  // Otimizações de dependências
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "axios"],
    exclude: ["html-to-image"], // Exclui para lazy load
  },
});
