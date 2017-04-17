'use strict';
const UNSAVED = 0, SAVED = 1;
const SITES = 0, USERNAME = 1, PASSWORD = 2, SAVEDSTATE = 3, LASTMODIFIED = 4;
const SITEPROPS = ["hostname","port","pathname","search"];
function getUrlFromHref(href)
{
	let url = new URL(href);
	let site = {hostname: url.hostname};
	if (url.pathname.length > 1)
		site.pathname = url.pathname;
	if (url.port.length > 0)
		site.port = url.port;
	if (url.search.length > 0)
		site.search = url.search;
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
	let a = aa[SITES][0].hostname + aa[SITES][0].pathname;
	let b = bb[SITES][0].hostname + bb[SITES][0].pathname;
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
function mergeTwoSites(h1, h2)//returns 1 when mergeable into the first, 2 when into the second or otherwise 0
{
	//"hostname","port","pathname","search"
	let su1 = `:${h1.port||""}${h1.pathname||""}${h1.search||""}`;//works only because pathname starts with a '/' and search starts with a '?' (when filled)
	let su2 = `:${h2.port||""}${h2.pathname||""}${h2.search||""}`;//works only because pathname starts with a '/' and search starts with a '?' (when filled)
	if ("hostname" in h1 && "hostname" in h2)
	{
		if (h1.hostname === h2.hostname)
		{
			if (su1 === su2 || su2.startsWith(su1))
				return 1;
			else if (su1.startsWith(su2))
				return 2;
		}
		else if (h1.hostname.endsWith("." + h2.hostname))//h2.hostname is shorter
		{
			if (su1 === su2 || su1.startsWith(su2))//su2 is shorter
				return 2;
		}
		else if (h2.hostname.endsWith("." + h1.hostname))//h1.hostname is shorter
		{
			if (su1 === su2 || su2.startsWith(su1))//su1 is shorter
				return 1;
		}
	}
	return 0;
}
function mergeSiteArrays(a1, a2)//into a1
{
	for (let h2 of a2)
	{
		let isMerged = false;
		for (let [i1, h1] of a1.entries())
		{
			let mergeable = mergeTwoSites(h1, h2);
			if (mergeable > 0)
			{
				if (mergeable == 2)
					a1[i1] = h2;//TODO: check that is this allowed is the for of loop?
				isMerged = true;
			}
		}
		if (!isMerged)
			a1.push(h2);
	}
	a1.sort(sitesSort);
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



	//FIXME: remove this migration code
	for (let siteset of v1)
	{
		for (let site of siteset[SITES])
			if ("pathname" in site && !/^\//.test(site.pathname))
				site.pathname = "/" + site.pathname;
		if (siteset.length <= LASTMODIFIED)
			siteset[LASTMODIFIED] = (new Date()).getTime();
	}
	for (let siteset of v2)
	{
		for (let site of siteset[SITES])
			if ("pathname" in site && !/^\//.test(site.pathname))
				site.pathname = "/" + site.pathname;
		if (siteset.length <= LASTMODIFIED)
			siteset[LASTMODIFIED] = (new Date()).getTime();
	}

	//step 1: add different lines of v2 to v1
	for (let entry of v2)
	{
		//If this exact line is not in v1 somewhere, append it to v1
		if (!contains(v1, entry))
		{
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
				mergeSiteArrays(v1[i][SITES], v1[j][SITES]);
				if (v1[i][SAVEDSTATE] === UNSAVED)
					v1[i][SAVEDSTATE] = v1[j][SAVEDSTATE];
				if (v1[i][LASTMODIFIED] < v1[j][LASTMODIFIED])
					v1[i][LASTMODIFIED] = v1[j][LASTMODIFIED];
				v1.splice(j, 1);
				j--;
			}
		}
	}
	return v1;
}
