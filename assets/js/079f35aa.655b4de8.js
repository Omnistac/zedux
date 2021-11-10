"use strict";(self.webpackChunkzedux_docs=self.webpackChunkzedux_docs||[]).push([[7641],{4965:function(e,t,s){s.r(t),s.d(t,{frontMatter:function(){return u},contentTitle:function(){return i},metadata:function(){return l},toc:function(){return m},default:function(){return p}});var n=s(3117),o=s(102),a=(s(7294),s(3905)),r=s(3052),c=["components"],u={id:"useEcosystem",title:"useEcosystem"},i=void 0,l={unversionedId:"api/hooks/useEcosystem",id:"api/hooks/useEcosystem",isDocsHomePage:!1,title:"useEcosystem",description:"A React hook that returns a reference to the nearest ecosystem that's been provided over React context via ``. If no ecosystem has been provided, Zedux will return the global ecosystem. If the global ecosystem hasn't been created yet, Zedux will create it.",source:"@site/docs/api/hooks/useEcosystem.mdx",sourceDirName:"api/hooks",slug:"/api/hooks/useEcosystem",permalink:"/zedux/docs/api/hooks/useEcosystem",editUrl:"https://github.com/Omnistac/zedux/tree/master/docs/api/hooks/useEcosystem.mdx",tags:[],version:"current",frontMatter:{id:"useEcosystem",title:"useEcosystem"},sidebar:"react",previous:{title:"useAtomValue",permalink:"/zedux/docs/api/hooks/useAtomValue"},next:{title:"useGetInstance",permalink:"/zedux/docs/api/hooks/useGetInstance"}},m=[{value:"Examples",id:"examples",children:[],level:2},{value:"Signature",id:"signature",children:[],level:2}],d={toc:m};function p(e){var t=e.components,s=(0,o.Z)(e,c);return(0,a.kt)("wrapper",(0,n.Z)({},d,s,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"import { useEcosystem } from '@zedux/react'\n")),(0,a.kt)("p",null,"A React hook that returns a reference to the nearest ",(0,a.kt)("a",{parentName:"p",href:"../classes/Ecosystem"},"ecosystem")," that's been provided over React context via ",(0,a.kt)("a",{parentName:"p",href:"../components/EcosystemProvider"},(0,a.kt)("inlineCode",{parentName:"a"},"<EcosystemProvider>")),". If no ecosystem has been provided, Zedux will return the global ecosystem. If the global ecosystem hasn't been created yet, Zedux will create it."),(0,a.kt)("p",null,"See ",(0,a.kt)("a",{parentName:"p",href:"../../walkthrough/ecosystems"},"the ecosystems walkthrough")," for more info about when Zedux uses which ecosystem."),(0,a.kt)("h2",{id:"examples"},"Examples"),(0,a.kt)(r.u,{resultVar:"Seconds",mdxType:"LiveEditor"},"\nconst secondsAtom = atom('seconds', () => {\n  const store = injectStore(0)\n\n  injectEffect(() => {\n    const intervalId = setInterval(\n      () => store.setState(val => val + 1),\n      1000\n    )\n\n    return () => clearInterval(intervalId)\n  }, [])\n\n  return store\n})\n\nfunction Seconds() {\n  const ecosystem = useEcosystem()\n  const instance = ecosystem.getInstance(secondsAtom)\n  const state = useAtomValue(instance)\n\n  return <div>Seconds: {state}</div>\n}\n"),(0,a.kt)("p",null,"Global and custom ecosystems:"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-tsx"},"function Child() {\n  const ecosystem = useEcosystem() // { id: 'root', ... }\n  ...\n}\n\nfunction App() {\n  const ecosystem = useEcosystem() // { id: 'global' ... }\n\n  return (\n    <EcosystemProvider id=\"root\">\n      <Child />\n    </EcosystemProvider>\n  )\n}\n")),(0,a.kt)("h2",{id:"signature"},"Signature"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-ts"},"useEcosystem() => Ecosystem\n")),(0,a.kt)("p",null,"Returns an ",(0,a.kt)("a",{parentName:"p",href:"../classes/Ecosystem"},"ecosytem object"),"."))}p.isMDXComponent=!0}}]);