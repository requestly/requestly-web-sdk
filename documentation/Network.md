## Network Module - WIP

> :warning: **This work is still in progress.** 
> Below functions are still under development and the contract is subject to change.

### Intercept API requests and responses

```javascript
Requestly.Network.intercept(urlPattern, callback);
```

Example usage:
```javascript
Requestly.Network.intercept(/^https:\/\/example\.com.*/, (args) => {
  const { method, url, requestHeaders, requestData, responseType, responseHeaders, response, time } = args;
  // your logic 
  return responseToOverride; // or return null
});
```

### Mock API response payload

```javascript
// Return static custom response for specified URL pattern
Requestly.Network.mockResponsePayload(urlPattern, { myField: 'staticCustomValue' });

// Evaluate and return custom response for specified URL pattern
Requestly.Network.mockResponsePayload(urlPattern, (args) => {
  const { method, url, response, responseType, requestHeaders, requestData, responseJSON } = args;
  
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
