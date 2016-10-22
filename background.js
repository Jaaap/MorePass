//import * as crypto from "crypto";
{
	'use strict';
	const UNSAVED = 0, SAVED = 1;

	function Vault()
	{
		let self = this;
		this.vault = [];
		chrome.storage.local.get("vault", function(result){
			self.vault = result.vault||[];
			console.log(999);
		});
		console.log(this.vault);
	}

	Vault.prototype = {
		get: function() {
			return this.vault;
		},
		add: function(siteset) {
			this.vault.push(siteset);
			this.vault.sort(function(aa,bb){
				let a = aa[0][0].hostname;
				let b = bb[0][0].hostname;
				if (aa[3] == bb[3])
					return (a < b ? -1 : +(a > b));
				else
					return aa[3] < bb[3] ? -1 : 1;
			});
			return this.save();
		},
		edit: function(idx, siteset) {
			siteset[3] = SAVED;
			this.vault[idx] = siteset;
			return this.save();
		},
		del: function(idx) {
			this.vault.splice(idx, 1);
			return this.save();
		},
		imprt: function(newVault) {
			this.vault = newVault;
			return this.save();
		},
		save: function() {
			chrome.storage.local.set({"vault": this.vault});
			return this.vault;
		}
	};

	let vaultObj = new Vault();

	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (sender.tab) //from content
		{
			if (request.action === "submit")
			{
				//[[{"hostname":"abc.nl"}],"me@gmail.com","******"]
				chrome.browserAction.setBadgeText({text: "1"});
				let siteset = [[getUrlFromHref(request.docuhref)], request.username, request.password, UNSAVED];
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
				sendResponse(vaultObj.add(request.siteset));
			}
			else if (request.action === "vault.imprt")
			{
				sendResponse(vaultObj.imprt(request.vault));
			}
			else if (request.action === "vault.edit")
			{
				sendResponse(vaultObj.edit(request.idx, request.siteset));
			}
		}
	});



/* http auth */
var target = "<all_urls>";

//see https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/onAuthRequired



	chrome.browserAction.onClicked.addListener(function(){ console.log("browserAction.onClicked"); });
	chrome.runtime.onInstalled.addListener(function(){ console.log("runtime.onInstalled"); });
	chrome.runtime.onStartup.addListener(function(){ console.log("runtime.onStartup"); });
	chrome.tabs.onUpdated.addListener(function(){ console.log("tabs.onUpdated"); });

}
