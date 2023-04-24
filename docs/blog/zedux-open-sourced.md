---
title: 'Zedux Open-Sourced and v1 Released'
image: /img/zedux-and-react.png
tags: [history, introductory]
---

Zedux: A Molecular State Engine for React is officially open-sourced and version 1.0.0 has been released!

Check it out on GitHub [here](https://github.com/Omnistac/zedux). Check out the docs [here](https://omnistac.github.io/zedux/). Check out the introduction [here](https://omnistac.github.io/zedux/docs/about/introduction). Check out the quick start [here](https://omnistac.github.io/zedux/docs/walkthrough/quick-start).

This article will give a brief history of Zedux while trying to stay high-level. If you like your announcements detailed and mixed with a little controversy, check out the follow-up article, ["Zedux: Is this the one?"](https://omnistac.github.io/zedux/blog/zedux-is-this-the-one).

<!-- truncate -->

Wow, we're finally here! It has been a journey. Grab a seat for a minute and I'll tell you about it.

## The Journey

It started in 2017 with me. I'd been working with React for several years at that point. I'd also spent inordinate amounts of time studying state management tools in React. It was a topic I loved, and I don't know why.

I started experimenting with making my own React state library. Not because I was dissatisfied with existing tools - quite the opposite. I wanted to learn everything about them. The best way to learn how an engine works is to break it apart. And that's exactly what I spent way too much time doing. Well, minus the engine.

Side note before you grab your swords: I'm not gonna mention any React state management tools by name in this article. There'll be places for that. Not here.

Alright. Back to the story.

## The Story (still)

Once upon a busy day, an idea for a flux-inspired composable store model came flying into my brain. Several months of prototyping, reworking, and tweaking later, I was sitting on some Rather Cool Composable Code.

I called it Zedux. Yes. The Z is for Zero-config, which is one of its key features. Really, it had only one problem:

It was useless. Composable stores were cool, sure. The buzzword status was off the charts. Say it with me: Composable stores. Composable stores. Sounds like a React dev's dream. Oh and don't forget zero-config.

Well, turns out it wasn't as _useful_ as it sounded. Don't get me wrong, these composable stores (I said it again, didn't I) were at least as useful as most tools out there at the time. But they didn't really stand out. They didn't fill a niche.

Long story short, I lost motivation and _sat_ on that code. There we were, the code and I, just _sitting_.

## Sitting

In the middle of landing my dream job in 2018, the recruiter mentioned that Zedux might be useful in their state-intensive bond trading software. Well, maybe. But I wasn't done sitting yet.

Over the next few years, I worked with other state management tools and examined them in our demanding apps - taking notes when they fell short in a big codebase and with highly volatile state.

Fast forward to 2020. Our demanding application was starting to demand too much of our tooling. Our selectors were slow. Our side effects were everywhere. We needed something with more scalable Dev X and runtime perf.

A few of us spent lots of time playing with other tools in our app. We _loved_ the atomic model and server cache management tools. We tested several thoroughly, but finally concluded that there was nothing stable and powerful enough to satisfy our socket-driven, very volatile app's needs.

After a series of fortuitous events, Zedux came up, and I realized that I was done sitting.

## Resurrecting Zedux

The atomic model was exactly what the composable store model was missing. After lots of discussion and prototyping, we dedicated 3 months to building an atomic architecture around Zedux's existing composable store model. This had many requirements, and in the end the whole codebase was completely reworked.

A few months later, Zedux became a roaring success. It took its place at the helm, powering all our apps in early 2021.

Turns out, the separation between the state management layer (stores) and the architecture layer (atoms) is the key to unlocking powerful DI and inter-store communication the likes of which no flux-based app has ever seen.

We got permission to open-source the new library later that year. A few API iterations and way too much documentation-writing later, we find ourselves in 2023 with a long-overdue announcement:

## Finale

As of today, April 24, 2023, Zedux is officially open-sourced and stable at version 1.0.0!

Check out the project on GitHub [here](https://github.com/Omnistac/zedux). All feedback is very welcome. Tell us what you think! You can [open a discussion](https://github.com/Omnistac/zedux/discussions) on GitHub or [tag/DM me](https://twitter.com/josh_claunch) on twitter. Depending on interest, we may start a discord community too.

If you were hoping this article would get down to the nitty-gritty details and throw some mud at other tools, you may be interested in the longer follow-up article, ["Zedux: Is this the one?"](https://omnistac.github.io/zedux/blog/zedux-is-this-the-one).

If you read this history lesson all the way to the end, my hat is all the way off to you. It has been quite a journey so far, but it's really only just beginning. Here's to all the mind-blowing tools we'll build together 🥂
