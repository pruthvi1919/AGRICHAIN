// Simple English → Hindi phonetic mapping
const map = {
  a: "अ", aa: "आ", i: "इ", ee: "ई", u: "उ", oo: "ऊ",
  e: "ए", ai: "ऐ", o: "ओ", au: "औ",
  k: "क", kh: "ख", g: "ग", gh: "घ",
  ch: "च", j: "ज", t: "ट", th: "ठ",
  d: "ड", dh: "ढ", n: "न", p: "प",
  ph: "फ", b: "ब", bh: "भ", m: "म",
  y: "य", r: "र", l: "ल", v: "व",
  s: "स", h: "ह"
};

export function toHindi(text) {
  if (!text) return "";

  let lower = text.toLowerCase();
  let result = "";

  let i = 0;
  while (i < lower.length) {
    // check 2-letter matches
    const pair = lower.slice(i, i + 2);
    if (map[pair]) {
      result += map[pair];
      i += 2;
      continue;
    }

    // check 1-letter
    const single = lower[i];
    result += map[single] || lower[i];
    i++;
  }

  return result;
}
