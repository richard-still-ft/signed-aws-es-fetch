'use strict';

const aws4 = require('aws4');
const fetch = global.fetch || require('node-fetch');
const urlParse = require('url').parse;
const resolveCname = require('denodeify')(require('dns').resolveCname);

module.exports = function(url, opts, creds) {
	let urlObject = urlParse(url);
	if (/\.es\.amazonaws\.com$/.test(urlObject.host)) {
		return signedFetch(url, opts, creds);
	} else {
		return resolveCname(urlObject.host)
			.then(function(host) {
				return signedFetch(url.replace(urlObject.host, host[0]), opts, creds);
			});
	}
};

function signedFetch(url, opts, creds) {
	creds = creds || {};
	creds.accessKeyId  = creds.accessKeyId || process.env.ES_AWS_ACCESS_KEY || process.env.AWS_ACCESS_KEY;
	creds.secretAccessKey  = creds.secretAccessKey || process.env.ES_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

	const urlObject = urlParse(url);
	const signable = {
		method: opts.method,
		host: urlObject.host,
		path: urlObject.path,
		body: opts.body,
		headers: opts.headers
	};
	aws4.sign(signable, creds);
	opts.headers = signable.headers;
	return fetch(`${urlObject.protocol}//${opts.headers.Host}${signable.path}`, opts);
}