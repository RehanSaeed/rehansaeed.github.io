(window.webpackJsonp=window.webpackJsonp||[]).push([[9],{252:function(t,e,a){},258:function(t,e,a){},259:function(t,e,a){},264:function(t,e,a){"use strict";var n=a(252);a.n(n).a},265:function(t,e,a){"use strict";var n={name:"u-tags",components:{"u-link":a(36).a},props:{tags:Array}},i=(a(264),a(1)),s=Object(i.a)(n,(function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",{staticClass:"tags"},t._l(t.tags,(function(e){return a("u-link",{key:e.id,staticClass:"tags__link",attrs:{bordered:"",to:e.path}},[t._v("\n\t\t\t"+t._s(e.title)+"\n\t\t")])})),1)}),[],!1,null,null,null);e.a=s.exports},266:function(t,e,a){"use strict";a.d(e,"a",(function(){return n})),a.d(e,"b",(function(){return i})),a.d(e,"c",(function(){return s}));a(21),a(254),a(97);function n(t){var e=t.match(/(.*)\/(.+)-(\d+)x(\d+)/);return{alt:e[2].replace("-"," ").replace("_"," "),height:e[4],width:e[3]}}function i(t){var e=n(t);return[{property:"og:image",content:t},{property:"og:image:alt",content:e.alt},{property:"og:image:height",content:e.height},{property:"og:image:width",content:e.width}]}function s(t){var e=n(t);return{"@type":"ImageObject",url:t,alternativeHeadline:e.alt,width:e.width,height:e.height}}},267:function(t,e,a){"use strict";var n=a(96),i=a(290),s={name:"u-author",components:{"u-heading":n.a,"u-social-links":i.a}},o=(a(270),a(1)),r=a(0),c=r.a.config.optionMergeStrategies.computed,l={metadata:{name:"Muhammad Rehan Saeed",description:"Software Developer at Microsoft, Open Source Contributor and Blogger"}},u=function(t){var e=t.options;e.__staticData?e.__staticData.data=l:(e.__staticData=r.a.observable({data:l}),e.computed=c({$static:function(){return e.__staticData.data}},e.computed))},b=Object(o.a)(s,(function(){var t=this.$createElement,e=this._self._c||t;return e("section",{staticClass:"author"},[e("g-image",{staticClass:"author__image",attrs:{alt:this.$static.metadata.name,immediate:"",src:a(268),width:"120",height:"120"}}),e("u-heading",{staticClass:"author__site-title",attrs:{level:"1"}},[this._v(this._s(this.$static.metadata.name))]),e("p",{staticClass:"author__description"},[this._v(this._s(this.$static.metadata.description))]),e("u-social-links")],1)}),[],!1,null,null,null);"function"==typeof u&&u(b);e.a=b.exports},268:function(t,e){t.exports={type:"image",mimeType:"image/png",src:"/assets/static/Logo-260x260.7ff51a0.f04f9a806a9e60a3b671e75b223480d9.png",size:{width:120,height:120},sizes:"(max-width: 120px) 100vw, 120px",srcset:["/assets/static/Logo-260x260.7ff51a0.f04f9a806a9e60a3b671e75b223480d9.png 120w"],dataUri:"data:image/svg+xml,%3csvg fill='none' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3e%3cdefs%3e%3cfilter id='__svg-blur-c0969dbe85b8087eadf19d5a3ec30aa1'%3e%3cfeGaussianBlur in='SourceGraphic' stdDeviation='40'/%3e%3c/filter%3e%3c/defs%3e%3cimage x='0' y='0' filter='url(%23__svg-blur-c0969dbe85b8087eadf19d5a3ec30aa1)' width='120' height='120' xlink:href='data:image/png%3bbase64%2ciVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsSAAALEgHS3X78AAAgAElEQVR42p27h1tU67bl7R/19fPdvn3vOWeHs89Wt24VMyYUJIvkJEFyzlmSCJJzkChIEJCgkoMEMaGSc/71XKsKxH327XO7eZ7pqqIKrDneMecc410vR5Cvvb09NfYfy7/8v3zt/55vv2%2bP9%2bN1tD4NZODFA/pao1j43K6%2bd3d3lz0lDt6PJjS/SPM99l/bOfhMe3vKz22wt7MAW5/Y2/ygCXnM1rRcJTanYecry1/qGWr1oveZK111LhLujHXF82Ewn9n3bazMjnNkP/Fvyf9J/gff3/vT%2bPZBv4WS4MHX7iwbS%2bPMfezg66ch1laX/wS%2bXTXRw58HFZC9Q%2bDufgNiZ1WS/QzbX9nTBtszctUEO3NsL3Wy%2bbWUrZkyVt7n8Hkwnq8jj/g6VsjCx3YNAH/GgL0/IPDda/8idne//ezO9iZvJ4bp6minrKSEsqIC8rMzyc3OpaWlhTcjI0xPT7O0tMDG2hdZwbew8VYSWOKPC6MBZ/eADXs7KwLAB/mZz2ribM/Kz80egKA83119DattsN7FznwtS5MZzE9kMzdZwuL0CwFgTAvA7rYafwTjz0D4U%2bofIoma%2bM4Wo4OdVJWkk5UaS0yoF35u1gR6OuBkY4qDlSluznaE%2bvuS/jCdoqIKnja0MTjYy%2b7aG1jrk%2bRmtATb0yYuq7%2b3pQVCYkdA2vyoobwCwtYX9aqGyoav7K68ZHe5ib3lZ2x9LWFhIo358UzmJgpZ/NTG8gEAe9ua0Kbzx2S/MUDes73MrqyQGlsLarAjlJYV2d1ZZ3xsgOqyx0T62eF7zxhvFzN8XEzlsQlWxlcwvnUZa/Ob3DW%2bjpO1KS72Njjb2eDnG0pgUBLFxZWsLk7J7/ty0As0i7SuWfHdNQ0o23PsbUyota9JfFr7%2bNNBP9hd6ZDk62ClUSqiSgPAWBpz41kCQMthAP6bJbC7yc7aJ7aWp9iUmt5cHGVrcYSlL92szE/Q2lRFaOB9Ivyd8Xcxx9LoIjevnMDg6m8Y6B7ntjzWu3Scq%2bePYaqng%2bG1cxjduKSGuaEhVmZ3sbawpbikjndTb5VC/9Z6lMS3JuW6omGcAMDGmCQqLNj%2bcgCCpjF%2b1ACw2iUMeCpl0KKWgALA3JvUQwCM/hdN8L%2bgv8KA3fUvKgBrCyNSQ71sLQ0x0ldDdIQPni42eLla4el8hwBXM5wsdDl/6kcu/P4jl07/hO6Zn9G/fBRdnZ8xuHQUvfNHuapzjGtnj6N3WYc7hgY4Wtlib2lPTnYJvb0jzH55z0GZ7izKZ9jSMkAeb77TrLwAgArCfmia4%2b7qKy0Az9ldeKplQCrzk9ksTbce6gH/Ygx%2be22XHQFgc/kdq/PDLM%2b8YnFmkCelWdje1cdYX1ZT7xz6V06hd/EYRtdOcEmSPnP8r5w78QMXf/8BvQt/5/q5nzHSPYrFjRMYXjqGiTDDSv8ybpamRHh78%2bhBOnk5T6iqaqX9eTury3OHhpB2WiiM2P6WLGoDnNU2Q3m/jMm9tV72VhrYW20WBtSwOPGIhfE0Ft7msiwAHJSAto39i/mu%2bQS7G18FAA0DVuf7hfZPCPR2xc/LGXOja1w89XdZ6V8lfuHiyR85f/IHzhz7C2d/%2bxuXT/0kK/8L94xPE2B9gQfu10n1vEGa5y1y/O9SEOFBxaMU6kqrqSp/RlVlC6WlT2l61szK0rz2s%2bxoPq2iBbQNT%2b0H2wvamFevSJPcXRuQ5FtlCnSyLT1gcTJdIoPFqTwB4LkA8GYfgP%2bOwNEAtbs5LyXwTmKCD297iI0IwM7CAMObl7h9/SxXzh2T1f6JS6d%2blvhJkv5ZaP4LhpePYat/kmjnq9TGWdKZYcfrTHtey7XnsSOvH7vxKi%2bSrooiXtQ10tc1QFd7P7k5lRQXVdH7skdG5dK3z6P2hC9aHTCrBWH%2bAAilMe%2bu9UsjbJRe8ZLt%2bTqWpjJZeiv1P5UvALT83wKgYcju1qI0wo8sfp2g%2bWkVHk4WAsBtDPUuckv3FEZXdTC9dhpLvdM4GOhw3/QCEY43eOxnxJMoM7oznBkr9WS8zIuxEg/GSzwZK/ZkON%2bLgfxgesozGe18ybuxD8zOrtLW2kO2gFBVI2OyV8ajTBqNGlzXUF9lwYxWA8wdYoAWAKUHrLUKADUsv5Pan8rWMqD5cAn8SwgOAbDM9tpnertbeZQQjpu9CfYKA66fw974Km7mNwh1vM0jPzNKwix4GmtNW7I93Y%2bc6M10YSj/PiNF9wUEL94Ua5J/U%2bylAjCY78dgSQzDMk3eDo0xO7Ms0%2bCr6ISn5BY2UVhcz9zsZ21T3NKu%2bqxm1RVdoDRJ9SpMEaW4uz4ifaBdxuVLaQkNrHzIEwAUBuSy9FGe/ysGHK79w/p%2bce4j9ZVFxId6E%2bHnJiLHHncbE2K87Enzs6UiyoH6BAeepzjxQqLzoTNdaU68yrhHX7Yrg7lukrAmhnKV5%2b70Z7vRlyXXgmAGnjxipK1ZSuwT8wsbvGgfpKKqk/SsGhrqm5QZqI7kb3W/H0tq7e%2bpumRNA4CMQBWAxQZhgCT/Nl1lwNLHWmniQ38OwD/pgn2zon399Yt68lKjSQh2JycplqzEBGJ9PShOjKYi3ofGZA%2beP/QUANxk9Z1VEFQA0p2FBfcYyJGkJYYEiEEBYCBHSd5VeoELPdk%2b9BZFM1Cbz3j/IF8%2bLzMyOEVNbSf5xU08zizh7fiQfIotYePcgez91gMW1VAZsDYoK1/C3nqr2gw3v5SIJ8hm%2bUMxyx%2brxCx1/zMAGiH0z4pwd1cRJdtMjnaQFutLoLsN8QFOlKbFUFuQT3l6KtXpSdQkBvAsxZfnj/xpfehFW4qrgKCwwEka3j21DHofO9OfdU9lggLAkDBgMMddXnOVxujB6/xQ%2bioeMdzexruJaYb6xnhS1kRW7lPiEvOpra6RDzSvmfna%2bc/2Z60P0ACxPwV2lyqFAaIIN7qkHFpVabyz2MT2QhNbCy8OA3A44b3vZ//WCpurX9lYeU9eegT37U1xtzUmIcCB8oeh1OVn0VCUR13mA2qTA6hP9qXpoR/P03wEBA/aU8WKpt1TGdD3WAPAgJTCmyJPRouUXuAt4ctgnqcwwIue/BAB4CGDLfVMDk8y2j9GRVEtjx9XkpBURHJKDrPTgwLCvvD5eCCK9kFQdMDu%2brDaA1CS3%2biW6FGD9ZcHcUTjOfe%2b9%2bGHpO/W2gzrix9k9n9iTv7TiACZ9waX8ZDmlxLsTMXDEOqykqjPfURdRiy1KYHUp/jRmOpHS6o37Wme0vk9ZczdV0ddf7a7UN5drXsl%2bfFSPwl/mQj%2bjBb7M1QUTH9xpPSBNAabannTO8Tb0SmelteJcSoiISGbgIB4WhobYHNK6wGm1T2BbxNhTtMQN0YFgC4BQATRxmsNCGvSE0QZ7knye%2bt9Gim8t%2b/rD9W5IjQ2Vz5L8u9F9Lxna/Uz78c6cLa6LUrvLG7WhuTFB1CdEcnTzFhJPoaa1FAVgIbUAJrTAmhN86Mrw4/eLF8JLwkPtdH1ZSp0d5OQppfjJeFNX47Ufo4vfQUhAkA0/eXJjLTUMvq6nwlhwXDvKCX51SK5U/DyCCMtNZf56WHpdW%2b1LJj5vh%2boALyRJEUMbY7LY7kqQKy/0jJB2LExqS2B73ZidtQZqySsrLwCwOr8lDr6RnobuGt4ldvXLmBvdovsGH%2bp%2b0iq0sKpllKoSg4WAIJoSAum9XEYnZlhdGcG8TrLn1ePPXmZcV96gTvtyW4S7tIf7tOa7ElLkif18fcpj7pHQZj0lWg3KhO9aC1%2bxETfIONDk7yfnGa4f5KUB9m4uQQQHpEqHqSLjcUxtlenDm2GaKWwMhUUBiixrRglKZFNMVObbzTJy3PFMB057LfV2SrjY2djVrPyAsCaXFcEgN2NGUZ7n2Emev/W1QuY6%2bsS5mFLrjTEsuQgKiQqk4KoFSAaH0fTlhVNR1YkLzJCaBMmPE/xVKNFEm5McOdZvDu1MS4UBTuQ5G6Bu%2bkN7lw9x40z4hZPiVE69xsWNy%2bTm5KilsDU%2bCe%2bTC/S0tSNp2cI7vel99RUCwATskBvNA5wf3dIaYpKX1jrUZNGYYP6/WkNCKqDnFfH5pGDvQBlru6sqSNkc%2bWTSnsVALmuLgharDEx1ILJzXNcOX%2baG5d0sDO9SYy3I0UJ/pQlBVKZEkpDZjzN2Qk0SrNsUPpDkj9VMfepjHKjOtadOlnpmmgXqiKdKA62Jd7ZGIeb5zn760/89L/%2bjV/%2b8r849sNfOPHz39A5%2bgu3dQWEtCwB4DPTH%2baYHJ8mIjwJJ%2bcAMjJyVTW3IrZ2a2VCesJ7SXBCYkil%2bc7KCxmV0hiVvQTRBuoukvJYyVWNLQFASVoNEQ%2bCyu6mUH/pwwEASvLKBBBbRVNdptBfh4s6J8TmHuOm7ll87M3IjfGhQpKvz06kMTeZyofhZIZ7ECMMCbQzxNfyJlFOxqR7WZLtY0WBvyWlIdZytSLC9hZ2185irPM7JudOYXP1PPfFVPmY6%2bFtdpP7ZvoEONjQWN3M%2b6kZlQWP04uwtvYgKTGduU9DAsAI6/Oj0uyUWhe5vP5Cnfs7yy/UpDm8pcZ%2baETdERUVlSLSQDY/qU1lTdv4NPFOQJGZKu8pzY/l%2bqWTnD/zG%2bcEgIty9bI1oVCa4ZO0SBpyU3gcHYCbqMKbujqc%2bMdP/PrDf3Lm1x8xuXxSkrpGtL0%2buX4W1ETaURZsRZStHo4io41On%2bDW6ePc%2bF3s8YXfcRRz5WKgi7%2bFPjH37pIdFyteYFTk8YrogBbu3nXngdjmhS9vZMEUdzomib/RdHuZ93vLYoEX29TN0%2b9s/h/2MI9oOqi2bjYm2F4ZUZNeVag//05lwK7ogF0pjYYnSQLACXRO/orOiV%2b5LEyI8bSjNDFImmE0GVGB6F26wI9/%2bQv/8T//B0d//E8unfiFmzpHMb54HNvrYoPvXqM8zJbuh/d4GmVNuOUVDE8f5fwvP3Dh%2bD/4%2b1//yt/%2b/T849as4yIunMbtwAj8zMVMBLrRV1/JZGNDfO4arWzCpSY%2bZGW5ncfQVa5/HhekD2tWXMbfUyNZ8o8YY/WFD9/BO9xF1D21jSg1EOGwtD/0JAMsihhbo7yzB6MZZThz9iZNHf8b4%2bnlyor14IvR/8igKG1N9fvmbJP37USylrp2NLuN8%2byJmAtrN01LPOr9KvZ%2bhRFZ%2bqkRGZKoDoRaXMJD3Xz/%2bC9b61zl3/Bg//fv/RO/sKdxMbxFgbUycozG5/nZSXmkyEcb5%2bnmJ2LjHZD5IFe8QR0%2bYK5PyGZC5rmr/pQZ2F2rYnK2ThZv/Xt7/QeZ/A2DzrfyCEbaXDzFg4RsAW5sLfHjThI3ZNX79%2ba%2bc%2bPVnnKROK1KCqZFRmBHhzXWp4dsXT%2bFieg0nY11ZwROyqj9L/J1Lx37i2m8/Y3rxKIUBlnyujmSswJtMt5u46p3CSkByEHDtr5/FRvd33PQvEGJlQFHoPWrjXHia6Emz6I3BFx0szK1RI2VQmPKQdtEf3bF%2b9N83lakmRmmtWVRylciBMmFFsbBiSDMF1Pr/wxa/NMQj6mhQ9uJFFOwDsJ/4PggKAJsb8yI8XuJqa8jRn3/g%2bD9%2bxNPOmPqsKKF/FGGuNtjc0sXF%2bBrmume4dPIf/PU//o1/////P87//htWNy5zXQAwv/wbFeH3%2bPAkirdlETyLcSDD5QZxNlfwNzyLhzDEy%2bAcgWa6pLoaSq%2bwokVMVWtGGB0FyfQ1N/Hl0wKDoglKM/LktQiGSoQJ4S4s9RZJGYvWny1l60sxq5/y1X1B%2bYb2psohr7OnubdwZE8ZHZK8AsL/CYCNtTk2lkaJFP3/i4ypY7/8iJfI4daiB5QmhxB6zwLPuze5e1WSPyblcfUiF0/9xt//898wvnQap5sXsdY9jZfpZWpifRgvEQDKo3mdE0NDtDVPw02pDDah1N%2bI8kAzqiOsaHpgz/NkR9ER7nRkR9Jd%2bpjepmdikD7x7t0cRcnp1PraM5wbzmheIl9f5GoBKBMAilibLhZNIwurbJ99t%2be5zwAZg4iJQLnBoNxfExB2VsZU5XcAgiKCtpZYX50RX/CWjsZcTv7jr/zy099EDt%2bmrTiRgjhf4rysCbA1wOn2ZRz0lbiCzY2LWErSjtd18JRVjbK5TrKbMZVxAQwXxfKuIorR8od0pAfTkii2OcmBrmR7XqY68jLNhc40Vwk3OtPFT%2bRF8aoim4HnrUyNfeTjx0UaC0qotL/Ny6C7AkAM80P1sCr1P1cuABQKACWqZf7zjV%2b0TXBzWpv8hDoFdlbefA%2bAdgxubcypbvDdUCtm0uB%2b/fuPOFjcEgYkUCgApAbYE%2b9hSYIAkSyrEu5ogpeJLl7Glwm6c5VHboYUBlqS5WtDbaIYnrxoxguDmahIZKA0jedintqTnOhOEdv8yFUco%2bIdxB9k%2bfE6O4DXhbH0Vhcy3PWKj%2b9m%2bPhhgYnBN%2bIuo3jufJWe2HssTbQIAM8EAIUBBWoJ7Cg3Sg%2bNwT/ucxzR0F%2bZnyNSAoNSAkOS9NR3JbCzsSg/ss54cyllYV5EulpzQ0aUhbjCprxYihN8yYl0JyfCjcehLmSESAQ5kuZjTaaviJ5QG2qinKgWjV8YfI/nj2PE90cw8NhPbHAUb54WM1iVS3O8E80x1nSnKvsGXmKQ/OnLDaI3L5S%2b0iQGn1Ux8rKXT%2b9n%2bSyTYKRvhKGyVF6HGfNaesXyxHNYeSolUCzGMI%2bVjzkCwKdvABwObR84onZ/VUKKnRQwVAYoACgjcF5TAjsbym7sKi/C7CmU1cwJvEeYkxnWhroyAUIpeeBLUbyvMMGH/CgPNUpiPHkS56l276ZkLxrF3NTEKIbHi/acRKF9hNDbnw5xjZ05SYw%2bf85ATZn0AWuqgixoiRM2PPSgR4xUT24IvSUPGGioVAH4MPWFL19XGOoZEnaEMSkWeyQ3gtlhhQH17MwUsfk5l5UPAsDGh//jbX%2bNENI2Qo0Q%2bmcAtlUGbNAd50aV1HmFyNx0b1u8bW6TF%2btJcby3mnxxvHgC8QWV4gtqkwJoTA3k%2baMgCbHHyT7iB8QLSMOsTgoTIPwpCfMgS7zEYy9nHvp4kBceQoGwJtf1NsXeptRH2tMmrrEzw5eXeZH0VBUw0N6pMUZfVhno6hVH6cNIYSSDDfV8HWmXMSg9QG2Chax%2bzP0TAA4DoWWAxhtLKCWw1C9JvxUHqAFAcYLb6wvqdtirzBBKrfXFzAjlpdYD797iYZAzJQkKAN4CgB/lDwKoSw3lWVoozzPCaXscSuujQNXulsmoyg/zJNjujrg/AwKtzQmyNsPN6JZMiIsEiPApkpIp979DiY8pZXKti7CjKcFV5n0QncVpvHrWwNjgBJ%2bmVxjs6uFJqJOwK4C%2bpzWsTnfDUpVmDH7O1zJg%2br84vLEvhBS/rG4dDUoMaAGYPFCBKwLG9sa8ugnZV/2IAum65YFOpFtcI9nBROywt0hhH7UMyh74qwA8TYugKSOKFgFAYUBTkjdPwu3J8LYkRHyCkc5JDCTsb12VqXEDh9t6eFqakOBuQ6WUWW2ELRVSBqUB5pQGWshItKdBSqklK4a2iiJ6Onp4OzXPyKs%2b2lP96ZLvT3RI7S92wWIZuzMFbE4r9wAyZPHe/2Gv8/vbfTIGxUSsvmR3SfTzcidbC70qAzTJ7/eABfmBdab6GqgMdSXH2Yx0k0sUy%2bo/SQsRNegnDlAMUUqQWOIQGkSdKQA0PQqlUV6ri3UV%2bWtNmsddop2sCLQxF81gLGpRD1uD6zgY3cTH2oQ0bxthiYM0WjtpnuZkCgvy/MzEOVpSJV2%2bTkqqXuRwe10jw0PvmRge401jIR96G1j%2bMszGbDNbX3PYmH7M6vs0ZsYS2Vp9810TVG%2byHhJFR5a/PGfpUyPLnxtZmm5Uj7Esz2kYoNphFYB57RbZB4YbC8hxtyBB/xzJIlXzxQtUSPK1j4NFEYaqu0NPRRk%2bFUtcnxpMbYIn5ZJUSbANmX72JHg6E%2bnuJC7yDt6StLeVCUF2kqyvnbDEmaooFypjZKIE2hLtfFt6jRmFMudLhAVlCeI70uNpKC3jZUc/k2PiAhfFvS6Mq7e5Po5Vy5iMYbInjsnXMQx1hLAhwu7wERv1aM3BbXcB4OObOqbH65n90MzM%2byamp16wMveWpZkJedwjv3hCLQFl00T52lz5QmN6OElWt4kw1SPVS2xtihYAkauVD8OoSpVrcjBPHvhQEeNGcagdhSF2pPo5Ee4mBsjVUUBwJtbFjmiHu0TYmBJsehNPvcu4XD2PmwgoGxFQ5uIPIhz1yRMACkJtyZNRm58oxis7k%2bf1bYwMjDL/qV8W7ZV6l2d8sJKOhihJPIE3XQn0tgaLVf4DAKoqPATAm74qxgaqmRyu5q3Eu7HnAsAk859HxHkJO2bGhAFzyj0xcVZrai8YbimXERdIQYSXCkC%2bSNtqaXZP0oIok8TLkoIokYZYHONBQbgT%2bbL66f42BDlbEOFuT5S7Iz53THC%2bdgWrczqYnzqF4dHjGB89itOFs7iLjLY4fQzzc0dxM75AhjTDAukhmeL6MmMCKExLpq68jv5XA3yS2T81XMvq3BijfRVi2YPpqI%2bgqyGYrmd%2brC%2bP/nMTPHTw6kjrs1zam/Ilcul4ns9w3zOWZNUVEJQJoJkCs5rbUTsbygkg%2bc%2bmeJYVS74AkBkkH0qET3GiNyUpvmpTzInxIjvyPllhLvK6Pel%2blkRL2dy/q889k5vcuXgOw5MnuH38N4x/O4G9zlmijfUpcLlLnqMlmfYW5N2Xx753iLS/RpKnMekCYkqgiKtwb7KTYinJLuRlexdLX0dYmO5nbX6MwZfFFGTcoyzHnfJcZ5qeuIt6HT%2b4v3Ew/g5viDwpSeGJuKmyohSqytPp6a4T2mvG4MrBGJzT3o8TFkgoR9o%2bj3VT/TBEBI8Im5IkXlSnkJ9wn3RRgykhrqQKKMoHfuhvK9S3IszFhLs3LnDyb3/h2jFZ6etXCDAyINLUiIcyCgtdrMhyMJO%2bYsRjt7vSNxx5EmVPvkyDhz7SIAOtSfR35EGgO49iwslOSaO7tUUSHxcQhlUGjLwuoCTDkrw0K4m7NFW4HGLAoTOJB4ctBIDOhiTa65NpqUmmuTZN1FWd2gO%2bE0IqADuaXWNlM1HtB7tSX9PqbXJFIyzNjFKS6s1D8e8xfg7E%2bEr42JEgwiZFZnu4AGBvcAlbvYt4mekTeMeIYHNDAo1vig2%2bgY8SRnqEW8tqe1pSHGIrADhQHG5LRoAFKf7WxPk6Eu1zj8TQAB7FxTP8uo31hTEWvwypx10%2bDBfTWWlF%2bxMbOmocGXzuKw528PspcHCkTTMJjqzNvmBt5gXrM%2b2sfW2TcdKl6oCVAx2gBYDdQwDsaI/V7aqhskLGZGtliqy%2bkyTvSOh9G8I9bIj0sOKBj6XUvRn%2bNrcIdTQmzs2KGKF7kLUhHiZ62Enzs7x2AReDa0TaGPHI4w5FQvkKUYKlAkKWNNAUseEx3jJBvO4RF%2bhDdnKCNO1%2bdUdYYcDS11HWvzaz/v4hi2NxLLyJZ3Y0ga2V0X92gzIJdlYn1fsJR9TDiVtT2kOKI%2bxohdDKwmElOKsFYFt7SGlHy4hNtS8ox%2bOU19%2bPtpES6qgCEKycC1SSdFUa3x2i3MwJdTIiysWcOHfpCffuEGJnqO7%2b3je5gZ%2blAamiE/KDrKiIdqA63kXiHuWxzhRIM30c6U%2bsrzuR3m5EeN%2bntiSXraUJdfUVABYlNudesDebz8aHh6xMJjE3Gsf6fOf3TVB9vCk/OywL3i1KcL0fTSj30vvYmn8pJTD%2bHQO21mfU5qe5h7Cl9oODe/RqbKiHGJW7R/nJvoTJ6gdITXs5muMrpinQWcackzEhEhH3zIgWEKJdzIiU51FyTfG1pSBSRJUkXZngTE2yG3WP/KkVCf0kRfxFWhy5yQ%2bI9vMkxN2FSD8/XjQ9kyQmvwEgQmhztl1UoALAI1anUlgcT2DlU5kyvL%2b7za98Kau/NvNaAWBYc/9svU%2bcVI8owdfSUCYO9gI0AMxqANgvAe1NBZUN2hsqu%2bqE2KChJJFAWV0/57u42xhLGOJlb4Sfg5EKQKizCdGud9R9g1Rpkuky2jJCnUkNsFNLJTXAhkdC%2bTxxkyWiKiseJ/AkL5f0%2bHjCvMVH3HcnKTKWl22tbP4RgHmRwkt1YoZK2BYpvPlRUYRZ7KxNfNcI1dOsG19Yn%2bvTMkA1QgoAfWwvKlJ44nsGrB1igArC4dhQNxc1ZbBNd1MBAQKAh60pLtLRne8a4CLjz0OcY4isfoSbBXHSHJOVSRHmToJ09nApCQ%2bpfUfzWwQ43yHYWcpFyudBoAvpcaFkpSYTGxJKoLubgOBFclQcr1%2b0sbU8qa3/fQCE7ku17C1UsTcnnuBrIVvT4gu%2bVKoHLL%2bNQ83By415lQGD6maIAoRyRlcBYGXuvwHA/urvA6CKpG3G%2bhsI97TC1dIIW9H61obXsZOr8x19PIURYW5S/9720iecCPVQSuUOvuItPOyMcbxjgIMa%2bjhb6OPraCEJS937%2bxHi4SnvcyLE8z6JEVH0drarJ9UOM2BjroO9xVp2F6phvlyMkYChWOPpfLbmmjV3vw6dgFfOFBxRjptqekDfAQAqA%2bamDnSACoB6a%2blQCRw81txr0wCwyZepVySKSXIXnW91%2bxom1y9ipnR56fA2hnoqMD5OFpKMJfesjLE318daJoGV0Q3M9a9iLO81u3UFSxmLdma38XF0UGkf4OIkj23lsROpUZEMdHeoACwIAAoIC58HxQy9gJU6YXIN2wttvOwd4MOkWGRhw/Z0LhtfqqVPvdUCIUzYXVUYMMA3FgyyszygArCsADA3pQXg64EQ%2bq4H7DNArf9NFdj1xSnSIj2F0mbYi74307uE4dWzGF07j6kkZ2Eg8tf4hiR9EwuxwkY3dDEQ6at/5QJ6l86id1GHW5d0BLhL2BjdwrFLi80AAApUSURBVNPWCn9ne3wcLPEW0xR6346H0eEaAJbGmZ9WRqF09IW3YnzeMvtlkDdvemhs6yYkqYyalkHpCfXsfHzEzqdM1j/ksT5dyubMUza/Vin7AUPqTtDeurIvMMTuypBmDO4DILG1qgVgb7/mtw4A2G9%2bHz9P87TtNQODr0iO8MbN0hgrw2sCwEVJ/hz6l09zW/eM%2blgJ5a6S0TXlbOE5blw4zY3zp9TrzYunMbxyVr01bivl42phJGCa4m5lqN6HDJOySY0KprO5WWTuZ1bEsb6bekNxRQ0lVc0ER6fjHfqQ0JRyfBPKCH7UKq/3q81xZ1G5ZSajclk5Rd7G3kq7AsCAZgqs9apTYGe573sGfAfA9sHqaxixcVD71Y2dGDrFYuUWjq2FORYKna9f4PYVHUlIB4PLp7h54YQkqMRJbl08JSt9Gj0laW3iBpfPYKirg6kwRglLvQu4anuHh4gmf0dT4kRlZsaHU1lUQnZ%2bJWGxady190Dn4i1sHLywdw0iKDYHz%2bgCPONriXhYw9LygrpI%2b2WrGeM76vWIUvv7OoADBhwG4C2bq1%2b%2bL4FDOmC/%2b/cOjXPXIwU9yyAuXtbnzLFf0NU5yfVzkuwlSVaSVhLXExCunz3GlTPH0D2tuV7V%2bU3e9xt6506gf%2bEkhhd/x0xAczS6gretEQGiJYKkUYaLoEoMsOexOMKCtBQMDe9y7MRFTvx%2bkeMnznHL4C7BURn4xxZzP7KUkLRmxien1Aa%2bu72s/ez7h601ivbInpb%2byo1RJXZXFQDGDwBYFgAUqqkJa6UvB/fXv/0Jy9bWOrHpFdywjuSamSfHfjnKbz//wIUTR7khiRlc%2bl3ipKzySfWqrz7/Fobi/82u6XDnxlls9C/ibHwVX2sDQl3NRU5bEHnfglgvSxL9bEkTo5WTEI7RbTMB4ALHT17g16OnOXvuOqFxedyPKMT/wVM6eqbUxdndL1nls%2b//yY32VIxmT3DttWZbbFGU1GKnCKHhbwDMTqrnBVS1d/CHTVoprI1d7Z/bvB4cw8w9hauWEZy/bsXRH/7KmV9/lhU/gcmVM2qCplfPSEiy13Ww1L8gdX4ZR5NrQnU93C1uiWW%2bhZck7icyOfSeKVGSfKy3JQ98rSWsSPKzIS3YkcwIT8wNTfjH8XMCwHl%2b%2bccpTutcwyMsE6eQAh4Vd7G1uaoqVOWM4/7ZJ3VHSLlqN0W0SrBHAHjN7pLSHLrZXBhSV/5wbK3NfVv9/ZMWexp/sI/q2Lsv%2bD6o4YZtHFfvRnDhsjE6v/7IVaG6kTTBu1LTtrcvY2eohC52Rro4mirJ38TT6jZeIoZ87UwJdDQTIWQuoslcu%2bo22uRFPQaIOwxxIM3fDs%2b7t/nH0TP8elyHH38%2bjrG5K16RRbhGllPRPC7luar5cx6lcWtPkB4AoJyKUY/IqEfJhtT6V8Yga/3yM4OqHF7WloCyP6AYo%2b31%2bYMmonoC9fEW6xubvP%2b8SFP3FLG5XZh65XLFMo7LJqHoXjFB7%2bxJTHRPYWtwGWdT6ex3bkh3v4mrrPZ9KwO8JXEfW2M1/OwFACdzwgSASLc7xPtYkSirnygyOSPYntxwZ3LCnEhwMyPZ5ab8zkv859%2bOoqOji2dgKh4CgG9SI8WN73j7eZ25xVU2NzUrz66AsSWLLcZPI%2bEVHaCeoRvS3B5T/lprVQkRFQtiM2c1yauhZYKyUaocodvemGNtbZl304u09XwQxMfIrh4iIqsLC/8SrlgnctE8mnPGIVzSs5e5fhX725fwtNTHR/yBr52StIRc/R1MCZAIcRKHKFI4TNRh9P27krQ1Kf5C%2bUA7MsVlFkW7UhrrTp4KgCkZ929SHXKDGNvTeLl74hWVh39iNfeiash7Ok736BIvBmboHZtl9N08H2dWWF%2bTfrc9ovnjK/WU2OYn7dkaYcFaj2qJ2RqXkTjI2pyAMDOphtIL1I2ShQ/Mzc0x/n6O9r6PlNQPk1LYSXxOBzE5r3B/8BwzvzJ0bVK5bJnIZasHnDaO4Ky%2bF6YG4g%2bEAX4ie4Md7wjVZbUdFKdoJombaxIXXxAvRumBt9Dd35Z0WfUsSbggSpN8aawbOQJGkrspj92vUR10heFCDx4kZuASnkdgahOW/sVk1YzS/WaVJ61vqW4bp7Z9jNa%2bTwy/X2FmYVlYsaaeJz6inP5SDhort8c2xc7Ozn/l89fPzM9/EpHxkeUFuUosL8hrc7NC9QUaX74nvUwkb147wcl1eESV4xlTg3tcM3dD6jH0Luf6vRwuWCZz2iRaQEjkgkUcOreDsDB3kNoVnW99m0B7E4IcRNwoJsnVQlbdSr3NnuRjK8nby8rLyAtxVClfEOFEoRLhDuSFyGtSEmUCyMvKR1RX1eDo/xDfxEqco6qwCynlQdFrXo6vUt3xntzafmHna/KfDtHa/5UX/R8YnvzCytoGR9p6Jpj4MMOnmSWhyZzQ5Sv9E7OMf1zi/dc1lTbTsyu8%2b7JCy%2bt3FNUPkl83REBSPa4R5dwLK8IhIB8bv0Ksg2ow8avhpnsJN90KuWKfwRnTWM6ax3HdLllY8YCzRqE4OPmTEBZMQoivmCJX6fS2xHjaEOthRYyMu3jp/Ek%2bGgYoAORHuVGe6MvT7Fiel2XS8bSC7udNdLd10NrURGRiLs4hWfgmN3DHJxeb4CKco6vIqZ%2bkquMTUdmt8lodGZWv6Rz8Su3zXp53DzL2YYEjaaUvSClopbJ5kI7%2bdzR3v6Gx6w0DE18l6VVpJKsMTc7K8xn6xmYobhgio7xXGNDFvdBiDJzTMPfIwsIrH3PvUkx8nnDDtUAin6sOj7lsk8YpkyiO6vlxyTJeIoGzZlGEJ1dSWfOc6toWaqobeFJeSXlRESU5WRIZlOdlUVtaSHPNEzqan/G6s4u%2bnj4GB4fp7x/i9ate%2bd4Lulub8I/JwUdq/35CPXe8s7GXz%2bUSU0tY9mvii/uxDS6R6VRBY%2bcobb2fqHjWTU3TCzr733KkR1a8vHGQ%2bMxn5DzppPnlBMV1r3hY2EL5s166Bj7wdlqa3ddVJuX65sOSWgKPyjpJyn%2bOrV8O581juW6fxk3nTPRc8oT%2b%2bejaZ3LGLJ7j%2buHomMZz8nYYf9f14vydOLUkrlgnkJxZS1VtGzX1HdQ%2b66Kh%2bRVNra9paeuhtb2Xjs5eXr7so6ennwFJemRomDfDEiNDjA0PMDX8ivbmRhE%2bBQQ8bMLjQT3OMgJdYyoJedxO1tMpInOlL0WXklXWRMOLIZ52vKWy8SXldc0CQjdHnrYP0zX4gcqmfuKzGkgrbqWhY5T0kjaCZJXisxsoqn0paL1jeEopkS/ClPfUtA6TVvKC6IwGfGIrZOzFctIgTCgfx9k7SZwykue3I4X%2bD2TVUzlpGMlvAoYSutYpXLZNFdY8pqxK/j/xEUo8a%2b5So/l5N61tr%2bju6qGvt5/hQaHryDDjb0aYHBthYlQAGOpjcqCTivIqtQxD0uXzPnpOgMjfoIw2/NPkedYredxK6MMqCiuFaS39VLaMUtX0ioqnzRRWPON/Ax5pmSpMu1X/AAAAAElFTkSuQmCC' /%3e%3c/svg%3e"}},270:function(t,e,a){"use strict";var n=a(258);a.n(n).a},272:function(t,e,a){"use strict";var n=a(259);a.n(n).a},281:function(t,e,a){"use strict";var n=a(2),i=a(98).filter,s=a(70),o=a(34),r=s("filter"),c=o("filter");n({target:"Array",proto:!0,forced:!r||!c},{filter:function(t){return i(this,t,arguments.length>1?arguments[1]:void 0)}})},285:function(t,e,a){},286:function(t,e,a){},287:function(t,e,a){},288:function(t,e,a){},289:function(t,e){},291:function(t,e,a){"use strict";a(164);var n=a(327),i=a(323),s=a(318),o=a(320);function r(t){if(t)return function(t){var e=new Date;return Object(n.a)(e,t)<=30?Object(i.a)(t,e,{addSuffix:!0}):Object(s.a)(e)==Object(s.a)(t)?Object(o.a)(t,"d MMMM"):Object(o.a)(t,"d MMMM yyyy")}(new Date(t))}var c={name:"u-post-meta",props:{meta:{type:Object}},computed:{postedDisplayDate:function(){return r(this.meta.date)},updatedDisplayDate:function(){return r(this.meta.dateModified)}}},l=(a(272),a(1)),u=Object(l.a)(c,(function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",[t.meta.dateModified?a("p",{staticClass:"post-meta"},[t._v("Posted "),a("time",{attrs:{datetime:t.meta.date,title:t.meta.date}},[t._v(t._s(t.postedDisplayDate))]),t._v(" and updated "),a("time",{attrs:{datetime:t.meta.dateModified,title:t.meta.dateModified}},[t._v(t._s(t.updatedDisplayDate))]),t._v(" - "),a("strong",[t._v(t._s(t.meta.timeToRead)+" min read")])]):a("p",{staticClass:"post-meta"},[t._v("Posted "),a("time",{attrs:{datetime:t.meta.date,title:t.meta.date}},[t._v(t._s(t.postedDisplayDate))]),t._v(" - "),a("strong",[t._v(t._s(t.meta.timeToRead)+" min read")])])])}),[],!1,null,null,null);e.a=u.exports},292:function(t,e,a){"use strict";a.d(e,"a",(function(){return s}));var n=a(87);var i=a(47);function s(t){return function(t){if(Array.isArray(t))return Object(n.a)(t)}(t)||function(t){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(t))return Array.from(t)}(t)||Object(i.a)(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}},313:function(t,e,a){"use strict";var n=a(285);a.n(n).a},314:function(t,e,a){"use strict";var n=a(286);a.n(n).a},315:function(t,e,a){"use strict";var n=a(287);a.n(n).a},316:function(t,e,a){"use strict";var n=a(288);a.n(n).a},317:function(t,e,a){"use strict";var n=a(289),i=a.n(n);e.default=i.a},319:function(t,e,a){"use strict";a.r(e);a(256),a(257),a(32),a(281),a(105),a(69),a(37),a(21),a(97),a(107);var n=a(292),i=a(96),s=a(267),o=a(255),r=a(249),c={name:"u-comments",components:{"u-content-box":r.a,"u-heading":i.a},props:{title:{type:String}}},l=(a(313),a(1)),u=Object(l.a)(c,(function(){var t=this.$createElement,e=this._self._c||t;return e("u-content-box",{staticClass:"comments",attrs:{tag:"section"}},[e("u-heading",{staticClass:"comments__title",attrs:{center:"",level:"2"}},[this._v("Comments")]),e("Vssue",{attrs:{title:this.title}})],1)}),[],!1,null,null,null).exports,b=(a(164),a(36)),d=a(296),p={name:"u-edit-post-button",components:{"u-link":b.a,"u-icon-github":d.a},props:{post:{type:Object}},computed:{url:function(){return"".concat(this.$static.metadata.repository.url,"/tree/").concat(this.$static.metadata.repository.branch,"/content/posts/")+new Date(this.post.date).getFullYear()+this.post.path+"index.md"}}},h=a(0),m=h.a.config.optionMergeStrategies.computed,g={metadata:{repository:{url:"https://github.com/RehanSaeed/rehansaeed.github.io",branch:"develop"}}},f=function(t){var e=t.options;e.__staticData?e.__staticData.data=g:(e.__staticData=h.a.observable({data:g}),e.computed=m({$static:function(){return e.__staticData.data}},e.computed))},v=Object(l.a)(p,(function(){var t=this.$createElement,e=this._self._c||t;return e("u-link",{attrs:{bordered:"",to:this.url}},[e("u-icon-github"),this._v("\n  Edit on GitHub\n")],1)}),[],!1,null,null,null);"function"==typeof f&&f(v);var w=v.exports,y=a(29),A=a(151),S=a(295),k=a(20),x=Object(k.a)("Facebook",512/448),C=Object(l.a)(x,(function(){var t=this.$createElement,e=this._self._c||t;return e("svg",{attrs:{"aria-hidden":"true",focusable:"false",height:this.height,width:this.width,role:"img",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 448 512"}},[e("title",[this._v(this._s(this.title))]),e("path",{attrs:{fill:"currentColor",d:"M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"}})])}),[],!1,null,null,null).exports,M=a(297),j=Object(k.a)("Reddit",512/448),O=Object(l.a)(j,(function(){var t=this.$createElement,e=this._self._c||t;return e("svg",{attrs:{"aria-hidden":"true",focusable:"false",height:this.height,width:this.width,role:"img",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 448 512"}},[e("title",[this._v(this._s(this.title))]),e("path",{attrs:{fill:"currentColor",d:"M201.5 305.5c-13.8 0-24.9-11.1-24.9-24.6 0-13.8 11.1-24.9 24.9-24.9 13.6 0 24.6 11.1 24.6 24.9 0 13.6-11.1 24.6-24.6 24.6zM504 256c0 137-111 248-248 248S8 393 8 256 119 8 256 8s248 111 248 248zm-132.3-41.2c-9.4 0-17.7 3.9-23.8 10-22.4-15.5-52.6-25.5-86.1-26.6l17.4-78.3 55.4 12.5c0 13.6 11.1 24.6 24.6 24.6 13.8 0 24.9-11.3 24.9-24.9s-11.1-24.9-24.9-24.9c-9.7 0-18 5.8-22.1 13.8l-61.2-13.6c-3-.8-6.1 1.4-6.9 4.4l-19.1 86.4c-33.2 1.4-63.1 11.3-85.5 26.8-6.1-6.4-14.7-10.2-24.1-10.2-34.9 0-46.3 46.9-14.4 62.8-1.1 5-1.7 10.2-1.7 15.5 0 52.6 59.2 95.2 132 95.2 73.1 0 132.3-42.6 132.3-95.2 0-5.3-.6-10.8-1.9-15.8 31.3-16 19.8-62.5-14.9-62.5zM302.8 331c-18.2 18.2-76.1 17.9-93.6 0-2.2-2.2-6.1-2.2-8.3 0-2.5 2.5-2.5 6.4 0 8.6 22.8 22.8 87.3 22.8 110.2 0 2.5-2.2 2.5-6.1 0-8.6-2.2-2.2-6.1-2.2-8.3 0zm7.7-75c-13.6 0-24.6 11.1-24.6 24.9 0 13.6 11.1 24.6 24.6 24.6 13.8 0 24.9-11.1 24.9-24.6 0-13.8-11-24.9-24.9-24.9z"}})])}),[],!1,null,null,null).exports,U=Object(k.a)("Share",512/448),T=Object(l.a)(U,(function(){var t=this.$createElement,e=this._self._c||t;return e("svg",{attrs:{"aria-hidden":"true",focusable:"false",height:this.height,width:this.width,role:"img",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 448 512"}},[e("title",[this._v(this._s(this.title))]),e("path",{attrs:{fill:"currentColor",d:"M352 320c-22.608 0-43.387 7.819-59.79 20.895l-102.486-64.054a96.551 96.551 0 0 0 0-41.683l102.486-64.054C308.613 184.181 329.392 192 352 192c53.019 0 96-42.981 96-96S405.019 0 352 0s-96 42.981-96 96c0 7.158.79 14.13 2.276 20.841L155.79 180.895C139.387 167.819 118.608 160 96 160c-53.019 0-96 42.981-96 96s42.981 96 96 96c22.608 0 43.387-7.819 59.79-20.895l102.486 64.054A96.301 96.301 0 0 0 256 416c0 53.019 42.981 96 96 96s96-42.981 96-96-42.981-96-96-96z"}})])}),[],!1,null,null,null).exports,z=a(298),D={name:"u-share-button",components:{"u-button":y.a,"u-dialogue":A.a,"u-link":b.a,"u-icon-email":S.a,"u-icon-facebook":C,"u-icon-linkedin":M.a,"u-icon-reddit":O,"u-icon-share":T,"u-icon-twitter":z.a},data:function(){return{isDialogueOpen:!1,isSupported:navigator.share}},props:{title:{type:String},url:{type:String},tags:{type:Array}},computed:{internalTitle:function(){return this.title||document.title},internalUrl:function(){var t=this.url;if(!t){var e=document.querySelector("link[rel=canonical]");t=null!==e?e.href:document.location.href}return t},encodedTitle:function(){return encodeURIComponent(this.internalTitle)},encodedUrl:function(){return encodeURIComponent(this.internalUrl)},encodedTags:function(){return this.tags?encodeURIComponent(this.tags.map((function(t){return t.replace(/[\W_]+/g,"")})).join(",")):""},facebookUrl:function(){return"https://www.facebook.com/sharer/sharer.php?u=".concat(this.encodedUrl,"&quote=").concat(this.encodedTitle)},twitterUrl:function(){return"https://twitter.com/intent/tweet?text=".concat(this.encodedTitle,"&url=").concat(this.encodedUrl,"&hashtags=").concat(this.encodedTags,"&via=").concat(this.$static.metadata.author.twitter.replace("@",""))},redditUrl:function(){return"http://www.reddit.com/submit?url=".concat(this.encodedUrl,"&title=").concat(this.encodedTitle)},linkedinUrl:function(){return"http://www.linkedin.com/shareArticle?mini=true&url=".concat(this.encodedUrl,"&title=").concat(this.encodedTitle)},mailUrl:function(){return"mailto:?subject=".concat(this.encodedTitle,"&body=").concat(this.encodedUrl)}},methods:{open:function(){this.isDialogueOpen=!0},close:function(){this.isDialogueOpen=!1},share:function(){navigator.share({title:this.internalTitle,url:this.internalUrl})},onClick:function(){this.isSupported?this.share():this.open()}}},K=(a(314),h.a.config.optionMergeStrategies.computed),Y={metadata:{author:{twitter:"@RehanSaeedUK"}}},E=function(t){var e=t.options;e.__staticData?e.__staticData.data=Y:(e.__staticData=h.a.observable({data:Y}),e.computed=K({$static:function(){return e.__staticData.data}},e.computed))},I=Object(l.a)(D,(function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",[a("u-button",{attrs:{bordered:""},nativeOn:{click:function(e){return t.onClick(e)}}},[a("u-icon-share"),t._v("\n    Share\n  ")],1),a("u-dialogue",{staticClass:"share-dialogue",attrs:{title:"Share","is-open":t.isDialogueOpen},on:{close:t.close}},[a("div",{staticClass:"share-dialogue__links"},[a("u-link",{staticClass:"share-dialogue__link",attrs:{bordered:"",to:t.facebookUrl},nativeOn:{click:function(e){return t.close(e)}}},[a("u-icon-facebook"),t._v("\n        Facebook\n      ")],1),a("u-link",{staticClass:"share-dialogue__link",attrs:{bordered:"",to:t.twitterUrl},nativeOn:{click:function(e){return t.close(e)}}},[a("u-icon-twitter"),t._v("\n        Twitter\n      ")],1),a("u-link",{staticClass:"share-dialogue__link",attrs:{bordered:"",to:t.redditUrl},nativeOn:{click:function(e){return t.close(e)}}},[a("u-icon-reddit"),t._v("\n        Reddit\n      ")],1),a("u-link",{staticClass:"share-dialogue__link",attrs:{bordered:"",to:t.linkedinUrl},nativeOn:{click:function(e){return t.close(e)}}},[a("u-icon-linkedin"),t._v("\n        LinkedIn\n      ")],1),a("u-link",{staticClass:"share-dialogue__link",attrs:{bordered:"",to:t.mailUrl},nativeOn:{click:function(e){return t.close(e)}}},[a("u-icon-email"),t._v("\n        Email\n      ")],1)],1)])],1)}),[],!1,null,null,null);"function"==typeof E&&E(I);var R=I.exports,H=a(265),L=a(266),P={components:{"u-content-box":r.a,"u-edit-post-button":w,"u-share-button":R,"u-tags":H.a},props:{post:{type:Object}},computed:{imageMeta:function(){return Object(L.a)(this.post.heroImage)}}},W=(a(315),Object(l.a)(P,(function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("u-content-box",{staticClass:"post",attrs:{tag:"article"}},[a("header",{staticClass:"post__header"},[t.post.heroImage?a("g-image",{attrs:{alt:t.imageMeta.alt,src:t.post.heroImage}}):t._e()],1),a("div",{directives:[{name:"g-image",rawName:"v-g-image"}],staticClass:"post__content",domProps:{innerHTML:t._s(t.post.content)}}),a("footer",{staticClass:"post__footer"},[a("div",{staticClass:"post__footer__first-row"},[a("u-share-button",{staticClass:"post__share",attrs:{title:t.post.title,tags:t.post.tags.map((function(t){return t.title}))}}),a("u-edit-post-button",{staticClass:"post__edit",attrs:{post:t.post}})],1),a("u-tags",{staticClass:"post__tags",attrs:{tags:t.post.tags}})],1)])}),[],!1,null,null,null).exports),Z=a(291),F={components:{"u-comments":u,"u-heading":i.a,"u-author":s.a,"u-newsletter":o.a,"u-post":W,"u-post-meta":Z.a},computed:{image:function(){return this.$static.metadata.url+this.$page.post.heroImage},url:function(){return this.$static.metadata.url+this.$page.post.path}},metaInfo:function(){return{title:this.$page.post.title,link:[{rel:"canonical",href:this.url}],meta:[{name:"description",content:this.$page.post.description},{name:"author",content:this.$page.post.author.name},{name:"keywords",content:this.$page.post.tags.map((function(t){return t.title})).join(",")},{name:"twitter:card",content:"summary_large_image"},{name:"twitter:site",content:this.$static.metadata.author.twitter},{name:"twitter:creator",content:this.$static.metadata.author.twitter},{name:"twitter:title",content:this.$page.post.title},{name:"twitter:description",content:this.$page.post.description},{name:"twitter:image",content:this.image},{property:"og:title",content:this.$page.post.title},{property:"og:url",content:this.url}].concat(Object(n.a)(Object(L.b)(this.image)),[{property:"og:description",content:this.$page.post.description},{property:"og:locale",content:this.$static.metadata.language.replace("-","_")},{property:"og:site_name",content:this.$static.metadata.name},{property:"og:type",content:"article"},{property:"article:published_time",content:this.$page.post.date}],Object(n.a)([this.$page.post.dateModified].filter((function(t){return t})).map((function(t){return{property:"article:modified_time",content:t}}))),[{property:"article:author",content:this.$page.post.author}],Object(n.a)(this.$page.post.headings.map((function(t){return{property:"article:section",content:t.value}}))),Object(n.a)(this.$page.post.tags.map((function(t){return{property:"article:tag",content:t.title}}))),[{property:"fb:app_id",content:this.$static.metadata.facebookAppId}]),script:[{type:"application/ld+json",json:{"@context":"https://schema.org","@type":"Article",mainEntityOfPage:{"@type":"WebPage","@id":this.$static.metadata.url},headline:this.$page.post.title,description:this.$page.post.description,keywords:this.$page.post.tags.map((function(t){return t.title})).join(),url:this.url,image:[Object(L.c)(this.image)],datePublished:this.$page.post.date,dateModified:this.$page.post.dateModified,author:{"@type":"Person",name:this.$page.post.author,logo:{"@type":"ImageObject",url:"".concat(this.$static.metadata.url,"/images/author/").concat(this.$page.post.author.split(" ").join("-"),"/Logo-260x260.png"),width:260,height:260},url:this.$static.metadata.url+"/about/"},publisher:{"@type":"Organization",name:this.$static.metadata.name,logo:{"@type":"ImageObject",url:this.$static.metadata.url+"/images/schema/Publisher-600x60.png",width:600,height:60},url:this.$static.metadata.url}}}]}}},N=(a(316),h.a.config.optionMergeStrategies.computed),J={metadata:{name:"Muhammad Rehan Saeed",url:"https://rehansaeed.com",language:"en-GB",facebookAppId:"632414437490344",author:{name:"Muhammad Rehan Saeed",twitter:"@RehanSaeedUK"}}},B=function(t){var e=t.options;e.__staticData?e.__staticData.data=J:(e.__staticData=h.a.observable({data:J}),e.computed=N({$static:function(){return e.__staticData.data}},e.computed))},G=a(317),Q=Object(l.a)(F,(function(){var t=this.$createElement,e=this._self._c||t;return e("Layout",[e("div",{staticClass:"post-page"},[e("div",{staticClass:"post-page__title"},[e("u-heading",{attrs:{level:"1",center:""}},[this._v(this._s(this.$page.post.title))]),e("u-post-meta",{attrs:{meta:this.$page.post}})],1),e("u-post",{staticClass:"post-page__content",attrs:{post:this.$page.post}}),e("u-comments",{staticClass:"post-page__comments",attrs:{title:this.$page.post.title}}),e("u-newsletter"),e("u-author",{staticClass:"post-page__author"})],1)])}),[],!1,null,null,null);"function"==typeof B&&B(Q),"function"==typeof G.default&&Object(G.default)(Q);e.default=Q.exports}}]);