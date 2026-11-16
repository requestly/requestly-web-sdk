# Requestly Web SDK

## Installation

### Add to website as `<script>` tag

```html
<script src="https://unpkg.com/@requestly/web-sdk@latest/dist/requestly-web-sdk.min.js" crossorigin></script>
```
This would expose `Requestly` as a global variable.

### Add as NPM dependency

#### NPM:
```sh
npm install @requestly/web-sdk --save 
```

#### Yarn:
```sh
yarn add @requestly/web-sdk
```

Import in project as ES module:
```javascript
import * as Requestly from '@requestly/web-sdk';
```

## Getting Started

Check documentation for different modules exposed by SDK.

- [SessionRecorder](documentation/SessionRecorder.md)
- [Network](documentation/Network.md)

## Development

The repo's `.npmrc` sets `ignore-scripts=true`, so npm lifecycle scripts do not run automatically.

- **Git hooks:** `npm ci` no longer installs the husky pre-commit hook. Run `npm run prepare` once after cloning.
- **Releasing:** `npm version` no longer runs the `version` (build) and `postversion` (push) scripts. Release with:

```sh
# Each step runs only if the previous one succeeded. Start from a clean working tree: the first step
# stops the release if anything is staged, modified or untracked, so the tag contains exactly what was built.
# The version is bumped first (the build embeds it); the release commit and tag are created only after
# the build succeeds.
test -z "$(git status --porcelain)" && \
  npm ci && \
  npm version <patch|minor|major> --no-git-tag-version && \
  npm run build && \
  VERSION=$(node -p "require('./package.json').version") && \
  git commit -am "$VERSION" && \
  git tag -a "v$VERSION" -m "$VERSION" && \
  git push && git push origin "v$VERSION" && \
  npm publish
```

If the build fails, nothing is committed or tagged; fix the build after discarding the bump with
`git checkout package.json package-lock.json`, then run the release again. Because the release only starts from
a clean tree, this discards nothing but the version bump.
