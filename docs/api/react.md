# `react()`

A standard tool for creating reactors. It's mostly just syntactic sugar for switch statements or action-reducer maps, but, of course, with [processors](/docs/types/Processor.md) rolled in.

`react()` is a factory for creating [`ZeduxReactor`](/docs/api/ZeduxReactor.md)s.

## Definition

```javascript
(initialState: any) => ZeduxReactor
```

## Usage

```javascript
import { react } from 'zedux'

const reactor = react()
```

## Motivation

We've seen what happens when a library leaves the implementation of low-level details (read: boilerplate) up to the user. We get a massive divide between those who think explicitly creating all boilerplate is best, and a couple hundred libraries offering a "better" way.

Zedux provides a high-level api for action and reducer creation out of the box. Since its actually a pretty good one, the number of competing libraries will be minimal. And the low-level people, while unhindered, will at least not be joined by those whose only reason for writing boilerplate is, "Well, that's how the docs do it."

## Notes

Check out the [ZeduxReactor api](/docs/api/ZeduxReactor.md) to see how to use this bad boy.
