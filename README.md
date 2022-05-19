# Requestly Web SDK

## Installation

#### Add to website as `<script>` tag

```html
<script src="https://unpkg.com/@requestly/web-sdk/dist/requestly-web-sdk.min.js" crossorigin></script>
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

### Record a session

```javascript
// Instantiate Requestly Session Recorder
const sessionRecorder = new Requestly.SessionRecorder({
  video: true, // record video
  networkRequests: true, // record network requests
  consoleLogs: true // record browser console logs
});

// Start sessionRecorder
sessionRecorder.start();

// Stop sessionRecorder
sessionRecorder.stop();

// Get sessionRecorder data
const data = sessionRecorder.getData();
```

### Mock API response payload

```javascript
// Return static custom response for specified URL pattern
Requestly.Network.mockResponsePayload(urlPattern, { myField: 'staticCustomValue' });

// Evaluate and return custom response for specified URL pattern
Requestly.Network.mockResponsePayload(urlPattern, (args) => {
  const {method, url, response, responseType, requestHeaders, requestData, responseJSON} = args;
  
  // evaluate response from properties received in args
  return { myField: 'evaluatedCustomValue' };
});

// Clear response mock for specified URL pattern
Requestly.Network.unmockResponsePayload(urlPattern);

// Temporarily disable mocking of API response
Requestly.Network.disableMocks();

// Enable back mocking of API response
Requestly.Network.enableMocks();
```
