(window.webpackJsonp=window.webpackJsonp||[]).push([[10],{"3ewn":function(t,e,a){"use strict";a.d(e,"a",(function(){return n})),a.d(e,"b",(function(){return i})),a.d(e,"c",(function(){return s}));a("rB9j"),a("Rm1S"),a("UxlC");function n(t){var e=t.match(/(.*)\/(.+)-(\d+)x(\d+)/);return{alt:e[2].replace("-"," ").replace("_"," "),height:e[4],width:e[3]}}function i(t){var e=n(t);return[{property:"og:image",content:t},{property:"og:image:alt",content:e.alt},{property:"og:image:height",content:e.height},{property:"og:image:width",content:e.width}]}function s(t){var e=n(t);return{"@type":"ImageObject",url:t,alternativeHeadline:e.alt,width:e.width,height:e.height}}},"5urB":function(t,e,a){},"6Kmc":function(t,e,a){"use strict";a("bP6F")},"8d1i":function(t,e,a){},Fryl:function(t,e,a){"use strict";a("5urB")},Mh7a:function(t,e,a){"use strict";var n={name:"u-tags",components:{"u-link-button":a("TUbx").a},props:{tags:{isRequired:!0,type:Array}}},i=(a("Zglw"),a("KHd+")),s=Object(i.a)(n,(function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",{staticClass:"tags"},t._l(t.tags,(function(e){return a("u-link-button",{key:e.id,staticClass:"tags__link",attrs:{bordered:"",to:e.path}},[t._v(t._s(e.title))])})),1)}),[],!1,null,null,null);e.a=s.exports},SZTi:function(t,e,a){"use strict";var n=a("k8r6"),i={name:"u-time",props:{datetime:{type:String,required:!0}},computed:{datetimeDisplay:function(){return Object(n.a)(this.datetime)}}},s=a("KHd+"),r=Object(s.a)(i,(function(){var t=this.$createElement;return(this._self._c||t)("time",{staticClass:"time",attrs:{datetime:this.datetime,title:this.datetime}},[this._v(this._s(this.datetimeDisplay))])}),[],!1,null,null,null);e.a=r.exports},Zglw:function(t,e,a){"use strict";a("8d1i")},bP6F:function(t,e,a){},k8r6:function(t,e,a){"use strict";a.d(e,"a",(function(){return o}));var n=a("NoME"),i=a("FVam"),s=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"long",year:"numeric"}),r=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"long",year:"numeric"});function o(t){if(t)return function(t){var e=new Date;return Object(n.a)(e,t)<=30?Object(i.a)(t,e,{addSuffix:!0}):e.getFullYear()==t.getFullYear()?s.format(t):r.format(t)}(new Date(t))}},kL9j:function(t,e,a){"use strict";var n=a("bYPN"),i=a("qAcn"),s=a("scFS"),r=a("Mh7a"),o=a("3ewn"),c={name:"u-post-card",components:{"u-card":n.a,"u-heading":i.a,"u-post-meta":s.a,"u-tags":r.a},props:{post:{type:Object}},computed:{imageMeta:function(){return Object(o.a)(this.post.heroImage)}}},u=(a("q73z"),a("KHd+")),d=Object(u.a)(c,(function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("u-card",{staticClass:"post-card",class:{"post-card--has-poster":t.post.poster},attrs:{tag:"article",hoverable:"",focusable:""}},[a("div",{staticClass:"post-card__header"},[t.post.heroImage?a("g-image",{staticClass:"post-card__image",attrs:{alt:t.imageMeta.alt,src:t.post.heroImage}}):t._e()],1),a("div",{staticClass:"post-card__content"},[a("u-heading",{staticClass:"post-card__title",attrs:{id:t.post.title,to:t.post.path,level:"2"}},[t._v(t._s(t.post.title))]),a("p",{staticClass:"post-card__description"},[t._v(t._s(t.post.description))]),a("u-post-meta",{staticClass:"post-card__meta",attrs:{meta:t.post}}),t.post.tags?a("u-tags",{staticClass:"post-card__tags",attrs:{tags:t.post.tags}}):t._e()],1)])}),[],!1,null,null,null);e.a=d.exports},plPW:function(t,e,a){},q73z:function(t,e,a){"use strict";a("plPW")},scFS:function(t,e,a){"use strict";var n={name:"u-post-meta",components:{"u-time":a("SZTi").a},props:{meta:{type:Object,required:!0}}},i=(a("6Kmc"),a("KHd+")),s=Object(i.a)(n,(function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",[t.meta.dateModified?a("p",{staticClass:"post-meta"},[t._v("\n    Posted\n    "),a("u-time",{staticClass:"dt-published",attrs:{datetime:t.meta.date}}),t._v(" and updated\n    "),a("u-time",{staticClass:"dt-updated",attrs:{datetime:t.meta.dateModified}}),t._v(" -\n    "),a("strong",[t._v(t._s(t.meta.timeToRead)+" min read")])],1):a("p",{staticClass:"post-meta"},[t._v("\n    Posted\n    "),a("u-time",{staticClass:"dt-published",attrs:{datetime:t.meta.date}}),t._v(" -\n    "),a("strong",[t._v(t._s(t.meta.timeToRead)+" min read")])],1)])}),[],!1,null,null,null);e.a=s.exports},y3F6:function(t,e,a){"use strict";a.r(e);a("TeQF"),a("07d7"),a("2B1R"),a("ma9I"),a("sMBO"),a("pNMO"),a("4Brf"),a("rB9j"),a("Rm1S"),a("UxlC");var n=a("MoJ+"),i=a("qAcn"),s=a("mVoE"),r=a("kL9j"),o={components:{"u-arrows":n.a,"u-heading":i.a,"u-author":s.a,"u-post-card":r.a},computed:{metadata:function(){return this.$static.metadata},tag:function(){return this.$page.tag},posts:function(){return this.tag.belongsTo.edges.map((function(t){return t.node})).filter((function(t){return t.published}))},title:function(){return this.tag.title},description:function(){return"Blog posts authored by ".concat(this.metadata.author.name," about ").concat(this.title,".")},image:function(){return"".concat(this.metadata.url,"/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg")},url:function(){return this.metadata.url+this.tag.path}},metaInfo:function(){return{title:this.title,link:[{rel:"canonical",href:this.url}],meta:[{name:"description",content:this.description},{name:"author",content:this.metadata.author.name},{name:"twitter:card",content:"summary_large_image"},{name:"twitter:site",content:this.metadata.author.twitter.user},{name:"twitter:creator",content:this.metadata.author.twitter.user},{name:"twitter:title",content:this.title},{name:"twitter:description",content:this.description},{name:"twitter:image",content:this.image},{property:"og:title",content:this.title},{property:"og:url",content:this.url},{property:"og:image",content:this.image},{property:"og:image:height",content:this.image.match(/(\d*)x(\d*)/)[2]},{property:"og:image:width",content:this.image.match(/(\d*)x(\d*)/)[1]},{property:"og:description",content:this.description},{property:"og:locale",content:this.metadata.language.replace("-","_")},{property:"og:site_name",content:this.metadata.name},{property:"og:type",content:"website"},{property:"fb:app_id",content:this.metadata.facebookAppId}]}}},c=(a("Fryl"),a("KHd+")),u=a("Kw5r"),d=u.default.config.optionMergeStrategies.computed,l={metadata:{name:"Muhammad Rehan Saeed",url:"https://rehansaeed.com",language:"en-GB",facebookAppId:"632414437490344",author:{name:"Muhammad Rehan Saeed",twitter:{user:"@RehanSaeedUK"}}}},p=function(t){var e=t.options;e.__staticData?e.__staticData.data=l:(e.__staticData=u.default.observable({data:l}),e.computed=d({$static:function(){return e.__staticData.data}},e.computed))},m=null,h=Object(c.a)(o,(function(){var t=this.$createElement,e=this._self._c||t;return e("Layout",[e("div",{staticClass:"tag-page"},[e("u-heading",{attrs:{id:this.title,level:"1",center:"",to:this.tag.path}},[this._v("# "+this._s(this.title))]),e("u-arrows",{staticClass:"tag-page__arrows"}),e("div",{staticClass:"tag-page__items"},this._l(this.posts,(function(t){return e("u-post-card",{key:t.id,attrs:{post:t}})})),1)],1)])}),[],!1,null,null,null);"function"==typeof p&&p(h),"function"==typeof m&&m(h);e.default=h.exports}}]);