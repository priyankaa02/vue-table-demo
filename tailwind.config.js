// tailwind.config.js
module.exports = {
  content: ["./public/**/*.html", "./src/**/*.vue", "./src/main.ts"],
  purge: {
    enabled: true,
    content: ["./public/**/*.html", "./src/**/*.vue", "./src/main.ts"],
    // ...
  },
  darkMode: false,
  theme: {
    screens: {
      'mobile': {'max': '550px'},
    }
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
