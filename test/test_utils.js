var expect = chai.expect;
//"hostname","port","pathname","search"]
describe("utils", function() {
	describe("mergeSites", function() {
		it("empty to empty", function() {
			let s = [];
			mergeSites(s,[]);
			expect(s).to.deep.equal([]);
		});
		it("empty to filled1", function() {
			let s = [{"hostname":"abc.com"}];
			mergeSites(s,[]);
			expect(s).to.deep.equal([{"hostname":"abc.com"}]);
		});
		it("filled1 to empty", function() {
			let s = [];
			mergeSites(s,[{"hostname":"abc.com"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com"}]);
		});
		it("filled1 to equal filled1", function() {
			let s = [{"hostname":"abc.com"}];
			mergeSites(s,[{"hostname":"abc.com"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com"}]);
		});
		it("filled1 to other filled1", function() {
			let s = [{"hostname":"abc.com"}];
			mergeSites(s,[{"hostname":"xyz.com"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com"},{"hostname":"xyz.com"}]);
		});
		it("filled2 to partly equal filled1", function() {
			let s = [{"hostname":"abc.com"},{"hostname":"xyz.com"}];
			mergeSites(s,[{"hostname":"xyz.com"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com"},{"hostname":"xyz.com"}]);
		});
		it("filled1 to partly equal filled2", function() {
			let s = [{"hostname":"xyz.com"}];
			mergeSites(s,[{"hostname":"abc.com"},{"hostname":"xyz.com"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com"},{"hostname":"xyz.com"}]);
		});
		it("subdomain and domain", function() {
			let s = [{"hostname":"abc.com"}];
			mergeSites(s,[{"hostname":"sub.abc.com"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com"}]);
		});
		it("path to no path", function() {
			let s = [{"hostname":"abc.com","pathname":"def/"}];
			mergeSites(s,[{"hostname":"abc.com"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com"}]);
		});
		it("port to no port", function() {
			let s = [{"hostname":"abc.com","port":8080}];
			mergeSites(s,[{"hostname":"abc.com"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com"}]);
		});
	});
});
