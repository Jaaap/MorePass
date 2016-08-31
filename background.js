(function(){

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log(sender.tab ?  "from a content script:" + sender.tab.url : "from the extension");
	if (request.action === "submit")
	{
		//sendResponse({farewell: "goodbye"});
		//chrome.browserAction.show(sender.tab.id);
		chrome.browserAction.setBadgeText({text: "1"});
		let username = request.username;
		let password = request.password;
		//FIXME: store these credentials somewhere for the popup to use.
	}
});

})();
