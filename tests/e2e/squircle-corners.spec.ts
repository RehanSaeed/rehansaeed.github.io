import { expect, test } from "./fixtures";

const expectedShape = (supported: boolean) => (supported ? "squircle" : "");

test("shared corners use compensated squircles with a rounded fallback", async ({
  page,
}) => {
  await page.goto("/");

  const card = page.locator(".post-card").first();
  const header = card.locator(".post-card__header");
  await expect(card).toBeVisible();
  await expect(header).toBeVisible();

  const styles = await card.evaluate((element) => {
    const root = getComputedStyle(document.documentElement);
    const cardStyle = getComputedStyle(element);
    const headerStyle = getComputedStyle(
      element.querySelector(".post-card__header")!,
    );
    const shadowStyle = getComputedStyle(element, "::before");
    const supported = CSS.supports("corner-shape", "squircle");
    return {
      supported,
      radius: Number.parseFloat(cardStyle.borderTopLeftRadius),
      rootFontSize: Number.parseFloat(root.fontSize),
      headerRadius: Number.parseFloat(headerStyle.borderTopLeftRadius),
      cardShape: cardStyle.getPropertyValue("corner-shape"),
      headerShape: headerStyle.getPropertyValue("corner-shape"),
      shadowShape: shadowStyle.getPropertyValue("corner-shape"),
    };
  });

  const originalRadius = styles.rootFontSize * 0.3057325;
  expect(styles.radius).toBeCloseTo(
    originalRadius * (styles.supported ? 1.84 : 1),
    2,
  );
  expect(styles.headerRadius).toBeCloseTo(styles.radius, 2);
  expect(styles.cardShape).toBe(expectedShape(styles.supported));
  expect(styles.headerShape).toBe(expectedShape(styles.supported));
  expect(styles.shadowShape).toBe(expectedShape(styles.supported));

  // Isolate the real card's paint to compare its corner against a circular one.
  await page.addStyleTag({
    content: `
      .post-card:first-child {
        background: black !important;
        box-shadow: none !important;
        transform: none !important;
        translate: none !important;
      }
      .post-card:first-child > * { visibility: hidden !important; }
    `,
  });
  const squircle = await card.screenshot({ animations: "disabled" });
  await card.evaluate((element) => {
    element.style.setProperty("corner-shape", "round");
  });
  const round = await card.screenshot({ animations: "disabled" });
  expect(squircle.equals(round)).toBe(!styles.supported);
});
