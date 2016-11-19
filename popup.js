(function(){
'use strict';
const UNSAVED = 0, SAVED = 1;

function init()
{
	if ("chrome" in window)
	{
		chrome.runtime.sendMessage({action: "vault.get"}, function(vault) {
			fillSitesetSelect(vault);

			chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
				let currentTab = tabs[0];

				let tabLocation = new URL(currentTab.url);
				document.querySelector('form#site>div>div>input').value = tlds.getBaseDomain(tabLocation.hostname);
				let topScoreIdx = getTopScoreIdx(vault, tabLocation);

				if (topScoreIdx > -1)
				{
					chrome.tabs.sendMessage(currentTab.id, { type: 'hasLoginForm' }, function (hasLoginForm) {
						if (typeof hasLoginForm !== 'undefined') {
							console.log("hasLoginForm", hasLoginForm);
							if (hasLoginForm)
							{
								let row = vault[topScoreIdx];
								chrome.tabs.sendMessage(currentTab.id, { type: 'fillLoginForm', user: row[1], pass: row[2] }, function (response) { window.close(); });
							}
						}
					});
				}
			});
		});
	}
	else
	{
		console.error("window.chrome not found");
	}

	document.querySelector('form#site>label>select').addEventListener("change", onSitesetSelectChange, false);
	document.querySelector('form#site>b').addEventListener("click", onPlusIconClick, false);
	document.querySelector('form#site>i>button.save').addEventListener("click", onSitesetSaveClick, false);
	document.querySelector('form#site>i>button.del').addEventListener("click", onSitesetDeleteClick, false);
	document.querySelector('form#imprt>button').addEventListener("click", onImportSaveClick, false);
}


function onSitesetSelectChange(evt)
{
	let select = evt.target;

	let nrOfSites = 0;
	let urlDivs = document.querySelectorAll('div>div.url');
	if (select.value && select.value >= 0)
	{
		chrome.runtime.sendMessage({action: "vault.get"}, function(vault) {
			let siteset = vault[select.value];
			nrOfSites = siteset[0].length;
			document.querySelector('input[name="username"]').value = siteset[1];
			document.querySelector('input[name="password"]').value = siteset[2];
			for (let j = 0; j < nrOfSites; j++)
			{
				urlDivs[j].classList.add("on");
				let inputs = urlDivs[j].querySelectorAll('input');
				inputs[0].value = siteset[0][j].hostname;
				inputs[1].value = siteset[0][j].pathname || "";
			}
		});
	}
	else
	{
		document.querySelector('input[name="username"]').value = "";
		document.querySelector('input[name="password"]').value = "";
	}

	for (let j = nrOfSites; j < urlDivs.length; j++)
	{
		if (j > 0)
			urlDivs[j].classList.remove("on");
		let inputs = urlDivs[j].querySelectorAll('input');
		inputs[0].value = "";
		inputs[1].value = "";
	}
}
function onPlusIconClick(evt)
{
	document.querySelector('div>div.url:not(.on)').classList.add("on");
}

function onSitesetSaveClick(evt)
{
	//[[{"hostname":"abc.nl"}],"me@gmail.com","******"]
	let entry = [[]];
	entry[1] = document.querySelector('input[name="username"]').value;
	entry[2] = document.querySelector('input[name="password"]').value;
	let urlDivs = document.querySelectorAll('div>div.url');
	for (let i = 0; i < urlDivs.length; i++)
	{
		let host = urlDivs[i].querySelector('input[name="host"]').value;
		if (urlDivs[i].classList.contains("on") && host != "")
		{
			entry[0].push(getUrlFromHref('https://' + host + "/" + urlDivs[i].querySelector('input[name="path"]').value));
		}
	}
	let selectValue = document.querySelector('form#site>label>select').value;
	if (selectValue >= 0)
		chrome.runtime.sendMessage({action: "vault.edit", siteset: entry, idx: selectValue}, function(vault) { fillSitesetSelect(vault); });
	else
		chrome.runtime.sendMessage({action: "vault.add", siteset: entry}, function(vault) { fillSitesetSelect(vault); });
}
function onSitesetDeleteClick(evt)
{
	let selectValue = document.querySelector('form#site>label>select').value;
	chrome.runtime.sendMessage({action: "vault.del", idx: selectValue}, function(vault) { fillSitesetSelect(vault); });
}

function onImportSaveClick(evt)
{
	let ta = document.querySelector('#imprt textarea');
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
				preVault[i][1][0] = {"hostname": preVault[i][0]};
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
		chrome.runtime.sendMessage({"action": "vault.imprt", "vault": vault}, function(vault) { fillSitesetSelect(vault); });
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

function fillSitesetSelect(dta)
{
	let frags = [document.createDocumentFragment(), document.createDocumentFragment()];
	for (let i = 0; i < dta.length; i++)
	{
		let opt = document.createElement("option");
		opt.value = i;
		opt.appendChild(document.createTextNode(dta[i][0].map(function(loc){ return loc.pathname ? loc.hostname + "/" + loc.pathname : loc.hostname; }).join(", ")));
		if (dta[i].length > 3)
			frags[dta[i][3]].appendChild(opt);
	}
	let optGroup0 = document.querySelector('optgroup#ssNew');
	while (optGroup0.hasChildNodes())
		optGroup0.removeChild(optGroup0.lastChild);
	optGroup0.appendChild(frags[0]);
	let optGroup1 = document.querySelector('optgroup#ssSaved');
	while (optGroup1.hasChildNodes())
		optGroup1.removeChild(optGroup1.lastChild);
	optGroup1.appendChild(frags[1]);
	onSitesetSelectChange({target: optGroup0.parentNode});
}


function getTopScoreIdx(vault, tabLocation)
{
	let topScore = 0;
	let vaultIdx = -1;
	for (let i = 0; i < vault.length; i++)
	{
		if (vault[i][3] == SAVED)
		{
			let bookmarks = vault[i][0];
			for (let j = 0; j < bookmarks.length; j++)
			{
				let score = getLocationMatchScore(tabLocation, bookmarks[j]);
				if (score > topScore)
				{
					topScore = score;
					vaultIdx = i;
				}
				if (score > 0)
					console.log("Score", score, i, bookmarks[j]);
			}
		}
	}
	if (topScore > 0)
		return vaultIdx;
}

function getLocationMatchScore(tabLoc, bmLoc)
{
	let score = 0;
	if (tabLoc.hostname === bmLoc.hostname)
		score += 20 + bmLoc.hostname.length;
	else if (tabLoc.hostname.endsWith(bmLoc.hostname))
		score += 10 + bmLoc.hostname.length;
	if (score > 0)
	{
		if (bmLoc.port && tabLoc.port === bmLoc.port)
			score += 9;
		if (bmLoc.pathname && bmLoc.pathname)
		{
			if (tabLoc.pathname.startsWith("/"+bmLoc.pathname))
				score += 5 + Math.log(bmLoc.pathname.length + 1);
			else
				score += 1 + Math.log(getMatchingSubstringLength(tabLoc.pathname, "/"+bmLoc.pathname));
		}
		if (bmLoc.search && tabLoc.search && tabLoc.search.indexOf(bmLoc.search) > -1)
			score += 2 + Math.log(bmLoc.search.length);
	}
	return score;
}

document.addEventListener("DOMContentLoaded", init);

})();
