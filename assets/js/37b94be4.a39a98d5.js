(self.webpackChunkzedux_docs=self.webpackChunkzedux_docs||[]).push([[3977],{1872:function(e,t,a){"use strict";a.r(t),a.d(t,{frontMatter:function(){return s},metadata:function(){return o},toc:function(){return i},default:function(){return p}});var n=a(4034),r=a(9973),l=(a(7294),a(3905)),s={id:"Store",title:"Store"},o={unversionedId:"api/classes/Store",id:"api/classes/Store",isDocsHomePage:!1,title:"Store",description:"The class returned from the createStore() factory. The store is the basic unit of state management.",source:"@site/docs/api/classes/Store.mdx",sourceDirName:"api/classes",slug:"/api/classes/Store",permalink:"/zedux/docs/api/classes/Store",editUrl:"https://github.com/Omnistac/zedux/tree/master/docs/api/classes/Store.mdx",version:"current",frontMatter:{id:"Store",title:"Store"},sidebar:"react",previous:{title:"LocalAtom",permalink:"/zedux/docs/api/classes/LocalAtom"},next:{title:"EcosystemProvider",permalink:"/zedux/docs/api/components/EcosystemProvider"}},i=[{value:"Creation",id:"creation",children:[{value:"In Atoms",id:"in-atoms",children:[]}]},{value:"To Be Continued...",id:"to-be-continued",children:[]},{value:"Definition",id:"definition",children:[]},{value:"Methods",id:"methods",children:[{value:"<code>.dispatch</code>",id:"dispatch",children:[]},{value:"<code>.getState</code>",id:"getstate",children:[]},{value:"<code>.setState</code>",id:"setstate",children:[]},{value:"<code>.setStateDeep</code>",id:"setstatedeep",children:[]},{value:"<code>.subscribe</code>",id:"subscribe",children:[]},{value:"<code>.use</code>",id:"use",children:[]}]}],c={toc:i};function p(e){var t=e.components,a=(0,r.Z)(e,["components"]);return(0,l.kt)("wrapper",(0,n.Z)({},c,a,{components:t,mdxType:"MDXLayout"}),(0,l.kt)("p",null,"The class returned from ",(0,l.kt)("a",{parentName:"p",href:"../factories/createStore"},"the ",(0,l.kt)("inlineCode",{parentName:"a"},"createStore()")," factory"),". The store is the basic unit of state management."),(0,l.kt)("p",null,"In Zedux, unlike Redux, the store is a class. A Zedux app will typically create many stores. It's therefore necessary that stores be as light as possible. With classes, we can take advantage of prototype method reuse, making each store use far less memory."),(0,l.kt)("p",null,"All atom state is held in stores. Whether you create one yourself using ",(0,l.kt)("a",{parentName:"p",href:"../injectors/injectStore"},(0,l.kt)("inlineCode",{parentName:"a"},"injectStore()"))," or let Zedux create one for you, every atom instance has a store."),(0,l.kt)("h2",{id:"creation"},"Creation"),(0,l.kt)("p",null,"Create using ",(0,l.kt)("inlineCode",{parentName:"p"},"createStore()"),"."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},"import { createStore } from '@zedux/react'\n\nconst store = createStore()\nconst withReducer = createStore(rootReducer)\nconst withInitialState = createStore(null, initialState)\nconst withBoth = createStore(rootReducer, initialState)\nconst splittingReducers = createStore({\n  a: reducerA,\n  b: reducerB\n})\nconst childStores = createStore({\n  a: storeA,\n  b: storeB\n})\nconst mixed = createStore({\n  a: reducerA,\n  b: storeB\n})\n")),(0,l.kt)("h3",{id:"in-atoms"},"In Atoms"),(0,l.kt)("p",null,"In an atom evaluator, stores should almost always be stable references. The easiest way to ensure this is by using ",(0,l.kt)("a",{parentName:"p",href:"../injectors/injectStore"},(0,l.kt)("inlineCode",{parentName:"a"},"injectStore()")),"."),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},"import { atom, injectStore } from '@zedux/react'\n\nconst testAtom = atom('test', () => {\n  const store = injectStore(initialState)\n\n  return store // remember to return the store\n})\n")),(0,l.kt)("p",null,"You'll often deal with multiple stores in a single atom. Take advantage of inline state updates and store composition:"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},"const testAtom = atom('test', () => {\n  const storeFromInjector = injectCustomThing()\n  const localStore = injectStore()\n\n  // state can be set inline during atom evaluation:\n  storeFromInjector.setState(newState)\n\n  // compose stores together to get a single store you can return:\n  const combinedStore = injectStore(\n    () => createStore({\n      otherState: storeFromInjector,\n      state: localStore\n    })\n  )\n\n  return combinedStore\n})\n")),(0,l.kt)("h2",{id:"to-be-continued"},"To Be Continued..."),(0,l.kt)("p",null,"See ",(0,l.kt)("a",{parentName:"p",href:"../../walkthrough/stores"},"the stores walkthrough")," for a better high-level picture of stores."),(0,l.kt)("h2",{id:"definition"},"Definition"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},"class Store<State = any> {\n  \n  public use(newHierarchy: HierarchyDescriptor<State>): Store<State>\n}\n")),(0,l.kt)("h2",{id:"methods"},"Methods"),(0,l.kt)("p",null,"Stores expose the following methods:"),(0,l.kt)("h3",{id:"dispatch"},(0,l.kt)("inlineCode",{parentName:"h3"},".dispatch")),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},"public dispatch(action: Dispatchable): State\n")),(0,l.kt)("p",null,"Dispatches an action to the store. This method is actually a bound function property, so you can call it with no context e.g. after dereferencing it like:"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},"const { dispatch } = myStore\n")),(0,l.kt)("p",null,"Returns the new state of the store."),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Param"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Required"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"action")),(0,l.kt)("td",{parentName:"tr",align:null},"Dispatchable - either an ",(0,l.kt)("a",{parentName:"td",href:"../types/ActionChain"},"ActionChain")," or a normal ",(0,l.kt)("a",{parentName:"td",href:"../types/Action"},"Action object")),(0,l.kt)("td",{parentName:"tr",align:null},"Yes"),(0,l.kt)("td",{parentName:"tr",align:null},"The action to dispatch to the store. Will be passed to all the store's reducers. Will also be wrapped in the ",(0,l.kt)("a",{parentName:"td",href:"../constants/metaTypes#inherit"},"INHERIT meta type")," and passed to any child stores.")))),(0,l.kt)("h3",{id:"getstate"},(0,l.kt)("inlineCode",{parentName:"h3"},".getState")),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},"public getState(): State\n")),(0,l.kt)("p",null,"Returns the current state of the store."),(0,l.kt)("h3",{id:"setstate"},(0,l.kt)("inlineCode",{parentName:"h3"},".setState")),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},"public setState(settable: Settable<State>, meta?: any): State\n")),(0,l.kt)("p",null,"Sets the store's state. This method is actually a bound function property, so you can call it with no context e.g. after dereferencing it like:"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},"const { setState } = myStore\n")),(0,l.kt)("p",null,"Returns the new state of the store."),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Param"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Required"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"settable")),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("a",{parentName:"td",href:"../types/Settable"},"Settable")," - either the new state or a function that accepts the current state and returns the new state"),(0,l.kt)("td",{parentName:"tr",align:null},"Yes"),(0,l.kt)("td",{parentName:"tr",align:null},"The new state of the store. Will be translated into a special HYDRATE pseudo-action and dispatched to the store's reducers. Any relevant pieces of state will also be set on child stores")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"meta")),(0,l.kt)("td",{parentName:"tr",align:null},"any"),(0,l.kt)("td",{parentName:"tr",align:null},"No (no default)"),(0,l.kt)("td",{parentName:"tr",align:null},"Will be set as the ",(0,l.kt)("inlineCode",{parentName:"td"},"meta")," property of the created HYDRATE pseudo-action. Set to ",(0,l.kt)("a",{parentName:"td",href:"../constants/metaTypes#skip_evaluation"},(0,l.kt)("inlineCode",{parentName:"a"},"metaTypes.SKIP_EVALUATION")))))),(0,l.kt)("h3",{id:"setstatedeep"},(0,l.kt)("inlineCode",{parentName:"h3"},".setStateDeep")),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},"public setStateDeep(settable: Settable<RecursivePartial<State>>, meta?: any): State\n")),(0,l.kt)("p",null,"Deeply merges an object into the current state of the store. Returns the new state of the store. Note that there is no way to remove state with this method. Use ",(0,l.kt)("inlineCode",{parentName:"p"},".setState")," for that."),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Param"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Required"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"settable")),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("a",{parentName:"td",href:"../types/Settable"},"Settable")," - either a partial state object or a function that accepts the current state and returns a partial state object"),(0,l.kt)("td",{parentName:"tr",align:null},"Yes"),(0,l.kt)("td",{parentName:"tr",align:null},"The new state of the store. Will be translated into a special HYDRATE pseudo-action and dispatched to the store's reducers. Any relevant pieces of state will also be set on child stores")),(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"meta")),(0,l.kt)("td",{parentName:"tr",align:null},"any"),(0,l.kt)("td",{parentName:"tr",align:null},"No (no default)"),(0,l.kt)("td",{parentName:"tr",align:null},"Will be set as the ",(0,l.kt)("inlineCode",{parentName:"td"},"meta")," property of the created HYDRATE pseudo-action. Set to ",(0,l.kt)("a",{parentName:"td",href:"../constants/metaTypes#skip_evaluation"},(0,l.kt)("inlineCode",{parentName:"a"},"metaTypes.SKIP_EVALUATION"))," to prevent the atom instance that created this store from evaluating.")))),(0,l.kt)("h3",{id:"subscribe"},(0,l.kt)("inlineCode",{parentName:"h3"},".subscribe")),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},"public subscribe(subscriber: Subscriber<State>): Subscription\n")),(0,l.kt)("p",null,"Registers a ",(0,l.kt)("a",{parentName:"p",href:"../types/Subscriber"},"subscriber"),"."),(0,l.kt)("p",null,"Returns a ",(0,l.kt)("a",{parentName:"p",href:"../types/Subscription"},"Subscription object"),"."),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Param"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Required"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"subscriber")),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("a",{parentName:"td",href:"../types/Subscriber"},"Subscriber")," - either a function that will be called every time the state updates or an object with ",(0,l.kt)("inlineCode",{parentName:"td"},"next"),", ",(0,l.kt)("inlineCode",{parentName:"td"},"error"),", and/or ",(0,l.kt)("inlineCode",{parentName:"td"},"effects")," keys"),(0,l.kt)("td",{parentName:"tr",align:null},"Yes"),(0,l.kt)("td",{parentName:"tr",align:null},"The function(s) that will be called when certain events happen in the store. If a single function is passed, it will be called every time the store's state changes. An object can also be passed to register multiple different types of subscribers.")))),(0,l.kt)("h3",{id:"use"},(0,l.kt)("inlineCode",{parentName:"h3"},".use")),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},"public use(newHierarchy: HierarchyDescriptor<State>): Store<State>\n")),(0,l.kt)("p",null,"The code-splitting wizard of the Zedux realm. ",(0,l.kt)("inlineCode",{parentName:"p"},".use")," changes the store's hierarchy on the fly. Use it to add or remove child stores and reducers."),(0,l.kt)("p",null,"The first parameter to ",(0,l.kt)("a",{parentName:"p",href:"../factories/createStore"},(0,l.kt)("inlineCode",{parentName:"a"},"createStore()"))," is a ",(0,l.kt)("a",{parentName:"p",href:"../types/HierarchyDescriptor"},"HierarchyDescriptor")," which describes the structure of the store. ",(0,l.kt)("inlineCode",{parentName:"p"},".use()")," also accepts a HierarchyDescriptor to dynamically modify the hierarchy at any time:"),(0,l.kt)("pre",null,(0,l.kt)("code",{parentName:"pre",className:"language-ts"},"const myStore = createStore(rootReducer)\nmyStore.use(anotherStore) // completely replace the store's state\nmyStore.use({ // completely replace the store's state\n  a: storeA,\n  b: storeB\n})\nmyStore.use({ // merge this hierarchy into the previous hierarchy\n  b: null, // remove `b` from the store\n  c: { // add `c` and its nested nodes to the store\n    d: reducerD\n  }\n})\nmyStore.use(null) // wipe everything\n")),(0,l.kt)("p",null,"Returns the store for chaining."),(0,l.kt)("table",null,(0,l.kt)("thead",{parentName:"table"},(0,l.kt)("tr",{parentName:"thead"},(0,l.kt)("th",{parentName:"tr",align:null},"Param"),(0,l.kt)("th",{parentName:"tr",align:null},"Type"),(0,l.kt)("th",{parentName:"tr",align:null},"Required"),(0,l.kt)("th",{parentName:"tr",align:null},"Description"))),(0,l.kt)("tbody",{parentName:"table"},(0,l.kt)("tr",{parentName:"tbody"},(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("inlineCode",{parentName:"td"},"newDescriptor")),(0,l.kt)("td",{parentName:"tr",align:null},(0,l.kt)("a",{parentName:"td",href:"../types/HierarchyDescriptor"},"HierarchyDescriptor")," - A store, a reducer, ",(0,l.kt)("inlineCode",{parentName:"td"},"null"),", or an object hierarchy containing those"),(0,l.kt)("td",{parentName:"tr",align:null},"Yes"),(0,l.kt)("td",{parentName:"tr",align:null},"This param describes the hierarchy update. The new hierarchy will be deeply merged into the existing hierarchy. Passing ",(0,l.kt)("inlineCode",{parentName:"td"},"null")," for any node (including the root) removes everything below that point in the tree.")))))}p.isMDXComponent=!0}}]);