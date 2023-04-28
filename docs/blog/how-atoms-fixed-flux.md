---
title: 'How Atoms Fixed Flux'
image: /img/zedux-and-react.png
tags: [history, theory]
---

The atomic model introduced by [Recoil](https://github.com/facebookexperimental/Recoil) introduced a lot of new capabilities at the cost of introducing some foreign concepts.

[Jotai](https://github.com/pmndrs/jotai) later simplified some of Recoil's APIs at the cost of some power and making debugging more difficult.

[Zedux](https://github.com/Omnistac/zedux) later simplified the atomic model itself by removing asynchrony from the atom graph and using APIs that feel familiar to React devs.

Other articles will focus on the differences between these tools. This article will focus on one big feature that all 3 have in common:

They fixed Flux.

## Flux

If you don't know Flux, here's a quick gist:

```
Actions -> Dispatcher -> Stores -> Views
```

Flux apps have multiple stores. There is only one Dispatcher whose job is to feed actions to all the stores in a proper order. This proper order means dynamically sorting out dependencies between the stores. For example, take an ecommerce app setup:

```
UserStore <-> CartStore <-> PromosStore
```

When the user moves an item to their cart, the PromosStore needs to wait for CartStore's state to update before sending off a request to see the available coupons for the user's items.

Or perhaps certain items can't ship to the user's area. In this case, the CartStore needs to read state from the UserStore to determine whether it should update. And what about the error message? The CartStore may need to update a NotificationsStore.

Flux doesn't like these dependencies. From the [legacy React docs](https://legacy.reactjs.org/blog/2014/07/30/flux-actions-and-the-dispatcher.html#why-we-need-a-dispatcher):

> The objects within a Flux application are highly decoupled, and adhere very strongly to the [Law of Demeter](https://en.wikipedia.org/wiki/Law_of_Demeter), the principle that each object within a system should know as little as possible about the other objects in the system.

The theory behind this is solid. 100%. Soo ... why did Flux die?

## State Dependencies

Well turns out, dependencies between isolated state containers are inevitable. In fact, to keep code modular and DRY, you _should_ be reading from and relying on other stores frequently. A UserStore in particular may need to be read from often to enable features or prevent disallowed actions.

A point that is rarely addressed in the state management world is that apps scale. The above ecommerce app example could someday have stores for OrderHistory, ShippingCalculator, DeliveryEstimate, etc. It is not impractical for a large app to have hundreds of stores.

Flux only provides basic dependency helpers encourages you to manage dependencies outside the data layer as much as possible. Considering that the data layer is what defines those dependencies, this technical decoupling adds significant cognitive load when developing a Flux app.

On top of this, there are many design considerations Flux didn't solve for - or at least, the theory was unclear. Where should side effects go? Don't selectors that combine state from many stores violate the Law of Demeter? Should you attach all the needed state from all stores to an action before dispatching? What if PromosStore needs to wait for CartStore to send an async request before updating - is it CartStore's job to dispatch another action with all the information PromosStore needs?

Some of these answers were foggy. Side effects, for example, were typically placed inside the stores themselves. You can see this recommended even on the archived [Flux examples page](https://github.com/facebookarchive/flux/tree/4ee8c50865c357e005cb40ea03cdd403533aad26/examples). But what about purity? What about an RxJS flow that reads from many stores at many stages in the pipeline?

Long story short, the Flux model breaks down very quickly. And it showed on even very small apps.

## Later Iterations

We all know how [Redux](https://github.com/reduxjs/redux) came roaring in to save the day. It ditched the concept of multiple stores in favor of a singleton model. Now everything can access everything else without any formal "dependencies". Redux also reduced Flux's boilerplate a little. Alright, a very little.

RTK later simplified Redux's infamous boilerplate. Then Zustand removed some fluff at the cost of

With modular state, dependency trees naturally get so complex and interwoven that the best solution we could think of was, "Just don't do it I guess."

And it worked. It still works well enough for most apps. The Flux principles were so solid that simply removing the dependency nightmare fixed it.

Or did it?
