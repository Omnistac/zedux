(self.webpackChunkzedux_docs=self.webpackChunkzedux_docs||[]).push([[4690],{1768:function(e,t,n){"use strict";n.r(t),n.d(t,{frontMatter:function(){return o},metadata:function(){return r},toc:function(){return c},default:function(){return l}});var a=n(4034),s=n(9973),i=(n(7294),n(3905)),o={id:"IonGetUtils",title:"IonGetUtils"},r={unversionedId:"api/types/IonGetUtils",id:"api/types/IonGetUtils",isDocsHomePage:!1,title:"IonGetUtils",description:"The object Zedux passes as the first parameter to ion getters.",source:"@site/docs/api/types/IonGetUtils.mdx",sourceDirName:"api/types",slug:"/api/types/IonGetUtils",permalink:"/zedux/docs/api/types/IonGetUtils",editUrl:"https://github.com/Omnistac/zedux/tree/master/docs/api/types/IonGetUtils.mdx",version:"current",frontMatter:{id:"IonGetUtils",title:"IonGetUtils"},sidebar:"react",previous:{title:"HierarchyDescriptor",permalink:"/zedux/docs/api/types/HierarchyDescriptor"},next:{title:"IonSetUtils",permalink:"/zedux/docs/api/types/IonSetUtils"}},c=[{value:"Definition",id:"definition",children:[{value:"<code>ecosystem</code>",id:"ecosystem",children:[]},{value:"<code>get</code>",id:"get",children:[]},{value:"<code>getInstance</code>",id:"getinstance",children:[]}]}],p={toc:c};function l(e){var t=e.components,n=(0,s.Z)(e,["components"]);return(0,i.kt)("wrapper",(0,a.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,"The object Zedux passes as the first parameter to ",(0,i.kt)("a",{parentName:"p",href:"../factories/ion#get"},"ion getters"),"."),(0,i.kt)("h2",{id:"definition"},"Definition"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"interface IonGetUtils {\n  ecosystem: Ecosystem\n\n  get<A extends Atom<any, []>>(atom: A): AtomStateType<A>\n\n  get<A extends Atom<any, [...any]>>(\n    atom: A,\n    params: AtomParamsType<A>\n  ): AtomStateType<A>\n\n  get<I extends AtomInstance>(\n    instance: I\n  ): AtomInstanceStateType<I>\n\n  getInstance<A extends Atom<any, []>>(atom: A): AtomInstanceType<A>\n\n  getInstance<A extends Atom<any, any, any>>(\n    atom: A,\n    params: AtomParamsType<A>\n  ): AtomInstanceType<A>\n}\n")),(0,i.kt)("h3",{id:"ecosystem"},(0,i.kt)("inlineCode",{parentName:"h3"},"ecosystem")),(0,i.kt)("p",null,"A reference to the ",(0,i.kt)("a",{parentName:"p",href:"../classes/Ecosystem"},"ecosystem")," this ion instance was created in."),(0,i.kt)("h3",{id:"get"},(0,i.kt)("inlineCode",{parentName:"h3"},"get")),(0,i.kt)("p",null,"A function that returns the current state of an atom instance. You can pass either an instance directly or an atom and its params (if any)."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"({ get }) => get(otherAtom)\n({ get }) => get(otherAtom, ['param 1', 'param 2'])\n({ get }) => get(anInstance)\n")),(0,i.kt)("p",null,"When called synchronously during instance evaluation, ",(0,i.kt)("inlineCode",{parentName:"p"},"get")," registers a ",(0,i.kt)("a",{parentName:"p",href:"../glossary#dynamic-graph-dependency"},"dynamic graph dependency")," on the resolved atom instance."),(0,i.kt)("p",null,"When called asynchronously (e.g. in an ",(0,i.kt)("a",{parentName:"p",href:"../injectors/injectEffect"},(0,i.kt)("inlineCode",{parentName:"a"},"injectEffect")),"), it does not register a dependency; it simply returns the resolved atom instance's value."),(0,i.kt)("h3",{id:"getinstance"},(0,i.kt)("inlineCode",{parentName:"h3"},"getInstance")),(0,i.kt)("p",null,"A function that returns an atom instance. Pass an atom and its params (if any)"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"({ getInstance }) => getInstance(otherAtom)\n({ getInstance }) => getInstance(otherAtom, ['param 1', 'param 2'])\n")),(0,i.kt)("p",null,"When called synchronously during instance evaluation, ",(0,i.kt)("inlineCode",{parentName:"p"},"getInstance")," registers a ",(0,i.kt)("a",{parentName:"p",href:"../glossary#static-graph-dependency"},"static graph dependency")," on the resolved atom instance."),(0,i.kt)("p",null,"When called asynchronously (e.g. in an ",(0,i.kt)("a",{parentName:"p",href:"../injectors/injectEffect"},(0,i.kt)("inlineCode",{parentName:"a"},"injectEffect")),"), it does not register a dependency; it simply returns the resolved atom instance."))}l.isMDXComponent=!0}}]);