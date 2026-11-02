/* ================= DARK MODE ================= */
const themeToggle = document.getElementById("themeToggle");
const themeIcon = themeToggle.querySelector("i");

function setTheme(isDark) {
  document.body.classList.toggle("dark-mode", isDark);

  themeIcon.classList.toggle("fa-moon", !isDark);
  themeIcon.classList.toggle("fa-sun", isDark);

  localStorage.setItem("d2sr-theme", isDark ? "dark" : "light");
}

const savedTheme = localStorage.getItem("d2sr-theme");
setTheme(savedTheme === "dark");

themeToggle.addEventListener("click", () => {
  const isDark = !document.body.classList.contains("dark-mode");
  setTheme(isDark);
});

/* ================= MOBILE MENU (only if the button exists) ================= */
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.querySelector(".nav-links");
if (menuToggle && navLinks) {
  const menuIcon = menuToggle.querySelector("i");
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    const isOpen = navLinks.classList.contains("open");
    menuIcon.classList.toggle("fa-bars", !isOpen);
    menuIcon.classList.toggle("fa-xmark", isOpen);
  });
}

/* ================= FILE UPLOAD ================= */
const fileInput = document.getElementById("imageUpload");
const uploadArea = document.getElementById("uploadArea");
const imagePreview = document.getElementById("imagePreview");
const previewImage = document.getElementById("previewImage");
const removeImage = document.getElementById("removeImage");
const analyzeBtn = document.getElementById("analyzeBtn");
const uploadError = document.getElementById("uploadError");

const MAX_SIZE = 25 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg"];
let selectedFile = null;

function showError(msg) {
  uploadError.textContent = msg;
  uploadError.hidden = !msg;
}

function setFile(file) {
  showError("");
  if (!ALLOWED.includes(file.type))
    return showError(
      "Unsupported format. Please upload a JPG, JPEG or PNG image.",
    );
  if (file.size > MAX_SIZE)
    return showError("File is too large. Maximum size is 25 MB.");

  selectedFile = file;
  if (previewImage.src.startsWith("blob:"))
    URL.revokeObjectURL(previewImage.src);
  previewImage.src = URL.createObjectURL(file);
  imagePreview.classList.add("show");
  uploadArea.classList.add("has-image");
  analyzeBtn.hidden = false;
}

function clearFile() {
  selectedFile = null;
  fileInput.value = "";
  previewImage.removeAttribute("src");
  imagePreview.classList.remove("show");
  uploadArea.classList.remove("has-image");
  analyzeBtn.hidden = true;
  showError("");
}

fileInput.addEventListener("change", (e) => {
  if (e.target.files[0]) setFile(e.target.files[0]);
});
removeImage.addEventListener("click", clearFile);

/* ================= DRAG AND DROP ================= */
["dragenter", "dragover"].forEach((n) =>
  uploadArea.addEventListener(n, (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragging");
  }),
);
["dragleave", "drop"].forEach((n) =>
  uploadArea.addEventListener(n, (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragging");
  }),
);
uploadArea.addEventListener("drop", (e) => {
  if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
});

/* ================= ANALYZE → analyzing.html ================= */
analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) return;
  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i> Preparing…';
  try {
    const data = await D2SR.analyze(selectedFile);
    sessionStorage.setItem("d2sr-analysis", JSON.stringify(data));
    location.href = "../analysis/analyzing.html";
  } catch (err) {
    console.error(err);
    showError("Could not read this image. Please try another file.");
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML =
      '<i class="fa-solid fa-magnifying-glass-chart"></i> Analyze Image';
  }
});
