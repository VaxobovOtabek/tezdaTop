const base = require('../../packages/config/tailwind.base.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...base,
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'
  ]
};
