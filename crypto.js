{
	'use strict';

	function createIv()
	{
		return window.crypto.getRandomValues(new Uint8Array(16));
	}

	function encrypt(keyStr, iv, data)
	{
		return importKey(keyStr).then(function(key){


			let encoder = new TextEncoder("utf-8");
			let buf = encoder.encode(data);

			return window.crypto.subtle.encrypt(
				{
					name: "AES-CBC",
					//Don't re-use initialization vectors!
					//Always generate a new iv every time your encrypt!
					iv: iv //window.crypto.getRandomValues(new Uint8Array(16)),
				},
				key, //from generateKey or importKey above
				buf //ArrayBuffer of data you want to encrypt
			)
			.then(function(encrypted){
				//returns an ArrayBuffer containing the encrypted data
				return encrypted;
			})
			.catch(function(err){
				console.error("crypto.subtle.encrypt", err);
			});
		})
		.catch(function(err){
			console.error("importKey", err);
		});
	}

	function decrypt(keyStr, iv, data)
	{
		//let iv = new Uint8Array(data.slice(0, 16));
		return importKey(keyStr).then(function(key){
			return window.crypto.subtle.decrypt(
				{
					name: "AES-CBC",
					iv: iv, //The initialization vector you used to encrypt
				},
				key, //from generateKey or importKey above
				new Uint8Array(data) //ArrayBuffer of the data
			)
			.then(function(decrypted){ //returns an ArrayBuffer containing the decrypted data
				let decoder = new TextDecoder("utf-8");
				return decoder.decode(new Uint8Array(decrypted));
			})
			.catch(function(err){
				console.error("crypto.subtle.decrypt", err);
			});
		})
		.catch(function(err){
			console.error("importKey". err);
		});
	}

	function importKey(keyStr)
	{
		let encoder = new TextEncoder("utf-8");
		let buf = encoder.encode(keyStr);

		return crypto.subtle.digest({name: "SHA-256"}, buf)
			.then(function(result){
				return window.crypto.subtle.importKey(
					"raw",
					result,
					{ name: "AES-CBC" },
					false,
					["encrypt", "decrypt"]
				).then(function(key){
					return key;
				})
				.catch(function(err){
					console.error("crypto.subtle.encrypt", err);
				});
			});
	}

	//export { createIv, encrypt, decrypt };
	window.crypto = { "createIv": createIv, "encrypt": encrypt, "decrypt": decrypt };
}
