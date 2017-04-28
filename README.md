# pass.dog
WebExtension for Chrome, Firefox and Edge to manage passwords on multiple devices. You do not have to install other programs (like KeePass requires) and there are no binaries (like .exe files) in the extension.

## What?
pass.dog allows you to manage your passwords, encrypt & export them so you can put it on a USB stick or mail it to yourself and decrypt & import them on another device.

## Secure?
See for yourself. Read the sourcecode (it's just javascript) and report any bugs you find. pass.dog uses the native crypto.subtle.encrypt function in the browser to encrypt and decrypt with AES-GCM.

## Design goals?
* Security over features
	* Features are nice but a password manager should be as simple as possible to reduce bugs and ease review.
* TNO: Trust No One
	* No saving to the cloud
	* No binaries or dependance on closed source libraries
* No automatic form fill without any user interaction
	* pass.dog requires you to click the extension icon (the brown dog) to fill the credentials of the page you are viewing

## Features?
* Allow multiple credential pairs for a single website (like joe@company.com and admin@company.com)
* Allow multiple websites for a single credential pair (like amazon.com, amazon.co.uk, ...)
* Capture new credentials being submitted on webpages. These are stored in an "unsaved" list and must be approved before they can be used.
* Auto-set "keep me logged in" checkboxes. pass.dog searches login forms for checkboxes intended to keep the user logged in and tries to check them.
* HTTP Basic and Digest Authentication

## How to use?
While in development, you can clone or download this WebExtension, then ...

For **Chrome** go to chrome://extensions/, enable "Developer mode" and then "Load unpacked extension...". Point it to the root of the pass.dog folder/dir you just created.

For **Firefox**, go to about:addons, Click on the gear icon (⚙) pulldown, click "Install Addon From File..." and open the pass.dog.xpi file.
