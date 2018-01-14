// get-http-response-body/test/engine_spec.js

'use strict';

const engine = require('../src/engine.js');

const chai = require('chai');
const expect = chai.expect;

// testHarness('https://nodejs.org/en/', [/Download v(\S+)\s+Current/]);
// testHarness('https://www.ruby-lang.org/en/downloads/', [/The current stable version is (\S+)\.\s+Please/]);

describe('App', function () {
	const getBody_TestCases = [
		{
			testName: 'www.google.ca',
			url: 'https://www.google.ca',
			options: {},
			expectedHttpStatusCode: 200,
			fnAdditionalTests: null
		},
		{
			testName: 'github.com',
			url: 'https://github.com',
			options: {},
			expectedHttpStatusCode: 200,
			fnAdditionalTests: null
		},
		{
			testName: 'httpbin.org status code 200 OK',
			url: 'https://httpbin.org/status/200',
			options: {},
			expectedHttpStatusCode: 200,
			fnAdditionalTests: null
		},
		{
			testName: 'httpbin.org status code 404 Not Found',
			url: 'https://httpbin.org/status/404',
			options: {},
			expectedHttpStatusCode: 404,
			fnAdditionalTests: null
		},
		{
			testName: 'httpbin.org status code 500 Internal Server Error',
			url: 'https://httpbin.org/status/500',
			options: {},
			expectedHttpStatusCode: 500,
			fnAdditionalTests: null
		}
	];

	getBody_TestCases.forEach(testCase => {
		describe('getBody() : ' + testCase.testName, function () {
			it('Rocks!', function (done) {
				engine.getBody(testCase.url, testCase.options)
					.then(result => {
						expect(result).to.be.not.null;						// eslint-disable-line no-unused-expressions

						if (testCase.fnAdditionalTests) {
							testCase.fnAdditionalTests(result, testCase);
						}

						done();
					}, error => {

						if (testCase.expectedHttpStatusCode !== 200) {
							expect(error.httpStatusCode).to.equal(testCase.expectedHttpStatusCode);
						}

						done();
					})
					.catch(error => {
						console.error('Error caught in test', testCase.testName, ':', error);
						done();
					})
				;
			});
		});
	});

	const getBodyAsJSON_TestCases = [
		{
			testName: 'nodejs.org JSON',
			url: 'http://nodejs.org/dist/index.json',
			fnAdditionalTests: result => {
				expect(typeof result).to.equal('object');
			}
		},
		{
			testName: 'httpbin.org UUID',
			url: 'https://httpbin.org/uuid',
			fnAdditionalTests: result => {
				expect(typeof result).to.equal('object');
				console.log('Additional test: result.uuid is', result.uuid);
				expect(result.uuid).to.be.not.null;						// eslint-disable-line no-unused-expressions
				expect(typeof result.uuid).to.equal('string');
			}
		}
	];

	getBodyAsJSON_TestCases.forEach(testCase => {
		describe('getBodyAsJSON() : ' + testCase.testName, function () {
			it('Rocks!', function (done) {
				engine.getBodyAsJSON(testCase.url)
					.then(parsedData => {
						expect(parsedData).to.be.not.null;						// eslint-disable-line no-unused-expressions

						if (testCase.fnAdditionalTests) {
							testCase.fnAdditionalTests(parsedData, testCase);
						}

						done();
					})
					.catch(error => {
						console.error('Error caught in test', testCase.testName, ':', error);
						done();
					})
				;
			});
		});
	});

	const matchRegex_TestCases = [
		{
			testName: 'Node.js version',
			url: 'https://nodejs.org/en/',
			regex: /Download v{0,1}(\S+)\s+Current/,
			options: {},
			expectedHttpStatusCode: 200,
			expectedCapturedText: '9.4.0',
			fnAdditionalTests: null
		}
	];

	matchRegex_TestCases.forEach(testCase => {
		describe('matchRegex() : ' + testCase.testName, function () {
			it('Rocks!', function (done) {
				engine.matchRegex(testCase.url, testCase.regex, testCase.options)
					.then(capturedText => {
						expect(capturedText).to.be.not.null;						// eslint-disable-line no-unused-expressions
						expect(capturedText).to.equal(testCase.expectedCapturedText);

						if (testCase.fnAdditionalTests) {
							testCase.fnAdditionalTests(capturedText, testCase);
						}

						done();
					})
					.catch(error => {
						console.error('Error caught in test', testCase.testName, ':', error);
						done();
					})
				;
			});
		});
	});
});
