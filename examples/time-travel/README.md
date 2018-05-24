# Zedux Time Travel Example

This example merely demonstrates that Zedux supports time travel debugging. It works only with the [redux devtools browser extension](https://github.com/zalmoxisus/redux-devtools-extension) (for now).

Zedux was designed from the ground up to support time travel debugging. It supports this feature proudly &ndash; you'll see it mentioned frequently throughout the [Zedux docs](https://bowheart.github.io/zedux/docs/overview).

## To view

This example uses the excellent [parcel bundler](https://parceljs.org). To run the example, simply clone this repo, open it in a terminal, and run the following commands:

```bash
cd examples
npm install
npm start -- time-travel
```

or simply:

```bash
cd examples/time-travel
npm start
```

which will run the first set of commands for you.

Then open `localhost:1234` in a browser. Enjoy!

Note that parcel supports Hot Module Replacement, so feel free to play around with that too!
