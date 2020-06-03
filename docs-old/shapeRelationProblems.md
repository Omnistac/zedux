# Shape Relation Problems

This is just a page to get creative juices flowing about shape relation problems. All of these are surmountable, but we haven't come up with a clean, simple api for handling any of them yet. Feedback is what we're after here!

## The problem

A "shape relation problem" is a problem surrounding two or more entities with different [shape relations](/docs/glossary.md#shape-relation).

In all cases, the easiest workaround is to bring both entities to the same level. Unfortunately, this will always necessarily be the lowest level. In other words, this means taking the [shape agnostic](/docs/glossary.md#shape-agnostic) entity (the "higher" level) and making it [shape bound](/docs/glossary.md#shape-bound) (the "lower" level).

This isn't a big deal in a single-store environment. Since there is only one "shape", there is not usually a need to keep entities unaware of it. But Zedux doesn't believe in single stores.

Keeping entities shape agnostic makes them reusable. This is the better approach. Even shape bound entities should abstract out as much of their boundedness as possible. This is why selectors, for example, are composable; so we can have higher-order selectors that are effectively shape agnostic, composed of many shape bound selectors. This means we can use and reuse them with ease. It also makes for a declarative api.

Essentially, we're looking for some happy, easy, declarative adapter layer or standard abstraction of some sort that'll allow shape agnostic entities to communicate with specific shape bound entities.

## The problems

### Colocating selectors and reducers.

This is a nice thought ([first expressed by Dan Abramov himself](https://github.com/reactjs/redux/issues/2295#issuecomment-287960516), I believe) but hasn't been very practical. Selectors are shape bound, while reducers are shape agnostic.

On the other hand, this is another argument for [inducers](/docs/types/Inducer.md). As opposed to reducers, inducers *are* shape bound. This means that colocating selectors and inducers is easy and natural.

### Processor shape dependencies

Processors are necessarily shape agnostic, but there are cases where a processor needs to know the value of some other piece of state. Currently this is done by adding an inspector to the store that behaves as a shape bound "processor". This is just semantically irksome and a little more overhead for code splitting environments than we'd like.
