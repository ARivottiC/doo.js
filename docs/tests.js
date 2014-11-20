mocha.setup('bdd');
var expect = chai.expect;

describe('App', function(){

    it('isa Doo', function () {
        expect(app).to.be.an.instanceof(Doo);
    });

    it('root element is BODY', function () {
        expect(app.elem.tagName).to.equal("BODY");
    });

    it('body is visible', function () {
        expect(app.hidden()).to.be.false;
        app.hide();
        expect(app.hidden()).to.be.true;
        app.show();
        expect(app.hidden()).to.be.false;
    });


});

mocha.checkLeaks();
mocha.run();
