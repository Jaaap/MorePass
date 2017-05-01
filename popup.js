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
console.log("vaultMatches", vaultMatches);
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
										if (pageUsernameValue == vaultMatches[j][USERNAME])//FIXME: same username could be in vaultMatches multiple times
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
			[[{"hostname":"mustard04.lan.betterbe.com","port":8081,"pathname":"/p/"}], "user","pass",0],
			[[{"hostname":"192.168.0.1"},{"hostname":"abc.com","port":8080,"pathname":"/p/"},{"hostname":"abc.com","port":8081,"pathname":"/p/"},{"hostname":"theregister.co.uk"},{"hostname":"sub.theregister.co.uk"}],"user","pass",1]
		]);
	}
	$('form#passphrase').addEventListener("submit", onPassphraseformChange, false);
	$('ul.menu').addEventListener("click", menuClick, false);
	$('div.left').addEventListener("click", showRightPane, false);
	$('div.rght b.add').addEventListener("click", onPlusIconClick, false);
	$('div.rght b.reveal').addEventListener("click", onEyeIconClick, false);
	$('div.rght button.save').addEventListener("click", onSitesetSaveClick, false);
	$('div.rght button.del').addEventListener("click", onSitesetDeleteClick, false);
	$('div.import button').addEventListener("click", onImportButtonClick, false);
	$('div.export button').addEventListener("click", onExportButtonClick, false);
}

function onPassphraseformChange(evt)
{
	evt.preventDefault();
	chrome.runtime.sendMessage({'action': 'passphrase.set', 'passprase':$('input[name="passphrase"]').value}, result => {
		$('input[name="passphrase"]').setCustomValidity(result.passphrasecorrect ? "" : "Passprase incorrect, please try again.");
		//TODO: show the user that the passphrase is correct
	});
}
function menuClick(evt)
{
	let li = evt.target;
	if (li.tagName == "LI")
	{
		Array.from(document.querySelectorAll('ul.menu>li,div.main>div')).forEach(elem => { elem.classList.remove("on"); });
		li.classList.add("on");
		Array.from(document.querySelectorAll('div.' + li.getAttribute('data-href').split(/,/).join(',div.'))).forEach(div => { div.classList.add("on"); });
	}
}
function makeSpan(j, tld, baseDomain, cls)
{
	let span = document.createElement("span");
	if (cls != null)
		span.className = cls;
	if (j != null)
		span.setAttribute("data-i", j);
	let i = document.createElement("i");
	let b = document.createElement("b");
	if (tld != null)
		i.appendChild(document.createTextNode(tld));
	b.appendChild(document.createTextNode(baseDomain));
	span.appendChild(i);
	span.appendChild(b);
	return span;
}
function makeLeftpaneSpans(vault, savedState)
{
	let spans = [];
	for (let j = 0; j < vault.length; j++)
	{
		if (vault[j][SAVEDSTATE] === savedState)
		{
			for (let site of vault[j][SITES])
			{
				let splitHostname = tlds.splitHostname(site.hostname);
				if (splitHostname)
				{
					let tld = splitHostname.pop().split(".").reverse().join(".") + ".";
					let baseDomain = splitHostname.pop();
					let span = makeSpan(j, tld, baseDomain);
					if (splitHostname.length)
					{
						let i = document.createElement("i");
						let subDomain = "." + splitHostname.join(".");
						baseDomain += subDomain;
						i.appendChild(document.createTextNode(subDomain));
						span.appendChild(i);
					}
					spans.push([baseDomain + (site.pathname||""),span]);
				}
				else
				{
					let span = makeSpan(j, null, site.hostname);
					spans.push([site.hostname,span]);
				}
			}
		}
	}
	spans.sort();
	return spans;
}
function showLeftPane(vault)
{
	let frag = document.createDocumentFragment();
	frag.appendChild(makeSpan(null, null, "New", "h3"));
	frag.appendChild(makeSpan(null, null, "*Add new*", "on"));
	makeLeftpaneSpans(vault, UNSAVED).forEach(span => { frag.appendChild(span[1]); });
	frag.appendChild(makeSpan(null, null, "Saved", "h3"));
	makeLeftpaneSpans(vault, SAVED).forEach(span => { frag.appendChild(span[1]); });
	let divLeft = $('div.left');
	let last;
	while (last = divLeft.lastChild) divLeft.removeChild(last);
	divLeft.appendChild(frag);
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
			$('input[name="username"]').value = "";
			$('input[name="password"]').value = "";
		}
	}
}
function showRightPane1(vaultIndex, vault)
{
	let siteset = vault[vaultIndex];
	let nrOfSites = siteset[SITES].length;
	$('input[name="username"]').value = siteset[USERNAME];
	$('input[name="password"]').value = siteset[PASSWORD];
	let urlDivs = document.querySelectorAll('div>div.url');
	for (let j = 0; j < nrOfSites; j++)
	{
		urlDivs[j].classList.add("on");
		let inputs = urlDivs[j].querySelectorAll('input');
		inputs[0].value = siteset[SITES][j].hostname + (siteset[SITES][j].port ? ":" + siteset[SITES][j].port : "");
		inputs[1].value = (siteset[SITES][j].pathname || "/").substr(1);
	}
}
function onPlusIconClick(evt)
{
	$('div>div.url:not(.on)').classList.add("on");
}
function onEyeIconClick(evt)
{
	let input = $('div.rght input[name="password"]');
	input.type = input.type == "password" ? "text" : "password";
}

function onSitesetSaveClick(evt)
{
	//[[{"hostname":"abc.nl"}],"me@gmail.com","******"]
	let entry = [[]];
	entry[USERNAME] = $('div.rght input[name="username"]').value;
	entry[PASSWORD] = $('div.rght input[name="password"]').value;
	for (let urlDiv of document.querySelectorAll('div>div.url'))
	{
		let host = urlDiv.querySelector('input[name="host"]').value;
		if (urlDiv.classList.contains("on") && host != "")
		{
			entry[SITES].push(getUrlFromHref('https://' + host + "/" + urlDiv.querySelector('input[name="path"]').value));
		}
	}
	let vaultIdx = $('div.left>span.on').getAttribute("data-i");
	if (vaultIdx)
		chrome.runtime.sendMessage({'action': 'vault.edit', 'siteset': entry, 'idx': vaultIdx}, function(vault) { showLeftPane(vault); });
	else
		chrome.runtime.sendMessage({'action': 'vault.add', 'siteset': entry}, function(vault) { showLeftPane(vault); });
}
function onSitesetDeleteClick(evt)
{
	let vaultIdx = $('div.left>span.on').getAttribute("data-i");
	chrome.runtime.sendMessage({'action': 'vault.del', 'idx': vaultIdx}, function(vault) { showLeftPane(vault); });
}

function onImportButtonClick(evt)
{
	let importtype = $('input[name="importtype"]:checked').value;
	if (importtype == "pd")
	{
		let passp = $('input[name="passphrase"]').value;
		chrome.runtime.sendMessage({'action': 'vault.decrypt.merge', "passphrase": passp.value, "vault": $('div.import textarea').value}, function(result) {
			passp.value = "";
			$('div.import textarea').value = result.success ? "*Import successful*" : "*** ERROR ***\n" + result.error;
			chrome.runtime.sendMessage({'action': 'vault.get'}, vault => { showLeftPane(vault); });
		});
	}
	else if (importtype == "lp")
	{
		importLastpassCSV();
	}
}

function onExportButtonClick(evt)
{
	let passp = $('input[name="passphrase"]').value;
	chrome.runtime.sendMessage({'action': 'vault.encrypt', "passphrase": passp}, function(encryptedVault) {
		$('div.export textarea').value = encryptedVault;
	});
}

function importLastpassCSV()
{
	let ta = $('div.import textarea');
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


document.addEventListener("DOMContentLoaded", init);

})();
