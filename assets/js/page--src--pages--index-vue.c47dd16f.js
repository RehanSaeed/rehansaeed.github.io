(window.webpackJsonp=window.webpackJsonp||[]).push([[7],{KQm4:function(t,e,o){"use strict";o.d(e,"a",(function(){return n}));var a=o("a3WO");var i=o("BsWD");function n(t){return function(t){if(Array.isArray(t))return Object(a.a)(t)}(t)||function(t){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(t))return Array.from(t)}(t)||Object(i.a)(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}},SAWW:function(t,e,o){"use strict";e.a={data:()=>({searchTerm:""}),computed:{searchResults(){const t=this.searchTerm;return t.length<3?[]:this.$search.search({query:t,limit:8})}},watch:{$route(t,e){this.searchTerm=""}}}},kL9j:function(t,e,o){"use strict";var a=o("bYPN"),i=o("qAcn"),n=o("scFS"),r=o("Mh7a"),s=o("3ewn"),l={name:"u-post-card",components:{"u-card":a.a,"u-heading":i.a,"u-post-meta":n.a,"u-tags":r.a},props:{post:{type:Object}},computed:{imageMeta:function(){return Object(s.a)(this.post.heroImage)}}},c=(o("q73z"),o("KHd+")),d=Object(c.a)(l,(function(){var t=this,e=t.$createElement,o=t._self._c||e;return o("u-card",{staticClass:"post-card",class:{"post-card--has-poster":t.post.poster},attrs:{tag:"article",hoverable:"",focusable:""}},[o("div",{staticClass:"post-card__header"},[t.post.heroImage?o("g-image",{staticClass:"post-card__image",attrs:{alt:t.imageMeta.alt,src:t.post.heroImage}}):t._e()],1),o("div",{staticClass:"post-card__content"},[o("u-heading",{staticClass:"post-card__title",attrs:{id:t.post.title,to:t.post.path,level:"2"}},[t._v(t._s(t.post.title))]),o("p",{staticClass:"post-card__description"},[t._v(t._s(t.post.description))]),o("u-post-meta",{staticClass:"post-card__meta",attrs:{meta:t.post}}),t.post.tags?o("u-tags",{staticClass:"post-card__tags",attrs:{tags:t.post.tags}}):t._e()],1)])}),[],!1,null,null,null);e.a=d.exports},"kmF/":function(t,e,o){"use strict";o.r(e);o("pNMO"),o("4Brf"),o("ma9I"),o("TeQF"),o("oVuX"),o("sMBO"),o("rB9j"),o("Rm1S"),o("UxlC"),o("EnZy");var a=o("KQm4"),i=o("ez0Y"),n=o("mVoE"),r=o("w5yD"),s=o("bYPN"),l=o("TUbx");function c(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"";if(t.hasPreviousPage)return 2==t.currentPage?"".concat(e,"/"):"".concat(e,"/").concat(t.currentPage-1,"/")}function d(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"";if(t.hasNextPage)return"".concat(e,"/").concat(t.currentPage+1,"/")}var u={components:{"u-card":s.a,"u-link-button":l.a},props:{pageInfo:{required:!0,type:Object}},computed:{previousUrl:function(){return c(this.pageInfo)},nextUrl:function(){return d(this.pageInfo)}}},h=(o("lXGD"),o("KHd+")),p=Object(h.a)(u,(function(){var t=this,e=t.$createElement,o=t._self._c||e;return o("div",{staticClass:"pager"},[o("u-link-button",{staticClass:"pager__previous-button",class:{"pager__button--none":!t.pageInfo.hasPreviousPage},attrs:{bordered:"",contrast:"",to:t.previousUrl}},[t._v("Previous")]),o("p",{staticClass:"pager__info"},[o("strong",[t._v("Page "+t._s(t.pageInfo.currentPage)+" of "+t._s(t.pageInfo.totalPages))])]),o("u-link-button",{staticClass:"pager__next-button",class:{"pager__button--none":!t.pageInfo.hasNextPage},attrs:{bordered:"",contrast:"",to:t.nextUrl}},[t._v("Next")])],1)}),[],!1,null,null,null).exports,m=o("kL9j"),g={components:{Layout:i.a,"u-author":n.a,"u-newsletter":r.a,"u-pager":p,"u-post-card":m.a},computed:{title:function(){return"Blog"},description:function(){return"Blog posts and more authored by ".concat(this.$static.metadata.author.name,".")},image:function(){return this.$static.metadata.url+"/images/hero/Muhammad-Rehan-Saeed-1600x900.jpg"},imageHeight:function(){return this.image.match(/(\d*)x(\d*)/)[2]},imageWidth:function(){return this.image.match(/(\d*)x(\d*)/)[1]},nextUrl:function(){return d(this.$page.posts.pageInfo,this.$static.metadata.url)},previousUrl:function(){return c(this.$page.posts.pageInfo,this.$static.metadata.url)}},metaInfo:function(){return{title:this.title,link:[{rel:"canonical",href:this.$static.metadata.url}].concat(Object(a.a)([{rel:"next",href:this.nextUrl}].filter((function(t){return t.href}))),Object(a.a)([{rel:"prev",href:this.previousUrl}].filter((function(t){return t.href})))),meta:[{name:"description",content:this.description},{name:"author",content:this.$static.metadata.author.name},{name:"twitter:card",content:"summary_large_image"},{name:"twitter:site",content:this.$static.metadata.author.twitter.user},{name:"twitter:creator",content:this.$static.metadata.author.twitter.user},{name:"twitter:title",content:this.title},{name:"twitter:description",content:this.description},{name:"twitter:image",content:this.image},{property:"og:title",content:this.title},{property:"og:url",content:this.$static.metadata.url},{property:"og:image",content:this.image},{property:"og:image:height",content:this.imageHeight},{property:"og:image:width",content:this.imageWidth},{property:"og:description",content:this.description},{property:"og:locale",content:this.$static.metadata.language.replace("-","_")},{property:"og:site_name",content:this.$static.metadata.name},{property:"og:type",content:"profile"},{property:"profile:first_name",content:this.$static.metadata.author.firstName},{property:"profile:last_name",content:this.$static.metadata.author.lastName},{property:"profile:username",content:this.$static.metadata.author.name},{property:"profile:gender",content:this.$static.metadata.author.gender},{property:"fb:app_id",content:this.$static.metadata.facebookAppId}],script:[{type:"application/ld+json",json:{"@context":"https://schema.org","@type":"WebSite",description:this.description,url:this.$static.metadata.url,image:[{"@type":"ImageObject",url:this.image,width:this.imageWidth,height:this.imageHeight}],potentialAction:{"@type":"SearchAction",target:"".concat(this.$static.metadata.url,"?search={search_term_string}"),"query-input":"required name=search_term_string"},author:{"@type":"Person",name:this.$static.metadata.author.name,logo:{"@type":"ImageObject",url:"".concat(this.$static.metadata.url,"/images/author/").concat(this.$static.metadata.author.name.split(" ").join("-"),"/Logo-260x260.png"),width:260,height:260},url:this.$static.metadata.url+"/about/"},publisher:{"@type":"Organization",name:this.$static.metadata.name,logo:{"@type":"ImageObject",url:this.$static.metadata.url+"/images/schema/Publisher-600x60.png",width:600,height:60},url:this.$static.metadata.url}}}]}}},f=(o("vV/I"),o("Kw5r")),b=f.default.config.optionMergeStrategies.computed,v={metadata:{name:"Muhammad Rehan Saeed",language:"en-GB",url:"https://rehansaeed.com",facebookAppId:"632414437490344",author:{name:"Muhammad Rehan Saeed",firstName:"Muhammad Rehan",lastName:"Saeed",gender:"male",twitter:{user:"@RehanSaeedUK"}}}},_=function(t){var e=t.options;e.__staticData?e.__staticData.data=v:(e.__staticData=f.default.observable({data:v}),e.computed=b({$static:function(){return e.__staticData.data}},e.computed))},y=null,w=Object(h.a)(g,(function(){var t=this.$createElement,e=this._self._c||t;return e("Layout",[e("div",{staticClass:"posts"},[e("u-author"),e("div",{staticClass:"posts__items"},this._l(this.$page.posts.edges,(function(t){return e("u-post-card",{key:t.node.id,attrs:{post:t.node}})})),1),e("u-pager",{staticClass:"posts__pager",attrs:{"page-info":this.$page.posts.pageInfo}}),e("u-newsletter",{staticClass:"posts__newsletter"})],1)])}),[],!1,null,null,null);"function"==typeof _&&_(w),"function"==typeof y&&y(w);e.default=w.exports},lXGD:function(t,e,o){"use strict";o("q9oi")},pWKE:function(t,e,o){"use strict";o.r(e);var a=window.CustomEvent;function i(t,e){var o="on"+e.type.toLowerCase();return"function"==typeof t[o]&&t[o](e),t.dispatchEvent(e)}function n(t){for(;t;){if("dialog"===t.localName)return t;t=t.parentElement?t.parentElement:t.parentNode?t.parentNode.host:null}return null}function r(t){for(;t&&t.shadowRoot&&t.shadowRoot.activeElement;)t=t.shadowRoot.activeElement;t&&t.blur&&t!==document.body&&t.blur()}function s(t,e){for(var o=0;o<t.length;++o)if(t[o]===e)return!0;return!1}function l(t){return!(!t||!t.hasAttribute("method"))&&"dialog"===t.getAttribute("method").toLowerCase()}function c(t){return t.isConnected||document.body.contains(t)}function d(t){if(t.submitter)return t.submitter;var e=t.target;if(!(e instanceof HTMLFormElement))return null;var o=p.formSubmitter;if(!o){var a=t.target;o=("getRootNode"in a&&a.getRootNode()||document).activeElement}return o&&o.form===e?o:null}function u(t){if(!t.defaultPrevented){var e=t.target,o=p.imagemapUseValue,a=d(t);null===o&&a&&(o=a.value);var i=n(e);if(i)"dialog"===(a&&a.getAttribute("formmethod")||e.getAttribute("method"))&&(t.preventDefault(),null!=o?i.close(o):i.close())}}function h(t){if(this.dialog_=t,this.replacedStyleTop_=!1,this.openAsModal_=!1,t.hasAttribute("role")||t.setAttribute("role","dialog"),t.show=this.show.bind(this),t.showModal=this.showModal.bind(this),t.close=this.close.bind(this),t.addEventListener("submit",u,!1),"returnValue"in t||(t.returnValue=""),"MutationObserver"in window){new MutationObserver(this.maybeHideModal.bind(this)).observe(t,{attributes:!0,attributeFilter:["open"]})}else{var e,o=!1,a=function(){o?this.downgradeModal():this.maybeHideModal(),o=!1}.bind(this),i=function(i){if(i.target===t){var n="DOMNodeRemoved";o|=i.type.substr(0,n.length)===n,window.clearTimeout(e),e=window.setTimeout(a,0)}};["DOMAttrModified","DOMNodeRemoved","DOMNodeRemovedFromDocument"].forEach((function(e){t.addEventListener(e,i)}))}Object.defineProperty(t,"open",{set:this.setOpen.bind(this),get:t.hasAttribute.bind(t,"open")}),this.backdrop_=document.createElement("div"),this.backdrop_.className="backdrop",this.backdrop_.addEventListener("mouseup",this.backdropMouseEvent_.bind(this)),this.backdrop_.addEventListener("mousedown",this.backdropMouseEvent_.bind(this)),this.backdrop_.addEventListener("click",this.backdropMouseEvent_.bind(this))}a&&"object"!=typeof a||((a=function(t,e){e=e||{};var o=document.createEvent("CustomEvent");return o.initCustomEvent(t,!!e.bubbles,!!e.cancelable,e.detail||null),o}).prototype=window.Event.prototype),h.prototype={get dialog(){return this.dialog_},maybeHideModal:function(){this.dialog_.hasAttribute("open")&&c(this.dialog_)||this.downgradeModal()},downgradeModal:function(){this.openAsModal_&&(this.openAsModal_=!1,this.dialog_.style.zIndex="",this.replacedStyleTop_&&(this.dialog_.style.top="",this.replacedStyleTop_=!1),this.backdrop_.parentNode&&this.backdrop_.parentNode.removeChild(this.backdrop_),p.dm.removeDialog(this))},setOpen:function(t){t?this.dialog_.hasAttribute("open")||this.dialog_.setAttribute("open",""):(this.dialog_.removeAttribute("open"),this.maybeHideModal())},backdropMouseEvent_:function(t){if(this.dialog_.hasAttribute("tabindex"))this.dialog_.focus();else{var e=document.createElement("div");this.dialog_.insertBefore(e,this.dialog_.firstChild),e.tabIndex=-1,e.focus(),this.dialog_.removeChild(e)}var o=document.createEvent("MouseEvents");o.initMouseEvent(t.type,t.bubbles,t.cancelable,window,t.detail,t.screenX,t.screenY,t.clientX,t.clientY,t.ctrlKey,t.altKey,t.shiftKey,t.metaKey,t.button,t.relatedTarget),this.dialog_.dispatchEvent(o),t.stopPropagation()},focus_:function(){var t=this.dialog_.querySelector("[autofocus]:not([disabled])");!t&&this.dialog_.tabIndex>=0&&(t=this.dialog_),t||(t=function t(e){var o=["button","input","keygen","select","textarea"].map((function(t){return t+":not([disabled])"}));o.push('[tabindex]:not([disabled]):not([tabindex=""])');var a=e.querySelector(o.join(", "));if(!a&&"attachShadow"in Element.prototype)for(var i=e.querySelectorAll("*"),n=0;n<i.length&&!(i[n].tagName&&i[n].shadowRoot&&(a=t(i[n].shadowRoot)));n++);return a}(this.dialog_)),r(document.activeElement),t&&t.focus()},updateZIndex:function(t,e){if(t<e)throw new Error("dialogZ should never be < backdropZ");this.dialog_.style.zIndex=t,this.backdrop_.style.zIndex=e},show:function(){this.dialog_.open||(this.setOpen(!0),this.focus_())},showModal:function(){if(this.dialog_.hasAttribute("open"))throw new Error("Failed to execute 'showModal' on dialog: The element is already open, and therefore cannot be opened modally.");if(!c(this.dialog_))throw new Error("Failed to execute 'showModal' on dialog: The element is not in a Document.");if(!p.dm.pushDialog(this))throw new Error("Failed to execute 'showModal' on dialog: There are too many open modal dialogs.");(function(t){for(;t&&t!==document.body;){var e=window.getComputedStyle(t),o=function(t,o){return!(void 0===e[t]||e[t]===o)};if(e.opacity<1||o("zIndex","auto")||o("transform","none")||o("mixBlendMode","normal")||o("filter","none")||o("perspective","none")||"isolate"===e.isolation||"fixed"===e.position||"touch"===e.webkitOverflowScrolling)return!0;t=t.parentElement}return!1})(this.dialog_.parentElement)&&console.warn("A dialog is being shown inside a stacking context. This may cause it to be unusable. For more information, see this link: https://github.com/GoogleChrome/dialog-polyfill/#stacking-context"),this.setOpen(!0),this.openAsModal_=!0,p.needsCentering(this.dialog_)?(p.reposition(this.dialog_),this.replacedStyleTop_=!0):this.replacedStyleTop_=!1,this.dialog_.parentNode.insertBefore(this.backdrop_,this.dialog_.nextSibling),this.focus_()},close:function(t){if(!this.dialog_.hasAttribute("open"))throw new Error("Failed to execute 'close' on dialog: The element does not have an 'open' attribute, and therefore cannot be closed.");this.setOpen(!1),void 0!==t&&(this.dialog_.returnValue=t);var e=new a("close",{bubbles:!1,cancelable:!1});i(this.dialog_,e)}};var p={reposition:function(t){var e=document.body.scrollTop||document.documentElement.scrollTop,o=e+(window.innerHeight-t.offsetHeight)/2;t.style.top=Math.max(e,o)+"px"},isInlinePositionSetByStylesheet:function(t){for(var e=0;e<document.styleSheets.length;++e){var o=document.styleSheets[e],a=null;try{a=o.cssRules}catch(t){}if(a)for(var i=0;i<a.length;++i){var n=a[i],r=null;try{r=document.querySelectorAll(n.selectorText)}catch(t){}if(r&&s(r,t)){var l=n.style.getPropertyValue("top"),c=n.style.getPropertyValue("bottom");if(l&&"auto"!==l||c&&"auto"!==c)return!0}}}return!1},needsCentering:function(t){return"absolute"===window.getComputedStyle(t).position&&(!("auto"!==t.style.top&&""!==t.style.top||"auto"!==t.style.bottom&&""!==t.style.bottom)&&!p.isInlinePositionSetByStylesheet(t))},forceRegisterDialog:function(t){if((window.HTMLDialogElement||t.showModal)&&console.warn("This browser already supports <dialog>, the polyfill may not work correctly",t),"dialog"!==t.localName)throw new Error("Failed to register dialog: The element is not a dialog.");new h(t)},registerDialog:function(t){t.showModal||p.forceRegisterDialog(t)},DialogManager:function(){this.pendingDialogStack=[];var t=this.checkDOM_.bind(this);this.overlay=document.createElement("div"),this.overlay.className="_dialog_overlay",this.overlay.addEventListener("click",function(e){this.forwardTab_=void 0,e.stopPropagation(),t([])}.bind(this)),this.handleKey_=this.handleKey_.bind(this),this.handleFocus_=this.handleFocus_.bind(this),this.zIndexLow_=1e5,this.zIndexHigh_=100150,this.forwardTab_=void 0,"MutationObserver"in window&&(this.mo_=new MutationObserver((function(e){var o=[];e.forEach((function(t){for(var e,a=0;e=t.removedNodes[a];++a)e instanceof Element&&("dialog"===e.localName&&o.push(e),o=o.concat(e.querySelectorAll("dialog")))})),o.length&&t(o)})))}};if(p.DialogManager.prototype.blockDocument=function(){document.documentElement.addEventListener("focus",this.handleFocus_,!0),document.addEventListener("keydown",this.handleKey_),this.mo_&&this.mo_.observe(document,{childList:!0,subtree:!0})},p.DialogManager.prototype.unblockDocument=function(){document.documentElement.removeEventListener("focus",this.handleFocus_,!0),document.removeEventListener("keydown",this.handleKey_),this.mo_&&this.mo_.disconnect()},p.DialogManager.prototype.updateStacking=function(){for(var t,e=this.zIndexHigh_,o=0;t=this.pendingDialogStack[o];++o)t.updateZIndex(--e,--e),0===o&&(this.overlay.style.zIndex=--e);var a=this.pendingDialogStack[0];a?(a.dialog.parentNode||document.body).appendChild(this.overlay):this.overlay.parentNode&&this.overlay.parentNode.removeChild(this.overlay)},p.DialogManager.prototype.containedByTopDialog_=function(t){for(;t=n(t);){for(var e,o=0;e=this.pendingDialogStack[o];++o)if(e.dialog===t)return 0===o;t=t.parentElement}return!1},p.DialogManager.prototype.handleFocus_=function(t){var e=t.composedPath?t.composedPath()[0]:t.target;if(!this.containedByTopDialog_(e)&&document.activeElement!==document.documentElement&&(t.preventDefault(),t.stopPropagation(),r(e),void 0!==this.forwardTab_)){var o=this.pendingDialogStack[0];return o.dialog.compareDocumentPosition(e)&Node.DOCUMENT_POSITION_PRECEDING&&(this.forwardTab_?o.focus_():e!==document.documentElement&&document.documentElement.focus()),!1}},p.DialogManager.prototype.handleKey_=function(t){if(this.forwardTab_=void 0,27===t.keyCode){t.preventDefault(),t.stopPropagation();var e=new a("cancel",{bubbles:!1,cancelable:!0}),o=this.pendingDialogStack[0];o&&i(o.dialog,e)&&o.dialog.close()}else 9===t.keyCode&&(this.forwardTab_=!t.shiftKey)},p.DialogManager.prototype.checkDOM_=function(t){this.pendingDialogStack.slice().forEach((function(e){-1!==t.indexOf(e.dialog)?e.downgradeModal():e.maybeHideModal()}))},p.DialogManager.prototype.pushDialog=function(t){var e=(this.zIndexHigh_-this.zIndexLow_)/2-1;return!(this.pendingDialogStack.length>=e)&&(1===this.pendingDialogStack.unshift(t)&&this.blockDocument(),this.updateStacking(),!0)},p.DialogManager.prototype.removeDialog=function(t){var e=this.pendingDialogStack.indexOf(t);-1!==e&&(this.pendingDialogStack.splice(e,1),0===this.pendingDialogStack.length&&this.unblockDocument(),this.updateStacking())},p.dm=new p.DialogManager,p.formSubmitter=null,p.imagemapUseValue=null,void 0===window.HTMLDialogElement){var m=document.createElement("form");if(m.setAttribute("method","dialog"),"dialog"!==m.method){var g=Object.getOwnPropertyDescriptor(HTMLFormElement.prototype,"method");if(g){var f=g.get;g.get=function(){return l(this)?"dialog":f.call(this)};var b=g.set;g.set=function(t){return"string"==typeof t&&"dialog"===t.toLowerCase()?this.setAttribute("method",t):b.call(this,t)},Object.defineProperty(HTMLFormElement.prototype,"method",g)}}document.addEventListener("click",(function(t){if(p.formSubmitter=null,p.imagemapUseValue=null,!t.defaultPrevented){var e=t.target;if("composedPath"in t)e=t.composedPath().shift()||e;if(e&&l(e.form)){if(!("submit"===e.type&&["button","input"].indexOf(e.localName)>-1)){if("input"!==e.localName||"image"!==e.type)return;p.imagemapUseValue=t.offsetX+","+t.offsetY}n(e)&&(p.formSubmitter=e)}}}),!1),document.addEventListener("submit",(function(t){var e=t.target;if(!n(e)){var o=d(t);"dialog"===(o&&o.getAttribute("formmethod")||e.getAttribute("method"))&&t.preventDefault()}}));var v=HTMLFormElement.prototype.submit;HTMLFormElement.prototype.submit=function(){if(!l(this))return v.call(this);var t=n(this);t&&t.close()}}e.default=p},plPW:function(t,e,o){},q73z:function(t,e,o){"use strict";o("plPW")},q9oi:function(t,e,o){},"vV/I":function(t,e,o){"use strict";o("xAqx")},xAqx:function(t,e,o){}}]);