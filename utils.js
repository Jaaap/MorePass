'use strict';
const UNSAVED = 0, SAVED = 1;
const SITES = 0, USERNAME = 1, PASSWORD = 2, SAVEDSTATE = 3, LASTMODIFIED = 4;
const SITEPROPS = ["hostname","port","pathname","search"];
function getUrlFromHref(href)
{
	let url = new URL(href);
	let site = {hostname: url.hostname};
	if (url.pathname.length > 1)
		site.pathname = url.pathname.substring(1);
	if (url.port.length > 0)
		site.port = url.port;
	if (url.search.length > 0)
		site.search = url.search.substring(1);
	return site;
}

function parseCSV(strData, strDelimiter)
{
	strDelimiter = (strDelimiter || ",");
	let objPattern = new RegExp("(\\" + strDelimiter + "|\\r?\\n|\\r|^)" + "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" + "([^\"\\" + strDelimiter + "\\r\\n]*))", "gi");
	let arrData = [[]];
	let arrMatches = null;
	while (arrMatches = objPattern.exec(strData))
	{
		let strMatchedDelimiter = arrMatches[ 1 ];
		if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter))
			arrData.push([]);
		let strMatchedValue;
		if (arrMatches[2])
			strMatchedValue = arrMatches[2].replace(/""/g, "\"");
		else
			strMatchedValue = arrMatches[3];
		arrData[arrData.length - 1].push(strMatchedValue);
	}
	return arrData;
}
function vaultSort(aa,bb)
{
	let a = aa[SITES][0].hostname + "/" + aa[SITES][0].pathname;
	let b = bb[SITES][0].hostname + "/" + bb[SITES][0].pathname;
	if (aa[SAVEDSTATE] == bb[SAVEDSTATE])//unsaved vs saved
		return (a < b ? -1 : +(a > b));
	else
		return aa[SAVEDSTATE] < bb[SAVEDSTATE] ? -1 : 1;
}
function sitesSort(a,b)
{
	for (let prop of SITEPROPS)
		if (a[prop] !== b[prop])
			return a[prop] < b[prop] ? -1 : 1;
	return 0;
}
function getMatchingSubstringLength(a, b)
{
	let max = Math.min(a.length,b.length);
	for (let i = 0; i < max; i++)
	{
		if (a[i] !== b[i])
			return i;
	}
	return 0;
}
function siteEquals(h1, h2)//SITE: hash with hostname etc
{
	for (let prop of SITEPROPS)
		if (h1[prop] !== h2[prop])
			return false;
	return true;
}
function sitesEquals(a1, a2)//SITES: array of hashes with hostname etc, assumes everything is sorted
{
	if (a1.length !== a2.length)
		return false;
	for (let i = 0; i < a1.length; i++)
		if (!siteEquals(a1[i], a2[i]))
			return false;
	return true;
}
function contains(arr, val)//assumes everything is sorted
{
	for (let entry of arr)
		if (entry[USERNAME] == val[USERNAME] && entry[PASSWORD] == val[PASSWORD] && sitesEquals(entry[SITES], val[SITES]))
			return true;
	return false;
}
function mergeSites(a1, a2)//into a1
{
	for (let h2 of a2)
	{
		let match = false;
		for (let h1 of a1)
			if (siteEquals(h1, h2))
				match = true;
		if (!match)
			a1.push(h2);
	}
	a1.sort(sitesSort);
console.log("mergeSites", JSON.stringify(a1));
}
function mergeVaults(vault1,vault2)
{
	let v1 = JSON.parse(JSON.stringify(vault1));
	let v2 = JSON.parse(JSON.stringify(vault2));
	v1.sort(vaultSort);
	v2.sort(vaultSort);
	for (let entry of v1)
		entry[SITES].sort(sitesSort);
	for (let entry of v2)
		entry[SITES].sort(sitesSort);

	//step 1: add different lines of v2 to v1
	for (let entry of v2)
	{
		//If this exact line is not in v1 somewhere, append it to v1
		if (!contains(v1, entry))
		{
			console.log("adding", entry);
			v1.push(entry);
		}
	}
	//step 2: merge entries with same credentials in v1
	for (let i = 0; i < v1.length; i++)
	{
		for (let j = 0; j < v1.length; j++)
		{
			if (i != j && v1[i][USERNAME] == v1[j][USERNAME] && v1[i][PASSWORD] == v1[j][PASSWORD])
			{
				//merge i and j
				console.log("merging " + i + " and " + j, JSON.stringify(v1[i]), JSON.stringify(v1[j]));
				//[].push.apply(v1[i][SITES], v1[j][SITES]);
				//v1[i][SITES].sort(sitesSort);
				mergeSites(v1[i][SITES], v1[j][SITES]);
				v1.splice(j, 1);
				j--;
			}
		}
	}
	return v1;
}
