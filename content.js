(function(){

let isUnknownCredentials = true;

function triggerMouseEvent(elem, eventType)
{
	return elem.dispatchEvent(new MouseEvent(eventType, {'view': window, 'bubbles': true, 'cancelable': true}));
}
/*
function triggerKeyboardEvent(elem, eventType, key)
{
	return elem.dispatchEvent(new KeyboardEvent(eventType, {'bubbles': true, 'cancelable': true, 'key': key, 'char': key, 'shiftKey': false}));
}
*/
function triggerEvent(elem, eventType)
{
	return elem.dispatchEvent(new Event(eventType, {'bubbles': true, 'cancelable': true}));
}

function getPasswordInput(docRoot, tld)
{
	let inputs = docRoot.querySelectorAll('form[method="post" i] input[type="password"],form input[type="password"]');
	//level 1: form's action must match tld
	for (let i = 0; i < inputs.length; i++)
	{
		let action = inputs[i].form.action;
		if (action && action.length)
		{
			let url = new URL(action);
			if (url && url.hostname && (!tld || url.hostname == tld || url.hostname.endsWith("." + tld)))
				return inputs[i];
		}
	}
	//level 2: forget the tld and the action and just return the first input from inputs
	if (inputs.length)
		return inputs[0];
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
	return passwordInput.form.querySelector('input[type="submit"],button[type="submit"],button:not([type]),input[type="image"]');
}
function getRemembermeCheckbox(passwordInput)
{
	let cbs = passwordInput.form.querySelectorAll('input[type="checkbox"]');
	for (let i = 0; i < cbs.length; i++)
	{
		let cb = cbs[i];
		let name = cb.name + " " + cb.id;
		//autologin stayloggedin keepcookie rememberme 
		if (/autologin|remember|cookie/i.test(name))
			return cb;
	}
}


/* messaging */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse)
{
	if (message.type === 'hasLoginForm')
	{
		let passwordInput = getPasswordInput(document, message.tld);
		if (passwordInput != null)
		{
			isUnknownCredentials = false;
			let usernameInput = getUsernameInput(passwordInput);
			if (usernameInput)
				return sendResponse([true, usernameInput.value]);
			return sendResponse([true, null]);
		}
		return sendResponse([false]);
	}
	else if (message.type === 'fillLoginForm')
	{
		let passwordInput = getPasswordInput(document, message.tld);
		if (passwordInput)
		{
			isUnknownCredentials = false;
			passwordInput.value = message.pass;
			triggerEvent(passwordInput, "input");
			let usernameInput = getUsernameInput(passwordInput);
			if (usernameInput)
			{
				usernameInput.value = message.user;
				triggerEvent(usernameInput, "input");
			}
			let remembermeCheckbox = getRemembermeCheckbox(passwordInput);
			if (remembermeCheckbox)
			{
				remembermeCheckbox.checked = true;
			}
			if (message.submit)
			{
				let submitButton = getSubmitButton(passwordInput);
				if (submitButton)
				{
					triggerMouseEvent(submitButton, "click");
				}
				else //try to submit the form
				{
					passwordInput.form.submit();
				}
			}
			return sendResponse(true);
		}
		return sendResponse(false);
	}
});


function onLoginformSubmit(evt)
{
	if (isUnknownCredentials)
	{
		let passwordInput = getPasswordInput(evt.target);
		let usernameInput = getUsernameInput(passwordInput) || {value:null};
		if (passwordInput && passwordInput.value && passwordInput.value.length)// && usernameInput && usernameInput.value && usernameInput.value.length)
			chrome.runtime.sendMessage({'action': "submit", 'username': usernameInput.value, 'password': passwordInput.value, 'docuhref': document.location.href }, function(response) { console.log(response); });
	}
}
/* init */
let passwordInput = getPasswordInput(document);
if (passwordInput)
{
	chrome.runtime.sendMessage({'action': "blacklist.get"}, blacklist => {
		if (blacklist != null)
		{
			let action = passwordInput.form.action;
			if (action && action.length)
			{
				let actionUrl = new URL(action);
				if (blacklist.indexOf(tlds.getBaseDomainWithoutTLD(actionUrl)) > -1)
					return;
			}
			if (blacklist.indexOf(tlds.getBaseDomainWithoutTLD(document.location.hostname)) == -1)
				return;
			//catch new credentials
			passwordInput.form.addEventListener("submit", onLoginformSubmit, false);
		}
	});
}


})();
