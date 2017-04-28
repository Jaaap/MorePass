//import * as crypto from "crypto";
{
	'use strict';
	let credentials = {};

	function Vault()
	{
		let self = this;
		this.vault = [];
		chrome.storage.local.get("vault", function(result){
			self.vault = result.vault||[];
		});
	}

	Vault.prototype = {
		get: function()
		{
			return this.vault;
		},
		add: function(siteset)
		{
			siteset[LASTMODIFIED] = (new Date()).getTime();
			this.vault.push(siteset);
			this.vault.sort(vaultSort);
			return this.save();
		},
		edit: function(idx, siteset)
		{
			siteset[SAVEDSTATE] = SAVED;
			siteset[LASTMODIFIED] = (new Date()).getTime();
			this.vault[idx] = siteset;
			this.vault.sort(vaultSort);
			return this.save();
		},
		del: function(idx)
		{
			this.vault.splice(idx, 1);
			return this.save();
		},
		imprt: function(newVault)
		{
			this.vault = newVault;
			return this.save();
		},
		save: function()
		{
			//FIXME: remove this migration code
			for (let siteset of this.vault)
			{
				for (let site of siteset[SITES])
					if ("pathname" in site && !/^\//.test(site.pathname))
						site.pathname = "/" + site.pathname;
				if (siteset.length <= LASTMODIFIED)
					siteset[LASTMODIFIED] = (new Date()).getTime();
			}
			chrome.storage.local.set({"vault": this.vault});
			return this.vault;
		},
	};

	let vaultObj = new Vault();
	chrome.storage.local.get("credentials", function(result){
		credentials = result.credentials;
	});

	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (sender.tab) //from content
		{
			if (request.action === "submit")
			{
				//[[{"hostname":"abc.nl"}],"me@gmail.com","******"]
				chrome.browserAction.setBadgeText({text: "*"});
				let url = getUrlFromHref(request.docuhref);
				let baseDomain = tlds.getBaseDomain(url.hostname);
				let siteset = [[{"hostname": baseDomain}], request.username, request.password, UNSAVED];
				vaultObj.add(siteset);
			}
		}
		else //from popup
		{
			if (request.action === "vault.get")
			{
				sendResponse(vaultObj.get());
			}
			else if (request.action === "vault.add")
			{
				let ss = request.siteset;
				if (ss.length <= 3)
					ss[SAVEDSTATE] = SAVED;
				sendResponse(vaultObj.add(ss));
			}
			else if (request.action === "vault.imprt")
			{
				request.vault.sort(vaultSort);
				sendResponse(vaultObj.imprt(request.vault));
			}
			else if (request.action === "vault.edit")
			{
				sendResponse(vaultObj.edit(request.idx, request.siteset));
				chrome.browserAction.setBadgeText({text: ""});
			}
			else if (request.action === "vault.del")
			{
				sendResponse(vaultObj.del(request.idx));
				chrome.browserAction.setBadgeText({text: ""});
			}
			else if (request.action === "vault.encrypt")
			{
				encrypt(request.passphrase, JSON.stringify(vaultObj.get())).then(encryptedVault => {
					sendResponse(encryptedVault);
				});
				return true;
			}
			else if (request.action === "vault.decrypt.merge")
			{
				try {
					decrypt(request.passphrase, request.vault).then(decryptedVault => {
						try {
							let decryptedVaultObj = JSON.parse(decryptedVault);
							let merged = mergeVaults(vaultObj.get(), decryptedVaultObj);
	//console.log(vaultObj.get().length + " + " + decryptedVaultObj.length + " = " + merged.length);
	//console.log(JSON.stringify(merged));
							vaultObj.imprt(merged);
							sendResponse({"success":true});
						} catch(e) {
	console.error(e);
							sendResponse({"success":false,"error":e.getMessage()});
						}
					}).catch(err => {
						sendResponse({"success":false,"error":"Decryption error"});
					});
				} catch(e) {
console.error(e);
					sendResponse({"success":false,"error":e.message});
				}
				return true;
			}
/*
			else if (request.action === "credentials.set")
			{
				credentials = {"email": request.email};
				chrome.storage.local.set({"credentials": credentials});
				//uploadVaultToServer(request.email, "pass hash FIXME", vaultObj.get());
				//getFromServer(request.email, "pass hash FIXME");
			}
			else if (request.action === "credentials.get")
			{
				sendResponse(credentials.email);
			}
*/
			else
			{
				console.warn("Unknown action", request.action);
			}
		}
	});




	/* http auth */
	let target = "<all_urls>";

	let pendingRequests = [];

	function completed(requestDetails) {
		//console.log("completed: " + requestDetails.requestId);
		let index = pendingRequests.indexOf(requestDetails.requestId);
		if (index > -1) {
			pendingRequests.splice(index, 1);
		}
	}

	function provideCredentialsAsync(requestDetails) {
		// If we have seen this request before, then assume our credentials were bad and give up.
		if (pendingRequests.indexOf(requestDetails.requestId) > -1) {
			console.log("bad credentials for: " + requestDetails.requestId);
		} else {
			pendingRequests.push(requestDetails.requestId);
			console.log("providing credentials for: " + requestDetails.requestId);
			let tabLocation = new URL(requestDetails.url);
			let vaultMatches = getVaultMatches(vaultObj.get(), tabLocation);
			// we can return a promise that will be resolved with the stored credentials
			if (vaultMatches.length > 0)
				return {'authCredentials': {'username': vaultMatches[0][USERNAME], 'password': vaultMatches[0][PASSWORD]}};
		}
	}

	browser.webRequest.onAuthRequired.addListener(provideCredentialsAsync, {urls: [target]}, ["blocking"]);

	browser.webRequest.onCompleted.addListener(completed, {urls: [target]});
	browser.webRequest.onErrorOccurred.addListener(completed, {urls: [target]});

}
