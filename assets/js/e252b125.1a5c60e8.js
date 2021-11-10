"use strict";(self.webpackChunkzedux_docs=self.webpackChunkzedux_docs||[]).push([[7365],{3315:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return c},contentTitle:function(){return m},metadata:function(){return l},toc:function(){return d},default:function(){return p}});var a=n(3117),s=n(102),o=(n(7294),n(3905)),r=n(3052),i=["components"],c={id:"useAtomInstance",title:"useAtomInstance"},m=void 0,l={unversionedId:"api/hooks/useAtomInstance",id:"api/hooks/useAtomInstance",isDocsHomePage:!1,title:"useAtomInstance",description:"A React hook that accepts an atom and its params and registers a static graph dependency on the resolved atom instance. Returns the resolved atom instance object.",source:"@site/docs/api/hooks/useAtomInstance.mdx",sourceDirName:"api/hooks",slug:"/api/hooks/useAtomInstance",permalink:"/zedux/docs/api/hooks/useAtomInstance",editUrl:"https://github.com/Omnistac/zedux/tree/master/docs/api/hooks/useAtomInstance.mdx",tags:[],version:"current",frontMatter:{id:"useAtomInstance",title:"useAtomInstance"},sidebar:"react",previous:{title:"useAtomConsumer",permalink:"/zedux/docs/api/hooks/useAtomConsumer"},next:{title:"useAtomSelector",permalink:"/zedux/docs/api/hooks/useAtomSelector"}},d=[{value:"Examples",id:"examples",children:[],level:2},{value:"Signature",id:"signature",children:[{value:"Overloads",id:"overloads",children:[],level:3},{value:"<code>atom</code>",id:"atom",children:[],level:3},{value:"<code>params</code>",id:"params",children:[],level:3},{value:"<code>instance</code>",id:"instance",children:[],level:3}],level:2}],u={toc:d};function p(e){var t=e.components,n=(0,s.Z)(e,i);return(0,o.kt)("wrapper",(0,a.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { useAtomInstance } from '@zedux/react'\n")),(0,o.kt)("p",null,"A React hook that accepts an atom and its params and registers a ",(0,o.kt)("a",{parentName:"p",href:"../glossary#static-graph-dependency"},"static graph dependency")," on the resolved atom instance. Returns the resolved ",(0,o.kt)("a",{parentName:"p",href:"../classes/AtomInstance"},"atom instance object"),"."),(0,o.kt)("p",null,"Since the dependency is static, the component that uses this hook will not rerender when the resolved atom instance's state changes."),(0,o.kt)("p",null,"To make the dependency dynamic, pass the returned atom instance to a dynamic hook like ",(0,o.kt)("a",{parentName:"p",href:"useAtomValue"},(0,o.kt)("inlineCode",{parentName:"a"},"useAtomValue")),", ",(0,o.kt)("a",{parentName:"p",href:"useAtomState"},(0,o.kt)("inlineCode",{parentName:"a"},"useAtomState")),", or ",(0,o.kt)("a",{parentName:"p",href:"useAtomSelector"},(0,o.kt)("inlineCode",{parentName:"a"},"useAtomSelector")),"."),(0,o.kt)("p",null,"You can also pass an atom instance directly to register a static graph dependency on instances received from other sources, e.g. from ",(0,o.kt)("a",{parentName:"p",href:"useAtomConsumer"},"useAtomConsumer"),". You typically won't need to do this."),(0,o.kt)("h2",{id:"examples"},"Examples"),(0,o.kt)(r.u,{resultVar:"Seconds",mdxType:"LiveEditor"},"\nconst secondsAtom = atom('seconds', () => {\n  const store = injectStore(0)\n\n  injectEffect(() => {\n    const intervalId = setInterval(\n      () => store.setState(val => val + 1),\n      1000\n    )\n\n    return () => clearInterval(intervalId)\n  }, [])\n\n  return store\n})\n\nfunction Seconds() {\n  const instance = useAtomInstance(secondsAtom)\n  const state = useAtomValue(instance)\n\n  return <div>Seconds: {state}</div>\n}\n"),(0,o.kt)("p",null,"Miscellaneous:"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-tsx"},"const instance = useAtomInstance(myAtom)\nconst withParams = useAtomInstance(myAtom, ['param 1', 'param 2'])\n\n// the instance can be provided over React context:\n<AtomInstanceProvider instance={instance}>\n  {children}\n</AtomInstanceProvider>\n")),(0,o.kt)("h2",{id:"signature"},"Signature"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"useAtomInstance(atom, params?) => AtomInstance\n")),(0,o.kt)("p",null,"Uses the atom + params combo to find an existing atom instance. If no instance is found, creates one. Returns the resolved ",(0,o.kt)("a",{parentName:"p",href:"../classes/AtomInstance"},"atom instance"),"."),(0,o.kt)("h3",{id:"overloads"},"Overloads"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"useAtomInstance(instance) => AtomInstance\n")),(0,o.kt)("h3",{id:"atom"},(0,o.kt)("inlineCode",{parentName:"h3"},"atom")),(0,o.kt)("p",null,"Required. The ",(0,o.kt)("a",{parentName:"p",href:"../classes/Atom"},"atom")," object whose key will be used to find an existing atom instance and whose definition will be used to create an atom instance if none exist yet."),(0,o.kt)("h3",{id:"params"},(0,o.kt)("inlineCode",{parentName:"h3"},"params")),(0,o.kt)("p",null,"Optional. An array of parameters that identify this atom instance. These params will be passed to the atom's ",(0,o.kt)("a",{parentName:"p",href:"../glossary#evaluator"},"evaluator function"),"."),(0,o.kt)("p",null,"TS users will be required to pass this for atoms that take params. If you don't use TS ... just don't forget to pass them."),(0,o.kt)("h3",{id:"instance"},(0,o.kt)("inlineCode",{parentName:"h3"},"instance")),(0,o.kt)("p",null,"Required (in this overload). An ",(0,o.kt)("a",{parentName:"p",href:"../classes/AtomInstance"},"atom instance"),". Will register a static dependency on the passed instance and return it."))}p.isMDXComponent=!0}}]);