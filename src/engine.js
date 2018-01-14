#!/usr/bin/env node

// get-http-response-body/src/engine.js

'use strict';

// Promise.then() returns a Promise in the pending status. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then
// The catch() method returns a Promise and deals with rejected cases only. It behaves the same as calling Promise.prototype.then(undefined, onRejected). See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch

// Promise.resolve(value) returns a Promise object that is resolved with the given value. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve
// Promise.reject(reason) returns a Promise object that is rejected with the given reason. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject

// Promise.all(iterable) returns a single Promise that resolves when all of the promises in the iterable argument have resolved or when the iterable argument contains no promises. It rejects with the reason of the first promise that rejects. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
// Promise.race(iterable) returns a promise that resolves or rejects as soon as one of the promises in the iterable resolves or rejects, with the value or reason from that promise. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race

function getBody (url, options = {}) {
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
				// consume response data to free up memory
				response.resume();
				//return;
				reject(error);
			}

			response.setEncoding('utf8');

			let rawData = '';

			response.on('data', chunk => { rawData += chunk; });

			response.on('end', () => {

				if (options.parseJSON) {
					try {
						const parsedData = JSON.parse(rawData);

						//console.log('Parsed JSON data:', parsedData);
						resolve(parsedData);
					} catch (error2) {
						console.error(`JSON.parse() error: ${error2.message}`);
						reject(error2);
					}
				} else {
					//console.log('options.parseJSON is false.');
					resolve(rawData);
				}
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
		}, error => {
			console.error('getBodyAsJSON() : getBody().then() : Error is', error);

			return Promise.reject(error);
		});
}

// TODO: Support multiple matches and multiple captures per match? Enable this via options; e.g. :
// options.globalRegex (or read this flag from the regex itself) -> If true, then return an array of "capture results"; if false, return a single "capture result".
// options.multipleCaptures (or read this flag from the regex itself?) -> If true, each "capture result" is an array; if false, each "capture result" is a string.

function matchRegex (url, regex, options = {}) {
	return getBody(url, options)
		.then(body => {
			//console.log('Success! Body is', body);

			const indexOfCaptureGroup = 1;
			let match;

			if ((match = regex.exec(body)) !== null && match.length > indexOfCaptureGroup) {
				return Promise.resolve(match[indexOfCaptureGroup]);
			} else {
				let errorMessage = 'matchRegex failed.';

				console.error(errorMessage);

				return Promise.reject(new Error(errorMessage));
			}
		}, error => {
			console.error('matchRegex() : Error is', error);

			return Promise.reject(error);
		});
}

// **** Test getBody ****

//let url = 'http://nodejs.org/dist/index.json';
//let url = 'https://www.google.ca';
//let url = 'https://github.com';
//let url = 'http://localhost:5000';
//let url = 'https://httpbin.org/status/200';
//let url = 'https://httpbin.org/status/404';
//let url = 'https://httpbin.org/status/500';
//let url = 'https://httpbin.org/uuid';

// let options = {};

// options.parseJSON = true;

// getBody(url, options)
//	.then(body => {
//		console.log('Success! Body is', body);
//		console.log('body.uuid is', body.uuid);
//		console.log('body.uuid is', body['uuid']);
//	}, error => {
//		console.error('Error is', error);
//		console.error('HTTP status code is', error.httpStatusCode);
//		console.error('Foo 1:', error.httpResponse.statusCode)
//		console.error('Foo 2:', error.httpResponse.statusMessage)
//	});

// **** Test getBodyAsJSON ****

//let url = 'http://nodejs.org/dist/index.json';
//let url = 'https://httpbin.org/uuid';

//getBodyAsJSON(url)
//	.then(parsedData => {
//		console.log('Test of getBodyAsJSON() : Success! parsedData is', parsedData);

//		if (parsedData.uuid) {
//			console.log('Type of parsedData.uuid is', typeof parsedData.uuid);
//			console.log('parsedData.uuid is', parsedData.uuid);
//		}
//	}, error => {
//		console.error('Test of getBodyAsJSON() : Error is', error);
//		console.error('HTTP status code is', error.httpStatusCode);
//	});

// **** Test matchRegex ****

//let url = 'https://nodejs.org/en/';
//let regex = /Download v{0,1}(\S+)\s+Current/;
//let regex = /Downlooad v{0,1}(\S+)\s+Current/;
//let options = {};

//matchRegex(url, regex, options)
//	.then(capturedText => {
//		console.log('matchRegex: Success! capturedText is', capturedText);
//	}, error => {
//		console.error('matchRegex: Error is', error);
//	});

module.exports = {
	getBody: getBody,
	getBodyAsJSON: getBodyAsJSON,
	matchRegex: matchRegex
};
