describe('new', function(){

    it('app isA Doo', function () {
        expect( app ).to.be.an.instanceof( Doo );
    });

    it('root element is BODY', function () {
        expect( app.elem.tagName ).to.equal( 'BODY' );
    });
});
