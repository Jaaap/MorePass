var expect = chai.expect;
//"hostname","port","pathname","search"]
describe("utils", function() {
	describe("mergeSiteArrays", function() {
		it("empty to empty", function() {
			let s = [];
			mergeSiteArrays(s,[]);
			expect(s).to.deep.equal([]);
		});
		it("empty to filled1", function() {
			let s = [{"hostname":"abc.com"}];
			mergeSiteArrays(s,[]);
			expect(s).to.deep.equal([{"hostname":"abc.com"}]);
		});
		it("filled1 to empty", function() {
			let s = [];
			mergeSiteArrays(s,[{"hostname":"abc.com"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com"}]);
		});
		it("filled1 to equal filled1", function() {
			let s = [{"hostname":"abc.com"}];
			mergeSiteArrays(s,[{"hostname":"abc.com"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com"}]);
		});
		it("filled1 to other filled1", function() {
			let s = [{"hostname":"abc.com"}];
			mergeSiteArrays(s,[{"hostname":"xyz.com"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com"},{"hostname":"xyz.com"}]);
		});
		it("filled2 to partly equal filled1", function() {
			let s = [{"hostname":"abc.com"},{"hostname":"xyz.com"}];
			mergeSiteArrays(s,[{"hostname":"xyz.com"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com"},{"hostname":"xyz.com"}]);
		});
		it("filled1 to partly equal filled2", function() {
			let s = [{"hostname":"xyz.com"}];
			mergeSiteArrays(s,[{"hostname":"abc.com"},{"hostname":"xyz.com"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com"},{"hostname":"xyz.com"}]);
		});
		it("subdomain and domain", function() {
			let s = [{"hostname":"abc.com"}];
			mergeSiteArrays(s,[{"hostname":"sub.abc.com"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com"}]);
		});
		it("path to no path", function() {
			let s = [{"hostname":"abc.com","pathname":"def/"}];
			mergeSiteArrays(s,[{"hostname":"abc.com"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com"}]);
		});
		it("port to no port", function() {
			let s = [{"hostname":"abc.com","port":8080}];
			mergeSiteArrays(s,[{"hostname":"abc.com"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com"}]);
		});
		it("port and path to port and other path", function() {
			let s = [{"hostname":"abc.com","port":8080}];
			mergeSiteArrays(s,[{"hostname":"abc.com","port":8080,"pathname":"/p/"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com","port":8080}]);
		});
		it("port and path to other port and same path", function() {
			let s = [{"hostname":"abc.com","port":8081,"pathname":"/p/"}];
			mergeSiteArrays(s,[{"hostname":"abc.com","port":8080,"pathname":"/p/"}]);
			expect(s).to.deep.equal([{"hostname":"abc.com","port":8080,"pathname":"/p/"},{"hostname":"abc.com","port":8081,"pathname":"/p/"}]);
		});
	});
});
