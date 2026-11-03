/* dark-mode logic and storage key as main.js ... shared between all pages) */
const themeToggle = document.getElementById("themeToggle");
const themeIcon = themeToggle.querySelector("i");
function setTheme(isDark) {
  document.body.classList.toggle("dark-mode", isDark);
  themeIcon.classList.toggle("fa-moon", !isDark);
  themeIcon.classList.toggle("fa-sun", isDark);
  localStorage.setItem("d2sr-theme", isDark ? "dark" : "light");
  if (window.onThemeChange) window.onThemeChange();
}
setTheme(localStorage.getItem("d2sr-theme") === "dark");
themeToggle.addEventListener("click", () =>
  setTheme(!document.body.classList.contains("dark-mode")),
);
