"use strict";(self.webpackChunkzedux_docs=self.webpackChunkzedux_docs||[]).push([[6595],{9678:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return o},contentTitle:function(){return u},metadata:function(){return l},toc:function(){return d},default:function(){return p}});var i=n(3117),s=n(102),c=(n(7294),n(3905)),a=n(3052),r=["components"],o={id:"injectEffect",title:"injectEffect"},u=void 0,l={unversionedId:"api/injectors/injectEffect",id:"api/injectors/injectEffect",isDocsHomePage:!1,title:"injectEffect",description:"An injector that attaches a side effect to an atom instance.",source:"@site/docs/api/injectors/injectEffect.mdx",sourceDirName:"api/injectors",slug:"/api/injectors/injectEffect",permalink:"/zedux/docs/api/injectors/injectEffect",editUrl:"https://github.com/Omnistac/zedux/tree/master/docs/api/injectors/injectEffect.mdx",tags:[],version:"current",frontMatter:{id:"injectEffect",title:"injectEffect"},sidebar:"react",previous:{title:"injectEcosystem",permalink:"/zedux/docs/api/injectors/injectEcosystem"},next:{title:"injectGet",permalink:"/zedux/docs/api/injectors/injectGet"}},d=[{value:"Examples",id:"examples",children:[],level:2},{value:"Signature",id:"signature",children:[{value:"<code>sideEffect</code>",id:"sideeffect",children:[],level:3},{value:"<code>deps</code>",id:"deps",children:[],level:3}],level:2}],f={toc:d};function p(e){var t=e.components,n=(0,s.Z)(e,r);return(0,c.kt)("wrapper",(0,i.Z)({},f,n,{components:t,mdxType:"MDXLayout"}),(0,c.kt)("pre",null,(0,c.kt)("code",{parentName:"pre",className:"language-ts"},"import { injectEffect } from '@zedux/react'\n")),(0,c.kt)("p",null,"An ",(0,c.kt)("a",{parentName:"p",href:"../glossary#injector"},"injector")," that attaches a side effect to an atom instance."),(0,c.kt)("h2",{id:"examples"},"Examples"),(0,c.kt)(a.u,{resultVar:"Seconds",mdxType:"LiveEditor"},"\nconst secondsAtom = atom('seconds', () => {\n  const store = injectStore(0)\n\n  injectEffect(() => {\n    const intervalId = setInterval(\n      () => store.setState(val => val + 1),\n      1000\n    )\n\n    return () => clearInterval(intervalId)\n  }, [])\n\n  return store\n})\n\nfunction Seconds() {\n  const state = useAtomValue(secondsAtom)\n\n  return <div>Seconds: {state}</div>\n}\n"),(0,c.kt)("p",null,"Miscellaneous:"),(0,c.kt)("pre",null,(0,c.kt)("code",{parentName:"pre",className:"language-ts"},"// empty deps - only runs once - when the atom instance is created.\ninjectEffect(sideEffect, [])\n\n// no deps - runs on every evaluation\ninjectEffect(sideEffect)\n\n// with deps - runs again when any deps change\ninjectEffect(sideEffect, [depA, depB])\n\n// return a cleanup function that will run when this atom instance is destroyed\ninjectEffect(() => {\n  const subscription = stream.subscribe(...)\n\n  return () => subscription.unsubscribe()\n}, [])\n\n// the cleanup function will also run every time deps change\ninjectEffect(() => {\n  const subscription = stream.subscribe(...)\n\n  return () => subscription.unsubscribe()\n}, [depA, depB])\n")),(0,c.kt)("h2",{id:"signature"},"Signature"),(0,c.kt)("pre",null,(0,c.kt)("code",{parentName:"pre",className:"language-ts"},"injectEffect(sideEffect, deps?) => void\n")),(0,c.kt)("h3",{id:"sideeffect"},(0,c.kt)("inlineCode",{parentName:"h3"},"sideEffect")),(0,c.kt)("p",null,"Required. A function that will be run asynchronously, after this atom instance has been created. The effect can do anything but it shouldn't reference unstable variables outside the effect, unless those variables are added to the ",(0,c.kt)("inlineCode",{parentName:"p"},"deps")," array."),(0,c.kt)("p",null,"This function can return a cleanup function that will be called every time the effect is rerun due to the ",(0,c.kt)("inlineCode",{parentName:"p"},"deps")," changing. The cleanup function will also be run when the atom instance is destroyed. Use this to clean up subscriptions, clear timeouts, destroy resources, and generally prevent memory leaks."),(0,c.kt)("h3",{id:"deps"},(0,c.kt)("inlineCode",{parentName:"h3"},"deps")),(0,c.kt)("p",null,"Optional (but you should probably pass it). An array of values that will cause this effect to rerun when they change. All outside, unstable variables referenced in the effect function should be passed in this array."))}p.isMDXComponent=!0}}]);