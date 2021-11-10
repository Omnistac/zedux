"use strict";(self.webpackChunkzedux_docs=self.webpackChunkzedux_docs||[]).push([[645],{7596:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return l},contentTitle:function(){return c},metadata:function(){return m},toc:function(){return d},default:function(){return p}});var a=n(3117),o=n(102),s=(n(7294),n(3905)),i=n(3052),r=["components"],l={id:"using-atoms",title:"Using Atoms"},c=void 0,m={unversionedId:"walkthrough/using-atoms",id:"walkthrough/using-atoms",isDocsHomePage:!1,title:"Using Atoms",description:"In the quick start, we learned a few basic ways to instantiate and consume atoms. In this page, we'll cover more hooks and injectors for atom instantiation and consumption, as well as how to interact with atom instances directly.",source:"@site/docs/walkthrough/using-atoms.mdx",sourceDirName:"walkthrough",slug:"/walkthrough/using-atoms",permalink:"/zedux/docs/walkthrough/using-atoms",editUrl:"https://github.com/Omnistac/zedux/tree/master/docs/walkthrough/using-atoms.mdx",tags:[],version:"current",frontMatter:{id:"using-atoms",title:"Using Atoms"},sidebar:"react",previous:{title:"Creating Atoms",permalink:"/zedux/docs/walkthrough/creating-atoms"},next:{title:"Ecosystems",permalink:"/zedux/docs/walkthrough/ecosystems"}},d=[{value:"Dynamic Hooks &amp; Injectors",id:"dynamic-hooks--injectors",children:[{value:"<code>useAtomSelector</code>",id:"useatomselector",children:[{value:"<code>injectAtomSelector</code>",id:"injectatomselector",children:[],level:4}],level:3},{value:"<code>useAtomState</code>",id:"useatomstate",children:[{value:"<code>injectAtomState</code>",id:"injectatomstate",children:[],level:4}],level:3},{value:"<code>useAtomValue</code>",id:"useatomvalue",children:[{value:"<code>injectAtomValue</code>",id:"injectatomvalue",children:[],level:4}],level:3}],level:2},{value:"Static Hooks/Injectors",id:"static-hooksinjectors",children:[{value:"<code>useAtomConsumer</code>",id:"useatomconsumer",children:[],level:3},{value:"<code>useAtomInstance</code>",id:"useatominstance",children:[{value:"<code>injectAtomInstance</code>",id:"injectatominstance",children:[],level:4}],level:3},{value:"<code>useGetInstance</code>",id:"usegetinstance",children:[{value:"<code>injectGetInstance</code>",id:"injectgetinstance",children:[],level:4}],level:3}],level:2},{value:"Instances",id:"instances",children:[{value:"<code>.store</code>",id:"store",children:[],level:3},{value:"<code>.setState()</code>",id:"setstate",children:[],level:3},{value:"<code>.dispatch()</code>",id:"dispatch",children:[],level:3},{value:"<code>.exports</code>",id:"exports",children:[],level:3},{value:"<code>.invalidate()</code>",id:"invalidate",children:[],level:3},{value:"Hooks and Injectors",id:"hooks-and-injectors",children:[],level:3}],level:2},{value:"Recap",id:"recap",children:[],level:2},{value:"Next Steps",id:"next-steps",children:[],level:2}],u={toc:d};function p(e){var t=e.components,n=(0,o.Z)(e,r);return(0,s.kt)("wrapper",(0,a.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,s.kt)("p",null,"In the quick start, we learned a few basic ways to instantiate and consume atoms. In this page, we'll cover more hooks and injectors for atom instantiation and consumption, as well as how to interact with atom instances directly."),(0,s.kt)("h2",{id:"dynamic-hooks--injectors"},"Dynamic Hooks & Injectors"),(0,s.kt)("p",null,"Some hooks create a ",(0,s.kt)("a",{parentName:"p",href:"../api/glossary#dynamic-graph-dependency"},"dynamic graph dependency")," on the atom. This means that when the atom instance's store's state changes, components that use these hooks will rerender."),(0,s.kt)("p",null,"All these hooks have complementary injectors. When the injected atom instance's state changes, atoms that use these injectors will reevaluate."),(0,s.kt)("h3",{id:"useatomselector"},(0,s.kt)("inlineCode",{parentName:"h3"},"useAtomSelector")),(0,s.kt)("p",null,"Returns a portion or derivation of the state of an atom instance's store. Also ensures that the component only reevaluates when the selector's result changes. Similar to Redux' ",(0,s.kt)("a",{parentName:"p",href:"https://react-redux.js.org/api/hooks#useselector"},(0,s.kt)("inlineCode",{parentName:"a"},"useSelector()")),"."),(0,s.kt)(i.u,{resultVar:"SelectorSerendipity",mdxType:"LiveEditor"},"\nconst countersAtom = atom('counters', () => ({\n  a: 0,\n  b: 0\n}))\n\nfunction SelectorSerendipity() {\n  // whenever countersAtom's state changes, this selector will run.\n  // If the selector returns a new value, this component will rerender.\n  const counterA = useAtomSelector(countersAtom, ({ a }) => a)\n  const instance = useAtomInstance(countersAtom)\n  const { setState } = instance\n\n  return (\n    <>\n      <div>Counter A: {counterA}</div>\n      <button onClick={() => setState(val => ({ ...val, a: val.a + 1 }))}>\n        Increment Counter A (triggers rerender)\n      </button>\n      <div>Counter B: {instance.store.getState().b}</div>\n      <button onClick={() => setState(val => ({ ...val, b: val.b + 1 }))}>\n        Increment Counter B (no rerender)\n      </button>\n    </>\n  )\n}\n"),(0,s.kt)("p",null,"If the atom takes params, pass those as the second parameter to ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomSelector"),":"),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"const usersByRoleAtom = ion('usersByRole', ({ get }, role: string) =>\n  get(usersAtom).filter(user => user.role === role)\n)\n\nfunction App() {\n  const userIds = useAtomSelector(\n    usersByRoleAtom,\n    // highlight-next-line\n    ['admin'],\n    users => users.map(({ id }) => id)\n  )\n  ...\n}\n")),(0,s.kt)("p",null,"Note that while you can use a selector memoizing library like ",(0,s.kt)("a",{parentName:"p",href:"https://github.com/reduxjs/reselect"},"reselect"),", it isn't necessary in Zedux. If more sophisticated selector behavior is required, use selector atoms like we did with ",(0,s.kt)("inlineCode",{parentName:"p"},"usersByRoleAtom")," in the above example. ",(0,s.kt)("a",{parentName:"p",href:"../api/classes/Ion"},"Ions")," are particulary suited for this use case."),(0,s.kt)("p",null,"Selector atoms are composable, memoized by default (since they live in an atom ecosystem), and the cache size and ttl are configurable too - all because they're atoms. The memoization details can even be handled more granularly using ",(0,s.kt)("a",{parentName:"p",href:"../api/injectors/injectMemo"},(0,s.kt)("inlineCode",{parentName:"a"},"injectMemo()")),"."),(0,s.kt)("h4",{id:"injectatomselector"},(0,s.kt)("inlineCode",{parentName:"h4"},"injectAtomSelector")),(0,s.kt)("p",null,"The injector equivalent of ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomSelector")," - for use in atoms:"),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"const userAtom = atom('user', () => {\n  const token = injectAtomSelector(authAtom, authData => authData.token)\n  ...\n})\n")),(0,s.kt)("h3",{id:"useatomstate"},(0,s.kt)("inlineCode",{parentName:"h3"},"useAtomState")),(0,s.kt)("p",null,(0,s.kt)("inlineCode",{parentName:"p"},"useAtomState()")," is similar to React's ",(0,s.kt)("inlineCode",{parentName:"p"},"useState()")," hook."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-tsx"},"import { useAtomState } from '@zedux/react'\n\nfunction App() {\n  // whenever myAtom's state changes, this component will rerender\n  const [state, setState] = useAtomState(myAtom)\n  const [withParams, setWithParams] = useAtomState(myAtom, ['a param'])\n  ...\n}\n")),(0,s.kt)("p",null,(0,s.kt)("inlineCode",{parentName:"p"},"setState")," is a reference to the ",(0,s.kt)("inlineCode",{parentName:"p"},"setState")," function on the atom instance, which wraps the ",(0,s.kt)("inlineCode",{parentName:"p"},"setState")," function of the instance's store. It functions like a React state setter."),(0,s.kt)("p",null,"To get a reference to ",(0,s.kt)("inlineCode",{parentName:"p"},"setState")," without creating a dynamic dependency, use ",(0,s.kt)("a",{parentName:"p",href:"#useatominstance"},(0,s.kt)("inlineCode",{parentName:"a"},"useAtomInstance()")),"."),(0,s.kt)("h4",{id:"injectatomstate"},(0,s.kt)("inlineCode",{parentName:"h4"},"injectAtomState")),(0,s.kt)("p",null,"The injector equivalent of ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomState")," - for use in atoms."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"const userAtom = atom('user', () => {\n  const [auth, setAuth] = injectAtomState(authAtom)\n})\n")),(0,s.kt)("h3",{id:"useatomvalue"},(0,s.kt)("inlineCode",{parentName:"h3"},"useAtomValue")),(0,s.kt)("p",null,"The simplest way to consume an atom's state. Returns an atom instance's value. Creates a dynamic graph dependency on the resolved atom instance. This means that the current component will rerender when the resolved atom instance's state changes."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"function MyComponent() {\n  // whenever myAtom's state changes, this component will rerender\n  const currentState = useAtomValue(myAtom, ['param 1', 'param 2'])\n  const paramless = useAtomValue(paramlessAtom)\n  ...\n}\n")),(0,s.kt)("h4",{id:"injectatomvalue"},(0,s.kt)("inlineCode",{parentName:"h4"},"injectAtomValue")),(0,s.kt)("p",null,"The injector equivalent of ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomValue"),". Returns an atom instance's value. Creates a dynamic graph dependency on the resolved atom instance. This means that the current atom instance will reevaluate when the resolved atom instance's state changes."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"const dependentAtom = atom('dependent', () => {\n  // whenever myAtom's state changes, this atom will reevaluate\n  const currentState = injectAtomValue(myAtom)\n  ...\n})\n")),(0,s.kt)("p",null,"This injector is your main tool for Dependency Injection."),(0,s.kt)("h2",{id:"static-hooksinjectors"},"Static Hooks/Injectors"),(0,s.kt)("p",null,"The following hooks/injectors do not cause rerenders/reevaluations when the resolved atom instance's state changes. They do, however, register static graph dependencies on the resolved atom instance. This means that Zedux will prevent the instance from being cleaned up as long as the dependent depends on it."),(0,s.kt)("h3",{id:"useatomconsumer"},(0,s.kt)("inlineCode",{parentName:"h3"},"useAtomConsumer")),(0,s.kt)("p",null,"Used in conjuction with ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomInstance")," to consume atom instances provided over React context. Note that there is no such thing as ",(0,s.kt)("inlineCode",{parentName:"p"},"injectAtomConsumer"),"."),(0,s.kt)("h3",{id:"useatominstance"},(0,s.kt)("inlineCode",{parentName:"h3"},"useAtomInstance")),(0,s.kt)("p",null,"Returns a reference to an instance of the atom. Atom instances have many features."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"import { useAtomInstance, useAtomValue } from '@zedux/react'\n\nfunction MyComponent() {\n  const instance = useAtomInstance(myAtom)\n  const value = useAtomValue(instance) // useAtomValue accepts an instance\n}\n")),(0,s.kt)("p",null,"In this example, when we use ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomInstance()"),", it creates a static dependency. This means MyComponent will not rerender when the instance's state changes. However, we then use another hook - ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomValue()")," - to make the dependency dynamic."),(0,s.kt)("p",null,(0,s.kt)("inlineCode",{parentName:"p"},"useAtomInstance()")," can also be used in conjunction with ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomConsumer()")," to provide an instance over React context, so deeply nested children don't need to know the params of a specific atom instance they want to reuse:"),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-tsx"},"import {\n  AtomInstanceProvider,\n  useAtomConsumer,\n  useAtomInstance\n} from '@zedux/react'\n\nfunction Parent() {\n  const instance = useAtomInstance(myAtom, ['some', 'params'])\n\n  return (\n    <AtomInstanceProvider instance={instance}>\n      <Child />\n    </AtomInstanceProvider>\n  )\n}\n\nfunction Child() {\n  const instance = useAtomConsumer(myAtom) // no need to pass params here\n  const value = useAtomValue(instance) // subscribe to the instance\n  ...\n}\n")),(0,s.kt)("div",{className:"admonition admonition-note alert alert--secondary"},(0,s.kt)("div",{parentName:"div",className:"admonition-heading"},(0,s.kt)("h5",{parentName:"div"},(0,s.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,s.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,s.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z"}))),"note")),(0,s.kt)("div",{parentName:"div",className:"admonition-content"},(0,s.kt)("p",{parentName:"div"},"While ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomConsumer()")," creates a static dependency, ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomValue()")," makes it dynamic."))),(0,s.kt)("p",null,"Instances also expose lots of extra, low-level functionality. We'll cover more of that in the ",(0,s.kt)("a",{parentName:"p",href:"/not-done"},"instances walkthrough"),"."),(0,s.kt)("h4",{id:"injectatominstance"},(0,s.kt)("inlineCode",{parentName:"h4"},"injectAtomInstance")),(0,s.kt)("p",null,"The injector equivalent of ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomInstance")," - for use in atoms."),(0,s.kt)("h3",{id:"usegetinstance"},(0,s.kt)("inlineCode",{parentName:"h3"},"useGetInstance")),(0,s.kt)("p",null,"Returns a function that can be used to dynamically create/retrieve atom instances. Often used to preload atoms, especially for kicking off render-as-you-fetch React suspense flows."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-tsx"},"import { useGetInstance } from '@zedux/react'\n\nfunction BlogPostThumbnail({ id }: { id: string }) {\n  const lazyLoad = useGetInstance()\n\n  return (\n    <button\n      onClick={() => {\n        lazyLoad(blogPostAtom, [id])\n      }}\n    >\n      View Post\n    </button>\n  )\n}\n")),(0,s.kt)("p",null,"Calling the loader function instantiates the atom, if no instance has been created for the given params yet, and returns the instance."),(0,s.kt)("p",null,(0,s.kt)("inlineCode",{parentName:"p"},"useGetInstance")," also accepts an optional ",(0,s.kt)("inlineCode",{parentName:"p"},"atom")," param that partially applies the returned ",(0,s.kt)("inlineCode",{parentName:"p"},"getInstance")," function."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"const getBlogPostInstance = useGetInstance(blogPostAtom)\n...\nconst instance = getBlogPostInstance([id])\n")),(0,s.kt)("h4",{id:"injectgetinstance"},(0,s.kt)("inlineCode",{parentName:"h4"},"injectGetInstance")),(0,s.kt)("p",null,"The injector equivalent of ",(0,s.kt)("inlineCode",{parentName:"p"},"useGetInstance")," - for use in atoms. This injector will also dynamically register static graph dependencies when called during synchronous atom evaluation."),(0,s.kt)("h2",{id:"instances"},"Instances"),(0,s.kt)("p",null,"You'll often interact with ",(0,s.kt)("a",{parentName:"p",href:"../api/classes/AtomInstance"},"atom instances")," directly. Atom instances have many useful properties."),(0,s.kt)("h3",{id:"store"},(0,s.kt)("inlineCode",{parentName:"h3"},".store")),(0,s.kt)("p",null,"A reference to the underlying store of this atom instance. Don't use this directly if you can avoid it. That said, there are many cases where it can be useful. We'll cover some of these in the ",(0,s.kt)("a",{parentName:"p",href:"side-effects"},"side effects walkthrough"),"."),(0,s.kt)("h3",{id:"setstate"},(0,s.kt)("inlineCode",{parentName:"h3"},".setState()")),(0,s.kt)("p",null,"The most common way to set an atom instance's state. The tuple returned by ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomState")," contains a reference to this function. ",(0,s.kt)("inlineCode",{parentName:"p"},".setState()")," accepts either the new state or a function that receives the current state and returns the new state."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"const instance = getInstance(myAtom)\ninstance.setState(newState)\ninstance.setState(currentState => newState)\n")),(0,s.kt)("p",null,"This ",(0,s.kt)("inlineCode",{parentName:"p"},".setState()")," function is ",(0,s.kt)("strong",{parentName:"p"},"not")," a reference to the instance's store's ",(0,s.kt)("inlineCode",{parentName:"p"},".setState()")," function. ",(0,s.kt)("inlineCode",{parentName:"p"},"instance.setState()")," is a wrapper around ",(0,s.kt)("inlineCode",{parentName:"p"},"instance.store.setState()"),". This is important because ",(0,s.kt)("inlineCode",{parentName:"p"},"instance.setState()")," allows interceptors to run before calling ",(0,s.kt)("inlineCode",{parentName:"p"},".store.setState()"),"."),(0,s.kt)("div",{className:"admonition admonition-important alert alert--info"},(0,s.kt)("div",{parentName:"div",className:"admonition-heading"},(0,s.kt)("h5",{parentName:"div"},(0,s.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,s.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,s.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"important")),(0,s.kt)("div",{parentName:"div",className:"admonition-content"},(0,s.kt)("p",{parentName:"div"},"Always prefer calling ",(0,s.kt)("inlineCode",{parentName:"p"},"instance.setState()")," over ",(0,s.kt)("inlineCode",{parentName:"p"},"instance.store.setState()")))),(0,s.kt)("h3",{id:"dispatch"},(0,s.kt)("inlineCode",{parentName:"h3"},".dispatch()")),(0,s.kt)("p",null,"The recommended way to dispatch actions to the instance's store."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"const instance = getInstance(myAtom)\ninstance.dispatch({ type: 'some-type' })\n")),(0,s.kt)("p",null,"Similar to ",(0,s.kt)("inlineCode",{parentName:"p"},"instance.setState()"),", ",(0,s.kt)("inlineCode",{parentName:"p"},"instance.dispatch()")," is a wrapper around ",(0,s.kt)("inlineCode",{parentName:"p"},"instance.store.dispatch()"),". The difference is that ",(0,s.kt)("inlineCode",{parentName:"p"},"instance.dispatch()")," allows dispatch interceptors to run before calling ",(0,s.kt)("inlineCode",{parentName:"p"},".store.dispatch()"),"."),(0,s.kt)("div",{className:"admonition admonition-important alert alert--info"},(0,s.kt)("div",{parentName:"div",className:"admonition-heading"},(0,s.kt)("h5",{parentName:"div"},(0,s.kt)("span",{parentName:"h5",className:"admonition-icon"},(0,s.kt)("svg",{parentName:"span",xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"},(0,s.kt)("path",{parentName:"svg",fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"}))),"important")),(0,s.kt)("div",{parentName:"div",className:"admonition-content"},(0,s.kt)("p",{parentName:"div"},"Always prefer calling ",(0,s.kt)("inlineCode",{parentName:"p"},"instance.dispatch()")," over ",(0,s.kt)("inlineCode",{parentName:"p"},"instance.store.dispatch()")))),(0,s.kt)("h3",{id:"exports"},(0,s.kt)("inlineCode",{parentName:"h3"},".exports")),(0,s.kt)("p",null,"A reference to the exports of the atom."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"const instance = getInstance(myAtom)\nconst { someExport } = instance.exports\n")),(0,s.kt)("p",null,"These exports are constant - they are set the first time an atom instance evaluates and they will not change on subsequent evaluations."),(0,s.kt)("h3",{id:"invalidate"},(0,s.kt)("inlineCode",{parentName:"h3"},".invalidate()")),(0,s.kt)("p",null,"Call this to force the atom instance to reevaluate. Outside of testing, there shouldn't be a need for this. Unless you know what you're doing, avoid impure or mutation-oriented patterns that require you to manually invalidate atom instances."),(0,s.kt)(i.u,{resultVar:"RandomNum",mdxType:"LiveEditor"},"\nconst randomNumAtom = atom('randomNum', () => Math.floor(Math.random() * 100))\n\nfunction RandomNum() {\n  const instance = useAtomInstance(randomNumAtom)\n  const value = useAtomValue(randomNumAtom)\n\n  return (\n    <>\n      <div>Random Number: {value}</div>\n      <button onClick={() => instance.invalidate()}>Re-roll</button>\n    </>\n  )\n}\n"),(0,s.kt)("h3",{id:"hooks-and-injectors"},"Hooks and Injectors"),(0,s.kt)("p",null,"Most hooks and injectors that return an atom instance create a static graph dependency on that instance. To turn that into a dynamic dependency (one that'll cause rerenders/reevaluations when the instance's state updates), we need to pass the instance to another hook/injector."),(0,s.kt)("p",null,"It just so happens that instances can be passed directly to ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomSelector"),", ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomState"),", ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomValue"),", and their corresponding injectors. Yep, we've already seen all of those \ud83d\udcaa."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-ts"},"function App() {\n  const instance = useAtomInstance(myAtom) // static dep \ud83d\ude22\n  const val = useAtomValue(instance) // dynamic dep \ud83c\udf89\n  ...\n}\n")),(0,s.kt)("h2",{id:"recap"},"Recap"),(0,s.kt)("ul",null,(0,s.kt)("li",{parentName:"ul"},(0,s.kt)("p",{parentName:"li"},"Every atom instance has an underlying Zedux store.")),(0,s.kt)("li",{parentName:"ul"},(0,s.kt)("p",{parentName:"li"},(0,s.kt)("inlineCode",{parentName:"p"},"useAtomSelector"),", ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomState"),", ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomValue"),", and their corresponding injectors all create dynamic graph dependencies that trigger updates when the resolved atom instance's state changes.")),(0,s.kt)("li",{parentName:"ul"},(0,s.kt)("p",{parentName:"li"},(0,s.kt)("inlineCode",{parentName:"p"},"useAtomInstance")," and ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomConsumer")," can be used together to provide and consume atom instances over React context.")),(0,s.kt)("li",{parentName:"ul"},(0,s.kt)("p",{parentName:"li"},(0,s.kt)("inlineCode",{parentName:"p"},"useGetInstance")," and ",(0,s.kt)("inlineCode",{parentName:"p"},"injectGetInstance")," return a function that can be used to preload or lazy-load atoms.")),(0,s.kt)("li",{parentName:"ul"},(0,s.kt)("p",{parentName:"li"},"Atom instances have ",(0,s.kt)("inlineCode",{parentName:"p"},".store"),", ",(0,s.kt)("inlineCode",{parentName:"p"},".setState"),", ",(0,s.kt)("inlineCode",{parentName:"p"},".dispatch"),", ",(0,s.kt)("inlineCode",{parentName:"p"},".exports"),", and ",(0,s.kt)("inlineCode",{parentName:"p"},".invalidate")," properties that can be used directly.")),(0,s.kt)("li",{parentName:"ul"},(0,s.kt)("p",{parentName:"li"},(0,s.kt)("inlineCode",{parentName:"p"},"useAtomSelector"),", ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomState"),", ",(0,s.kt)("inlineCode",{parentName:"p"},"useAtomValue"),", and their corresponding injectors all accept atom instances too."))),(0,s.kt)("h2",{id:"next-steps"},"Next Steps"),(0,s.kt)("p",null,"Now we know how to create and consume atoms. Next we'll learn how to create and configure isolated atom environments using ",(0,s.kt)("a",{parentName:"p",href:"ecosystems"},"ecosystems"),"."))}p.isMDXComponent=!0}}]);