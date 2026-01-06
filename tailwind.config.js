/** @type {import('tailwindcss').Config} */
/**
 * Tailwind CSS v4 Configuration
 * 
 * In Tailwind v4, most configuration is done via CSS using the @theme directive in main.css.
 * This file only specifies content sources for class scanning.
 * 
 * See src/main.css for:
 * - MD3 color system tokens
 * - Typography scale (display, headline, title, body, label)
 * - Spacing and border radius
 * - Box shadows and elevations
 * - Animations and keyframes
 * - Custom utility values
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
}
