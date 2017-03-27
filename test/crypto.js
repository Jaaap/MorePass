var expect = chai.expect;
//"hostname","port","pathname","search"]
describe("crypto", function() {
	describe("encrypt / decrypt", function() {
		it("encrypt then decrypt", function() {
			let text = "daerhrthrthh";
			let pass = "sdfgdsg";
			return encrypt(pass,text).then(function(encrypted){ return decrypt(pass,encrypted); }).then(function(decrypted){ expect(decrypted).to.equal(text); });
		});
		it("encrypt then decrypt text with unicode", function() {
			let text = "daerhrthrthh€uü";
			let pass = "sdfgdsg";
			return encrypt(pass,text).then(function(encrypted){ return decrypt(pass,encrypted); }).then(function(decrypted){ expect(decrypted).to.equal(text); });
		});
		it("encrypt then decrypt password with unicode", function() {
			let text = "sdfgdsg";
			let pass = "daerhrthrthh€uü";
			return encrypt(pass,text).then(function(encrypted){ return decrypt(pass,encrypted); }).then(function(decrypted){ expect(decrypted).to.equal(text); });
		});
		it("encrypt then decrypt with other password", function() {
			let text = "daerhrthrthh";
			let pass1 = "sdfgdsg";
			let pass2 = "qfhdfghdfgh";
			return encrypt(pass1,text).then(function(encrypted){ return decrypt(pass2,encrypted); }).then(function(decrypted){}).catch(function(err){ expect(err.message).to.equal('The operation failed for an operation-specific reason'); expect(err.name).to.equal('OperationError');});
		});
	});
});
