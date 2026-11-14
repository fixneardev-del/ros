// Contrast audit for the signed-in dashboards.
//
// Paste into the browser console, or run through the browse daemon:
//   browse js "$(cat scripts/contrast-audit.js)"
//
// It walks every visible text node, works out the effective background by
// walking up the tree, and reports anything under the WCAG AA threshold for
// its size. Large text (24px, or 18.66px bold) needs 3:1; everything else
// needs 4.5:1.

(() => {
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const parse = (value) =>
    (value.match(/[\d.]+/g) || []).slice(0, 4).map(Number);

  const backgroundOf = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const color = getComputedStyle(node).backgroundColor;
      const parts = parse(color);
      if (color && !color.includes("rgba(0, 0, 0, 0)") && (parts.length < 4 || parts[3] > 0.9)) {
        return parts;
      }
      node = node.parentElement;
    }
    return [255, 255, 255];
  };

  const ratio = (fg, bg) => {
    const a = lum(fg);
    const b = lum(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };

  const failures = [];
  const seen = new Set();

  const selector =
    "p,span,a,h1,h2,h3,h4,h5,h6,li,td,th,dt,dd,button,label,summary,strong,small,legend,figcaption";

  document.querySelectorAll(selector).forEach((el) => {
    const text = el.textContent.trim();
    if (!text) return;
    if (el.children.length > 0 && !el.matches("a,button,summary,label")) return;

    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") return;
    if (parseFloat(cs.opacity) < 0.9) return;

    const fg = parse(cs.color);
    if (fg.length < 3) return;

    const bg = backgroundOf(el);
    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    const score = ratio(fg, bg);

    const key = `${cs.color}|${bg.join(",")}|${Math.round(size)}`;
    if (score < need && !seen.has(key)) {
      seen.add(key);
      failures.push({
        text: text.slice(0, 40),
        color: cs.color,
        bg: `rgb(${bg.join(",")})`,
        size,
        ratio: Number(score.toFixed(2)),
        need,
      });
    }
  });

  return JSON.stringify(failures, null, 2);
})();
