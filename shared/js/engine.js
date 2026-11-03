
   /* D²SR analysis engine (client-side DEMO) */
   
window.D2SR = {
  async analyze(file) {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const text = new TextDecoder("latin1").decode(bytes);
    const head = text.slice(0, 131072);

    const hash = await sha256(buf);
    const hasExif = /Exif\0\0|eXIf/.test(head);
    const hasC2pa = /c2pa|jumbf|jumb/i.test(text);
    const editor = (head.match(
      /Photoshop|Lightroom|GIMP|Snapseed|Canva|Pixlr|Paint\.NET/i,
    ) || [null])[0];
    const aiTool = (head.match(
      /Midjourney|Stable Diffusion|DALL[-·\s]?E|Firefly|ComfyUI|NovelAI|Sampler:|Negative prompt/i,
    ) || [null])[0];

    const dim = await measure(file);
    const seedA = parseInt(hash.slice(0, 8), 16);
    const seedB = parseInt(hash.slice(8, 16), 16);

    let aiGen = aiTool ? 88 + (seedA % 10) : 4 + (seedA % 7);
    let tampered = editor ? 38 + (seedB % 28) : 1 + (seedB % 4);
    if (!hasExif && !hasC2pa && !aiTool) aiGen += 12;
    if (hasC2pa) {
      aiGen = Math.max(1, aiGen - 3);
      tampered = Math.max(1, tampered - 1);
    }
    aiGen = Math.min(99, aiGen);
    tampered = Math.min(99, tampered);

    const real = Math.max(1, Math.round(100 - aiGen * 0.9 - tampered * 0.6));
    const trust = Math.round((real + (100 - aiGen) + (100 - tampered)) / 3);

    let verdict = "Authentic",
      tone = "good";
    if (aiGen >= 50) {
      verdict = "AI Generated";
      tone = "bad";
    } else if (tampered >= 30) {
      verdict = "Tampered";
      tone = "warn";
    } else if (trust < 75) {
      verdict = "Suspicious";
      tone = "warn";
    }

    return {
      fileName: file.name,
      size: file.size,
      type: file.type || "unknown",
      width: dim.width,
      height: dim.height,
      thumb: dim.thumb,
      hash,
      hasExif,
      hasC2pa,
      editor,
      aiTool,
      aiGen,
      tampered,
      real,
      trust,
      verdict,
      tone,
      timestamp: new Date().toISOString().replace("T", " ").replace("Z", ""),
      imageId: "img-" + hash.slice(0, 8),
    };
  },
  formatSize(b) {
    return b < 1024
      ? b + " bytes"
      : b < 1048576
        ? (b / 1024).toFixed(1) + " KB"
        : (b / 1048576).toFixed(1) + " MB";
  },
};

async function sha256(buf) {
  try {
    const d = await crypto.subtle.digest("SHA-256", buf);
    return [...new Uint8Array(d)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
  } catch (e) {
    // fallback if crypto.subtle is unavailable
    let h = 2166136261 >>> 0;
    const u = new Uint8Array(buf);
    for (let i = 0; i < u.length; i += 7)
      h = Math.imul(h ^ u[i], 16777619) >>> 0;
    return h.toString(16).padStart(8, "0").repeat(8);
  }
}

function measure(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file),
      img = new Image();
    img.onload = () => {
      const k = Math.min(1, 900 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve({
        width: img.width,
        height: img.height,
        thumb: c.toDataURL("image/jpeg", 0.82),
      });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => resolve({ width: 0, height: 0, thumb: "" });
    img.src = url;
  });
}
