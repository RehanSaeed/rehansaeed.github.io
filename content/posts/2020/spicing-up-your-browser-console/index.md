---
title: "Spicing up your Browser Console"
description: "Use figlet fonts, ASCII art and browser console themes to spice up your browser console."
author: "Muhammad Rehan Saeed"
permalink: "/spicing-up-your-browser-console/"
heroImage: "/images/hero/Figlet-Fonts-1600x900.png"
date: "2020-06-10T18:00:00Z"
dateModified: null
published: true
categories:
  - "JavaScript"
tags:
  - "ASCII Art"
  - "Figlet Font"
  - "Browser"
  - "Console"
  - "JavaScript"
---

Wouldn't it be cool if when you opened the browser console up on a site, you saw a cool secret message? There are many sites that do this with quite a few business's advertising frontend development jobs in this way. I wanted to join in on the fun, so...I did. Here is my story of two hours I'm not getting back.

I've done some work on [Colorful.Console](/colorful-console/) which is an amazing C# console library that lets you write text in ASCII art using [figlet fonts](https://en.wikipedia.org/wiki/FIGlet). I wanted to do the same for my blog. I was too lazy to use Colorful.Console and used a random [online generator](https://www.askapache.com/online-tools/figlet-ascii/) I found. I tried a couple of different fonts out and came up with this JavaScript code:

```js
const consoleOptions = 'background: #ffffff; color: #6b17e8';

// Standard Figlet Font
console.log('%c  ____      _                 ', consoleOptions);
console.log('%c |  _ \\ ___| |__   __ _ _ __  ', consoleOptions);
console.log('%c | |_) / _ \\ '_ \\ / _` | '_ \\ ', consoleOptions);
console.log('%c |  _ <  __/ | | | (_| | | | |', consoleOptions);
console.log('%c |_| \\_\\___|_| |_|\\__,_|_| |_|', consoleOptions);

// o8 Figlet Font
console.log('%c oooooooooo             oooo                              ', consoleOptions);
console.log('%c  888    888 ooooooooo8  888ooooo    ooooooo   oo oooooo  ', consoleOptions);
console.log('%c  888oooo88 888oooooo8   888   888   ooooo888   888   888 ', consoleOptions);
console.log('%c  888  88o  888          888   888 888    888   888   888 ', consoleOptions);
console.log('%c o888o  88o8  88oooo888 o888o o888o 88ooo88 8o o888o o888o', consoleOptions);
```

For the standard font, I had to escape quite a few characters using a back slash `\`, so watch out for that. The results in a browser console were pretty terrible and hard to read...

![My name rendered in ASCII art using a figlet font](./images/First-Try-723x427.png)

Notice that I passed options to the `console.log` API to set the background and foreground colour of the text. The Chrome browser adds a lot of space between lines and the font just looks a little anaemic and hard to read. I rooted around the Character Map app in Windows, to see if I could find a more substantial set of characters that would show up more brightly instead of using dashes, pipes and numbers. Then I found these: `▀ ▄ █ ▌ ▐ ▲ ► ▼ ◄`.

# My Final Form

I took the o8 figlet font text above and simply did a find and replace on it. I replaced the `8` character with `█` and I also replaced the `o` character with `▄`:

```js
console.log('%c ▄▄▄▄     ▄▄▄▄            ▄▄▄▄                                                                ▄▄▄▄', consoleOptions);
console.log('%c  ████▄   ███ ▄▄▄▄  ▄▄▄▄   ███▄▄▄▄▄    ▄▄▄▄▄▄▄   ▄▄ ▄▄▄ ▄▄▄▄   ▄▄ ▄▄▄ ▄▄▄▄    ▄▄▄▄▄▄▄    ▄▄▄▄▄███ ', consoleOptions);
console.log('%c  ██ ███▄█ ██  ███   ███   ███   ███   ▄▄▄▄▄███   ███ ███ ███   ███ ███ ███   ▄▄▄▄▄███ ███    ███ ', consoleOptions);
console.log('%c  ██  ███  ██  ███   ███   ███   ███ ███    ███   ███ ███ ███   ███ ███ ███ ███    ███ ███    ███ ', consoleOptions);
console.log('%c ▄██▄  █  ▄██▄  ███▄██ █▄ ▄███▄ ▄███▄ ██▄▄▄██ █▄ ▄███▄███▄███▄ ▄███▄███▄███▄ ██▄▄▄██ █▄  ██▄▄▄███▄', consoleOptions);

console.log('%c ▄▄▄▄▄▄▄▄▄▄             ▄▄▄▄                              ', consoleOptions);
console.log('%c  ███    ███ ▄▄▄▄▄▄▄▄▄█  ███▄▄▄▄▄    ▄▄▄▄▄▄▄   ▄▄ ▄▄▄▄▄▄  ', consoleOptions);
console.log('%c  ███▄▄▄▄██ ███▄▄▄▄▄▄█   ███   ███   ▄▄▄▄▄███   ███   ███ ', consoleOptions);
console.log('%c  ███  ██▄  ███          ███   ███ ███    ███   ███   ███ ', consoleOptions);
console.log('%c ▄███▄  ██▄█  ██▄▄▄▄███ ▄███▄ ▄███▄ ██▄▄▄██ █▄ ▄███▄ ▄███▄', consoleOptions);

console.log('%c ▄▄▄▄▄▄▄▄█                                          ▄▄▄▄ ', consoleOptions);
console.log('%c ███           ▄▄▄▄▄▄▄   ▄▄▄▄▄▄▄▄▄█ ▄▄▄▄▄▄▄▄▄█  ▄▄▄▄▄███ ', consoleOptions);
console.log('%c ███▄▄▄▄▄▄    ▄▄▄▄▄███  ███▄▄▄▄▄▄█ ███▄▄▄▄▄▄█ ███    ███ ', consoleOptions);
console.log('%c         ███ ███    ███ ███        ███        ███    ███ ', consoleOptions);
console.log('%c ▄██▄▄▄▄███   ██▄▄▄██ █▄  ██▄▄▄▄███  ██▄▄▄▄███  ██▄▄▄███▄', consoleOptions);
```

This seemed to work great and created a cool effect:

![My name rendered in ASCII art using a figlet font](./images/Second-Try-1125x569.png)

# Conclusions

All you need to do now is copy and paste that text somewhere in the main part of your app. Now, when someone opens the browser console, they'll see your cool surprise. You can hit ||F12|| right now and take a look at mine.
