"use strict";(self.webpackChunkzedux_docs=self.webpackChunkzedux_docs||[]).push([[826],{4646:function(e,n,t){t.r(n),t.d(n,{frontMatter:function(){return l},contentTitle:function(){return c},metadata:function(){return u},toc:function(){return d},default:function(){return m}});var a=t(3117),i=t(102),o=(t(7294),t(3905)),r=t(3052),s=["components"],l={id:"injectInvalidate",title:"injectInvalidate"},c=void 0,u={unversionedId:"api/injectors/injectInvalidate",id:"api/injectors/injectInvalidate",isDocsHomePage:!1,title:"injectInvalidate",description:"An injector that returns an invalidate() function. This invalidate() function can be used to force a reevaluation of the current atom instance.",source:"@site/docs/api/injectors/injectInvalidate.mdx",sourceDirName:"api/injectors",slug:"/api/injectors/injectInvalidate",permalink:"/zedux/docs/api/injectors/injectInvalidate",editUrl:"https://github.com/Omnistac/zedux/tree/master/docs/api/injectors/injectInvalidate.mdx",tags:[],version:"current",frontMatter:{id:"injectInvalidate",title:"injectInvalidate"},sidebar:"react",previous:{title:"injectGetInstance",permalink:"/zedux/docs/api/injectors/injectGetInstance"},next:{title:"injectMemo",permalink:"/zedux/docs/api/injectors/injectMemo"}},d=[{value:"Examples",id:"examples",children:[],level:2},{value:"Signature",id:"signature",children:[],level:2}],p={toc:d};function m(e){var n=e.components,t=(0,i.Z)(e,s);return(0,o.kt)("wrapper",(0,a.Z)({},p,t,{components:n,mdxType:"MDXLayout"}),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { injectInvalidate } from '@zedux/react'\n")),(0,o.kt)("p",null,"An ",(0,o.kt)("a",{parentName:"p",href:"../glossary#injector"},"injector")," that returns an ",(0,o.kt)("inlineCode",{parentName:"p"},"invalidate()")," function. This ",(0,o.kt)("inlineCode",{parentName:"p"},"invalidate()")," function can be used to force a reevaluation of the current atom instance."),(0,o.kt)("p",null,"In general, try to avoid impure, mutation-oriented, or generally non-reactive patterns that might require manual invalidation. However, there are some use cases for it."),(0,o.kt)("h2",{id:"examples"},"Examples"),(0,o.kt)(r.u,{resultVar:"Coin",mdxType:"LiveEditor"},"\nconst coinTossAtom = atom('coinToss', () => {\n  const isHeads = Math.random() < 0.5\n  const invalidate = injectInvalidate()\n\n  return api(isHeads).setExports({\n    flip: invalidate\n  })\n})\n\nfunction Coin() {\n  const isHeads = useAtomValue(coinTossAtom)\n  const { flip } = useAtomInstance(coinTossAtom).exports\n\n  return <button onClick={flip}>{isHeads ? 'Heads' : 'Tails'}</button>\n}\n"),(0,o.kt)("p",null,(0,o.kt)("inlineCode",{parentName:"p"},"injectInvalidate")," is the equivalent of the following pattern in React:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"const [, forceRender] = useState()\n...\nforceRender({})\n")),(0,o.kt)("p",null,"The equivalent in an atom would look like:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"const invalidate = injectInvalidate()\n...\ninvalidate()\n")),(0,o.kt)("h2",{id:"signature"},"Signature"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"injectInvalidate() => invalidate\n")),(0,o.kt)("p",null,"Returns the ",(0,o.kt)("inlineCode",{parentName:"p"},"invalidate()")," function whose signature is"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"invalidate() => void\n")),(0,o.kt)("p",null,"Nuthin' special."))}m.isMDXComponent=!0}}]);