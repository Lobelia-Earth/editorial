import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

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
});
