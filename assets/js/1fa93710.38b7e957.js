(self.webpackChunkzedux_docs=self.webpackChunkzedux_docs||[]).push([[8932],{7226:function(t,e,n){"use strict";n.r(e),n.d(e,{frontMatter:function(){return c},metadata:function(){return p},toc:function(){return s},default:function(){return l}});var a=n(4034),i=n(9973),r=(n(7294),n(3905)),c={id:"DispatchInterceptor",title:"DispatchInterceptor"},p={unversionedId:"api/types/DispatchInterceptor",id:"api/types/DispatchInterceptor",isDocsHomePage:!1,title:"DispatchInterceptor",description:"A function that intercepts instance.dispatch() calls.",source:"@site/docs/api/types/DispatchInterceptor.mdx",sourceDirName:"api/types",slug:"/api/types/DispatchInterceptor",permalink:"/zedux/docs/api/types/DispatchInterceptor",editUrl:"https://github.com/Omnistac/zedux/tree/master/docs/api/types/DispatchInterceptor.mdx",version:"current",frontMatter:{id:"DispatchInterceptor",title:"DispatchInterceptor"},sidebar:"react",previous:{title:"AtomInstanceTtl",permalink:"/zedux/docs/api/types/AtomInstanceTtl"},next:{title:"EcosystemConfig",permalink:"/zedux/docs/api/types/EcosystemConfig"}},s=[{value:"Definition",id:"definition",children:[]},{value:"Example",id:"example",children:[]}],o={toc:s};function l(t){var e=t.components,n=(0,i.Z)(t,["components"]);return(0,r.kt)("wrapper",(0,a.Z)({},o,n,{components:e,mdxType:"MDXLayout"}),(0,r.kt)("p",null,"A function that intercepts ",(0,r.kt)("a",{parentName:"p",href:"../classes/AtomInstance#dispatch"},(0,r.kt)("inlineCode",{parentName:"a"},"instance.dispatch()"))," calls."),(0,r.kt)("p",null,"These interceptors function like middleware. They will be called every time ",(0,r.kt)("inlineCode",{parentName:"p"},"instance.dispatch()")," is called and can cancel the dispatch or reroute it."),(0,r.kt)("h2",{id:"definition"},"Definition"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"type DispatchInterceptor<State = any> = (\n  action: ActionChain,\n  next: (action: ActionChain) => State\n) => State\n")),(0,r.kt)("p",null,"Accepts an ",(0,r.kt)("a",{parentName:"p",href:"ActionChain"},"ActionChain")," object and a ",(0,r.kt)("inlineCode",{parentName:"p"},"next")," function. Must return the new state (or the current state if no change)."),(0,r.kt)("h2",{id:"example"},"Example"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"const store = injectStore()\n\nconst myApi = api(store).addDispatchInterceptor(\n  (action, next) => {\n    const currentState = store.getState()\n\n    // make sure you return the state!\n    if (isBad(currentState)) return currentState // cancel the dispatch\n\n    // return the new state\n    return next(action) // proceed with the dispatch\n  }\n)\n")),(0,r.kt)("p",null,"See ",(0,r.kt)("a",{parentName:"p",href:"../classes/AtomApi"},"AtomApi")," for more info."))}l.isMDXComponent=!0}}]);