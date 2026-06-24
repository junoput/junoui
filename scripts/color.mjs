// ════════════════════════════════════════════════════════════════════════
//  junoui — color conversion (shared by the build and the doc generator)
// ════════════════════════════════════════════════════════════════════════
//  Dependency-free OKLCH → sRGB hex using Björn Ottosson's OKLab math.
//  Web keeps authored oklch(); native targets and docs use the hex here.
// ════════════════════════════════════════════════════════════════════════

export function oklchToHex(str) {
  const m = /oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)/i.exec(str);
  if (!m) return null;
  let L = parseFloat(m[1]);
  if (str.includes('%')) L /= 100;
  const C = parseFloat(m[2]);
  const h = (parseFloat(m[3]) * Math.PI) / 180;
  const a = C * Math.cos(h),
    b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3,
    mm = m_ ** 3,
    s = s_ ** 3;

  const r = +4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s;

  const toByte = (x) => {
    const c = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(c * 255)));
  };
  const hex = (n) => n.toString(16).padStart(2, '0');
  return ('#' + hex(toByte(r)) + hex(toByte(g)) + hex(toByte(bl))).toUpperCase();
}

// Any authored color → hex (#hex passes through, uppercased).
export const toHex = (v) => (v.startsWith('#') ? v.toUpperCase() : (oklchToHex(v) ?? '#000000'));
