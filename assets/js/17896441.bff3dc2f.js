(self.webpackChunkzedux_docs=self.webpackChunkzedux_docs||[]).push([[7918],{6742:function(e,t,n){"use strict";n.d(t,{Z:function(){return d}});var a=n(9973),r=n(7294),i=n(3727),l=n(3919),s=n(412),o=(0,r.createContext)({collectLink:function(){}}),c=n(4996);var d=function(e){var t,n,d,u=e.isNavLink,m=e.to,v=e.href,f=e.activeClassName,g=e.isActive,p=e["data-noBrokenLinkCheck"],h=e.autoAddBaseUrl,E=void 0===h||h,b=(0,a.Z)(e,["isNavLink","to","href","activeClassName","isActive","data-noBrokenLinkCheck","autoAddBaseUrl"]),_=(0,c.C)().withBaseUrl,L=(0,r.useContext)(o),N=m||v,y=(0,l.Z)(N),k=null==N?void 0:N.replace("pathname://",""),w=void 0!==k?(n=k,E&&function(e){return e.startsWith("/")}(n)?_(n):n):void 0,U=(0,r.useRef)(!1),A=u?i.OL:i.rU,Z=s.Z.canUseIntersectionObserver;(0,r.useEffect)((function(){return!Z&&y&&null!=w&&window.docusaurus.prefetch(w),function(){Z&&d&&d.disconnect()}}),[w,Z,y]);var C=null!==(t=null==w?void 0:w.startsWith("#"))&&void 0!==t&&t,T=!w||!y||C;return w&&y&&!C&&!p&&L.collectLink(w),T?r.createElement("a",Object.assign({href:w},N&&!y&&{target:"_blank",rel:"noopener noreferrer"},b)):r.createElement(A,Object.assign({},b,{onMouseEnter:function(){U.current||null==w||(window.docusaurus.preload(w),U.current=!0)},innerRef:function(e){var t,n;Z&&e&&y&&(t=e,n=function(){null!=w&&window.docusaurus.prefetch(w)},(d=new window.IntersectionObserver((function(e){e.forEach((function(e){t===e.target&&(e.isIntersecting||e.intersectionRatio>0)&&(d.unobserve(t),d.disconnect(),n())}))}))).observe(t))},to:w||""},u&&{isActive:g,activeClassName:f}))}},4973:function(e,t,n){"use strict";n.d(t,{Z:function(){return u},I:function(){return d}});var a=n(7294),r=/{\w+}/g,i="{}";function l(e,t){var n=[],l=e.replace(r,(function(e){var r=e.substr(1,e.length-2),l=null==t?void 0:t[r];if(void 0!==l){var s=a.isValidElement(l)?l:String(l);return n.push(s),i}return e}));return 0===n.length?e:n.every((function(e){return"string"==typeof e}))?l.split(i).reduce((function(e,t,a){var r;return e.concat(t).concat(null!==(r=n[a])&&void 0!==r?r:"")}),""):l.split(i).reduce((function(e,t,r){return[].concat(e,[a.createElement(a.Fragment,{key:r},t,n[r])])}),[])}function s(e){return l(e.children,e.values)}var o=n(4644);function c(e){var t,n=e.id,a=e.message;return null!==(t=o[null!=n?n:a])&&void 0!==t?t:a}function d(e,t){var n,a=e.message;return l(null!==(n=c({message:a,id:e.id}))&&void 0!==n?n:a,t)}function u(e){var t,n=e.children,r=e.id,i=e.values,l=null!==(t=c({message:n,id:r}))&&void 0!==t?t:n;return a.createElement(s,{values:i},l)}},3852:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return I}});var a=n(7294),r=n(6742),i=n(4973);var l=function(e){var t=e.metadata;return a.createElement("nav",{className:"pagination-nav","aria-label":(0,i.I)({id:"theme.docs.paginator.navAriaLabel",message:"Docs pages navigation",description:"The ARIA label for the docs pagination"})},a.createElement("div",{className:"pagination-nav__item"},t.previous&&a.createElement(r.Z,{className:"pagination-nav__link",to:t.previous.permalink},a.createElement("div",{className:"pagination-nav__sublabel"},a.createElement(i.Z,{id:"theme.docs.paginator.previous",description:"The label used to navigate to the previous doc"},"Previous")),a.createElement("div",{className:"pagination-nav__label"},"\xab ",t.previous.title))),a.createElement("div",{className:"pagination-nav__item pagination-nav__item--next"},t.next&&a.createElement(r.Z,{className:"pagination-nav__link",to:t.next.permalink},a.createElement("div",{className:"pagination-nav__sublabel"},a.createElement(i.Z,{id:"theme.docs.paginator.next",description:"The label used to navigate to the next doc"},"Next")),a.createElement("div",{className:"pagination-nav__label"},t.next.title," \xbb"))))},s=n(2263),o=n(907),c=n(6700);function d(e){var t=e.siteTitle,n=e.versionLabel;return a.createElement(i.Z,{id:"theme.docs.versions.unreleasedVersionLabel",description:"The label used to tell the user that he's browsing an unreleased doc version",values:{siteTitle:t,versionLabel:a.createElement("strong",null,n)}},"This is unreleased documentation for {siteTitle} {versionLabel} version.")}function u(e){var t=e.siteTitle,n=e.versionLabel;return a.createElement(i.Z,{id:"theme.docs.versions.unmaintainedVersionLabel",description:"The label used to tell the user that he's browsing an unmaintained doc version",values:{siteTitle:t,versionLabel:a.createElement("strong",null,n)}},"This is documentation for {siteTitle} {versionLabel}, which is no longer actively maintained.")}function m(e){var t=e.versionLabel,n=e.to,l=e.onClick;return a.createElement(i.Z,{id:"theme.docs.versions.latestVersionSuggestionLabel",description:"The label userd to tell the user that he's browsing an unmaintained doc version",values:{versionLabel:t,latestVersionLink:a.createElement("strong",null,a.createElement(r.Z,{to:n,onClick:l},a.createElement(i.Z,{id:"theme.docs.versions.latestVersionLinkLabel",description:"The label used for the latest version suggestion link label"},"latest version")))}},"For up-to-date documentation, see the {latestVersionLink} ({versionLabel}).")}var v=function(){var e=(0,s.default)().siteConfig.title,t=(0,o.useActivePlugin)({failfast:!0}).pluginId,n=(0,c.J)(t).savePreferredVersionName,r=(0,o.useActiveVersion)(t),i=(0,o.useDocVersionSuggestions)(t),l=i.latestDocSuggestion,v=i.latestVersionSuggestion;if(!v)return a.createElement(a.Fragment,null);var f,g=null!=l?l:(f=v).docs.find((function(e){return e.id===f.mainDocId}));return a.createElement("div",{className:"alert alert--warning margin-bottom--md",role:"alert"},a.createElement("div",null,"current"===r.name?a.createElement(d,{siteTitle:e,versionLabel:r.label}):a.createElement(u,{siteTitle:e,versionLabel:r.label})),a.createElement("div",{className:"margin-top--md"},a.createElement(m,{versionLabel:v.label,to:g.path,onClick:function(){return n(v.name)}})))},f=n(1217),g="lastUpdatedDate_1WI_";function p(e){var t=e.lastUpdatedAt,n=e.formattedLastUpdatedAt;return a.createElement(i.Z,{id:"theme.lastUpdated.atDate",description:"The words used to describe on which date a page has been last updated",values:{date:a.createElement("time",{dateTime:new Date(1e3*t).toISOString(),className:g},n)}}," on {date}")}function h(e){var t=e.lastUpdatedBy;return a.createElement(i.Z,{id:"theme.lastUpdated.byUser",description:"The words used to describe by who the page has been last updated",values:{user:a.createElement("strong",null,t)}}," by {user}")}function E(e){var t=e.lastUpdatedAt,n=e.formattedLastUpdatedAt,r=e.lastUpdatedBy;return a.createElement("div",{className:"col text--right"},a.createElement("em",null,a.createElement("small",null,a.createElement(i.Z,{id:"theme.lastUpdated.lastUpdatedAtBy",description:"The sentence used to display when a page has been last updated, and by who",values:{atDate:t&&n?a.createElement(p,{lastUpdatedAt:t,formattedLastUpdatedAt:n}):"",byUser:r?a.createElement(h,{lastUpdatedBy:r}):""}},"Last updated{atDate}{byUser}"),!1)))}var b=n(6010);var _=function(e,t,n){var r=(0,a.useState)(void 0),i=r[0],l=r[1];(0,a.useEffect)((function(){function a(){var a=function(){var e=Array.from(document.getElementsByClassName("anchor")),t=e.find((function(e){return e.getBoundingClientRect().top>=n}));if(t){if(t.getBoundingClientRect().top>=n){var a=e[e.indexOf(t)-1];return null!=a?a:t}return t}return e[e.length-1]}();if(a)for(var r=0,s=!1,o=document.getElementsByClassName(e);r<o.length&&!s;){var c=o[r],d=c.href,u=decodeURIComponent(d.substring(d.indexOf("#")+1));a.id===u&&(i&&i.classList.remove(t),c.classList.add(t),l(c),s=!0),r+=1}}return document.addEventListener("scroll",a),document.addEventListener("resize",a),a(),function(){document.removeEventListener("scroll",a),document.removeEventListener("resize",a)}}))},L="tableOfContents_35-E",N="table-of-contents__link";function y(e){var t=e.toc,n=e.isChild;return t.length?a.createElement("ul",{className:n?"":"table-of-contents table-of-contents__left-border"},t.map((function(e){return a.createElement("li",{key:e.id},a.createElement("a",{href:"#"+e.id,className:N,dangerouslySetInnerHTML:{__html:e.value}}),a.createElement(y,{isChild:!0,toc:e.children}))}))):null}var k=function(e){var t=e.toc;return _(N,"table-of-contents__link--active",100),a.createElement("div",{className:(0,b.Z)(L,"thin-scrollbar")},a.createElement(y,{toc:t}))},w=n(4034),U=n(9973),A="iconEdit_2_ui",Z=function(e){var t=e.className,n=(0,U.Z)(e,["className"]);return a.createElement("svg",(0,w.Z)({fill:"currentColor",height:"1.2em",width:"1.2em",preserveAspectRatio:"xMidYMid meet",role:"img",viewBox:"0 0 40 40",className:(0,b.Z)(A,t),"aria-label":"Edit page"},n),a.createElement("g",null,a.createElement("path",{d:"m34.5 11.7l-3 3.1-6.3-6.3 3.1-3q0.5-0.5 1.2-0.5t1.1 0.5l3.9 3.9q0.5 0.4 0.5 1.1t-0.5 1.2z m-29.5 17.1l18.4-18.5 6.3 6.3-18.4 18.4h-6.3v-6.2z"})))};function C(e){var t=e.editUrl;return a.createElement("a",{href:t,target:"_blank",rel:"noreferrer noopener"},a.createElement(Z,null),a.createElement(i.Z,{id:"theme.common.editThisPage",description:"The link label to edit the current page"},"Edit this page"))}var T="docTitle_3a4h",x="docItemContainer_33ec",B="docItemCol_3FnS";var I=function(e){var t,n=e.content,r=n.metadata,i=n.frontMatter,s=i.image,c=i.keywords,d=i.hide_title,u=i.hide_table_of_contents,m=r.description,g=r.title,p=r.editUrl,h=r.lastUpdatedAt,_=r.formattedLastUpdatedAt,L=r.lastUpdatedBy,N=(0,o.useActivePlugin)({failfast:!0}).pluginId,y=(0,o.useVersions)(N),w=(0,o.useActiveVersion)(N),U=y.length>1,A=i.title||g;return a.createElement(a.Fragment,null,a.createElement(f.Z,{title:A,description:m,keywords:c,image:s}),a.createElement("div",{className:"row"},a.createElement("div",{className:(0,b.Z)("col",(t={},t[B]=!u,t))},a.createElement(v,null),a.createElement("div",{className:x},a.createElement("article",null,U&&a.createElement("div",null,a.createElement("span",{className:"badge badge--secondary"},"Version: ",w.label)),!d&&a.createElement("header",null,a.createElement("h1",{className:T},g)),a.createElement("div",{className:"markdown"},a.createElement(n,null))),(p||h||L)&&a.createElement("div",{className:"margin-vert--xl"},a.createElement("div",{className:"row"},a.createElement("div",{className:"col"},p&&a.createElement(C,{editUrl:p})),(h||L)&&a.createElement(E,{lastUpdatedAt:h,formattedLastUpdatedAt:_,lastUpdatedBy:L}))),a.createElement("div",{className:"margin-vert--lg"},a.createElement(l,{metadata:r})))),!u&&n.toc&&a.createElement("div",{className:"col col--3"},a.createElement(k,{toc:n.toc}))))}},1217:function(e,t,n){"use strict";n.d(t,{Z:function(){return s}});var a=n(7294),r=n(9105),i=n(6700),l=n(4996);function s(e){var t=e.title,n=e.description,s=e.keywords,o=e.image,c=(0,i.LU)().image,d=(0,i.pe)(t),u=(0,l.Z)(o||c,{absolute:!0});return a.createElement(r.Z,null,t&&a.createElement("title",null,d),t&&a.createElement("meta",{property:"og:title",content:d}),n&&a.createElement("meta",{name:"description",content:n}),n&&a.createElement("meta",{property:"og:description",content:n}),s&&a.createElement("meta",{name:"keywords",content:Array.isArray(s)?s.join(","):s}),u&&a.createElement("meta",{property:"og:image",content:u}),u&&a.createElement("meta",{name:"twitter:image",content:u}),u&&a.createElement("meta",{name:"twitter:card",content:"summary_large_image"}))}},6010:function(e,t,n){"use strict";function a(e){var t,n,r="";if("string"==typeof e||"number"==typeof e)r+=e;else if("object"==typeof e)if(Array.isArray(e))for(t=0;t<e.length;t++)e[t]&&(n=a(e[t]))&&(r&&(r+=" "),r+=n);else for(t in e)e[t]&&(r&&(r+=" "),r+=t);return r}function r(){for(var e,t,n=0,r="";n<arguments.length;)(e=arguments[n++])&&(t=a(e))&&(r&&(r+=" "),r+=t);return r}n.d(t,{Z:function(){return r}})}}]);