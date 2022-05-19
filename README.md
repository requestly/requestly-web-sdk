# Requestly Web SDK

## Installation

#### Add to website as `<script>` tag

Add Requestly SDK in `<head>` as sooner as possible.
```html
<head>
    <script src="https://unpkg.com/@requestly/web-sdk/dist/requestly-web-sdk.min.js" crossorigin></script>
    <!-- Rest HTML -->
</head>
```

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

```javascript
// Create Requestly Session
const sessionRecorder = new Requestly.SessionRecorder({
  video: true,
  networkRequests: true
});

// Start sessionRecorder
sessionRecorder.start();

// Stop sessionRecorder
sessionRecorder.stop();

// Get sessionRecorder data
const data = sessionRecorder.getData();
```
