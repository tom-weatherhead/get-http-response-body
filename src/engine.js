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

module.exports = {
	getBody: getBody,
	getBodyAsJSON: getBodyAsJSON,
	matchRegex: matchRegex
};
