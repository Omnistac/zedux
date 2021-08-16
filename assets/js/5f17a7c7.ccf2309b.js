(self.webpackChunkzedux_docs=self.webpackChunkzedux_docs||[]).push([[4325],{9708:function(e,t,r){"use strict";r.r(t),r.d(t,{frontMatter:function(){return i},metadata:function(){return s},toc:function(){return c},default:function(){return u}});var n=r(4034),a=r(9973),o=(r(7294),r(3905)),i={id:"HierarchyDescriptor",title:"HierarchyDescriptor"},s={unversionedId:"api/types/HierarchyDescriptor",id:"api/types/HierarchyDescriptor",isDocsHomePage:!1,title:"HierarchyDescriptor",description:"The type passed to createStore() and to Store#use().",source:"@site/docs/api/types/HierarchyDescriptor.mdx",sourceDirName:"api/types",slug:"/api/types/HierarchyDescriptor",permalink:"/zedux/docs/api/types/HierarchyDescriptor",editUrl:"https://github.com/Omnistac/zedux/tree/master/docs/api/types/HierarchyDescriptor.mdx",version:"current",frontMatter:{id:"HierarchyDescriptor",title:"HierarchyDescriptor"},sidebar:"react",previous:{title:"EvaluationReason",permalink:"/zedux/docs/api/types/EvaluationReason"},next:{title:"IonGetUtils",permalink:"/zedux/docs/api/types/IonGetUtils"}},c=[{value:"Definition",id:"definition",children:[]}],p={toc:c};function u(e){var t=e.components,r=(0,a.Z)(e,["components"]);return(0,o.kt)("wrapper",(0,n.Z)({},p,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"The type passed to ",(0,o.kt)("a",{parentName:"p",href:"../factories/createStore"},(0,o.kt)("inlineCode",{parentName:"a"},"createStore()"))," and to ",(0,o.kt)("a",{parentName:"p",href:"../classes/Store#use"},(0,o.kt)("inlineCode",{parentName:"a"},"Store#use()")),"."),(0,o.kt)("h2",{id:"definition"},"Definition"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"type Branch<T = any> = {\n  [K in keyof T]: HierarchyDescriptor<T[K]>\n}\n\ntype HierarchyDescriptor<State = any> =\n  | Branch<State>\n  | Store<State>\n  | Reducer<State>\n  | null\n")),(0,o.kt)("p",null,"A HierarchyDescriptor can be a store, a reducer, or an object containing stores, reducers, or more objects nested indefinitely."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { createStore } from '@zedux/react'\n\nconst withStore = createStore(myStore)\nconst withReducer = createStore(myReducer)\nconst withObject = createStore({\n  storeState: myStore,\n  reducerState: myReducer\n})\nconst nested = createStore({\n  a: {\n    b: storeB,\n    c: storeC,\n    d: {\n      e: reducerE,\n      f: storeF\n    }\n  }\n})\n")),(0,o.kt)("p",null,"Any node in the HierarchyDescriptor can also be set to ",(0,o.kt)("inlineCode",{parentName:"p"},"null"),". This indicates removal when passed to ",(0,o.kt)("a",{parentName:"p",href:"../classes/Store#use"},(0,o.kt)("inlineCode",{parentName:"a"},"Store#use()")),"."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"const myStore = createStore({\n  a: storeA,\n  b: storeB,\n})\n\nmyStore.use({\n  b: null // remove `b` from myStore\n})\n")))}u.isMDXComponent=!0}}]);