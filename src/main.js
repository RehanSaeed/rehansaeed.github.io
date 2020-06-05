// Import main css
import 'typeface-audiowide';
import audiowide from 'typeface-audiowide/files/audiowide-latin-400.woff2';
import '~/assets/style/index.scss';

// Import default layout so we don't need to import it to every page
import defaultLayout from '~/layouts/default.vue';

// Import comments
import Vssue from 'vssue';
import GithubV3 from '@vssue/api-github-v3';

import { decode } from '~/framework/obfuscate.js';
const site = require('./../site.json');

// The Client API can be used here. Learn more: gridsome.org/docs/client-api
export default function (Vue, { router, head, isClient }) {

const consoleOptions = 'background: #ffffff; color: #6b17e8';

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

  head.link.push({
    rel: 'preload',
    href: audiowide,
    as: 'font',
    type: 'font/woff2',
    crossorigin: ''
  });

  // Search
  head.link.push({
    rel: 'search',
    type: 'application/opensearchdescription+xml',
    href: '/opensearch.xml',
    title: 'Muhammad Rehan Saeed'
  });

  // Feeds
  head.link.push({
    rel: 'alternate',
    type: 'application/atom+xml',
    href: '/atom.xml',
    title: 'Muhammad Rehan Saeed'
  });
  head.link.push({
    rel: 'alternate',
    type: 'application/json',
    href: '/feed.json',
    title: 'Muhammad Rehan Saeed'
  });
  head.link.push({
    rel: 'alternate',
    type: 'application/rss+xml',
    href: '/rss.xml',
    title: 'Muhammad Rehan Saeed'
  });

  // Webmention
  head.link.push({
    rel: 'webmention',
    href: site.webmention.webmentionUrl,
  });
  head.link.push({
    rel: 'pingback',
    href: site.webmention.pingbackUrl,
  });
  head.link.push({
    rel: 'authorization_endpoint',
    href: 'https://indieauth.com/auth',
  });
  head.link.push({
    rel: 'me',
    href: site.author.twitter.url,
  });
  head.link.push({
    rel: 'me authn',
    href: site.author.gitHub.url,
  });
  head.link.push({
    rel: 'me',
    href: site.author.youtube.url,
  });
  head.link.push({
    rel: 'me',
    href: site.author.linkedIn.url,
  });
  head.link.push({
    rel: 'me',
    href: site.author.stackOverflow.url,
  });
  head.link.push({
    rel: 'me',
    href: site.author.buyMeACoffee.url,
  });
  head.link.push({
    rel: 'me',
    href: site.author.paypal.url,
  });

  // Referrer
  head.meta.push({
    name: 'referrer',
    content: 'no-referrer-when-downgrade',
  });

  // Set default layout as a global component
  Vue.component('Layout', defaultLayout);

  Vue.use(Vssue, {
    api: GithubV3,
    owner: site.repository.owner,
    repo: site.repository.name,
    clientId: decode(site.repository.clientId),
    clientSecret: decode(site.repository.clientSecret),
    labels: ['comment'],
    prefix: '[Comment] ',
    admins: [
      site.repository.owner
    ],
    perPage: 9999,
    locale: 'en',
    autoCreateIssue: true,
  });
}
