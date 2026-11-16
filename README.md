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
# Each step runs only if the previous one succeeded, so a failed build never publishes.
npm ci && \
  npm version <patch|minor|major> && \
  npm run build && \
  git push && git push --tags && \
  npm publish
```
