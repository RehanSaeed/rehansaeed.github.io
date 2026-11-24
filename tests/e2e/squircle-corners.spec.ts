import sharp from "sharp";
import { expect, test } from "./fixtures";

test("shared corners use compensated squircles with a rounded fallback", async ({
  page,
}) => {
  await page.goto("/");

  const card = page.locator(".post-card").first();
  const header = card.locator(".post-card__header");
  const tag = card.locator(".link-button--tag").first();
  await expect(card).toBeVisible();
  await expect(header).toBeVisible();
  await expect(tag).toBeVisible();

  const styles = await card.evaluate((element) => {
    const root = getComputedStyle(document.documentElement);
    const cardStyle = getComputedStyle(element);
    const headerStyle = getComputedStyle(
      element.querySelector(".post-card__header")!,
    );
    const shadowStyle = getComputedStyle(element, "::before");
    const tagStyle = getComputedStyle(
      element.querySelector(".link-button--tag")!,
    );
    const supported = CSS.supports("corner-shape", "squircle");
    const probe = document.createElement("div");
    probe.style.setProperty("corner-shape", "squircle");
    document.body.append(probe);
    const expectedShape =
      getComputedStyle(probe).getPropertyValue("corner-shape");
    probe.remove();
    return {
      supported,
      expectedShape,
      radius: Number.parseFloat(cardStyle.borderTopLeftRadius),
      rootFontSize: Number.parseFloat(root.fontSize),
      headerRadius: Number.parseFloat(headerStyle.borderTopLeftRadius),
      tagRadius: Number.parseFloat(tagStyle.borderTopRightRadius),
      cardShape: cardStyle.getPropertyValue("corner-shape"),
      headerShape: headerStyle.getPropertyValue("corner-shape"),
      shadowShape: shadowStyle.getPropertyValue("corner-shape"),
      tagShape: tagStyle.getPropertyValue("corner-shape"),
    };
  });

  expect(styles.radius).toBeCloseTo(
    styles.rootFontSize * (styles.supported ? 1.625 : 0.875),
    2,
  );
  expect(styles.tagRadius).toBeCloseTo(
    styles.rootFontSize * (styles.supported ? 0.625 : 0.3125),
    2,
  );
  expect(styles.radius).toBeGreaterThan(styles.tagRadius);
  expect(styles.headerRadius).toBeCloseTo(styles.radius, 2);
  expect(styles.cardShape).toBe(styles.expectedShape);
  expect(styles.headerShape).toBe(styles.expectedShape);
  expect(styles.shadowShape).toBe(styles.expectedShape);
  expect(styles.tagShape).toBe(styles.expectedShape);

  // Isolate the real card's paint to compare its corner against a circular one.
  await page.addStyleTag({
    content: `
      .squircle-test-card {
        background: black !important;
        box-shadow: none !important;
        transform: none !important;
        translate: none !important;
        transition: none !important;
      }
      .squircle-test-card::before { display: none !important; }
      .squircle-test-card > * { visibility: hidden !important; }
    `,
  });
  await card.evaluate((element) => {
    element.classList.add("squircle-test-card");
  });
  const squircle = await card.screenshot({ animations: "disabled" });
  await card.evaluate((element) => {
    element.style.setProperty("corner-shape", "round");
  });
  const round = await card.screenshot({ animations: "disabled" });
  const corner = { left: 0, top: 0, width: 16, height: 16 };
  const squirclePixels = await sharp(squircle).extract(corner).raw().toBuffer();
  const roundPixels = await sharp(round).extract(corner).raw().toBuffer();
  expect(squirclePixels.equals(roundPixels)).toBe(!styles.supported);
});
