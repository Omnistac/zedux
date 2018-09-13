# Zedux examples

Thanks to the excellent [parcel bundler](https://parceljs.org), the examples in this directory are structured a little better than you may be used to. All examples are run from this directory.

For example, to try out the `todomvc` example, simply clone this repo, open it in a terminal, and run the following commands:

```bash
cd examples # this directory
npm install
npm start -- todomvc
```

Then open `localhost:1234` in a browser. That's it! To switch to another example, simply kill that server and run:

```bash
npm start -- <name of example>
```

The new example will now be served from `localhost:1234`. Cool, eh?

All examples should also be fairly compatible with parcel's Hot Module Replacement. So have fun playing with that too!
