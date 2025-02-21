---
title: 'Scalability: The Lost Level of React State Management'
image: /img/scalability-the-lost-level/scale.jpg
tags: [atoms, dev-x, theory]
---

![cover photo](/img/scalability-the-lost-level/scale.jpg)

Original photo by <a href="https://unsplash.com/@trails?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">trail</a> on <a href="https://unsplash.com/photos/yN1qXz6Hrfw?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>

(Originally posted on [HackerNoon](https://hackernoon.com/scalability-the-lost-level-of-react-state-management)).

In a recent conversation about state management in React, the topic of scalability came up. I was disappointed, but not at all surprised to hear it written off as an unimportant buzzword.

Having been a fly on the React state management wall for 8 years, I've seen this general sentiment expressed over and over: All popular React state management solutions are "scalable" and that's all you need to know.

It isn't.

Join me for a minute and I'll tell you why.

{/* truncate */}

## What Is Scalability?

I hate to be one of those blogs that starts off a lawn-treatment article by defining grass. But the very definition of scalability when it comes to state management has been lost in the React community.

Allow me to define it.

"Scalability" refers to a tool's ability to adapt to new challenges over time. Importantly, it goes both ways - scaling up **and scaling down**. A scalable tool handles every situation well - elegance in every facet of complexity:

![Scalability = Elegance across App Complexities](/img/scalability-the-lost-level/elegance-across-complexity.png)

This would be a very idealistic state manager. In reality, there is no such silver bullet. Scalability is the artform of getting as close as possible to this perfect plateau.

Elegance is largely subjective, but there are a few measurable statistics like performance benchmarks, lines of code (read boilerplate), and the number of unique concepts the user is required to know to do a given task. Still, some state managers will be more "scalable" _for you_. And that's fine! Just keep this in mind:

### The Criteria

Apps grow. Teams grow. A scalable state management tool needs to elegantly solve a number of problems at every stage of an app's growth. These problems include:

1. Performance. Bigger apps need to move data quickly and prevent unnecessary rerenders.
2. Debugging. Are updates predictable? Can you track down unexpected changes?
3. Boilerplate. Tiny apps don't need a bazooka and big apps don't want thousands of them.
4. Side effects. Are these defined clearly? Are they flexible and simple?
5. Caching/Memoization. Big apps need control over memory usage and tiny apps don't care.

I'll call these the 5 Great Scalability Criteria. There are more considerations like code splitting, testability, extensibility, interoperability, adoptability, even-more-abilities, and the learning curve. But these 5 will do for this article.

As a general example, an overtly simple state manager might look something like this:

![good for small apps, bad for big apps](/img/scalability-the-lost-level/simple-state-managers.png)

A naive solution becomes less useful over time, requiring you to find uglier and more complex workarounds. Such a tool can start to get in your way more often than it helps.

A truly scalable state manager doesn't drown a tiny app in config files and boilerplate and _at the same time_ it doesn't leave a big app stranded in a sea of missing features and unstructured simplicity.

I'm sure this all sounds pretty straightforward. So why do I feel like this art has been lost?

## React Context

Don't get me started. Nope, too late. React's new(ish) context API is a thing of beauty and a joy to work with, **if** you don't use it for state management (directly).

React context is the quintessential example of a non-scalable React state management solution. As an app grows, React context inevitably leads to performance problems and dev X nightmares like indirection, mystery updates, implicit dependencies, and lots of tightly-coupled logic that makes abstraction, testing, and code splitting difficult.

React context creates as much lock-in as a real state manager - and even more since you'll write the boilerplate yourself. All that added boilerplate also increases the surface area for bugs.

```tsx
// There are many potential footguns with even this many providers - e.g.
// UserProvider creating an implicit dependency on AuthProvider, Routes
// rerendering due to UserProvider's state updating, etc.
function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <RouteProvider>
          <Routes />
        </RouteProvider>
      </UserProvider>
    </AuthProvider>
  )
}
```

I've seen this happen countless times on Twitter and Reddit:

Someone complains about how they regret starting with React context and asks what they should use instead.

Within a few hours, someone else will say, "Hey, I'm new. Where should I start?" and we all jump on and tell the poor guy to start with React context, dooming him to the same fate. This goes on in an endless loop.

### Are We Ever Gonna Learn?

The advice to use React context for state management is not malicious. In fact, I believe it comes from good intentions. React devs tend to recommend React context for state management because it sounds like a decent, unopinionated, neutral, objective, diplomatic solution that's readily available.

And it is all of those things. But it's also really bad advice.

I know that React state management is a polarizing topic. Avoiding it sounds like smooth sailing.

![React devs vs state management](https://i.imgflip.com/7myjxh.jpg)

But don't forget that competition breeds innovation. In the last 8 years, React state management has evolved in many, many ways that will benefit _you_. Don't ignore it!

To be clear, I'm not talking about `useState` and `useReducer` by themselves. Those are great tools for keeping local state tied to a component's lifecycle. You should use these even when you have a good state manager.

I'm talking about the moment when you need to [lift state up](https://react.dev/learn/sharing-state-between-components) (which you will need to do). Simple props are totally fine, as shown in that linked doc. But when you run into prop drilling problems, have a plan from the very beginning for what you're going to use. And don't use raw React context. Just don't. You'll thank me.

### Doing It Right

Now, I'm sure you've heard that React context can be used effectively at scale. And that's true (to an extent), **if** you do it right.

The main principle for this is using React context for [dependency injection, not state management](https://blog.testdouble.com/posts/2021-03-19-react-context-for-dependency-injection-not-state/). That article is an excellent breakdown of this technique. The gist is that React context is a very powerful **low-level** model that requires at least a thin wrapper to be used for state management.

The "thin wrapper" can be as simple as an [RxJS BehaviorSubject](https://rxjs.dev/api/index/class/BehaviorSubject).

Bad:

```tsx
function UserProvider({ children }) {
  const [user, setUser] = useState({})

  return (
    <userContext.Provider value={{ user, setUser }}>
      {children}
    </userContext.Provider>
  )
}
```

Good:

```tsx
function UserProvider({ children }) {
  const subject = useMemo(() => new RxJS.BehaviorSubject({}), [])

  return <userContext.Provider value={subject}>{children}</userContext.Provider>
}
```

This is just the (simplified) Provider. To use React context properly, you also have to learn to colocate logic, create hook wrappers, and create a system for triggering and taming rerenders using the pub/sub or similar model.

Sound like a lot of work? Good, because it is! To use React context properly, you essentially have to roll your own state manager.

If you're willing to tackle the 5 Great Scalability Criteria yourself, this is totally fine. Just don't go off the deep end with generators and stage 2 ECMAScript proposals. Keep concepts familiar for the sake of future team members and your own future self.

Alright, you knew [Redux](https://github.com/reduxjs/redux) was coming.

## Redux

I'm talking about Redux pre-[RTK](https://github.com/reduxjs/redux-toolkit) here. Due primarily to its infamous boilerplate, raw Redux has proven to not be a very scalable solution - it's clumsy for small apps to get started with and at the same time is clunkily verbose for large apps.

Redux did, however, make long strides over previous Flux implementations in other scalability criteria:

- #2 Debugging - Redux's time travel model was revolutionary
- #4 Side Effects - Redux's middleware finally gave these a comfortable home

![We don't talk about Redux Saga](https://i.imgflip.com/7ln21i.jpg)

Redux Toolkit (RTK) finally fixed many of the boilerplate problems. This alone makes RTK a very "scalable" state management solution.

Redux excels in the moderate-to-fairly-high complexity range. RTK is an overall improvement, but is still a little verbose for very small apps. Overall, I'd draw its scalability like this:

![RTK vs Redux](/img/scalability-the-lost-level/redux.png)

I'll cover that sharp drop at the end in a minute, but first:

## Zustand

This excellent state manager removed even more of Redux's boilerplate at the cost of some debugging power. You can think of [Zustand](https://github.com/pmndrs/zustand) like a very simplistic RTK that scales down way better and scales up only a little worse.

I'll cut to the graph:

![Zustand vs Redux](/img/scalability-the-lost-level/zustand.png)

Since Zustand covers the full spectrum better, altogether, I would call Zustand more "scalable" than RTK. It's more comfortable for small apps to use and will be a steady companion all the way up almost to the extremes of complexity.

I've seen many people on the RTK train bewildered about Zustand's success when RTK clearly scales up better. I hope the above graph clears this up a little - many apps don't need to scale up that far. But they do want a state manager that scales all the way _down_ to elegantly handle state in even the initial PoC/prototype phase.

Alright, it's time to talk about those steep drops at the end.

## Singleton vs Atomic

Redux and Zustand use a singleton model. You create one store. All side effects and state derivations (selectors) hook into that store.

This approach has a hard upper limit. I wrote some thoughts about this on [this Reselect discussion](https://github.com/reduxjs/reselect/discussions/491#discussioncomment-5762615). The gist is that an app with lots of fast-moving data can start to bottleneck a store with lots of subscribers, reducers, and deep selector graphs.

[Recoil](https://github.com/facebookexperimental/Recoil) introduced a new pattern for storing state and propagating updates. This atomic model has proven to scale up better than the singleton model at the cost of some hefty learning curves.

Still, it can be very useful in even very small apps. I'd draw its overall scalability something like this:

![Recoil vs RTK](/img/scalability-the-lost-level/recoil.png)

That slow tail off at the end is 👌 and is why I believe atomic (or similar) models are the future.

## Jotai

Jotai did to Recoil what Zustand did to Redux; it sacrificed a little long-term power for some short-term elegance. This makes Jotai an excellent all-around tool.

The graph:

![Jotai vs Recoil](/img/scalability-the-lost-level/jotai.png)

Please remember that this is just a dude drawing lines on [Excalidraw](https://excalidraw.com/). These lines don't accurately reflect each tool's capabilities in every aspect of every app or in the hands of every programmer. I'm trying to communicate only the general "scalability" of these tools from my experience given the scalability criteria I outlined.

With its simple APIs and very gracefully declining performance and capabilities, Jotai is the closest any of these tools have come to the "perfect plateau" at the beginning of this article.

Yes, that's right. Jotai is the most scalable state management solution. The end.

Well alright, _almost_ the end. I wouldn't be here if there wasn't a little bit more to the story:

## We Need To Go Deeper

After encountering the hard limit of the singleton model, a few coworkers and I started studying Recoil and Jotai. We loved the concepts and the performance scalability, but determined that they were lacking in other scalability criteria.

In 2020, I hatched a plan for an in-house solution that would sacrifice only a tiny bit of Jotai's simplicity in exchange for a much more powerful atomic model. Designed from the ground up with the 5 Great Scalability Criteria (and a lot more) in mind, this model scales up better than any of its predecessors and scales down only a little worse than Jotai.

This new tool started driving our production apps in early 2021 and has been a lifesaver in the extremes of complexity. 2 years later, we have finally open-sourced this tool as ["Zedux"](https://github.com/Omnistac/zedux).

## Zedux

Besides solving better for all of the 5 Great Scalability Criteria, Zedux added many features over Recoil/Jotai like React Query-esque cache management, cross-window support, real Dependency Injection, evaluation tracing, and atom exports. These are fun to say, but I'll write more about them in a separate article.

Overall, by design, Zedux's scalability looks like this:

![Zedux vs Recoil vs Jotai](/img/scalability-the-lost-level/zedux.png)

Besides a clear bias and my own experience using Zedux in data-intensive applications, the reason why I draw Zedux's scalability so generously is because of the 5 Great Scalability Criteria:

1. Performance (benchmarks [here](https://jsbench.me/zxlh0m1p0z), [here](https://jsbench.me/y6lh0mv9oc), [here](https://jsbench.me/xulh02zune), [here](https://jsbench.me/vllhus9i6t))
2. [Debugging](https://zedux.dev/docs/api/injectors/injectWhy)
3. [Boilerplate](https://zedux.dev/docs/walkthrough/quick-start)
4. Simple but completely powerful [side effects model](https://zedux.dev/docs/api/injectors/injectEffect)
5. [Cache control features](https://zedux.dev/docs/walkthrough/destruction)

There are many more reasons, but I'll limit it to these 5 for this article. Zedux was designed primarily to manage extremely volatile state in big fintech applications and to scale down _fairly_ well too. But that doesn't mean it does everything perfectly.

For small apps, Jotai and Zustand are certainly great options. Beyond that, personal preference can also come into play. As I said at the beginning, some tools are more scalable _for you_.

## Does Scalability Matter?

Scalability is a general principle, but that doesn't mean that every extreme applies to every app. You are free to analyze your own application and determine which parts of this discussion matter _and will ever matter_ for it. Just be sure to leave yourself plenty of leeway in your predictions.

Anything with live-time data visualization may need to scale up performance-wise beyond what the singleton model can handle. Additionally an app that's "just very, very big" might need more power.

This is all up to you to decide. But no, not all of this applies to every app.

## Conclusion

All modern state managers are solid options for most apps, but they scale up and down differently for each of the 5 Great Scalability Criteria.

Pick one you like that will suit the relative size and future complexity of your app. And don't use React context for state management unless you really want to make a state manager from scratch.

If the decision is too hard, here's my recommendation as someone who's been using React for 8 years:

- Pick either Zustand or Jotai if you want something you can start with quickly and that will scale up to moderate complexity (think an e-commerce or forum app).
- Pick RTK if you want something that will scale _up_ very well to almost the extremes of complexity and has a solid community.
- Pick Zedux if you want all your bases covered - from simplicity to ultimate complexity and everything in-between.

Lastly, I know that I've omitted many great tools like [XState](https://github.com/statelyai/xstate), [React Query](https://github.com/TanStack/query), and [SWR](https://github.com/vercel/swr). These tools are utilities that are very scalable in their own right, but aren't full replacements for a good state manager.

As for other global, atomic, proxy-based, and signal-based state managers, I'm sorry I couldn't get to them all in this article. Feel free to comment or start a discussion in [the Zedux repo](https://github.com/Omnistac/zedux/discussions) for better details or more comparisons.

If you get nothing else from this article, just remember that applications grow. Plan for growth and you'll succeed.
