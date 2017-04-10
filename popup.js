(function(){
'use strict';

function init()
{
	if ("chrome" in window)
	{
		chrome.runtime.sendMessage({'action': 'vault.get'}, vault => {
			chrome.tabs.query({'active': true, 'currentWindow': true}, tabs => {
				let currentTab = tabs[0];
				let tabLocation = new URL(currentTab.url);
				let vaultMatches = getVaultMatches(vault, tabLocation);
				if (vaultMatches.length > 0)
				{
					let tld = tlds.getTLD(tabLocation.hostname);
					chrome.tabs.sendMessage(currentTab.id, {'type': 'hasLoginForm', 'tld': tld}, data => {
						if (typeof data !== 'undefined')
						{
							let hasLoginForm = data[0];
							let pageUsernameValue = data[1];
							console.log("hasLoginForm", hasLoginForm, pageUsernameValue);
							if (hasLoginForm)
							{
								let i = 0;
								if (pageUsernameValue && pageUsernameValue.length)
								{
									for (let j = 0; j < vaultMatches.length; j++)
										if (pageUsernameValue == vaultMatches[j][USERNAME])
											i = j + 1;
									if (i >= vaultMatches.length)
										i = 0;
								}
								let row = vaultMatches[i];
								if (vaultMatches.length > 1)
									chrome.browserAction.setBadgeText({"text": (1+i) + "/" + vaultMatches.length, "tabId": currentTab.id});
								chrome.tabs.sendMessage(currentTab.id, {'type': 'fillLoginForm', 'tld': tld, 'user': row[USERNAME], 'pass': row[PASSWORD], 'submit': vaultMatches.length == 1}, response => { window.close(); });
							}
						}
					});
				}
			});
			showLeftPane(vault);
		});
	}
	else
	{
		console.warn("window.chrome not found");
		//FIXME: remove this test/mock code
		showLeftPane([
			[[{"hostname":"abc.com"},{"hostname":"sub.theregister.co.uk","port":8081,"pathname":"/p/"}], "user","pass",1],
			[[{"hostname":"mustard04.lan.betterbe.com","port":8081,"pathname":"/p/"}], "user","pass",1],
			[[{"hostname":"192.168.0.1"},{"hostname":"abc.com","port":8080,"pathname":"/p/"},{"hostname":"abc.com","port":8081,"pathname":"/p/"},{"hostname":"theregister.co.uk"},{"hostname":"sub.theregister.co.uk"}],"user","pass",1]
		]);
	}
	document.querySelector('div.left').addEventListener("click", showRightPane, false);
	document.querySelector('div.rght b.add').addEventListener("click", onPlusIconClick, false);
	document.querySelector('div.rght b.reveal').addEventListener("click", onEyeIconClick, false);
	document.querySelector('div.rght button.save').addEventListener("click", onSitesetSaveClick, false);
	document.querySelector('div.rght button.del').addEventListener("click", onSitesetDeleteClick, false);
/*
	document.querySelector('button#importLastpass').addEventListener("click", onImportSaveClick, false);
	document.querySelector('button#export').addEventListener("click", onExportButtonClick, false);
	document.querySelector('button#import').addEventListener("click", onImportButtonClick, false);
*/
}

function showLeftPane(vault)
{
	let spans = [];
	for (let j = 0; j < vault.length; j++)
	{
		for (let site of vault[j][SITES])
		{
			let span = document.createElement("span");
			span.setAttribute("data-i", j);
			let i = document.createElement("i");
			let b = document.createElement("b");
			let splitHostname = tlds.splitHostname(site.hostname);
			if (splitHostname)
			{
				i.appendChild(document.createTextNode(splitHostname.pop().split(".").reverse().join(".") + "."));
				let baseDomain = splitHostname.pop();
				b.appendChild(document.createTextNode(baseDomain));
				span.appendChild(i);
				span.appendChild(b);
				if (splitHostname.length)
				{
					i = document.createElement("i");
					let subDomain = "." + splitHostname.join(".");
					baseDomain += subDomain;
					i.appendChild(document.createTextNode(subDomain));
					span.appendChild(i);
				}
				spans.push([baseDomain,span]);
			}
			else
			{
				b.appendChild(document.createTextNode(site.hostname));
				span.appendChild(i);
				span.appendChild(b);
				spans.push([site.hostname,span]);
			}
		}
	}
	let frag = document.createDocumentFragment();
	spans.sort();
	spans.forEach(span => { frag.appendChild(span[1]); });
	document.querySelector('div.left').appendChild(frag);
}

function showRightPane(evt)
{
	let span = evt.target;
	if (span.tagName == "B" || span.tagName == "I")
		span = span.parentNode;
	if (span.tagName == "SPAN")
	{
		for (let [i,urlDiv] of Array.from(document.querySelectorAll('div>div.url')).entries())
		{
			if (i > 0)
				urlDiv.classList.remove("on");
			let inputs = urlDiv.querySelectorAll('input');
			inputs[0].value = "";
			inputs[1].value = "";
		}
		for (let onspan of document.querySelectorAll('div.left>span'))
			onspan.classList.remove("on");
		if (span.hasAttribute("data-i"))
		{
			let i = span.getAttribute("data-i");
			for (let ispan of document.querySelectorAll('div.left>span[data-i="' + i + '"]'))
				ispan.classList.add("on");
			if ("chrome" in window)
				chrome.runtime.sendMessage({'action': 'vault.get'}, showRightPane1.bind(this, i));
			else //FIXME: remove this test/mock code
				showRightPane1(i, [[[{"hostname":"abc.com"},{"hostname":"sub.theregister.co.uk","port":8081,"pathname":"/p/"}], "user","pass",1]]);
		}
		else
		{
			span.classList.add("on");
			document.querySelector('input[name="username"]').value = "";
			document.querySelector('input[name="password"]').value = "";
		}
	}
}
function showRightPane1(vaultIndex, vault)
{
	let siteset = vault[vaultIndex];
	let nrOfSites = siteset[SITES].length;
	document.querySelector('input[name="username"]').value = siteset[USERNAME];
	document.querySelector('input[name="password"]').value = siteset[PASSWORD];
	let urlDivs = document.querySelectorAll('div>div.url');
	for (let j = 0; j < nrOfSites; j++)
	{
		urlDivs[j].classList.add("on");
		let inputs = urlDivs[j].querySelectorAll('input');
		inputs[0].value = siteset[SITES][j].hostname + (siteset[SITES][j].port ? ":" + siteset[SITES][j].port : "");
		inputs[1].value = (siteset[SITES][j].pathname || "/").substr(1);//FIXME: old vaults have pathnames without the leading slash
	}
}
function onPlusIconClick(evt)
{
	document.querySelector('div>div.url:not(.on)').classList.add("on");
}
function onEyeIconClick(evt)
{
	let input = document.querySelector('div.rght input[name="password"]');
	input.type = input.type == "password" ? "text" : "password";
}

function onSitesetSaveClick(evt)
{
	//[[{"hostname":"abc.nl"}],"me@gmail.com","******"]
	let entry = [[]];
	entry[USERNAME] = document.querySelector('div.rght input[name="username"]').value;
	entry[PASSWORD] = document.querySelector('div.rght input[name="password"]').value;
	for (let urlDiv of document.querySelectorAll('div>div.url'))
	{
		let host = urlDiv.querySelector('input[name="host"]').value;
		if (urlDiv.classList.contains("on") && host != "")
		{
			entry[SITES].push(getUrlFromHref('https://' + host + "/" + urlDiv.querySelector('input[name="path"]').value));
		}
	}
	let vaultIdx = document.querySelector('div.left>span.on').getAttribute("data-i");
	if (vaultIdx >= 0)
		chrome.runtime.sendMessage({'action': 'vault.edit', 'siteset': entry, 'idx': vaultIdx}, function(vault) { showLeftPane(vault); });
	else
		chrome.runtime.sendMessage({'action': 'vault.add', 'siteset': entry}, function(vault) { showLeftPane(vault); });
}
function onSitesetDeleteClick(evt)
{
	let selectValue = document.querySelector('form#site>label>select').value;
	chrome.runtime.sendMessage({'action': 'vault.del', 'idx': selectValue}, function(vault) { showLeftPane(vault); });
}

function onExportButtonClick(evt)
{
	let passp = document.querySelector('input#passphrase').value;
	chrome.runtime.sendMessage({'action': 'vault.encrypt', "passphrase": passp}, function(encryptedVault) {
		document.querySelector('form#imex textarea').value = encryptedVault;
	});
}
function onImportButtonClick(evt)
{
	let passp = document.querySelector('input#passphrase').value;
	chrome.runtime.sendMessage({'action': 'vault.decrypt.merge', "passphrase": passp, "vault": document.querySelector('form#imex textarea').value}, function(result) {
		document.querySelector('form#imex textarea').value = result.success ? "*Import successful*" : "*** ERROR ***\n" + result.error;
	});
}

function onImportSaveClick(evt)
{
	let ta = document.querySelector('#imex textarea');
	if (ta && ta.value && ta.value.indexOf('url,username,password,') == 0) // LastPass style
	{
		let uup = parseCSV(ta.value);
		let preVault = [];
		for (let i = 1; i < uup.length; i++)
		{
			let line = uup[i];
			if (line.length > 2)
			{
				let url = getUrlFromHref(line[0]);
				preVault.push([tlds.getBaseDomain(url.hostname), [url], line[1], line[2]]);
			}
		}
		//step 1: clean urls if there are no other entries with same base domain
		for (let i = 0; i < preVault.length; i++)
		{
			let baseDomainSeen = false;
			for (let j = 0; j < preVault.length; j++)
			{
				if (i != j && preVault[i][0] == preVault[j][0])
					baseDomainSeen = true;
			}
			if (!baseDomainSeen)
			{
				preVault[i][1][0] = {'hostname': preVault[i][0]};
			}
		}
		//step 2: merge entries with same credentials
		for (let i = 0; i < preVault.length; i++)
		{
			for (let j = 0; j < preVault.length; j++)
			{
				if (i != j && preVault[i][2] == preVault[j][2] && preVault[i][3] == preVault[j][3])
				{
					//merge i and j
					[].push.apply(preVault[i][1], preVault[j][1]);
					preVault.splice(j, 1);
					j--;
				}
			}
		}
		//FIXME: merge existing vault
		let vault = [];
		for (let i = 0; i < preVault.length; i++)
		{
			vault.push([preVault[i][1], preVault[i][2], preVault[i][3], 1]);
		}
		chrome.runtime.sendMessage({'action': 'vault.imprt', 'vault': vault}, function(vault) { showLeftPane(vault); });
		ta.value = "";//JSON.stringify(preVault);
		alert("Import successful");
	}
/*
	let fileInput = document.getElementById('importFile');
	if ('files' in fileInput)
	{
		if (fileInput.files.length == 1)
		{
			let file = fileInput.files[0];
			let reader = new FileReader();
			reader.addEventListener("load", function(){
				//FIXME: test the file contents for validity
				chrome.runtime.sendMessage({action: "vault.imprt", vault: JSON.parse(reader.result)});
			});
			reader.readAsText(file);
		}
	}
*/
}


function getVaultMatches(vault, tabLocation)
{
	let topScore = 0;
	let vaultMatches = [];
	for (let i = 0; i < vault.length; i++)
	{
		if (vault[i][SAVEDSTATE] == SAVED)
		{
			let bookmarks = vault[i][SITES];
			let localTopScore = 0;
			for (let j = 0; j < bookmarks.length; j++)
			{
				let score = getLocationMatchScore(tabLocation, bookmarks[j]);
				if (score > localTopScore)
					localTopScore = score;
			}
			if (localTopScore > 0)
			{
				if (localTopScore > topScore)
				{
					topScore = localTopScore;
					vaultMatches = [vault[i]];
				}
				else if (localTopScore == topScore)
					vaultMatches.push(vault[i]);
			}
		}
	}
	return vaultMatches;
}

function getLocationMatchScore(tabLoc, bmLoc)
{
	let score = 0;
	if (tabLoc.hostname === bmLoc.hostname)
		score += 2000 + bmLoc.hostname.length;
	else if (tabLoc.hostname.endsWith("." + bmLoc.hostname))
		score += 1000 + bmLoc.hostname.length;
	if (score > 0)
	{
		if (bmLoc.port && tabLoc.port === bmLoc.port)
			score += 100;
		if (bmLoc.pathname && bmLoc.pathname)
		{
			if (tabLoc.pathname.startsWith("/"+bmLoc.pathname))
				score += 20 + (20 * Math.atan(bmLoc.pathname.length));
			else
				score += 10 + (10 * Math.atan(getMatchingSubstringLength(tabLoc.pathname, "/"+bmLoc.pathname) - 1)); //don't count the slash
		}
		if (bmLoc.search && tabLoc.search && tabLoc.search.indexOf(bmLoc.search) > -1)
			score += 1 + Math.atan(bmLoc.search.length);
	}
	return Math.round(100000 * score);
}

document.addEventListener("DOMContentLoaded", init);

})();
