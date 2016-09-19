//import * as crypto from "crypto";
{
	'use strict';

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
				return (a < b ? -1 : +(a > b));
			});
			return this.save();
		},
		edit: function(idx, siteset) {
			this.vault[idx] = siteset;
			return this.save();
		},
		del: function(idx) {
			this.vault.splice(idx, 1);
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
				//chrome.browserAction.show(sender.tab.id);
				chrome.browserAction.setBadgeText({text: "1"});
				let username = request.username;
				let password = request.password;
				//FIXME: store these credentials in vault.unsaved
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
			else if (request.action === "vault.edit")
			{
				sendResponse(vaultObj.edit(request.idx, request.siteset));
			}
		}
	});

	chrome.browserAction.onClicked.addListener(function(){ console.log("browserAction.onClicked"); });
	chrome.runtime.onInstalled.addListener(function(){ console.log("runtime.onInstalled"); });
	chrome.runtime.onStartup.addListener(function(){ console.log("runtime.onStartup"); });
	chrome.tabs.onUpdated.addListener(function(){ console.log("tabs.onUpdated"); });

}
