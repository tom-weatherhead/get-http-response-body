#!/usr/bin/env node

// get-http-response-body/src/demo-cli-regex.js

'use strict';

const engine = require('..');

const targetName = process.argv.length > 2 && process.argv[2];

function printLatestVersionOfTarget (url, regex) {
	engine.matchRegex(url, regex)
		.then(result => {

			if (!result) {
				console.error('printTargetLatestVersion: Error: result is null.');
			} else {
				console.log(result);
			}
		}, error => {
			console.error('printTargetLatestVersion: Error:', error);
		});
}

switch (targetName) {
	case 'angular':
		printLatestVersionOfTarget('https://www.npmjs.com/package/@angular/core', /\<strong\>([0-9\.]+)\<\/strong\>\s*\r{0,1}\n\s*is the latest/);
		break;

	case 'node':
		printLatestVersionOfTarget('https://nodejs.org/en/', /Download v{0,1}(\S+)\s+Current/);
		break;

	case 'ruby':
		printLatestVersionOfTarget('https://www.ruby-lang.org/en/downloads/', /The current stable version is (\S+)\.\s+Please/);
		break;

	default:
		console.error('Usage: thaw-latest-version-of [ angular | node | ruby ]');
}
