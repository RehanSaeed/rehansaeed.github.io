(window.webpackJsonp=window.webpackJsonp||[]).push([[10],{275:function(t,e,a){},276:function(t,e){},302:function(t,e,a){"use strict";var n=a(275);a.n(n).a},303:function(t,e,a){"use strict";var n=a(276),i=a.n(n);e.default=i.a},324:function(t,e,a){"use strict";a.r(e);a(256),a(257),a(32),a(268),a(63),a(37),a(21),a(254),a(97);var n=a(96),i=a(267),o=a(255),r=a(294),s={components:{"u-heading":n.a,"u-author":i.a,"u-newsletter":o.a,"u-post-card":r.a},computed:{metadata:function(){return this.$static.metadata},tag:function(){return this.$page.tag},posts:function(){return this.tag.belongsTo.edges.map((function(t){return t.node})).filter((function(t){return t.published}))},title:function(){return this.tag.title},description:function(){return"Blog posts authored by ".concat(this.metadata.author.name," about ").concat(this.title,".")},image:function(){return"".concat(this.metadata.url,"/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg")},url:function(){return this.metadata.url+this.tag.path}},metaInfo:function(){return{title:this.title,link:[{rel:"canonical",href:this.url}],meta:[{name:"description",content:this.description},{name:"author",content:this.metadata.author.name},{name:"twitter:card",content:"summary_large_image"},{name:"twitter:site",content:this.metadata.author.twitter},{name:"twitter:creator",content:this.metadata.author.twitter},{name:"twitter:title",content:this.title},{name:"twitter:description",content:this.description},{name:"twitter:image",content:this.image},{property:"og:title",content:this.title},{property:"og:url",content:this.url},{property:"og:image",content:this.image},{property:"og:image:height",content:this.image.match(/(\d*)x(\d*)/)[2]},{property:"og:image:width",content:this.image.match(/(\d*)x(\d*)/)[1]},{property:"og:description",content:this.description},{property:"og:locale",content:this.metadata.language.replace("-","_")},{property:"og:site_name",content:this.metadata.name},{property:"og:type",content:"website"},{property:"fb:app_id",content:this.metadata.facebookAppId}]}}},c=(a(302),a(1)),u=a(0),p=u.a.config.optionMergeStrategies.computed,h={metadata:{name:"Muhammad Rehan Saeed",url:"https://rehansaeed.com",language:"en-GB",facebookAppId:"632414437490344",author:{name:"Muhammad Rehan Saeed",twitter:"@RehanSaeedUK"}}},d=function(t){var e=t.options;e.__staticData?e.__staticData.data=h:(e.__staticData=u.a.observable({data:h}),e.computed=p({$static:function(){return e.__staticData.data}},e.computed))},m=a(303),l=Object(c.a)(s,(function(){var t=this.$createElement,e=this._self._c||t;return e("Layout",[e("div",{staticClass:"tag-page"},[e("u-heading",{attrs:{level:"1",center:""}},[this._v("# "+this._s(this.title))]),e("div",{staticClass:"tag-page__items"},this._l(this.posts,(function(t){return e("u-post-card",{key:t.id,attrs:{post:t}})})),1),e("u-newsletter",{staticClass:"tag-page__newsletter"})],1)])}),[],!1,null,null,null);"function"==typeof d&&d(l),"function"==typeof m.default&&Object(m.default)(l);e.default=l.exports}}]);