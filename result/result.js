const r = JSON.parse(sessionStorage.getItem("d2sr-result") || "null");
if (!r) location.replace("../home/index.html");
const $ = (id) => document.getElementById(id);

if (r) {
  const toneOf = (v, lo, mid) => (v < lo ? "good" : v < mid ? "warn" : "bad");
  const say = (m) => {
    const t = $("toast");
    t.textContent = m;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 1800);
  };

  /* ---- header + facts ---- */
  $("fileName").textContent = r.fileName;
  document.title = "D²SR | " + r.fileName;
  if (r.thumb) $("previewImg").src = r.thumb;
  $("fTime").innerHTML =
    r.timestamp.slice(0, 10) + "<br>" + r.timestamp.slice(11, 23);
  $("fHash").textContent =
    "SHA-256 " + r.hash.slice(0, 8) + "…" + r.hash.slice(-4);
  $("fC2pa").textContent = r.hasC2pa ? "Manifest found" : "No manifest found";
  const v = $("verdict");
  v.textContent = (r.tone === "good" ? "✓ " : "! ") + r.verdict;
  v.className = "chip mono " + (r.tone === "good" ? "" : r.tone);

  /* ---- trust ring ---- */
  requestAnimationFrame(() => {
    $("ringBar").style.strokeDashoffset = 326.7 * (1 - r.trust / 100);
  });
  const t0 = performance.now();
  (function tick(t) {
    const p = Math.min((t - t0) / 1400, 1);
    $("scoreNum").textContent = Math.round(r.trust * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  })(t0);

  /* ---- metric cards ---- */
  function metric(val, bar, tag, value, tone, label) {
    $(val).textContent = value + "%";
    $(bar).className = tone;
    $(bar).style.width = value + "%";
    $(tag).className = "tag " + tone;
    $(tag).textContent = label;
  }
  const aiT = toneOf(r.aiGen, 20, 50),
    tamT = toneOf(r.tampered, 15, 40);
  metric(
    "vAi",
    "bAi",
    "tAi",
    r.aiGen,
    aiT,
    aiT === "good" ? "Low risk" : aiT === "warn" ? "Medium" : "High risk",
  );
  metric(
    "vTam",
    "bTam",
    "tTam",
    r.tampered,
    tamT,
    tamT === "good" ? "Clean" : tamT === "warn" ? "Edited" : "Tampered",
  );
  const rT = r.real >= 75 ? "good" : r.real >= 50 ? "warn" : "bad";
  metric(
    "vReal",
    "bReal",
    "tReal",
    r.real,
    rT,
    rT === "good" ? "Verified" : rT === "warn" ? "Unclear" : "Doubtful",
  );
  const tT = r.trust >= 75 ? "good" : r.trust >= 50 ? "warn" : "bad";
  metric(
    "vTrust",
    "bTrust",
    "tTrust",
    r.trust,
    tT,
    tT === "good" ? "Optimal" : tT === "warn" ? "Review" : "Low",
  );

  /* ---- radar ---- */
  function drawRadar() {
    const cx = 150,
      cy = 105,
      R = 80;
    const ang = [-90, 30, 150].map((d) => (d * Math.PI) / 180);
    const pt = (i, f) => [
      cx + R * f * Math.cos(ang[i]),
      cy + R * f * Math.sin(ang[i]),
    ];
    const poly = (f) => [0, 1, 2].map((i) => pt(i, f).join(",")).join(" ");
    let h = "";
    [0.25, 0.5, 0.75, 1].forEach(
      (f) => (h += `<polygon class="web" points="${poly(f)}"/>`),
    );
    [0, 1, 2].forEach(
      (i) =>
        (h += `<line class="web" x1="${cx}" y1="${cy}" x2="${pt(i, 1)[0]}" y2="${pt(i, 1)[1]}"/>`),
    );
    const vals = [r.real, r.tampered, r.aiGen].map((x) => Math.max(x, 2) / 100);
    h += `<polygon class="area" points="${vals.map((x, i) => pt(i, x).join(",")).join(" ")}"/>`;
    h += `<text x="${cx}" y="${cy - R - 10}" text-anchor="middle">REAL (${r.real}%)</text>`;
    h += `<text x="${pt(1, 1)[0] + 6}" y="${pt(1, 1)[1] + 16}" text-anchor="end">TAMPERED (${r.tampered}%)</text>`;
    h += `<text x="${pt(2, 1)[0] - 6}" y="${pt(2, 1)[1] + 16}" text-anchor="start">AI GEN (${r.aiGen}%)</text>`;
    $("radar").innerHTML = h;
  }
  drawRadar();

  /* ---- log ---- */
  $("log").textContent = `FILE.name ........ ${r.fileName}
FILE.type ........ ${r.type}
FILE.size ........ ${r.size} bytes
DIMENSIONS ....... ${r.width} x ${r.height} px
SHA-256 .......... ${r.hash}
EXIF ............. ${r.hasExif ? "present" : "not found"}
C2PA manifest .... ${r.hasC2pa ? "marker found" : "not found"}
Editing software . ${r.editor || "none detected in metadata"}
AI-tool metadata . ${r.aiTool || "none detected"}
Analyzed at ...... ${r.timestamp} UTC

Note: hash, EXIF, C2PA and metadata checks are real.
AI / tamper percentages come from the demo heuristic in
analysis.js — connect the backend model for real scores.`;

  const acc = $("acc");
  acc.addEventListener("click", () => {
    const open = acc.getAttribute("aria-expanded") === "true";
    acc.setAttribute("aria-expanded", String(!open));
    $("log").hidden = open;
  });

  /* ---- buttons ---- */
  const report = () => {
    const { thumb, ...rest } = r;
    return rest;
  };
  $("saveBtn").onclick = () => {
    try {
      const list = JSON.parse(
        localStorage.getItem("d2sr-saved") || "[]",
      ).filter((x) => x.imageId !== r.imageId);
      list.unshift(report());
      localStorage.setItem("d2sr-saved", JSON.stringify(list.slice(0, 50)));
      say("Report saved");
    } catch (e) {
      say("Could not save");
    }
  };
  $("shareBtn").onclick = async () => {
    const txt = `D²SR report — ${r.fileName}: ${r.verdict}, trust ${r.trust}% (AI ${r.aiGen}%, tampered ${r.tampered}%), SHA-256 ${r.hash.slice(0, 16)}…`;
    try {
      await navigator.clipboard.writeText(txt);
      say("Summary copied");
    } catch (e) {
      say("Copy failed");
    }
  };
  const menu = $("exportMenu");
  $("exportBtn").onclick = (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  };
  document.addEventListener("click", () => (menu.hidden = true));
  menu.addEventListener("click", (e) => {
    const f = e.target.dataset.fmt;
    if (!f) return;
    if (f === "print") return window.print();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(report(), null, 2)], {
        type: "application/json",
      }),
    );
    a.download = r.fileName + ".report.json";
    a.click();
    say("Exported JSON");
  });
}
