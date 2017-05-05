//{
	'use strict';
	let cryptoVersion = 'dog.pass.crypto.v1';

	function createIv()
	{
		return crypto.getRandomValues(new Uint8Array(16));
	}

	function encrypt(keyStr, data) //returns cryptoVersion + "\n" + iv + "\n" + encryptedVault
	{
		return importKey(keyStr, "encrypt").then(key => {
			let iv = createIv();
			let encoder = new TextEncoder("utf-8");
			let buf = encoder.encode(data);

			return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, buf).then(encrypted => {
				return cryptoVersion + "\n" + Uint8ArrayToBase64(iv) + "\n" + Uint8ArrayToBase64(new Uint8Array(encrypted));
			});
		});
	}

	function decrypt(keyStr, ivAndData)
	{
		//data is cryptoVersion + "\n" + base64 iv + "\n" + base64 encrypted vault
		let [version,b64Iv, b64Data] = ivAndData.split("\n");
		if (keyStr)
		{
			if (version == cryptoVersion)
			{
				if (b64Iv)
				{
					if (b64Iv.length === 24)
					{
						let iv = Base64ToUint8Array(b64Iv);
						if (iv.length === 16)
						{
							if (b64Data)
							{
								let data = Base64ToUint8Array(b64Data);
								return importKey(keyStr, "decrypt").then(key => {
									return crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, data).then(decrypted => {
										let decoder = new TextDecoder("utf-8");
										return decoder.decode(new Uint8Array(decrypted));
									});
								});
							}
							else
								throw({"name":"MissingdataError","message":"Data not found. The encrypted vault must contain data on the third line"});
						}
						else
							throw({"name":"IvlengthError","message":"Decoded IV length should be 16 but is " + iv.length});
					}
					else
						throw({"name":"IvlengthError","message":"IV length should be 24 but is " + b64Iv.length});
				}
				else
					throw({"name":"MissingivError","message":"IV not found. The encrypted vault must contain an IV on the second line"});
			}
			else
				throw({"name":"CryptoversionError","message":"Version string should be " + cryptoVersion});
		}
		else
			throw({"name":"MissingpassphraseError","message":"Passphrase cannot be empty"});
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
