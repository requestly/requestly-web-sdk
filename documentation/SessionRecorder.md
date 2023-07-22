## SessionRecorder Module

```javascript
// Instantiate Requestly Session Recorder
const sessionRecorder = new Requestly.SessionRecorder({
  console: true, // should record console logs, default=false
  network: true, // should record network API requests, default=false
  maxDuration: 5 * 60 * 1000, // last `maxDuration` milliseconds of session should only be recorded, default=5mins
  relayEventsToTop: false, // if this is an iframe, should relay events to the top document, default=false
});

// Start sessionRecorder
sessionRecorder.start();

// Stop sessionRecorder
sessionRecorder.stop();

// Get session data from sessionRecorder
const data = sessionRecorder.getSession();
```
