(function(){
'use strict';

function init()
{
	if ("chrome" in window)
	{
		chrome.runtime.sendMessage({action: "vault.get"}, function(vault) {
			console.log(1, vault);
			fillSitesetSelect(vault);

			chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
				let currentTab = tabs[0];

				let tabLocation = new URL(currentTab.url);
				document.querySelector('form#site>div>div>input').value = getBaseDomain(tabLocation.hostname);
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
	document.querySelector('form#site>label>button').addEventListener("click", onSitesetSaveClick, false);
}


function onSitesetSelectChange(evt)
{
	let select = evt.target;

	let nrOfSites = 0;
	let urlDivs = document.querySelectorAll('div>div.url');
	if (select.value >= 0)
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
			let url = new URL('https://' + host + "/" + urlDivs[i].querySelector('input[name="path"]').value);
			let site = {hostname: url.hostname};
			if (url.pathname.length > 1)
				site.pathname = url.pathname.substring(1);
			if (url.port.length > 0)
				site.port = url.port.substring(1);
			if (url.search.length > 0)
				site.search = url.search.substring(1);
			entry[0].push(site);
		}
	}
	var selectValue = document.querySelector('form#site>label>select').value;
	if (selectValue >= 0)
		chrome.runtime.sendMessage({action: "vault.edit", siteset: entry, idx: selectValue}, function(vault) { fillSitesetSelect(vault); });
	else
		chrome.runtime.sendMessage({action: "vault.add", siteset: entry}, function(vault) { fillSitesetSelect(vault); });
}

function fillSitesetSelect(dta)
{
	let frag = document.createDocumentFragment();
//console.log(dta);
	for (let i = -1; i < dta.length; i++)
	{
		let opt = document.createElement("option");
		opt.value = i;
		opt.appendChild(document.createTextNode(i == -1 ? "* Add new site *" : dta[i][0].map(function(loc){ return loc.pathname ? loc.hostname + "/" + loc.pathname : loc.hostname; }).join(", ")));
		frag.appendChild(opt);
	}
	let select = document.querySelector('form#site>label>select');
	while (select.hasChildNodes())
		select.removeChild(select.lastChild);
	select.appendChild(frag);
	onSitesetSelectChange({target: select});
}


function getTopScoreIdx(vault, tabLocation)
{
	var topScore = 0;
	var vaultIdx = -1;
	for (var i = 0; i < vault.length; i++)
	{
		var bookmarks = vault[i][0];
		for (var j = 0; j < bookmarks.length; j++)
		{
			var score = getLocationMatchScore(tabLocation, bookmarks[j]);
			if (score > topScore)
			{
				topScore = score;
				vaultIdx = i;
			}
		}
	}
	if (topScore > 0)
	{
		console.log("getTopScoreIdx", topScore, vault[vaultIdx][0]);
		return vaultIdx;
	}
}

function getLocationMatchScore(tabLoc, bmLoc)
{
	let score = 0;
	if (tabLoc.hostname === bmLoc.hostname)
		score += 20;
	else if (tabLoc.hostname.endsWith(bmLoc.hostname))
		score += 10;
	if (score > 0)
	{
		if (bmLoc.port && tabLoc.port === bmLoc.port)
			score += 9;
		if (bmLoc.pathname && tabLoc.pathname.startsWith(bmLoc.pathname))
			score += 5 + Math.log(bmLoc.pathname.length);
		if (bmLoc.search && tabLoc.search === bmLoc.search)
			score += 2;
	}
//console.log(bmLoc.hostname, score);
	return score;
}

document.addEventListener("DOMContentLoaded", init);

})();
