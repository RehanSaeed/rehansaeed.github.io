---
title: "Writing your Webpack configuration in TypeScript"
description: "Learn how to write your Webpack configuration file using TypeScript to get intellisense and how to exclude Webpack 1 syntax from your TypeScript typings."
author: "Muhammad Rehan Saeed"
permalink: "/writing-your-webpack-configuration-in-typescript/"
heroImage: "/images/hero/TypeScript-1366x768.png"
date: "2018-01-03"
dateModified: null
published: true
categories:
  - "Front End"
tags:
  - "JavaScript"
  - "ParcelJS"
  - "TypeScript"
  - "Webpack"
---

# Webpack Configuration is a Mess

::: warning
Before you get the wrong idea, let me say that Webpack is a super powerful, it's what you probably should be using these days to deal with static assets and I like its power...
:::

However, Webpack configuration files are write once software, they are a mess, a complete and utter mess. There, I said it. It has a steep learning curve and plenty of magic. What's worse is that Webpack makes it intentionally harder than it needs to be. If you look online at examples, even in the Webpack docs themselves, you'll see a dozen examples that look completely different, this is for two reasons:

1. In its wisdom, Webpack decided it was a good idea to provide lots of different ways to configure it. There are four, yes four different ways to configure a rule and another four to configure a loader.
2. When Webpack 2 came out, they significantly changed the configuration syntax. They didn't want to make breaking changes, so they supported Webpack 1 and 2 syntax together.

What you ended up with is eight ways to configure a rule or loader, which is insane.

# ParcelJS

I'm going off on a tangent here but there is a new module bundler in development called [ParcelJS](https://parceljs.org/) which has support for JavaScript, HTML, CSS, SASS and images built in from the start with zero configuration! Adding Babel, TypeScript or Autoprefixer is also much easier with no need to configure Parcel to work with them.

Unfortunately, it's not ready for prime time yet as it is lacking support for source maps, multiple entry points, code splitting and Vue components. I have high hopes for ParcelJS in the future!

# Why TypeScript?

Happily, as I'll show below TypeScript can help you to completely avoid Webpack 1 syntax. Secondly, if you're already writing your application using TypeScript, then often the only JavaScript files you have left in your project end up being the Webpack configuration files. Converting Webpack configuration to TypeScript removes the need to switch context and switch between languages.

# How is it done?

It turns out that Webpack [supports](https://webpack.js.org/configuration/configuration-languages/) the use of TypeScript itself. However, the supported method requires you to add a couple of NPM packages as a dependency and you will not be able to use ES 2015 module syntax in your configuration file because it's not supported.

In my opinion, a much simpler and cleaner way is to use the TypeScript tsc command line tool to transpile TypeScript to JavaScript before running Webpack. You could add this command as a simple NPM script in your package.json file. Here are the commands you need to use:

```powershell
tsc --lib es6 webpack.config.ts
webpack --config webpack.config.js
```

Webpack does not come with TypeScript typings, so you'll also need to install the `@types/webpack` NPM package. Finally, to remove all Webpack 1 syntax, you need to create some new types extending the Webpack types, which remove the Webpack 1 syntax, I stuck all of these typings in a `webpack.common.ts` file:

```ts
import * as webpack from "webpack";

// Remove the Old Webpack 1 types to ensure that we are only using Webpack 2 syntax.

export type INewLoader = string | webpack.NewLoader;

export interface INewLoaderRule extends webpack.NewLoaderRule {
  loader: INewLoader;
  oneOf?: INewRule[];
  rules?: INewRule[];
}

export interface INewUseRule extends webpack.NewUseRule {
  oneOf?: INewRule[];
  rules?: INewRule[];
  use: INewLoader | INewLoader[];
}

export interface INewRulesRule extends webpack.RulesRule {
  oneOf?: INewRule[];
  rules: INewRule[];
}

export interface INewOneOfRule extends webpack.OneOfRule {
  oneOf: INewRule[];
  rules?: INewRule[];
}

export type INewRule = INewLoaderRule | INewUseRule | INewRulesRule | INewOneOfRule;

export interface INewModule extends webpack.NewModule {
  rules: INewRule[];
}

export interface INewConfiguration extends webpack.Configuration {
  module?: INewModule;
}

export interface IArguments {
  prod: boolean;
}

export type INewConfigurationBuilder = (env: IArguments) => INewConfiguration;
```

You can then use these types in your Webpack configuration:

```ts
import * as path from "path";
import * as webpack from "webpack";
import { INewConfiguration } from "./webpack.common";

const configuration: INewConfiguration = {
  // ...
};
export default configuration;
```

Or you can also pass arguments to your webpack configuration file like so:

```ts
import * as path from "path";
import * as webpack from "webpack";
import { IArguments, INewConfiguration, INewConfigurationBuilder } from "./webpack.common";

const configurationBuilder: INewConfigurationBuilder = 
  (env: IArguments): INewConfiguration => {
    const isDevBuild = !(env && env.prod);
    const configuration: INewConfiguration = {
      // ...
    };
    return configuration;
  };
export default configurationBuilder;
```

In this case, you can pass arguments to the webpack configuration file like so:

```powershell
> webpack --env.prod
```

# Conclusion

I think most people have huge trouble getting to grips with Webpack, once you understand that there are so many ways to supply the same config and how to translate between them, the learning curve gets shallower. You will be able to translate all of the examples you see online that inevitably are using a different syntax to you, so you can 'borrow' (It's what us software developers do for much of the day) their code and get stuff done.
