import base from '../../packages/config/tailwind.base.js';

/** @type {import('tailwindcss').Config} */
export default {
  ...base,
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'
  ]
};
