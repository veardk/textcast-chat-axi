# Contributing

Thanks for your interest in `textcast-chat-axi`.

The project currently keeps product direction and release decisions with the maintainer. External contributors should open an Issue first with the problem, use case, or proposal. Pull Requests are currently limited to repository collaborators. This lets us agree on scope before anyone spends time implementing a direction that may not fit the project.

## Issues

- **Bug:** use the [Bug report](https://github.com/veardk/textcast-chat-axi/issues/new?template=bug_report.yml) form. Include reproduction steps, your Node version, operating system, and complete relevant CLI output.
- **Feature or improvement:** describe what you are trying to accomplish and where the current workflow falls short before proposing an implementation.
- **Usage question:** read the README and CLI help first. If the answer is still unclear, open an Issue with a minimal reproduction.

## Local development

Node 22 or newer and pnpm 11 are required.

```sh
pnpm install --frozen-lockfile
pnpm run check
```

`pnpm run check` is the single repository quality gate. It runs the build, ESLint, Prettier check, type check, and test suite. Fix every failure before committing or requesting review.

Before submitting a change, confirm that:

- the change has corresponding tests, or the Pull Request explains why new tests are unnecessary;
- the README, CLI help, and `docs/invariants.md` agree with the behavior;
- no `node_modules/`, local state, credentials, or temporary build files are included;
- `pnpm run check` passes.

## Pull Requests

Only repository collaborators currently open Pull Requests. Use the repository Pull Request template and include:

- the concrete user problem and resulting behavior;
- the scope of the change;
- the checks and tests that were run;
- any checks that were not run, with the reason;
- screenshots or a recording for visual or interaction changes.

A passing check is required but does not guarantee acceptance. The maintainer also reviews product fit, security, compatibility, maintainability, and documentation.

## Commits and releases

Use Conventional Commits, for example:

```text
feat: add page switching for related Textcast pages
fix: preserve queued notes after reconnect
chore: update browser compatibility notes
```

After changes land on `main`, Release Please creates or updates a release Pull Request from the commit history. Merging that release Pull Request creates the GitHub Release and publishes the corresponding npm version through GitHub Actions.

Do not edit `CHANGELOG.md` or `.release-please-manifest.json` by hand; Release Please owns them.

## License and attribution

This project is licensed under the MIT License. The local review architecture is derived from the local review capabilities of [`lavish-axi`](https://github.com/kunchenguid/lavish-axi); the original license and copyright notice remain in [LICENSE](LICENSE). New code and documentation must comply with this project's MIT License.
