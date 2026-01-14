import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import pkg from "./package.json";

export default defineConfig({
  base: process.env.NODE_ENV === "development" ? "/admin/" : "/",
  plugins: [
    // babel({
    //   filter: /\.[jt]sx?$/,
    //   babelConfig: {
    //     presets: ["@babel/preset-typescript"],
    //     plugins: [["babel-plugin-react-compiler", {}]],
    //   },
    // }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});
