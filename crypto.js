{
	'use strict';

	function createIv()
	{
		return window.crypto.getRandomValues(new Uint8Array(16));
	}

	function encrypt(keyStr, data) //returns iv + "\n\n" + encryptedVault
	{
		return importKey(keyStr).then(function(key){


			let iv = createIv();
			let encoder = new TextEncoder("utf-8");
			let buf = encoder.encode(data);

			return window.crypto.subtle.encrypt(
				{
					name: "AES-CBC",
					//Don't re-use initialization vectors!
					//Always generate a new iv every time you encrypt!
					iv: iv //window.crypto.getRandomValues(new Uint8Array(16)),
				},
				key, //from generateKey or importKey above
				buf //ArrayBuffer of data you want to encrypt
			)
			.then(function(encrypted){
				//returns an ArrayBuffer containing the encrypted data
				//let decoder = new TextDecoder("utf-8");
				//return [Uint8ArrayToBase64(iv), decoder.decode(new Uint8Array(encrypted))];
				return Uint8ArrayToBase64(iv) + "\n\n" + Uint8ArrayToBase64(new Uint8Array(encrypted));
			})
			.catch(function(err){
				console.error("crypto.subtle.encrypt", err);
			});
		})
		.catch(function(err){
			console.error("importKey", err);
		});
	}

	function decrypt(keyStr, ivAndData)
	{
		//data is base64 iv + "\n\n" + base64 encrypted vault
		let [b64Iv, b64Data] = ivAndData.split("\n\n");
		let iv = Base64ToUint8Array(b64Iv);
		let data = Base64ToUint8Array(b64Data);
		return importKey(keyStr).then(function(key){
			return crypto.subtle.decrypt({ name: "AES-CBC", iv: iv }, key, data).then(function(decrypted){ //returns an ArrayBuffer containing the decrypted data
					let decoder = new TextDecoder("utf-8");
					return decoder.decode(new Uint8Array(decrypted));
				}).catch(function(err){
					console.error("crypto.subtle.decrypt", err);
				});
			}).catch(function(err){
				console.error("importKey", err);
			});
	}

	function sign(keyStr, data)
	{
		return importKey(keyStr).then(function(key){
			let encoder = new TextEncoder("utf-8");
			let buf = encoder.encode(data);
			return crypto.subtle.sign({ name: "HMAC" }, key, buf).then(function(signature){ //returns an ArrayBuffer containing the signature
					let decoder = new TextDecoder("utf-8");
					return decoder.decode(new Uint8Array(signature));
				}).catch(function(err){
					console.error("crypto.subtle.sign". err);
				});
			}).catch(function(err){
				console.error("importKey", err);
			});
	}

	function verify(keyStr, signature, data)
	{
		return importKey(keyStr).then(function(key){
			let encoder = new TextEncoder("utf-8");
			let signatureBuf = encoder.encode(signature);
			let dataBuf = encoder.encode(data);
			return window.crypto.subtle.verify({ name: "HMAC" }, key, signatureBuf, dataBuf).catch(function(err){
				console.error("crypto.subtle.verify". err);
			});
		});
	}

	function importKey(keyStr)
	{
		let encoder = new TextEncoder("utf-8");
		let buf = encoder.encode(keyStr);

		return crypto.subtle.digest({name: "SHA-256"}, buf).then(function(result){
				return window.crypto.subtle.importKey("raw", result, { name: "AES-CBC" }, false, ["encrypt", "decrypt"]).catch(function(err){
					console.error("crypto.subtle.importKey", err);
				});
			}).catch(function(err){
				console.error("crypto.subtle.digest", err);
			});
	}

	function Uint8ArrayToBase64(ui8a) {
		return btoa(Array.prototype.map.call(ui8a, function(x) { return String.fromCharCode(x); }).join(''));
	}
	function Base64ToUint8Array(b64) {
		var binstr = atob(b64);
		var buf = new Uint8Array(binstr.length);
		Array.prototype.forEach.call(binstr, function (ch, i) {
			buf[i] = ch.charCodeAt(0);
		});
		return buf;
	}
	//export { encrypt, decrypt };
	window.crypto = { "encrypt": encrypt, "decrypt": decrypt, "sign": sign, "verify": verify };
}
