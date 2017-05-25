var expect = chai.expect;
//"hostname","port","pathname","search"]
describe("tlds", function() {
/*
	describe("getTLD", function() {
		it("amazon", function() {
			let base = "amazon";
			expect(tlds.getTLD(base + ".com")).to.equal("com");
			expect(tlds.getTLD(base + ".co.uk")).to.equal("co.uk");
			expect(tlds.getTLD("sub." + base + ".com")).to.equal("com");
			expect(tlds.getTLD("sub." + base + ".co.uk")).to.equal("co.uk");
			expect(tlds.getTLD("subsub.sub." + base + ".com")).to.equal("com");
			expect(tlds.getTLD("subsub.sub." + base + ".co.uk")).to.equal("co.uk");
		});
	});
*/
	describe("getBaseDomain", function() {
		it("amazon", function() {
			let base = "amazon";
			expect(tlds.getBaseDomain(base + ".com")).to.equal(base + ".com");
			expect(tlds.getBaseDomain(base + ".co.uk")).to.equal(base + ".co.uk");
			expect(tlds.getBaseDomain("sub." + base + ".com")).to.equal(base + ".com");
			expect(tlds.getBaseDomain("sub." + base + ".co.uk")).to.equal(base + ".co.uk");
			expect(tlds.getBaseDomain("subsub.sub." + base + ".com")).to.equal(base + ".com");
			expect(tlds.getBaseDomain("subsub.sub." + base + ".co.uk")).to.equal(base + ".co.uk");
			expect(tlds.getBaseDomain(base + ".community")).to.equal(base + ".community");
		});
	});
	describe("getBaseDomainWithoutTLD", function() {
		it("amazon", function() {
			let base = "amazon";
			expect(tlds.getBaseDomainWithoutTLD(base + ".com")).to.equal(base);
			expect(tlds.getBaseDomainWithoutTLD(base + ".co.uk")).to.equal(base);
			expect(tlds.getBaseDomainWithoutTLD("sub." + base + ".com")).to.equal(base);
			expect(tlds.getBaseDomainWithoutTLD("sub." + base + ".co.uk")).to.equal(base);
			expect(tlds.getBaseDomainWithoutTLD("subsub.sub." + base + ".com")).to.equal(base);
			expect(tlds.getBaseDomainWithoutTLD("subsub.sub." + base + ".co.uk")).to.equal(base);
			expect(tlds.getBaseDomainWithoutTLD(base + ".community")).to.equal(base);
		});
	});
});
