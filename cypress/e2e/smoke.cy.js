/// <reference types="cypress" />

const disableSmoothScroll = () => {
  cy.document().then((document) => {
    const node = document.createElement("style");
    node.innerHTML = "html { scroll-behavior: inherit !important; }";
    document.body.appendChild(node);
  });
};

describe("Smoke", () => {
  it("Visit all pages", () => {
    cy.get("html").invoke("attr", "style", "scroll-behavior: inherit");

    cy.visit("/");
    disableSmoothScroll();
    cy.get("h1#muhammad-rehan-saeed").should("be.visible");

    cy.get("nav").contains("Portfolio").click();
    cy.get("h1#portfolio").should("be.visible");

    cy.get("nav").contains("About").click();
    cy.get("h1#about").should("be.visible");

    cy.get("nav").contains("Blog").click();
    cy.get("h1#muhammad-rehan-saeed").should("be.visible");

    cy.get(".post-card__title").first().click();
    cy.get(".post-page__title-container").should("be.visible");

    cy.get(".tags__link").first().click();
    cy.get("h1").should("contain", "#");
  });

  it("404 Page", () => {
    cy.visit("/this-does-not-exist");
    cy.get("h1").contains("404 Not Found").should("be.visible");
  });
});
