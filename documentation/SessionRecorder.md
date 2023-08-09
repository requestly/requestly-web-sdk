## SessionRecorder Module

```javascript
// Instantiate Requestly Session Recorder
const sessionRecorder = new Requestly.SessionRecorder({
  console: true, // should record console logs, default=false
  network: true, // should record network API requests, default=false
  maxDuration: 5 * 60 * 1000, // last `maxDuration` milliseconds of session should only be recorded, default=5mins
  relayEventsToTop: false, // if this is an iframe, should relay events to the top document, default=false
  previousSession: RQSession // the cached session details if any
  ignoreMediaResponse: true // should drop the payload of media requests, default=true
  maxPayloadSize: 100 * 1024 // requests/response payload greater than this would be dropped, default=100KB
});

// Start sessionRecorder
sessionRecorder.start();

// Stop sessionRecorder
sessionRecorder.stop();

// Get session data from sessionRecorder
const data = sessionRecorder.getSession();
```
