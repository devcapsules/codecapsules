module.exports = {
  root: true,
  extends: ["next/core-web-vitals"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  rules: {
    "@next/next/no-img-element": "off",
    "react-hooks/exhaustive-deps": "warn",
    "react/no-unescaped-entities": "warn",
    "react/jsx-no-comment-textnodes": "warn", 
    "@next/next/no-html-link-for-pages": "warn"
  }
};