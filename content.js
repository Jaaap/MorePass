(function(){

function getButtonText(element)
{
	if (element.nodeName === 'INPUT')
		return element.value;
	return element.textContent.trim();
}

function _getSubmitButtonScore(buttonText)
{
	var score = 0;
	if (['anmelden', 'inloggen', 'login', 'enter', 'log in', 'signin', 'sign in'].indexOf(buttonText) > -1)
		score += 10;
	else if (['reset', 'cancel', 'back', 'abort', 'undo', 'exit', 'empty', 'clear'].indexOf(buttonText) > -1)
		score -= 5;
	return score;
}

function getScore(form)
{
	var score = 0;
	Array.from(form.elements).forEach(function (element)
	{
		if (element.type === 'password')
			score += 5;
		if (element.type === 'submit')
			score += _getSubmitButtonScore(getButtonText(element).toLowerCase());
	});
	return score;
}

function getBestByScore(forms)
{
	if (forms.length > 0)
	{
		return forms.reduce(function (prev, current) {
			return prev.score > current.score ? prev : current;
		});
	}
	return null;
}

function getLoginForm(document)
{
	var forms = [];
	Array.from(document.forms).forEach(function (form) {
		var score = getScore(form);
		if (score > 0)
		{
			forms.push({ score: score, form: form });
		}
	});

	var formInfo = getBestByScore(forms);
	if (!formInfo)
	{
		return null;
	}

	return formInfo.form;
}

function _getPasswordField(form)
{
	return form.querySelector('input[type=password]');
}

function _getLoginField(form, passwordField)
{
	var previousElement = null;
	var loginField = null;
	Array.from(form.querySelectorAll('input')).forEach(function (element) {
		if (element === passwordField && previousElement !== null)
		{
			loginField = previousElement;
		}
		previousElement = element;
	});
	return loginField;
}



/* messaging */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse)
{
	if (message.type === 'hasLoginForm')
	{
		return sendResponse(getLoginForm(window.document) != null);
	}
	else if (message.type === 'fillLoginForm')
	{
		var form = getLoginForm(window.document);
		if (form != null)
		{
			var pwdField = _getPasswordField(form);
			pwdField.value = message.pass;
			var usrField = _getLoginField(form, pwdField);
			usrField.value = message.user;
			form.submit();
			return sendResponse(true);
		}
		return sendResponse(false);
	}
});




})();
