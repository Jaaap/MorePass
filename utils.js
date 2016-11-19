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
			strMatchedValue = arrMatches[ 2 ].replace(new RegExp( "\"\"", "g" ), "\"");
		else
			strMatchedValue = arrMatches[ 3 ];
		arrData[arrData.length - 1].push(strMatchedValue);
	}
	return arrData;
}
function vaultSort(aa,bb)
{
	let a = aa[0][0].hostname;
	let b = bb[0][0].hostname;
	if (aa[3] == bb[3])
		return (a < b ? -1 : +(a > b));
	else
		return aa[3] < bb[3] ? -1 : 1;
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
