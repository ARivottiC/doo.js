describe('data-doo', function(){

    it('empty', function () {
        var obj = app[0];

        expect( obj ).to.be.an.instanceof( Doo );
    });

    it('as $...', function () {
        var line = app[1],
            sep  = app[2];

        expect( app.$line ).to.equal( line );
        expect( app.$sep  ).to.equal( sep  );
    });

    it('is #...', function () {
        var obj = app[3];
        expect( obj ).to.have.property( 'isLine', true );
        expect( obj ).to.have.property( 'isSep' , true );
    });

    it('in @...', function () {
        var line = app[4],
            sep  = app[5];

        expect( line.group ).to.have.property( 'name', 'line' );
        expect( sep.group  ).to.have.property( 'name', 'sep'  );
    });

    it('use &...', function () {
        var line = app[6],
            sep  = app[7];

        expect( line.template ).to.have.property( 'name', 'line' );
        expect( sep.template  ).to.have.property( 'name', 'sep'  );
    });

    it('Class', function () {
        var obj = app[8];

        expect( obj ).to.be.an.instanceof( TestDataDoo );
    });


    it('{ }', function () {
        var obj = app[8];

        expect( obj ).to.have.property( '$$line', '1' );
        expect( obj ).to.have.property( '$$sep' , '2' );
    });
});
