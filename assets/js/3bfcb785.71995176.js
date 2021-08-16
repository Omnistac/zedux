(self.webpackChunkzedux_docs=self.webpackChunkzedux_docs||[]).push([[8483],{1504:function(t,e,a){"use strict";a.r(e),a.d(e,{frontMatter:function(){return i},metadata:function(){return o},toc:function(){return p},default:function(){return l}});var n=a(4034),s=a(9973),r=(a(7294),a(3905)),i={id:"Settable",title:"Settable"},o={unversionedId:"api/types/Settable",id:"api/types/Settable",isDocsHomePage:!1,title:"Settable",description:"The value passed to store.setState(), thus also the value passed to instance.setState() and to SetStateInterceptors and ion setters.",source:"@site/docs/api/types/Settable.mdx",sourceDirName:"api/types",slug:"/api/types/Settable",permalink:"/zedux/docs/api/types/Settable",editUrl:"https://github.com/Omnistac/zedux/tree/master/docs/api/types/Settable.mdx",version:"current",frontMatter:{id:"Settable",title:"Settable"},sidebar:"react",previous:{title:"SetStateInterceptor",permalink:"/zedux/docs/api/types/SetStateInterceptor"},next:{title:"Subscriber",permalink:"/zedux/docs/api/types/Subscriber"}},p=[{value:"Definition",id:"definition",children:[]}],c={toc:p};function l(t){var e=t.components,a=(0,s.Z)(t,["components"]);return(0,r.kt)("wrapper",(0,n.Z)({},c,a,{components:e,mdxType:"MDXLayout"}),(0,r.kt)("p",null,"The value passed to ",(0,r.kt)("a",{parentName:"p",href:"../classes/Store#setstate"},(0,r.kt)("inlineCode",{parentName:"a"},"store.setState()")),", thus also the value passed to ",(0,r.kt)("a",{parentName:"p",href:"../classes/AtomInstance#setstate"},(0,r.kt)("inlineCode",{parentName:"a"},"instance.setState()"))," and to ",(0,r.kt)("a",{parentName:"p",href:"SetStateInterceptor"},"SetStateInterceptors")," and ",(0,r.kt)("a",{parentName:"p",href:"../factories/ion#set"},"ion setters"),"."),(0,r.kt)("h2",{id:"definition"},"Definition"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"type Settable<State = any> = ((state: State) => State) | State\n")),(0,r.kt)("p",null,"Can be either the state straight-up or a function that receives the current state and returns the new state"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"const store = createStore(null, 'initial state')\n\nstore.setState('new state')\nstore.setState(currentState => `${currentState} and then some`)\nstore.getState() // 'new state and then some'\n")))}l.isMDXComponent=!0}}]);