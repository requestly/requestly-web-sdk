# Requestly Web SDK

## Installation

#### Add to website as `<script>` tag

Add Requestly SDK in `<head>` as sooner as possible.
```html
<head>
    <script src="https://unpkg.com/@requestly/web-sdk@0.1.0/dist/requestly-web-sdk.min.js" crossorigin></script>
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

## Getting Started

```javascript
// Create Requestly Session
const session = new Requestly.Session({
  video: true,
  networkRequests: true
});

// Start session
session.start();

// Stop session
session.stop();

// Get session data
const sessionData = session.getData();
```
