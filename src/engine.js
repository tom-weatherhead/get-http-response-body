#!/usr/bin/env node

// get-http-response-body/src/engine.js

'use strict';

let http = require('http');

// Promise.then() returns a Promise in the pending status. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
// The catch() method returns a Promise and deals with rejected cases only. It behaves the same as calling Promise.prototype.then(undefined, onRejected). See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch

// Promise.resolve(value) returns a Promise object that is resolved with the given value. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve
// Promise.reject(reason) returns a Promise object that is rejected with the given reason. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject

// Promise.all(iterable) returns a single Promise that resolves when all of the promises in the iterable argument have resolved or when the iterable argument contains no promises. It rejects with the reason of the first promise that rejects. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
// Promise.race(iterable) returns a promise that resolves or rejects as soon as one of the promises in the iterable resolves or rejects, with the value or reason from that promise. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race


// Would there be any advantage to using Observables rather than Promises?
// See e.g. https://stackoverflow.com/questions/37364973/angular-promise-vs-observable
// See e.g. https://blog.thoughtram.io/angular/2016/01/06/taking-advantage-of-observables-in-angular2.html

function getBody (url, options = {}) {
	const responseEncoding = options.responseEncoding || 'utf8';

	return new Promise((resolve, reject) => {
		let requestEngine;

		if (options.requestEngine) {
			requestEngine = options.requestEngine;
		} else if (/^http\:\/\//.test(url)) {
			requestEngine = require('http').get;
		} else if (/^https\:\/\//.test(url)) {
			requestEngine = require('https').get;
		} else {
			let error = new Error(`Unrecognized protocol in URL ${url}`);

			console.error(error.message);
			reject(error);
		}

		let requestObject = requestEngine(url, response => {
			// const { statusCode } = response;
			const statusCode = response.statusCode;
			const statusMessage = response.statusMessage;
			// const contentType = response.headers['content-type'];

			// console.log('Requested URL:', url);
			// console.log('Response status:', statusCode, statusMessage);
			// console.log('Response content type:', contentType);

			let error;

			if (statusCode !== 200) {
				error = new Error(`Request failed with HTTP status ${statusCode} ${statusMessage}`);
			// } else if (!/^application\/json/.test(contentType)) {
				// error = new Error('Invalid content-type.\n' +
				// `Expected application/json but received ${contentType}`);
			}

			if (error) {
				// error.httpHeaders = response.headers;
				error.httpStatusCode = statusCode;
				error.httpStatusMessage = statusMessage;
				// error.httpResponse = response;
				console.error(error.message);

				// Consume response data to free up memory
				response.resume();

				reject(error);
			}

			response.setEncoding(responseEncoding);

			let rawData = '';

			response.on('data', chunk => { rawData += chunk; });

			response.on('end', () => {
				resolve(rawData);
			});
		});

		if (requestObject.on) {
			requestObject.on('error', error => {
				console.error(`Got error: ${error.message}`);
				reject(error);
			});
		}
	});
}

function getBodyAsJSON (url, options = {}) {
	return getBody(url, options)
		.then(body => {

			try {
				const parsedData = JSON.parse(body);

				//console.log('getBodyAsJSON() : Type of parsed JSON data:', typeof parsedData);
				//console.log('getBodyAsJSON() : Parsed JSON data:', parsedData);

				return Promise.resolve(parsedData);
			} catch (error) {
				console.error('getBodyAsJSON() : JSON.parse() error:', error.message);

				return Promise.reject(error);
			}
		});
}

// TODO: Support multiple matches and multiple captures per match? Enable this via options; e.g. :
// options.globalRegex (or read this flag from the regex itself) -> If true, then return an array of "capture results"; if false, return a single "capture result".
// options.multipleCaptures (or read this flag from the regex itself?) -> If true, each "capture result" is an array; if false, each "capture result" is a string.

function matchRegex (url, regex, options = {}) {
	return getBody(url, options)
		.then(body => {
			const indexOfCaptureGroup = 1;
			let match = regex.exec(body);

			if (match !== null && match.length > indexOfCaptureGroup) {
				return Promise.resolve(match[indexOfCaptureGroup]);
			} else {
				let errorMessage = 'matchRegex failed.';

				console.error(errorMessage);

				return Promise.reject(new Error(errorMessage));
			}
		});
}

/*
 * From https://nodejs.org/api/http.html (Node.js version 9.6.1) :
 
options can be an object, a string, or a URL object. If options is a string, it is automatically parsed with url.parse(). If it is a URL object, it will be automatically converted to an ordinary options object.

The optional callback parameter will be added as a one-time listener for the 'response' event.

http.request() returns an instance of the http.ClientRequest class. The ClientRequest instance is a writable stream. If one needs to upload a file with a POST request, then write to the ClientRequest object.

Example:

const postData = querystring.stringify({
  'msg': 'Hello World!'
});

const options = {
  hostname: 'www.google.com',
  port: 80,
  path: '/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

// write data to request body
req.write(postData);
req.end();

Note that in the example req.end() was called. With http.request() one must always call req.end() to signify the end of the request - even if there is no data being written to the request body.

If any error is encountered during the request (be that with DNS resolution, TCP level errors, or actual HTTP parse errors) an 'error' event is emitted on the returned request object. As with all 'error' events, if no listeners are registered the error will be thrown.

There are a few special headers that should be noted.

    Sending a 'Connection: keep-alive' will notify Node.js that the connection to the server should be persisted until the next request.

    Sending a 'Content-Length' header will disable the default chunked encoding.

    Sending an 'Expect' header will immediately send the request headers. Usually, when sending 'Expect: 100-continue', both a timeout and a listener for the continue event should be set. See RFC2616 Section 8.2.3 for more information.

    Sending an Authorization header will override using the auth option to compute basic authentication.

 */

function request() {
}

function post(hostname, port, path, postData) {
	// const postData = querystring.stringify({
	  // 'msg': 'Hello World!'
	// });
	let postDataString = JSON.stringify(postData);
	
	const options = {
	  hostname: hostname, //'www.google.com',
	  port: port, //80,
	  path: path, //'/upload',
	  method: 'POST',
	  headers: {
		//'Content-Type': 'application/x-www-form-urlencoded',
		'Content-Type': 'application/json',
		'Content-Length': Buffer.byteLength(postDataString)
	  }
	};

	const req = http.request(options, (res) => {
	  console.log(`STATUS: ${res.statusCode} ${res.statusMessage}`);
	  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
	  res.setEncoding('utf8');
	  res.on('data', (chunk) => {
		console.log(`BODY: ${chunk}`);
	  });
	  res.on('end', () => {
		console.log('No more data in response.');
	  });
	});

	req.on('error', (e) => {
	  console.error(`problem with request: ${e.message}`);
	});

	// write data to request body
	req.write(postDataString);
	req.end();
}

function put(hostname, port, path, putData) {
	let putDataString = JSON.stringify(putData);
	
	const options = {
	  hostname: hostname, //'www.google.com',
	  port: port, //80,
	  path: path, //'/upload',
	  method: 'PUT',
	  headers: {
		//'Content-Type': 'application/x-www-form-urlencoded',
		'Content-Type': 'application/json',
		'Content-Length': Buffer.byteLength(putDataString)
	  }
	};

	const req = http.request(options, (res) => {
	  console.log(`STATUS: ${res.statusCode} ${res.statusMessage}`);
	  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
	  res.setEncoding('utf8');
	  res.on('data', (chunk) => {
		console.log(`BODY: ${chunk}`);
	  });
	  res.on('end', () => {
		console.log('No more data in response.');
	  });
	});

	req.on('error', (e) => {
	  console.error(`problem with request: ${e.message}`);
	});

	// write data to request body
	req.write(putDataString);
	req.end();
}

function delet(hostname, port, path) {
	// let putDataString = JSON.stringify(putData);
	
	const options = {
	  hostname: hostname, //'www.google.com',
	  port: port, //80,
	  path: path, //'/upload',
	  method: 'DELETE'
	};

	const req = http.request(options, (res) => {
	  console.log(`STATUS: ${res.statusCode} ${res.statusMessage}`);
	  res.setEncoding('utf8');
	  res.on('data', (chunk) => {
		console.log(`BODY: ${chunk}`);
	  });
	  res.on('end', () => {
		console.log('No more data in response.');
	  });
	});

	req.on('error', (e) => {
	  console.error(`problem with request: ${e.message}`);
	});

	req.end();
}

module.exports = {
	getBody: getBody,
	getBodyAsJSON: getBodyAsJSON,
	matchRegex: matchRegex,
	post: post,
	put: put,
	delete: delet
};
