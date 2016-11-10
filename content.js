(function(){

function getPasswordInput()
{
	return document.querySelector('form[method="post" i] input[type="password"]');
}
function getUsernameInput(passwordInput)
{
	let formElems = passwordInput.form.elements;
	let i = formElems.length - 1;
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
	//FIXME: don't do this when the popup is submiting this form
	let passwordInput = getPasswordInput();
	let usernameInput = getUsernameInput(passwordInput) || {value:null};
	chrome.runtime.sendMessage({action: "submit", username: usernameInput.value, password: passwordInput.value, docuhref: document.location.href }, function(response) {
		console.log(response);
	});
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
			passwordInput.value = message.pass;
			let usernameInput = getUsernameInput(passwordInput);
			if (usernameInput)
				usernameInput.value = message.user;
			else
				console.error("Unable to find usernameInput from passwordInput", passwordInput);
			//passwordInput.form.submit();
			return sendResponse(true);
		}
		return sendResponse(false);
	}
});


/* init */
let passwordInput = getPasswordInput();
if (passwordInput)
{
	passwordInput.form.addEventListener("submit", onLoginformSubmit, false);
}


})();
