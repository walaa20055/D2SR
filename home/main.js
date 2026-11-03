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
const uploadCard = document.querySelector(".upload-card");
const uploadArea = document.getElementById("uploadArea");
const imagePreview = document.getElementById("imagePreview");
const previewImage = document.getElementById("previewImage");
const removeImage = document.getElementById("removeImage");
const analyzeBtn = document.getElementById("analyzeBtn");
const uploadError = document.getElementById("uploadError");
const uploadProgress = document.getElementById("uploadProgress");
const progressPercent = document.getElementById("progressPercent");
const progressBar = document.getElementById("progressBar");
const progressName = document.getElementById("progressName");

const MAX_SIZE = 25 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg"];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const LOAD_TIME = reduceMotion ? 300 : 1500;

let selectedFile = null;
let objectUrl = null;
let loadToken = 0;

function showError(msg) {
  uploadError.textContent = msg;
  uploadError.hidden = !msg;
}

/* progress: 0 → 1 (drives the ring around the card + the bar) */
function setProgress(p) {
  uploadCard.style.setProperty("--load", `${p * 360}deg`);
  progressBar.style.width = `${p * 100}%`;
  progressPercent.textContent = `${Math.round(p * 100)}%`;
}

function resetUpload() {
  loadToken++;
  selectedFile = null;

  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;

  fileInput.value = "";
  previewImage.removeAttribute("src");
  imagePreview.classList.remove("show");
  uploadProgress.hidden = true;
  uploadArea.classList.remove("has-image");
  uploadCard.classList.remove("is-loading", "is-loaded");
  uploadCard.style.removeProperty("--load");
  analyzeBtn.hidden = true;
  showError("");
}

function setFile(file) {
  showError("");

  if (!ALLOWED.includes(file.type)) {
    return showError("Unsupported format. Please upload a JPG, JPEG or PNG image.");
  }

  if (file.size > MAX_SIZE) {
    return showError("File is too large. Maximum size is 25 MB.");
  }

  /* start fresh, then run the loading animation */
  resetUpload();
  const token = loadToken;

  selectedFile = file;
  objectUrl = URL.createObjectURL(file);

  uploadArea.classList.add("has-image");
  uploadCard.classList.add("is-loading");
  uploadProgress.hidden = false;
  progressName.textContent = file.name;
  setProgress(0);

  const decoded = new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = resolve;
    img.src = objectUrl;
  });

  const start = performance.now();

  function frame(now) {
    if (token !== loadToken) return;

    const t = Math.min((now - start) / LOAD_TIME, 1);
    setProgress(1 - Math.pow(1 - t, 2));

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      decoded.then(() => finishLoading(token));
    }
  }

  requestAnimationFrame(frame);
}

function finishLoading(token) {
  if (token !== loadToken) return;

  previewImage.src = objectUrl;
  uploadProgress.hidden = true;
  imagePreview.classList.add("show");

  uploadCard.classList.remove("is-loading");
  uploadCard.classList.add("is-loaded");

  analyzeBtn.hidden = false;
}

fileInput.addEventListener("change", (e) => {
  if (e.target.files[0]) setFile(e.target.files[0]);
});

removeImage.addEventListener("click", resetUpload);

/* ================= DRAG AND DROP ================= */
["dragenter", "dragover"].forEach((name) =>
  uploadArea.addEventListener(name, (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragging");
    uploadCard.classList.add("dragging");
  }),
);

uploadArea.addEventListener("dragleave", (e) => {
  e.preventDefault();
  if (uploadArea.contains(e.relatedTarget)) return;
  uploadArea.classList.remove("dragging");
  uploadCard.classList.remove("dragging");
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragging");
  uploadCard.classList.remove("dragging");

  if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
});

/* ================= ANALYZE → analyzing.html ================= */
analyzeBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparing…';

  try {
    const data = await D2SR.analyze(selectedFile);
    sessionStorage.setItem("d2sr-analysis", JSON.stringify(data));
    location.href = "../analysis/analyzing.html";
  } catch (err) {
    console.error(err);
    showError("Could not read this image. Please try another file.");
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass-chart"></i> Analyze Image';
  }
});