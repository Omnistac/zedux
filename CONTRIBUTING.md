Abide by the [code of conduct](CODE_OF_CONDUCT.md).

## Starting Development

We use `yarn` to manage package dependencies. Simply running `yarn` in the repo root is all you need to get started with developing the packages.

We use Nx with yarn workspaces to manage the package-based monorepo. Every directory in the `packages/` folder is its own npm package. Run `yarn nx graph` to see the dependency graph of Zedux packages.

We recommend Test-Driven Development for most Zedux code changes. Add integration tests and run `yarn test my-test-file` in the repo root to check changes.

### Docs

The docs are separated from the rest of the repo - they're not a yarn workspace. To run the docs site:

```sh
cd docs
yarn
yarn start
```

This sets up an HMR-enabled dev server for quickly previewing docs site changes.

## Pull Requests

Format your code with prettier using the .prettierrc config in the repo root.

Properly type everything - no `any`s unless it's the correct type or you demonstrate in the PR that `any` is needed and safe enough.

Add integration tests in the `test/integrations` folder of the appropriate package(s) to **fully** demonstrate all desired functionality. Unit tests aren't required if all functionality is covered well in integration tests, but they are a nice-to-have.

Ensure that all tests pass by running `yarn test` in the repo root. That command will also output code coverage. Ensure that all changes have full Statement, Branch, Function, and Line coverage.

The PR title should be in the same format as the main commit. E.g. `feat(react): implement cool new thing`

If your PR resolves any issues, [link the PR to the issue(s)](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue) e.g. by putting the words `Resolves #<issue number>, resolves #<other issue number>` in the PR body.

If your PR introduces any breaking changes, give as much information about it as possible. Your PR will be linked to in migration guides, so write it like documentation for people that are upgrading - give troubleshooting tips and link references/guides/etc.

Make the PR directly against Zedux `master` branch unless it's a hotfix for a specific version, in which case make it against the desired `v_.x` branch.

If your PR can't be merged due to conflicts, rebase against Zedux master, resolve conflicts locally, and force push the changes.

If your PR requires changes, you can push those as separate commits (only the first commit has to follow the [commit message guidelines](#commit-messages) via `yarn commit`. All other commits can be free-form via `git commit`). Or you can `git commit --amend` a previous commit and force push.

## Commit Messages

We use a custom script to generate the CHANGELOG from commit messages. Thus commit messages must follow a specific format. This format is a simplification of the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

Use `yarn commit` (in the repo root) instead of `git commit` to make our custom commit formatter tool automatically format these correctly for you.

It's recommended to always use `yarn commit`, but if you want to know the format that it outputs, here it is:

```
<type>(<optional scope>): <description>

<optional body>

<optional footer>
```

`type` is one of:

- `chore` - includes changes to dev deps, the development process, and CI-related fixes
- `docs` - includes changes to the docs site, READMEs, and code comments
- `feat` - new APIs and functionality
- `fix` - a bug fix, usually relating to a GitHub issue
- `refactor` - includes code style changes and moving code around without changing functionality
- `test` - new or improved test cases

`scope` is a package name (e.g. `atoms`, `core`) **if** the commit affects only one package. If the commit affects multiple packages or doesn't apply to packages, `scope` can be omitted in favor of the special footer.

`description` is the normal commit message (in imperative mood). There's no character limit, but keep it brief (preferably < 80 characters). Additional details can go in the `body`.

`body` is completely optional and can contain anything. It's a single line. Use semicolons to break up ideas. Don't worry about documenting everything here. That's what PRs are for. We use squash and merge to link your commit to its PR so people can read the details in beautiful rendered markdown.

`footer` contains special syntax for our custom script. The footer details what packages are affected by the change.

Examples:

```
docs: improve CoolClass doc wording
```

```
fix(core): stop doing specific wrong thing
```

```
feat: implement coolNewFeature

@affects atoms, core, react
```

If the commit includes a breaking change, simply add `!`. For example:

```
feat(react)!: replace ExistingClass with CoolerClass
```
