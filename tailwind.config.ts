import tailwindForms from '@tailwindcss/forms';
import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // Note: In Tailwind CSS v4, dark mode is configured via @variant in globals.css
  // The darkMode config option is no longer used in v4
  theme: {
    extend: {},
  },
  plugins: [tailwindForms],
} satisfies Config;
