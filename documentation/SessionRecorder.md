## SessionRecorder Module

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

// Get session data from sessionRecorder
const data = sessionRecorder.getSession();
```
