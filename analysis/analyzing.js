const data = JSON.parse(sessionStorage.getItem("d2sr-analysis") || "null");
if (!data) location.replace("../home/index.html"); // nothing uploaded yet

if (data) {
  const size = (b) =>
    b < 1048576
      ? (b / 1024).toFixed(1) + " KB"
      : (b / 1048576).toFixed(1) + " MB";
  document.getElementById("fileName").textContent = data.fileName;
  document.getElementById("fileMeta").textContent =
    `${size(data.size)} · Image ID: ${data.imageId}`;
  if (data.thumb)
    document.getElementById("thumb").innerHTML =
      `<img src="${data.thumb}" alt="Uploaded image">`;

  const plan = [
    [0, 1200],
    [700, 2400],
    [900, 2800],
    [2800, 3600],
    [3600, 4400],
  ];
  const total = 4400;
  const rows = [...document.querySelectorAll("#steps li")];
  const bar = document.getElementById("bar");
  const t0 = Date.now();

  const timer = setInterval(() => {
    const t = Date.now() - t0;
    rows.forEach((li, i) => {
      const [s, e] = plan[i];
      const state = t >= e ? "done" : t >= s ? "running" : "waiting";
      li.className = state;
      li.lastElementChild.textContent =
        state === "done"
          ? "Done"
          : state === "running"
            ? "Running…"
            : "Waiting";
    });
    bar.style.width = Math.min(100, (t / total) * 100) + "%";
    if (t >= total + 400) {
      clearInterval(timer);
      sessionStorage.setItem("d2sr-result", JSON.stringify(data));
      location.href = "../result/result.html";
    }
  }, 100);
}
