//{
	'use strict';

	function createIv()
	{
		return crypto.getRandomValues(new Uint8Array(16));
	}

	function encrypt(keyStr, data) //returns iv + "\n\n" + encryptedVault
	{
		return importKey(keyStr, "encrypt").then(key => {
			let iv = createIv();
			let encoder = new TextEncoder("utf-8");
			let buf = encoder.encode(data);

			return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, buf).then(encrypted => {
				return Uint8ArrayToBase64(iv) + "\n\n" + Uint8ArrayToBase64(new Uint8Array(encrypted));
			});
		});
	}

	function decrypt(keyStr, ivAndData)
	{
		//data is base64 iv + "\n\n" + base64 encrypted vault
		let [b64Iv, b64Data] = ivAndData.split("\n\n");
		let iv = Base64ToUint8Array(b64Iv);
		let data = Base64ToUint8Array(b64Data);
		return importKey(keyStr, "decrypt").then(key => {
			return crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, data).then(decrypted => {
				let decoder = new TextDecoder("utf-8");
				return decoder.decode(new Uint8Array(decrypted));
			});
		});
	}

	function importKey(keyStr, mode)
	{
		let encoder = new TextEncoder("utf-8");
		let buf = encoder.encode(keyStr);
		return crypto.subtle.digest({ name: "SHA-256" }, buf).then(result => {
			return crypto.subtle.importKey("raw", result, { name: "AES-GCM" }, false, [mode]);
		});
	}

	function Uint8ArrayToBase64(ui8a) {
		return btoa(Array.prototype.map.call(ui8a, x => String.fromCharCode(x)).join(''));
	}
	function Base64ToUint8Array(b64) {
		let binstr = atob(b64);
		let buf = new Uint8Array(binstr.length);
		Array.prototype.forEach.call(binstr, (ch, i) => { buf[i] = ch.charCodeAt(0); });
		return buf;
	}
	//export { encrypt, decrypt };
//}
