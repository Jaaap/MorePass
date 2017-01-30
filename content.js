(function(){

let isUnknownCredentials = true;

function triggerEvent(elem, eventType)
{
	let evt = new MouseEvent('click', { 'view': window, 'bubbles': true, 'cancelable': true });
	return !elem.dispatchEvent(evt);
}

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
			if (formElems[i].type === "text" || formElems[i].type === "email")
				return formElems[i];
		if (formElems[i] == passwordInput)
			passSeen = true;
	}
}
function getSubmitButton(passwordInput)
{
	return passwordInput.form.querySelector('input[type="submit"],button[type="submit"]');
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
			{
				usernameInput.value = message.user;
				//FIXME: find checkboxes named autologin or stayloggedin or keepcookie or rememberme and check them
				let submitButton = getSubmitButton(passwordInput);
				if (submitButton)
					triggerEvent(submitButton, "click");
			}
			else
				console.error("Unable to find usernameInput from passwordInput", passwordInput);
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
