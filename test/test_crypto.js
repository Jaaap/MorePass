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
			let text = "dae⌘rh⎀rthrthh€uü";
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
			return encrypt(pass1,text).then(function(encrypted){ return decrypt(pass2,encrypted); }).then(function(decrypted){}).catch(function(err){
				expect(err.message).to.equal('The operation failed for an operation-specific reason');
				expect(err.name).to.equal('OperationError');
			});
		});
		it("encrypt, shorten iv then decrypt", function() {
			let text = "daerhrthrthh";
			let pass = "sdfgdsg";
			return encrypt(pass,text).then(function(encrypted){ return decrypt(pass,encrypted.substr(1)); }).then(function(decrypted){ expect().fail('exception did not appear to be thrown'); }).catch(function(err){
				expect(err.message).to.equal('IV length should be 24 but is 23');
				expect(err.name).to.equal('UnpackError');
			});
		});
		it("encrypt, modify iv then decrypt", function() {
			let text = "daerhrthrthh";
			let pass = "sdfgdsg";
			return encrypt(pass,text).then(function(encrypted){ return decrypt(pass,"0123456789"+encrypted.substr(10)); }).then(function(decrypted){ expect().fail('exception did not appear to be thrown'); }).catch(function(err){
				expect(err.message).to.equal('The operation failed for an operation-specific reason');
				expect(err.name).to.equal('OperationError');
			});
		});
	});
});
