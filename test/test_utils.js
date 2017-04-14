var expect = chai.expect;
chai.config.truncateThreshold = 0;
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
	describe("mergeVaults", function() {
		it("empty to empty", function() {
			let s = [];
			let m = mergeVaults(s,[]);
			expect(m).to.deep.equal([]);
		});
		it("self to self", function() {
			let s = [[[{"hostname":"192.168.0.1"},{"hostname":"abc.com","port":8080,"pathname":"/p/"},{"hostname":"abc.com","port":8081,"pathname":"/p/"},{"hostname":"theregister.co.uk"},{"hostname":"sub.theregister.co.uk"}],"user","pass",1,1234]];
			let m = mergeVaults(s,[[[{"hostname":"192.168.0.1"},{"hostname":"abc.com","port":8080,"pathname":"/p/"},{"hostname":"abc.com","port":8081,"pathname":"/p/"},{"hostname":"theregister.co.uk"},{"hostname":"sub.theregister.co.uk"}],"user","pass",1]]);
			expect(m).to.deep.equal([[[{"hostname":"192.168.0.1"},{"hostname":"abc.com","port":8080,"pathname":"/p/"},{"hostname":"abc.com","port":8081,"pathname":"/p/"},{"hostname":"sub.theregister.co.uk"},{"hostname":"theregister.co.uk"}],"user","pass",1,1234]]);
		});
		it("self to self with path", function() {
			let s = [[[{"hostname":"blah.def.com","pathname":"/blah/nl/management/"}],"support_mycomp","password",1,1491838788182]];
			let m = mergeVaults(s,[[[{"hostname":"blah.def.com","pathname":"blah/nl/management/"}],"support_mycomp","password",1]]);
			expect(m).to.deep.equal([[[{"hostname":"blah.def.com","pathname":"/blah/nl/management/"}],"support_mycomp","password",1,1491838788182]]);
		});
		it("double self to self with path", function() {
			let s = [[[{"hostname":"def.com","pathname":"/amazon/de/management/"}],"support_mycomp","p4ssword",1,1485958313642],[[{"hostname":"blah.def.com","pathname":"/blah/nl/management/"}],"support_mycomp","password",1,1491838788182]];
			let m = mergeVaults(s,[[[{"hostname":"def.com","pathname":"/amazon/de/management/"}],"support_mycomp","p4ssword",1,1485958313642],[[{"hostname":"blah.def.com","pathname":"blah/nl/management/"}],"support_mycomp","password",1]]);
			expect(m).to.deep.equal([[[{"hostname":"blah.def.com","pathname":"/blah/nl/management/"}],"support_mycomp","password",1,1491838788182],[[{"hostname":"def.com","pathname":"/amazon/de/management/"}],"support_mycomp","p4ssword",1,1485958313642]]);
		});
	});
});
