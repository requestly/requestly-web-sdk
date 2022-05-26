## SessionRecorder Module

```javascript
// Instantiate Requestly Session Recorder
const sessionRecorder = new Requestly.SessionRecorder({
  video: true, // record video
  console: true, // record console logs
  maxDuration: 10 * 60 * 1000, // last `maxDuration` milliseconds of session should only be recorded, default 10mins
});

// Start sessionRecorder
sessionRecorder.start();

// Stop sessionRecorder
sessionRecorder.stop();

// Get session data from sessionRecorder
const data = sessionRecorder.getSession();
```
