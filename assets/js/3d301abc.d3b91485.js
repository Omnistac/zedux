(self.webpackChunkzedux_docs=self.webpackChunkzedux_docs||[]).push([[1913],{9933:function(e,t,n){"use strict";n.r(t),n.d(t,{frontMatter:function(){return i},metadata:function(){return r},toc:function(){return c},default:function(){return p}});var a=n(4034),s=n(9973),o=(n(7294),n(3905)),i={id:"IonSetUtils",title:"IonSetUtils"},r={unversionedId:"api/types/IonSetUtils",id:"api/types/IonSetUtils",isDocsHomePage:!1,title:"IonSetUtils",description:"The object Zedux passes as the first parameter to ion setters.",source:"@site/docs/api/types/IonSetUtils.mdx",sourceDirName:"api/types",slug:"/api/types/IonSetUtils",permalink:"/zedux/docs/api/types/IonSetUtils",editUrl:"https://github.com/Omnistac/zedux/tree/master/docs/api/types/IonSetUtils.mdx",version:"current",frontMatter:{id:"IonSetUtils",title:"IonSetUtils"},sidebar:"react",previous:{title:"IonGetUtils",permalink:"/zedux/docs/api/types/IonGetUtils"},next:{title:"Reducer",permalink:"/zedux/docs/api/types/Reducer"}},c=[{value:"Definition",id:"definition",children:[{value:"<code>ecosystem</code>",id:"ecosystem",children:[]},{value:"<code>get</code>",id:"get",children:[]},{value:"<code>getInstance</code>",id:"getinstance",children:[]},{value:"<code>instance</code>",id:"instance",children:[]},{value:"<code>set</code>",id:"set",children:[]}]}],m={toc:c};function p(e){var t=e.components,n=(0,s.Z)(e,["components"]);return(0,o.kt)("wrapper",(0,a.Z)({},m,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"The object Zedux passes as the first parameter to ",(0,o.kt)("a",{parentName:"p",href:"../factories/ion#set"},"ion setters"),"."),(0,o.kt)("h2",{id:"definition"},"Definition"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"interface IonSetUtils<\n  State,\n  Params extends any[],\n  Exports extends Record<string, any>\n> {\n  ecosystem: Ecosystem\n\n  get<A extends Atom<any, []>>(atom: A): AtomStateType<A>\n\n  get<A extends Atom<any, [...any]>>(\n    atom: A,\n    params: AtomParamsType<A>\n  ): AtomStateType<A>\n\n  get<I extends AtomInstance>(\n    instance: I\n  ): AtomInstanceStateType<I>\n\n  getInstance<A extends Atom<any, []>>(atom: A): AtomInstanceType<A>\n\n  getInstance<A extends Atom<any, [...any]>>(\n    atom: A,\n    params: AtomParamsType<A>\n  ): AtomInstanceType<A>\n\n  instance: AtomInstance<State, Params, Exports>\n\n  set<A extends Atom<any, []>>(\n    atom: A,\n    settable: Settable<AtomStateType<A>>\n  ): AtomStateType<A>\n\n  set<A extends Atom<any, [...any]>>(\n    atom: A,\n    params: AtomParamsType<A>,\n    settable: Settable<AtomStateType<A>>\n  ): AtomStateType<A>\n}\n")),(0,o.kt)("h3",{id:"ecosystem"},(0,o.kt)("inlineCode",{parentName:"h3"},"ecosystem")),(0,o.kt)("p",null,"A reference to the ",(0,o.kt)("a",{parentName:"p",href:"../classes/Ecosystem"},"ecosystem")," this ion instance was created in."),(0,o.kt)("h3",{id:"get"},(0,o.kt)("inlineCode",{parentName:"h3"},"get")),(0,o.kt)("p",null,"A function that returns the current state of an atom instance. You can pass either an instance directly or an atom and its params (if any)."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"({ get }, newVal) => get(otherAtom)\n({ get }, newVal) => get(otherAtom, ['param 1', 'param 2'])\n({ get }, newVal) => get(anInstance)\n")),(0,o.kt)("h3",{id:"getinstance"},(0,o.kt)("inlineCode",{parentName:"h3"},"getInstance")),(0,o.kt)("p",null,"A function that returns an atom instance. Pass an atom and its params (if any)"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"({ getInstance }, newVal) => getInstance(otherAtom)\n({ getInstance }, newVal) => getInstance(otherAtom, ['param 1', 'param 2'])\n")),(0,o.kt)("h3",{id:"instance"},(0,o.kt)("inlineCode",{parentName:"h3"},"instance")),(0,o.kt)("p",null,"A reference to the current ion ",(0,o.kt)("a",{parentName:"p",href:"../classes/AtomInstance"},"atom instance"),"."),(0,o.kt)("h3",{id:"set"},(0,o.kt)("inlineCode",{parentName:"h3"},"set")),(0,o.kt)("p",null,"A function that sets the state of an atom instance. Pass an atom and its params (if any) and either the new state or a function that receives the current state of that atom and returns the new state. Returns the new state."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"({ set }, newVal) => set(otherAtom, newVal)\n({ set }, newVal) => set(otherAtom, ['param 1', 'param 2'], newVal)\n")))}p.isMDXComponent=!0}}]);