/// <reference types="cypress" />

describe("Smoke", () => {
  it("Open search", () => {
    cy.visit("/");
    cy.get("nav").contains("Search").click();

    cy.get("input#search").should("be.visible");
  });

  it("Close search", () => {
    cy.visit("/");
    cy.get("nav").contains("Search").click();
    cy.get("button.dialog__close").click();

    cy.get("input#search").should("not.be.visible");
  });

  it("Search portfolio", () => {
    cy.visit("/");
    cy.get("nav").contains("Search").click();
    cy.get("input#search").type("Schema.NET");

    cy.get(".search-result__link")
      .first()
      .should("have.attr", "href", "https://github.com/RehanSaeed/Schema.NET");
  });

  it("Search post", () => {
    cy.visit("/");
    cy.get("nav").contains("Search").click();
    cy.get("input#search").type("ASP.NET");
    cy.get(".search-result__link").first().click();

    cy.get("input#search").should("not.be.visible");
  });
});
