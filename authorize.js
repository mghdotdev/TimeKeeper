"use strict";

const remote = require('electron').remote
const BrowserWindow = remote.BrowserWindow;
const https = require('https');
const querystring = require('querystring');
const url = require('url');

module.exports = function(config, windowParams) {

	if (config === undefined) {
		config = require('./config.js');
	}
	if (windowParams === undefined) {
		windowParams = {
			alwaysOnTop: true,
			autoHideMenuBar: true,
			webPreferences: {
				nodeIntegration: false
			}
		};
	}

	// -------- Get Verification Code -------- //
	function getVerificationCode(optionalUrlParams) {

		optionalUrlParams = optionalUrlParams || {};
		let urlParams = {
			client_id: config.client_id,
			client_secret: config.client_secret,
			redirect_uri: config.redirect_uri
		};
		urlParams = Object.assign(urlParams, optionalUrlParams);

		let authorizationURL = config.authorization_url + '?' + querystring.stringify(urlParams);

		return new Promise(function(resolve, reject) {

			let oAuthWindow = new BrowserWindow(windowParams);
			oAuthWindow.loadURL(authorizationURL);

			function extractVerificationCode(responseURL) {
				let parsedURL = url.parse(responseURL, true);
				let verificationCode = parsedURL.query.code;
				let error = parsedURL.query.error;

				if (error !== undefined) {
					oAuthWindow.close();
					reject(error);
				}
				else if (verificationCode) {
					oAuthWindow.close();
					resolve(verificationCode);	
				}
			};

			oAuthWindow.webContents.on('will-navigate', function(event, responseURL) {
				extractVerificationCode(responseURL);
			});

		});

	};

	// -------- Receive Authorization Token -------- //
	function fetchToken(fetchOptions, optionalUrlParams) {

		optionalUrlParams = optionalUrlParams || {};
		let urlParams = {
			client_id: config.client_id,
			client_secret: config.client_secret,
			redirect_uri: config.redirect_uri,
		};
		urlParams = Object.assign(urlParams, fetchOptions);
		urlParams = Object.assign(urlParams, optionalUrlParams);

		let parsedURL = url.parse(config.token_url);
		let options = {
			hostname: parsedURL.hostname,
			path: parsedURL.path + '?' + querystring.stringify(urlParams),
			method: 'POST'
		};

		return new Promise(function(resolve, reject) {

			let request = https.request(options, function(response) {
				let body = [];
				response
				.on('data', function(chunk) {
					body.push(chunk);
				})
				.on('end', function() {
					body = Buffer.concat(body).toString();
					resolve(body);
				});
			});

			request.on('error', function(error) {
				reject(error);
			});

			request.end();

		});

	};
	function getAuthorizationToken(optionalUrlParams) {
		return getVerificationCode(optionalUrlParams).then(function(verificationCode) {
			return fetchToken({ code: verificationCode }, optionalUrlParams);
		});
	};

	// -------- Refresh Authorization Token -------- //
	function refreshAuthorizationToken(refreshToken, optionalUrlParams) {
		return fetchToken({ refresh_token: refreshToken }, optionalUrlParams);
	};

	// -------- Return Public Functions -------- //
	return {
		getVerificationCode: getVerificationCode,
		getAuthorizationToken: getAuthorizationToken,
		refreshAuthorizationToken: refreshAuthorizationToken
	};

};