# Zedux website

The website and documentation at [zedux.dev](https://zedux.dev/) are built with
[Docusaurus](https://docusaurus.io/).

## Local development

From the repository root, install the website dependencies:

```sh
pnpm docs:install
```

Then start the development-only server:

```sh
pnpm docs:dev
```

Open [http://localhost:3000](http://localhost:3000). Docusaurus watches the
website source, documentation, blog posts, styles, and sidebar configuration;
changes are reflected in the browser without rebuilding the production site.

The website is an independent pnpm workspace under `docs/`. If you are already
in that directory, the equivalent commands are `pnpm install --frozen-lockfile`
and `pnpm start`.

## Production build

From the repository root:

```sh
pnpm docs:build
```

This generates the static site in `docs/build/` and catches broken links and
other production-only build errors.

## Deployment

```sh
GIT_USER=<your-github-username> pnpm --dir docs deploy
```

Deployment is handled separately from the development server and publishes to
the `gh-pages` branch.
