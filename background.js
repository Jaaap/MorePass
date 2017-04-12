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
console.log(this.vault);
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
							sendResponse({"success":false,"error":"Invalid JSON"});
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


/*
	function saveVaultFromServer(encryptedVault)
	{
		decrypt(credentials.passphrase, encryptedVault).then(function(newVault){
			//console.log("saveVaultFromServer", newVault);
			vaultObj.imprt(JSON.parse(newVault));
		});
	}
	function getFromServer(email, passphrase)
	{
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4)
			{
				if (xhr.status == "200")
				{
					console.log(xhr.responseText);
					saveVaultFromServer(xhr.responseText);
				}
				else
				{
					console.warn("getFromServer", "xhr", xhr);
				}
			}
		};
		xhr.ontimeout = function()
		{
			console.warn("getFromServer", "timeout", xhr);
		};
		xhr.open("GET", "https://pass.dog/s/index.pl", true);
		xhr.send();
	}

	function uploadVaultToServer(email, passphrase, vault)
	{
		encrypt(passphrase, JSON.stringify(vault)).then(function(encryptedVault){
			sign(passphrase, encryptedVault).then(function(signature){
				saveToServer(signature + "\n\n" + encryptedVault);
			});
		});
	}
	function saveToServer(encryptedVault){
		console.log("syncWithServer", encryptedVault);
		let xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4)
			{
				if (xhr.status == "200")
				{
					console.log(xhr.responseText);
				}
				else
				{
					console.warn("saveToServer", "xhr", xhr);
				}
			}
		};
		xhr.ontimeout = function()
		{
			console.warn("saveToServer", "timeout", xhr);
		};
		xhr.open("PUT", "https://pass.dog/s/index.pl", true);
		//xhr.setRequestHeader("Content-type", options.contentType);
		//xhr.setRequestHeader("Accept", "application/json");
		xhr.send(encryptedVault);
	}
*/

	/* http auth */
	//let target = "<all_urls>";


	//see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onAuthRequired



	/*
	chrome.browserAction.onClicked.addListener(function(){ console.log("browserAction.onClicked"); });
	if ("onInstalled" in chrome.runtime) chrome.runtime.onInstalled.addListener(function(){ console.log("runtime.onInstalled"); });
	if ("onStartup" in chrome.runtime) chrome.runtime.onStartup.addListener(function(){ console.log("runtime.onStartup"); });
	chrome.tabs.onUpdated.addListener(function(){ console.log("tabs.onUpdated"); });
	*/

}
