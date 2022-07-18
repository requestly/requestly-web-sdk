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
