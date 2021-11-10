"use strict";(self.webpackChunkzedux_docs=self.webpackChunkzedux_docs||[]).push([[7484],{2698:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return c},contentTitle:function(){return u},metadata:function(){return i},toc:function(){return l},default:function(){return m}});var r=n(3117),a=n(102),o=(n(7294),n(3905)),s=["components"],c={id:"redux-comparison",title:"Redux Comparison"},u=void 0,i={unversionedId:"about/redux-comparison",id:"about/redux-comparison",isDocsHomePage:!1,title:"Redux Comparison",description:"Zedux is more comparable to Redux Toolkit (RTK) than raw Redux, so that's what we'll compare against.",source:"@site/docs/about/redux-comparison.mdx",sourceDirName:"about",slug:"/about/redux-comparison",permalink:"/zedux/docs/about/redux-comparison",editUrl:"https://github.com/Omnistac/zedux/tree/master/docs/about/redux-comparison.mdx",tags:[],version:"current",frontMatter:{id:"redux-comparison",title:"Redux Comparison"},sidebar:"react",previous:{title:"Overview",permalink:"/zedux/docs/about/overview"},next:{title:"React Query Comparison",permalink:"/zedux/docs/about/react-query-comparison"}},l=[{value:"TL;DR",id:"tldr",children:[],level:2},{value:"Comparables",id:"comparables",children:[{value:"Reducers",id:"reducers",children:[],level:3},{value:"Reducer Splitting",id:"reducer-splitting",children:[],level:3},{value:"Actions and Reducers",id:"actions-and-reducers",children:[],level:3},{value:"State Slices",id:"state-slices",children:[],level:3},{value:"Hydrating",id:"hydrating",children:[],level:3},{value:"Side Effects",id:"side-effects",children:[],level:3}],level:2},{value:"No Middleware",id:"no-middleware",children:[],level:2},{value:"Other Features",id:"other-features",children:[],level:2}],d={toc:l};function m(e){var t=e.components,n=(0,a.Z)(e,s);return(0,o.kt)("wrapper",(0,r.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"Zedux is more comparable to ",(0,o.kt)("a",{parentName:"p",href:"https://redux-toolkit.js.org/"},"Redux Toolkit")," (RTK) than raw Redux, so that's what we'll compare against."),(0,o.kt)("p",null,"As its name suggests, Zedux originated from Redux. It actually started off as Redux middleware in early 2017. Zedux is now a comprehensive suite of state management tools that has several things in common with Redux Toolkit and lots of other features."),(0,o.kt)("p",null,"The Z in Zedux is for Zero config. One of the main features of Zedux is its zero config stores. This feature alone makes Zedux feel very different from Redux."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"const store = createStore() // no config required!\nstore.setState('my state')\n")),(0,o.kt)("p",null,"In this comparison, we won't use Zedux' React or atomic APIs. Zedux' React usage is vastly different from Redux', using Recoil-esque atoms to structure and control stores."),(0,o.kt)("h2",{id:"tldr"},"TL;DR"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},"Both Redux and Zedux stores can be given reducers to drive state creation and updates."),(0,o.kt)("li",{parentName:"ul"},"Zedux has zero config stores."),(0,o.kt)("li",{parentName:"ul"},"State should not be mutated."),(0,o.kt)("li",{parentName:"ul"},"RTK wraps reducers in immer producers. Zedux does not (we may implement this someday. Not for now)."),(0,o.kt)("li",{parentName:"ul"},"Both have similar reducer splitting APIs"),(0,o.kt)("li",{parentName:"ul"},"Both have similar action creator and reducer creation APIs"),(0,o.kt)("li",{parentName:"ul"},"In both, actions and reducers have a many-to-many relationship."),(0,o.kt)("li",{parentName:"ul"},"In both, dispatched actions can be observed, saved, and replayed for a time travel debugging experience."),(0,o.kt)("li",{parentName:"ul"},"RTK uses ",(0,o.kt)("inlineCode",{parentName:"li"},"createSlice()")," to create state slices. Zedux uses store composition \ud83e\udd2f."),(0,o.kt)("li",{parentName:"ul"},"Redux apps typically have one store. Zedux apps typically create many stores."),(0,o.kt)("li",{parentName:"ul"},"Both have similar state hydration APIs"),(0,o.kt)("li",{parentName:"ul"},"Redux uses middleware to manage side effects. Zedux uses effects subscribers."),(0,o.kt)("li",{parentName:"ul"},"Redux uses middleware for plugins. Zedux doesn't offer a dedicated plugin system at the store level (plugins will be at the ecosystem level. \ud83d\udea7 This feature is under construction)."),(0,o.kt)("li",{parentName:"ul"},"In both, stores are observables (streams) of state"),(0,o.kt)("li",{parentName:"ul"},"In Zedux, stores are also observables of actions."),(0,o.kt)("li",{parentName:"ul"},"In Zedux, store dispatches are completely synchronous.")),(0,o.kt)("h2",{id:"comparables"},"Comparables"),(0,o.kt)("p",null,"Many concepts are similar in both Zedux and Redux."),(0,o.kt)("h3",{id:"reducers"},"Reducers"),(0,o.kt)("p",null,"RTK - all stores use a reducer."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { configureStore } from '@reduxjs/toolkit'\n\nconst store = configureStore({\n  reducer: rootReducer\n})\n")),(0,o.kt)("p",null,"Zedux - stores ",(0,o.kt)("em",{parentName:"p"},"can")," be given a reducer."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { createStore } from '@zedux/react'\n\nconst store = createStore(rootReducer)\n")),(0,o.kt)("p",null,"But this is optional in Zedux."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"const zeroConfigStore = createStore()\n")),(0,o.kt)("p",null,"Due to their simplicity, zero config stores are extremely common in Zedux."),(0,o.kt)("h3",{id:"reducer-splitting"},"Reducer Splitting"),(0,o.kt)("p",null,"RTK - use ",(0,o.kt)("inlineCode",{parentName:"p"},"configureStore()")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"combineReducers()"),"."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { combineReducers, configureStore } from '@reduxjs/toolkit'\n\nconst store = configureStore({\n  reducer: {\n    a: reducerA,\n    b: combineReducers({\n      c: reducerC,\n      d: reducerD\n    })\n  }\n})\n")),(0,o.kt)("p",null,"Zedux - use ",(0,o.kt)("inlineCode",{parentName:"p"},"createStore()"),"."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { createStore } from '@zedux/react'\n\nconst store = createStore({\n  a: reducerA,\n  b: {\n    c: reducerC,\n    d: reducerD\n  }\n})\n")),(0,o.kt)("p",null,"The concept is almost the same in both. Zedux' ",(0,o.kt)("inlineCode",{parentName:"p"},"createStore")," is a bit more high-level, handling nested objects."),(0,o.kt)("h3",{id:"actions-and-reducers"},"Actions and Reducers"),(0,o.kt)("p",null,"RTK - use ",(0,o.kt)("inlineCode",{parentName:"p"},"createAction()")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"createReducer()"),'. RTK also uses immer so you can "mutate" state.'),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { createAction, createReducer } from '@reduxjs/toolkit'\n\nconst increment = createAction('counter/increment')\nconst decrement = createAction('counter/decrement')\nconst incrementByAmount = createAction<number>('counter/incrementByAmount')\n\nconst initialState = { value: 0 }\n\nconst counterReducer = createReducer(initialState, (builder) => {\n  builder\n    .addCase(increment, state => {\n      state.value++\n    })\n    .addCase(decrement, state => {\n      state.value--\n    })\n    .addCase(incrementByAmount, (state, action) => {\n      state.value += action.payload\n    })\n})\n")),(0,o.kt)("p",null,"Zedux - use ",(0,o.kt)("inlineCode",{parentName:"p"},"createActor()")," and ",(0,o.kt)("inlineCode",{parentName:"p"},"createReducer()"),". No immer (for now)."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { createActor, createReducer } from '@zedux/react'\n\nconst increment = createActor('counter/increment')\nconst decrement = createActor('counter/decrement')\nconst incrementByAmount = createActor<number>('counter/incrementByAmount')\n\nconst initialState = { value: 0 }\n\nconst counterReducer = createReducer(initialState)\n  .reduce(increment, state => state.value + 1)\n  .reduce(decrement, state => state.value - 1)\n  .reduce(incrementByAmount, (state, action) => state.value + action.payload)\n")),(0,o.kt)("p",null,"Zedux also exports a ",(0,o.kt)("inlineCode",{parentName:"p"},"createActorFactory()")," factory that we could have used to auto-attach the ",(0,o.kt)("inlineCode",{parentName:"p"},"counter/")," namespace to these action creators."),(0,o.kt)("h3",{id:"state-slices"},"State Slices"),(0,o.kt)("p",null,"RTK - use ",(0,o.kt)("inlineCode",{parentName:"p"},"createSlice()"),"."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { configureStore, createSlice } from '@reduxjs/toolkit'\n\nconst counterSlice = createSlice({\n  name: 'counter',\n  initialState: { value: 0 },\n  reducers: {\n    increment(state) {\n      state.value++\n    },\n    decrement(state) {\n      state.value--\n    },\n  },\n})\n\nconst store = configureStore({\n  reducer: {\n    counter: counterSlice.reducer\n  }\n})\n\nstore.dispatch(counterSlice.actions.increment())\nstore.dispatch(counterSlice.actions.decrement())\n")),(0,o.kt)("p",null,"Zedux - use nested stores."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { createStore } from '@zedux/react'\n\nconst counterStore = createStore(null, { value: 0 })\n\nconst increment = () => counterStore.setStateDeep(\n  ({ value }) => ({ value: value + 1 })\n)\nconst decrement = () => counterStore.setStateDeep(\n  ({ value }) => ({ value: value + 1 })\n)\n\nconst store = createStore({\n  counter: counterStore\n})\n\nincrement()\ndecrement()\n")),(0,o.kt)("h3",{id:"hydrating"},"Hydrating"),(0,o.kt)("p",null,"RTK - pass ",(0,o.kt)("inlineCode",{parentName:"p"},"preloadedState")," to ",(0,o.kt)("inlineCode",{parentName:"p"},"configureStore()"),"."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { configureStore } from '@reduxjs/toolkit'\n\nconst store = configureStore({\n  preloadedState: myData,\n  reducer: {}\n})\n")),(0,o.kt)("p",null,"Zedux - pass as the second param to ",(0,o.kt)("inlineCode",{parentName:"p"},"createStore()"),"."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { createStore } from '@zedux/react'\n\nconst store = createStore(null, myData)\n")),(0,o.kt)("h3",{id:"side-effects"},"Side Effects"),(0,o.kt)("p",null,"RTK - use middleware."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { configureStore } from '@reduxjs/toolkit'\n\nconst logger = store => next => action => {\n  const oldState = store.getState()\n  next(action)\n  const newState = store.getState()\n\n  console.log('store state updated', { newState, oldState })\n}\n\nconst store = configureStore({\n  middleware: [logger],\n  reducer: rootReducer,\n})\n")),(0,o.kt)("p",null,"(note that this middleware depends on other middleware and store enhancers not disrupting the synchronous state update)."),(0,o.kt)("p",null,"Zedux - use effects subscribers."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import { createStore } from '@zedux/react'\n\nconst store = createStore()\n\nstore.subscribe({\n  effects: ({ newState, oldState }) => {\n    console.log('store state updated', { newState, oldState })\n  }\n})\n")),(0,o.kt)("p",null,"(This is a very Zedux-favored example. Not all side effects flows are simpler in Zedux)."),(0,o.kt)("h2",{id:"no-middleware"},"No Middleware"),(0,o.kt)("p",null,"Yep. It isn't necessary. Side effects like logging or running sagas or observables can all be effectively handled by Zedux' effects subscribers. Batching and canceling actions may not be possible, but those never were necessary at the store level - they can be handled just fine outside the store."),(0,o.kt)("p",null,"In Redux, middleware can also be useful for adding plugins. Zedux has atoms, which can encapsulate the state, side effects, and exports of the store. A plugin system at the store level isn't very necessary."),(0,o.kt)("p",null,"Some operations are easier without middleware and some are harder. Those should more or less balance out."),(0,o.kt)("p",null,"Read more about ",(0,o.kt)("a",{parentName:"p",href:"../api/types/Subscriber#effects"},"effects subscribers here"),"."),(0,o.kt)("h2",{id:"other-features"},"Other Features"),(0,o.kt)("p",null,"Zedux and Redux don't overlap perfectly. They each have some unique features. We won't go into RTK's here, but check out ",(0,o.kt)("a",{parentName:"p",href:"https://redux-toolkit.js.org/"},"their docs"),"."),(0,o.kt)("p",null,"Zedux has many features not mentioned here. Most of these revolve around the ",(0,o.kt)("a",{parentName:"p",href:"recoil-comparison"},"Recoil-esque atomic model")," and ",(0,o.kt)("a",{parentName:"p",href:"react-query-comparison"},"React Query-esque cache management"),". Check out those comparisons for more info. Or check out the ",(0,o.kt)("a",{parentName:"p",href:"../walkthrough/quick-start"},"walkthrough")," for a better picture of what Zedux is all about."))}m.isMDXComponent=!0}}]);