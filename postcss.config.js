Set-Content -Path .\postcss.config.js -Value @"
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"@