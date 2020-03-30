// Import main css
import '~/assets/style/index.scss';

// Import default layout so we don't need to import it to every page
import DefaultLayout from '~/layouts/Default.vue';

// The Client API can be used here. Learn more: gridsome.org/docs/client-api
export default function (Vue, { router, head, isClient }) {

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


  // Set default layout as a global component
  Vue.component('Layout', DefaultLayout);
}
