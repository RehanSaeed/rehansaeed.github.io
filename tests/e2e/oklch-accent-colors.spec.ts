import { expect, test } from "./fixtures";

const readGamut = (color: string) => {
  const components = color.match(
    /^oklch\(([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\)$/,
  );
  if (!components) {
    throw new Error(`Expected an OKLCH colour, received ${color}`);
  }
  const lightness = Number(components[1]) / (components[2] ? 100 : 1);
  const chroma = Number(components[3]);
  const hue = (Number(components[4]) * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const red = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const green = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const blue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  // Convert linear sRGB to linear Display P3 without clamping either gamut.
  return {
    luminance: 0.2126 * red + 0.7152 * green + 0.0722 * blue,
    srgb: [red, green, blue],
    p3: [
      0.8224619687 * red + 0.1775380313 * green,
      0.0331941989 * red + 0.9668058011 * green,
      0.0170826307 * red + 0.0723974407 * green + 0.9105199286 * blue,
    ],
  };
};

test("Uses valid OKLCH accent tokens where supported", async ({ page }) => {
  await page.goto("/");
  const accents = await page.evaluate(() => {
    const root = document.documentElement;
    root.dataset.theme = "light";
    const light = getComputedStyle(root)
      .getPropertyValue("--global-accent-color")
      .trim();
    root.dataset.theme = "dark";
    const dark = getComputedStyle(root)
      .getPropertyValue("--global-accent-color")
      .trim();
    return {
      supportsOklch: CSS.supports("color", "oklch(0.5 0.1 290)"),
      lightValid: CSS.supports("color", light),
      darkValid: CSS.supports("color", dark),
      light,
      dark,
    };
  });

  expect(accents.light).not.toBe(accents.dark);
  expect(accents.lightValid).toBe(true);
  expect(accents.darkValid).toBe(true);
  expect(accents.light.startsWith("oklch(")).toBe(accents.supportsOklch);
  expect(accents.dark.startsWith("oklch(")).toBe(accents.supportsOklch);
});

test("Wide-gamut accents extend beyond sRGB only on P3 displays", async ({
  page,
}) => {
  await page.goto("/");
  const palettes = await page.evaluate(() => {
    const root = document.documentElement;
    const mediaRules: CSSMediaRule[] = [];
    const collect = (rules: CSSRuleList) => {
      for (const rule of rules) {
        if (
          rule instanceof CSSMediaRule &&
          rule.conditionText.includes("color-gamut: p3")
        ) {
          mediaRules.push(rule);
        }
        if (rule instanceof CSSGroupingRule) {
          collect(rule.cssRules);
        }
      }
    };
    for (const sheet of document.styleSheets) {
      collect(sheet.cssRules);
    }
    const originalMedia = mediaRules.map((rule) => rule.media.mediaText);
    const originalTheme = root.dataset.theme;
    const read = () => {
      const styles = getComputedStyle(root);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas colour conversion is unavailable");
      }
      context.fillStyle = styles.getPropertyValue("--global-background-color");
      context.fillRect(0, 0, 1, 1);
      const channels = Array.from(context.getImageData(0, 0, 1, 1).data)
        .slice(0, 3)
        .map((channel) => {
          const value = channel / 255;
          return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
        });
      return {
        backgroundLuminance:
          0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!,
        accent: styles.getPropertyValue("--global-accent-color").trim(),
        alternate: styles
          .getPropertyValue("--global-alternate-accent-color")
          .trim(),
        link: styles.getPropertyValue("--global-link-color").trim(),
        selection: styles
          .getPropertyValue("--global-selection-background-color")
          .trim(),
      };
    };
    try {
      // Exercise both CSS branches on every browser, independent of test hardware.
      return {
        mediaRuleCount: mediaRules.length,
        themes: ["light", "dark"].map((theme) => {
          mediaRules.forEach((rule, index) => {
            rule.media.mediaText = originalMedia[index]!;
          });
          root.dataset.theme = theme;
          const native = read();
          for (const rule of mediaRules) {
            rule.media.mediaText = "not all";
          }
          const srgb = read();
          for (const rule of mediaRules) {
            rule.media.mediaText = "all";
          }
          const p3 = read();
          const expected = matchMedia("(color-gamut: p3)").matches ? p3 : srgb;
          return { srgb, p3, nativeMatches: native.accent === expected.accent };
        }),
      };
    } finally {
      mediaRules.forEach((rule, index) => {
        rule.media.mediaText = originalMedia[index]!;
      });
      if (originalTheme === undefined) {
        delete root.dataset.theme;
      } else {
        root.dataset.theme = originalTheme;
      }
    }
  });

  expect(palettes.mediaRuleCount).toBeGreaterThan(0);
  for (const { srgb, p3, nativeMatches } of palettes.themes) {
    expect(nativeMatches).toBe(true);
    expect(p3.accent).not.toBe(srgb.accent);
    expect(p3.link).toBe(p3.accent);
    expect(p3.selection).toBe(p3.accent);
    const luminance = readGamut(p3.link).luminance;
    const contrast =
      (Math.max(luminance, p3.backgroundLuminance) + 0.05) /
      (Math.min(luminance, p3.backgroundLuminance) + 0.05);
    expect(contrast).toBeGreaterThanOrEqual(4.5);
    for (const color of [srgb.accent, srgb.alternate]) {
      for (const channel of readGamut(color).srgb) {
        expect(channel).toBeGreaterThanOrEqual(-0.0001);
        expect(channel).toBeLessThanOrEqual(1.0001);
      }
    }
    for (const color of [p3.accent, p3.alternate]) {
      const gamut = readGamut(color);
      expect(
        gamut.srgb.some((channel) => channel < -0.0001 || channel > 1.0001),
      ).toBe(true);
      for (const channel of gamut.p3) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(1);
      }
    }
  }
});
