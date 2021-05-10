---
title: "Code Coverage & Frontend Testing"
description: "What is the correct level of code coverage for your project and what tools are best for quickly writing unit and integration tests for a frontend application."
author: "Muhammad Rehan Saeed"
permalink: "/code-coverage-and-frontend-testing/"
heroImage: "/images/hero/Jest-Cypress-1600x900.png"
date: "2021-05-10T11:23:00Z"
dateModified: null
published: true
categories:
    - "Testing"
tags:
    - "Unit Testing"
    - "Integration Testing"
    - "Code Coverage"
    - "Jest"
    - "Cypress"
---

I was recently asked an interesting question about unit test code coverage and frontend testing by a colleague:

> Policies describe 80% plus unit test coverage and our React devs are pushing back a lot, arguing there is little logic in React and it would be a wast of time.
> Rehan any advice/pointer for us on this?

Code coverage in tests is always a controversial topic with developers in which I don't think there is a 'correct' answer. The answer you're going to get from most people is 'it depends' 🤷🏼.

If you're developing a mars rover where one bad line of code could mean mission over or flight navigation software, go ahead and go for 100% code coverage, let alone 80%. The question is, how tolerant are you to the risk of a bug in the front end React code? If something doesn't work, how long will it take you to fix it and how much will that cost you versus the cost of writing extra tests?

# Jest

Specifically regarding frontend unit testing, my team has been using [Jest](https://jestjs.io/) which is an excellent unit testing framework built by Facebook which I highly recommend. Jest is special because it's a single NPM package with everything you need rolled into it, including an assertion library, mocking framework and code coverage tools.

To reduce the burden of writing tests you can leverage snapshot testing. A snapshot test takes very few lines of code to write and generates a file containing the rendered HTML for a Vue/React/Angular/Web/Other component. My team writes at least one snapshot test for every component we write and it hasn't been too onerous for us.

I just ran the code coverage tool built into Jest on one of our projects and it came to 78.7% coverage. It's worth mentioning that our projects are mostly very simple and don't contain much complex branching logic. Jest also allows you to set a code coverage limit which will fail a build if code coverage drops below a certain level set by you. Here is an example of configuring Jest that in your `package.json` file to do just that:

```json
"jest": {
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": -10
    }
  }
}
```

# Cypress

In addition, if you want a robust system, it's also worth setting up some integration or functional tests. I recommend a tool called [Cypress](https://www.cypress.io/) for this job. According to the testing pyramid you need fewer of these tests as compared to unit tests as they can be more brittle.

![Testing Pyramid showing UI, Service and Unit Tests in that order](./images/Test-Pyramid-800x400.png)

I've found them very useful for making sure that you don't release something completely broken (happens more often in the wild than any dev would like you to think). In fact, I use Cypress for this very blog to verify every commit to make sure I don't accidentally break it.
