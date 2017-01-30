'use strict';
const UNSAVED = 0, SAVED = 1;
const SITES = 0, USERNAME = 1, PASSWORD = 2, SAVEDSTATE = 3, LASTMODIFIED = 4;
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
	while (arrMatches = objPattern.exec( strData ))
	{
		let strMatchedDelimiter = arrMatches[ 1 ];
		if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter))
			arrData.push([]);
		let strMatchedValue;
		if (arrMatches[2])
			strMatchedValue = arrMatches[2].replace(new RegExp( "\"\"", "g" ), "\"");
		else
			strMatchedValue = arrMatches[3];
		arrData[arrData.length - 1].push(strMatchedValue);
	}
	return arrData;
}
function vaultSort(aa,bb)
{
	let a = aa[SITES][0].hostname;
	let b = bb[SITES][0].hostname;
	if (aa[SAVEDSTATE] == bb[SAVEDSTATE])//unsaved vs saved
		return (a < b ? -1 : +(a > b));
	else
		return aa[SAVEDSTATE] < bb[SAVEDSTATE] ? -1 : 1;
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
