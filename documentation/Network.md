## Network Module

### Intercept API request and override response

```javascript
Requestly.Network.intercept(urlPattern, callback, overrideResponse);
```

Invokes `callback` whenever a request URL matches `urlPattern` regex. 
If `overrideResponse` is passed as `true`, the return value from `callback` will be used to override the response.

Example usage:
```javascript
Requestly.Network.intercept(/^https:\/\/example\.com.*/, (args) => {
  const { method, url, response } = args;
  // your logic 
  return { body: responseToOverride }; // or return null if you don't want to override response in some case
}, true);
```

#### Specifications:

`urlPattern` - A RegExp pattern to match with the request URL.

The corresponding callback passed to `intercept` method will be invoked with an object `args`.

> **Note:**
> If there are multiple URL patterns satisfying a request URL, only the lastest interceptor callback will be invoked.

All properties in `args` object received in `intercept` method callback:

| Argument | Description |
| -------- | ----------- |
| api | API used to make AJAX request - "xmlhttprequest" or "fetch" |
| method | Request method like "GET", "POST", "PUT", etc. |
| url | Request URL |
| requestHeaders | A JSON object denoting key-value pairs where key is request header name and value is header value |
| requestData | Request payload. In case of GET request, it will be a JSON object denoting query parameters in URL |
| responseHeaders | A JSON object denoting key-value pairs where key is response header name and value is header value |
| responseType | Type of data contained in response. This is available only in case of [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType). |
| contentType | Response header [Content-Type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type) |
| response | Original response body |
| responseJSON | JSON object parsed from response, if response is of JSON type.  |
| responseTime | Response time in milliseconds |
| status | HTTP response status code |
| statusText | HTTP response status text |

Attributes of response which can be returned from `intercept` method callback to override response:

| Attribute | Description |
| --------- | ----------- |
| body | Custom response body. No need to stringify if response type is JSON. |
| headers | Custom response headers |
| status | Custom HTTP response status code |
| statusText | Custom HTTP response status text |

### Clear all API interceptors

```javascript
Requestly.Network.clearInterceptors();
```
Stops watching API requests by clearing all registered URL interceptors.