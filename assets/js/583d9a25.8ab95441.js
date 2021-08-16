(self.webpackChunkzedux_docs=self.webpackChunkzedux_docs||[]).push([[8778],{3381:function(e,t,n){"use strict";n.r(t),n.d(t,{frontMatter:function(){return o},metadata:function(){return i},toc:function(){return p},default:function(){return l}});var a=n(4034),r=n(9973),s=(n(7294),n(3905)),o={id:"AtomApi",title:"AtomApi"},i={unversionedId:"api/classes/AtomApi",id:"api/classes/AtomApi",isDocsHomePage:!1,title:"AtomApi",description:"Defines certain one-off properties of an atom. These properties do not fit well in the injector paradigm, as they define key characteristics of the atom itself that should only be set once.",source:"@site/docs/api/classes/AtomApi.mdx",sourceDirName:"api/classes",slug:"/api/classes/AtomApi",permalink:"/zedux/docs/api/classes/AtomApi",editUrl:"https://github.com/Omnistac/zedux/tree/master/docs/api/classes/AtomApi.mdx",version:"current",frontMatter:{id:"AtomApi",title:"AtomApi"},sidebar:"react",previous:{title:"Atom",permalink:"/zedux/docs/api/classes/Atom"},next:{title:"AtomInstance",permalink:"/zedux/docs/api/classes/AtomInstance"}},p=[{value:"Creation",id:"creation",children:[]},{value:"Usage",id:"usage",children:[]},{value:"Properties",id:"properties",children:[{value:"<code>.dispatchInterceptors</code>",id:"dispatchinterceptors",children:[]},{value:"<code>.exports</code>",id:"exports",children:[]},{value:"<code>.promise</code>",id:"promise",children:[]},{value:"<code>.setStateInterceptors</code>",id:"setstateinterceptors",children:[]},{value:"<code>.ttl</code>",id:"ttl",children:[]},{value:"<code>.value</code>",id:"value",children:[]}]},{value:"Methods",id:"methods",children:[{value:"<code>.addExports</code>",id:"addexports",children:[]},{value:"<code>.addDispatchInterceptor</code>",id:"adddispatchinterceptor",children:[]},{value:"<code>.addSetStateInterceptor</code>",id:"addsetstateinterceptor",children:[]},{value:"<code>.setExports</code>",id:"setexports",children:[]},{value:"<code>.setPromise</code>",id:"setpromise",children:[]},{value:"<code>.setTtl</code>",id:"setttl",children:[]}]}],c={toc:p};function l(e){var t=e.components,n=(0,r.Z)(e,["components"]);return(0,s.kt)("wrapper",(0,a.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,s.kt)("p",null,"Defines certain one-off properties of an atom. These properties do not fit well in the ",(0,s.kt)("a",{parentName:"p",href:"../glossary#injector"},"injector paradigm"),", as they define key characteristics of the atom itself that should only be set once."),(0,s.kt)("p",null,"These properties include setting an atom's exports, setting a suspense promise, and setting dispatch and setState interceptors."),(0,s.kt)("p",null,"All properties added to an AtomApi, except the value, should be stable references. ",(0,s.kt)("inlineCode",{parentName:"p"},".value")," is the only property that won't be ignored on subsequent evaluations. It doesn't matter if the properties are not stable; Zedux will just ignore the new references on subsequent iterations."),(0,s.kt)("h2",{id:"creation"},"Creation"),(0,s.kt)("p",null,"Create AtomApis with ",(0,s.kt)("a",{parentName:"p",href:"../factories/api"},"the ",(0,s.kt)("inlineCode",{parentName:"a"},"api()")," factory"),"."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"import { api } from '@zedux/react'\n\nconst myApi = api()\nconst withValue = api('some value')\nconst withStore = api(createStore())\nconst withExports = api(val).setExports({ ...myExports })\nconst withPromise = api(val).setPromise(myPromise)\nconst fromApi = api(myApi)\nconst addingExports = api(withExports).addExports({ ...moreExports })\nconst overwritingExports = api(withExports).setExports({ ...newExports })\n")),(0,s.kt)("h2",{id:"usage"},"Usage"),(0,s.kt)("p",null,"AtomApis can be passed to ",(0,s.kt)("inlineCode",{parentName:"p"},"atom()")," as the value. They can also be returned from an evaluator function."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"import { api, atom, injectStore } from '@zedux/react'\n\nconst myAtom = atom('my', api('initial state'))\n\nconst withEvaluator = atom('withEvaluator', () => {\n  return api('initial state')\n})\n\nconst withStore = atom('withStore', () => {\n  const store = injectStore('initial state')\n\n  return api(store)\n})\n\nconst withExports = atom('withExports', () => {\n  const store = injectStore('initial state')\n\n  return api(store).setExports({\n    someProp: 'some val'\n  })\n})\n\nconst composingApis = atom('composingApis', () => {\n  const injectedApi = injectSomethingThatReturnsAnApi()\n\n  return api(injectedApi).addExports({\n    additionalExport: 'some val'\n  })\n})\n")),(0,s.kt)("h2",{id:"properties"},"Properties"),(0,s.kt)("p",null,"AtomApis expose the following properties:"),(0,s.kt)("h3",{id:"dispatchinterceptors"},(0,s.kt)("inlineCode",{parentName:"h3"},".dispatchInterceptors")),(0,s.kt)("p",null,"An array of the ",(0,s.kt)("a",{parentName:"p",href:"../types/DispatchInterceptor"},"dispatch interceptors")," added to this AtomApi via ",(0,s.kt)("a",{parentName:"p",href:"#adddispatchinterceptor"},(0,s.kt)("inlineCode",{parentName:"a"},".addDispatchInterceptor()")),". May be undefined."),(0,s.kt)("p",null,"These interceptors function like middleware. They will be called every time ",(0,s.kt)("a",{parentName:"p",href:"AtomInstance#dispatch"},(0,s.kt)("inlineCode",{parentName:"a"},"instance.dispatch()"))," is called and can cancel the dispatch."),(0,s.kt)("h3",{id:"exports"},(0,s.kt)("inlineCode",{parentName:"h3"},".exports")),(0,s.kt)("p",null,"The object of the exports added to this AtomApi via ",(0,s.kt)("a",{parentName:"p",href:"#setexports"},(0,s.kt)("inlineCode",{parentName:"a"},".setExports()"))," and/or ",(0,s.kt)("a",{parentName:"p",href:"#addexports"},(0,s.kt)("inlineCode",{parentName:"a"},".addExports()")),". May be undefined."),(0,s.kt)("h3",{id:"promise"},(0,s.kt)("inlineCode",{parentName:"h3"},".promise")),(0,s.kt)("p",null,"A promise that Zedux will use to cause React to suspend everywhere this atom instance is used until the promise resolves. Set this via ",(0,s.kt)("a",{parentName:"p",href:"#setpromise"},(0,s.kt)("inlineCode",{parentName:"a"},".setPromise()")),"."),(0,s.kt)("h3",{id:"setstateinterceptors"},(0,s.kt)("inlineCode",{parentName:"h3"},".setStateInterceptors")),(0,s.kt)("p",null,"An array of the ",(0,s.kt)("a",{parentName:"p",href:"../types/SetStateInterceptor"},"setState interceptors")," added to this AtomApi via ",(0,s.kt)("a",{parentName:"p",href:"#addsetstateinterceptor"},(0,s.kt)("inlineCode",{parentName:"a"},".addSetStateInterceptor()")),". May be undefined."),(0,s.kt)("p",null,"These interceptors function like middleware. They will be called every time ",(0,s.kt)("a",{parentName:"p",href:"AtomInstance#setstate"},(0,s.kt)("inlineCode",{parentName:"a"},"instance.setState()"))," is called and can cancel the state setting."),(0,s.kt)("h3",{id:"ttl"},(0,s.kt)("inlineCode",{parentName:"h3"},".ttl")),(0,s.kt)("p",null,"An ",(0,s.kt)("a",{parentName:"p",href:"../types/AtomInstanceTtl"},"AtomInstanceTtl")," or a function that returns an AtomInstanceTtl. If a function, it will be called when Zedux schedules this atom instance's destruction. Will override any ecosystem- or atom-level ttl for this atom instance."),(0,s.kt)("h3",{id:"value"},(0,s.kt)("inlineCode",{parentName:"h3"},".value")),(0,s.kt)("p",null,"A reference to the value passed to ",(0,s.kt)("a",{parentName:"p",href:"../factories/api"},"the ",(0,s.kt)("inlineCode",{parentName:"a"},"api()")," factory"),". Can be either a raw value or a ",(0,s.kt)("a",{parentName:"p",href:"Store"},"Zedux store"),"."),(0,s.kt)("p",null,"If it's a store and this AtomApi is returned from an evaluator function, the store should be a stable reference that won't change on subsequent evaluations, e.g. by using ",(0,s.kt)("a",{parentName:"p",href:"../injectors/injectStore"},(0,s.kt)("inlineCode",{parentName:"a"},"injectStore()")),"."),(0,s.kt)("h2",{id:"methods"},"Methods"),(0,s.kt)("p",null,"AtomApis expose the following methods:"),(0,s.kt)("h3",{id:"addexports"},(0,s.kt)("inlineCode",{parentName:"h3"},".addExports")),(0,s.kt)("p",null,"Accepts an object. The object can contain anything, though all properties should be stable references - memoized functions or ref objects that won't change on subsequent evaluations. Returns the AtomApi for chaining."),(0,s.kt)("p",null,"Merges the passed object into any already-set ",(0,s.kt)("a",{parentName:"p",href:"#exports"},"exports")," on this AtomApi. If no exports have been set on this AtomApi, sets the exports."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"const initialExports = api(val).addExports({ ...myExports })\nconst addedExports = api(val)\n  .setExports({ ...myExports })\n  .addExports({ ...moreExports })\n")),(0,s.kt)("h3",{id:"adddispatchinterceptor"},(0,s.kt)("inlineCode",{parentName:"h3"},".addDispatchInterceptor")),(0,s.kt)("p",null,"Accepts a ",(0,s.kt)("a",{parentName:"p",href:"../types/DispatchInterceptor"},"DispatchInterceptor"),". Returns the AtomApi for chaining."),(0,s.kt)("p",null,"Adds the passed dispatch interceptor to this AtomApi's ",(0,s.kt)("a",{parentName:"p",href:"#dispatchinterceptors"},"list of dispatch interceptors"),"."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"const store = injectStore()\n\nconst myApi = api(store).addDispatchInterceptor(\n  (action, next) => {\n    const currentState = store.getState()\n\n    // make sure you return the state!\n    if (isBad(currentState)) return currentState // cancel the dispatch\n\n    // return the new state\n    return next(action) // proceed with the dispatch\n  }\n)\n")),(0,s.kt)("h3",{id:"addsetstateinterceptor"},(0,s.kt)("inlineCode",{parentName:"h3"},".addSetStateInterceptor")),(0,s.kt)("p",null,"Accepts a ",(0,s.kt)("a",{parentName:"p",href:"../types/SetStateInterceptor"},"SetStateInterceptor"),". Returns the AtomApi for chaining."),(0,s.kt)("p",null,"Adds the passed setState interceptor to this AtomApi's ",(0,s.kt)("a",{parentName:"p",href:"#setstateinterceptors"},"list of setState interceptors"),"."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"const store = injectStore()\n\nconst myApi = api(store).addSetStateInterceptor(\n  (settable, next) => {\n    const currentState = store.getState()\n    \n    // make sure you return the state!\n    if (isBad(currentState)) return currentState // cancel the state setting\n\n    // return the new state\n    return next(settable) // proceed with the state setting\n  }\n)\n")),(0,s.kt)("h3",{id:"setexports"},(0,s.kt)("inlineCode",{parentName:"h3"},".setExports")),(0,s.kt)("p",null,"Accepts an object. The object can contain anything, though all properties should be stable references - memoized functions or ref objects that won't change on subsequent evaluations. Returns the AtomApi for chaining."),(0,s.kt)("p",null,"Overwrites any previously-set exports on this AtomApi"),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"const initialExports = api(val).setExports({ ...myExports })\nconst overwriteExports = api(initialExports).setExports({ ...newExports })\n")),(0,s.kt)("h3",{id:"setpromise"},(0,s.kt)("inlineCode",{parentName:"h3"},".setPromise")),(0,s.kt)("p",null,"Accepts a promise. Returns the AtomApi for chaining."),(0,s.kt)("p",null,"Sets the ",(0,s.kt)("a",{parentName:"p",href:"#promise"},(0,s.kt)("inlineCode",{parentName:"a"},".promise"))," property of this AtomApi. If this AtomApi is returned from an evaluator, the promise will be set as the atom instance's promise and will be used to cause React to suspend."),(0,s.kt)("p",null,"This promise should be a stable reference. If you create a new promise on a subsequent reevaluation, Zedux will ignore it."),(0,s.kt)("h3",{id:"setttl"},(0,s.kt)("inlineCode",{parentName:"h3"},".setTtl")),(0,s.kt)("p",null,"Accepts an ",(0,s.kt)("a",{parentName:"p",href:"../types/AtomInstanceTtl"},"AtomInstanceTtl")," or a function that returns an AtomInstanceTtl. If a function, it will be called when Zedux schedules this atom instance's destruction."),(0,s.kt)("p",null,"Sets the ",(0,s.kt)("a",{parentName:"p",href:"#ttl"},(0,s.kt)("inlineCode",{parentName:"a"},".ttl"))," property of this AtomApi. Overrides any ",(0,s.kt)("inlineCode",{parentName:"p"},"ttl")," set on this ",(0,s.kt)("a",{parentName:"p",href:"Atom#ttl"},"atom")," or any default ttl on this ",(0,s.kt)("a",{parentName:"p",href:"Ecosystem#defaultttl"},"ecosystem"),"."))}l.isMDXComponent=!0}}]);