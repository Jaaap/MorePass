# MorePass
WebExtension for Chrome, Firefox and Edge to manage passwords on multiple devices. You do not have to install other programs (like KeePass requires) and there are no binaries (like .exe files) in the extension.

## What?
MorePass allows you to manage your passwords, encrypt them locally and store that encrypted vault on a server (it's not a cloud, just a server).

## Secure?
See for yourself. Read the sourcecode (it's just javascript) and report any bugs you find. MorePass uses the native crypto.subtle.encrypt function in the browser to encrypt and decrypt with AES-CBC.

## Why?
Because LastPass is starting to fustrate me. Do you know they can now recover your stuff when you lost your master passphrase? Also the interface just bugs me.

## How to use?
While in development, you can clone or download this WebExtension, then ...

For **Chrome** go to chrome://extensions/, enable "Developer mode" and then "Load unpacked extension...". Point it to the root of the MorePass folder/dir you just created.

For **Firefox**, go to about:debugging, check the "Enable add-on debugging" box and click "Load Temporary Addon". Select the manifest.json file and open it.
