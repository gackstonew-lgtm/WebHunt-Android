import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        paper: "#F8F3F0",
        cream: {
          DEFAULT: "#F8F3F0",
          50: "#FFFFFF",
          100: "#FDFBF9",
          200: "#FAF6F3",
          300: "#F8F3F0",
          400: "#E6DFD5",
          500: "#A8A196",
          600: "#7E786E",
          700: "#57524A",
          800: "#36332E",
          900: "#0D0D0D",
        },
        stone: {
          DEFAULT: "#E6DFD5",
          50: "#FAF8F5",
          100: "#F8F3F0",
          200: "#E6DFD5",
          300: "#D2C9B9",
          400: "#A8A196",
          500: "#7E786E",
          600: "#57524A",
          700: "#36332E",
          800: "#1E1C19",
          900: "#0D0D0D",
        },
        royal: {
          DEFAULT: "#0048BB",
          50: "#EEF4FF",
          100: "#DCE8FE",
          200: "#B9D2FD",
          300: "#86B2FB",
          400: "#4D8CF7",
          500: "#0048BB",
          600: "#00388A",
          700: "#002C6E",
          800: "#002052",
          900: "#001639",
          950: "#000B1D",
        },
        coral: {
          DEFAULT: "#0048BB",
          50: "#EEF4FF",
          100: "#DCE8FE",
          200: "#B9D2FD",
          300: "#86B2FB",
          400: "#4D8CF7",
          500: "#0048BB",
          600: "#00388A",
          700: "#002C6E",
          800: "#002052",
          900: "#001639",
          950: "#000B1D",
        },
        primary: {
          DEFAULT: "#0048BB", // Royal Blue
          foreground: "#FFFFFF",
          hover: "#00388A",
          50: "#EEF4FF",
          100: "#DCE8FE",
          200: "#B9D2FD",
          300: "#86B2FB",
          400: "#4D8CF7",
          500: "#0048BB",
          600: "#00388A",
          700: "#002C6E",
          800: "#002052",
          900: "#001639",
          950: "#000B1D",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        // Map slate/neutral classes to WebHunt monochromatic pure dark surfaces
        slate: {
          50: "#F8F3F0",
          100: "#E6DFD5",
          200: "#D2C9B9",
          300: "#A8A196",
          400: "#A8A196", // Muted text token (#A8A196)
          500: "#7E786E",
          600: "#57524A",
          700: "#36332E",
          800: "rgba(248, 243, 240, 0.12)", // Hairline cream border
          850: "#161616",                   // Elevated hover surface
          900: "#0D0D0D",                   // Raised dark card
          950: "#000000",                   // Deep black background
        },
        // Semantic green for phone / verified status
        emerald: {
          400: "#5EBA8C",
          500: "#3FA372",
          600: "#2B7E55",
        },
        // WebHunt specific tokens
        webhunt: {
          bg: "#000000",
          card: "#0D0D0D",
          surface: "#080808",
          hover: "#161616",
          paper: "#F8F3F0",
          cream: "#F8F3F0",
          stone: "#E6DFD5",
          muted: "#A8A196",
          royal: "#0048BB",
          royalHover: "#00388A",
          coral: "#0048BB",
          coralHover: "#00388A",
          border: "rgba(248, 243, 240, 0.12)",
        },
      },
      borderColor: {
        DEFAULT: "var(--border)",
        subtle: "var(--border-subtle)",
        strong: "var(--border-strong)",
      },
    },
  },
  plugins: [],
};
export default config;
