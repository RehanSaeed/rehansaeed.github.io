(window.webpackJsonp=window.webpackJsonp||[]).push([[3],{187:function(t,e,a){},188:function(t,e,a){},189:function(t,e,a){"use strict";var n={name:"u-content-box",props:{hoverable:{type:Boolean},tag:{default:"div",type:String}}},s=(a(193),a(0)),o=Object(s.a)(n,(function(){var t=this.$createElement;return(this._self._c||t)(this.tag,{tag:"div",staticClass:"content-box",class:{"content-box--hoverable":this.hoverable}},[this._t("default")],2)}),[],!1,null,null,null);e.a=o.exports},191:function(t,e,a){"use strict";var n=a(28),s=a(189),o=a(84),i={name:"u-newsletter",components:{"u-button":n.a,"u-content-box":s.a,"u-heading":o.a}},r=(a(194),a(0)),u=a(1),c=u.a.config.optionMergeStrategies.computed,l={metadata:{mailchimpUrl:"https://rehansaeed.us19.list-manage.com/subscribe/post?u=0d1d7c30db26dd0a4aa1b5b40&amp;id=07ce865066"}},d=function(t){var e=t.options;e.__staticData?e.__staticData.data=l:(e.__staticData=u.a.observable({data:l}),e.computed=c({$static:function(){return e.__staticData.data}},e.computed))},p=Object(r.a)(i,(function(){var t=this.$createElement,e=this._self._c||t;return e("u-content-box",{staticClass:"newsletter",attrs:{tag:"section"}},[e("form",{staticClass:"newsletter__form",attrs:{method:"post",action:this.$static.metadata.mailchimpUrl}},[e("u-heading",{staticClass:"newsletter__title",attrs:{level:"2"}},[this._v("Newsletter")]),e("p",{staticClass:"newsletter__content"},[this._v("Stay up to date! Get all the latest & greatest posts delivered straight to your inbox!")]),e("input",{staticClass:"newsletter__input",attrs:{name:"EMAIL",placeholder:"youremail@example.com",required:"",type:"email",autocapitalize:"off",autocorrect:"off"}}),e("input",{staticStyle:{position:"absolute",left:"-5000px"},attrs:{"aria-hidden":"true",type:"text",name:"b_0d1d7c30db26dd0a4aa1b5b40_07ce865066",tabindex:"-1",value:""}}),e("u-button",{staticClass:"newsletter__button",attrs:{bordered:"",submit:""}},[this._v("\n      Subscribe\n    ")])],1)])}),[],!1,null,null,null);"function"==typeof d&&d(p);e.a=p.exports},193:function(t,e,a){"use strict";var n=a(187);a.n(n).a},194:function(t,e,a){"use strict";var n=a(188);a.n(n).a},206:function(t,e,a){},220:function(t,e,a){"use strict";var n=a(206);a.n(n).a},230:function(t,e,a){"use strict";a.r(e);var n=a(189),s=a(86),o=a(84),i=a(191),r={components:{"u-content-box":n.a,"u-link":s.a,"u-heading":o.a,"u-newsletter":i.a}},u=(a(220),a(0)),c=Object(u.a)(r,(function(){var t=this.$createElement,e=this._self._c||t;return e("Layout",[e("div",{staticClass:"not-found"},[e("u-heading",{attrs:{level:"1"}},[this._v("404 Not Found")]),e("u-content-box",{staticClass:"not-found__content"},[e("p",[this._v("Didn't find what you were looking for?")]),e("u-link",{attrs:{bordered:"",to:"/"}},[this._v("Go Home")])],1),e("u-newsletter")],1)])}),[],!1,null,null,null);e.default=c.exports}}]);