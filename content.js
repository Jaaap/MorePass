(function(){

let isUnknownCredentials = true;

function getPasswordInput()
{
	return document.querySelector('form[method="post" i] input[type="password"]');
}
function getUsernameInput(passwordInput)
{
	let formElems = passwordInput.form.elements;
	let i = formElems.length;
	let passSeen = false;
	while (i--)
	{
		if (passSeen)
			if (formElems[i].type === "text")
				return formElems[i];
		if (formElems[i] == passwordInput)
			passSeen = true;
	}
}

function onLoginformSubmit(evt)
{
	if (isUnknownCredentials)
	{
		let passwordInput = getPasswordInput();
		let usernameInput = getUsernameInput(passwordInput) || {value:null};
		chrome.runtime.sendMessage({action: "submit", username: usernameInput.value, password: passwordInput.value, docuhref: document.location.href }, function(response) { console.log(response); });
	}
}

/* messaging */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse)
{
	if (message.type === 'hasLoginForm')
	{
		return sendResponse(getPasswordInput() != null);
	}
	else if (message.type === 'fillLoginForm')
	{
		let passwordInput = getPasswordInput();
		if (passwordInput != null)
		{
			isUnknownCredentials = false;
			passwordInput.value = message.pass;
			let usernameInput = getUsernameInput(passwordInput);
			if (usernameInput)
				usernameInput.value = message.user;
			else
				console.error("Unable to find usernameInput from passwordInput", passwordInput);
			//passwordInput.form.submit();
			//FIXME: find the submit button or input and click it
			return sendResponse(true);
		}
		return sendResponse(false);
	}
});


/* init */
let passwordInput = getPasswordInput();
if (passwordInput)
{
	//FIXME more: don't do this for banks, ideal, DigID, Paypal etc
	//FIXME: check form action too, might be a different domain.
	if (!/\b(paypal|ing|abnamro|rabobank|deutschebank|deutsche-bank|commerzbank|kfw|hypovereinsbank|chase|bankamerica|wellsfargo|citicorp|pncbank|hsbc|bnymellon|usbank|suntrust|statestreet|capitalone|bbt)\.[a-z]+$/i.test(document.location.hostname))
		passwordInput.form.addEventListener("submit", onLoginformSubmit, false);
}


})();
