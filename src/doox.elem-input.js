;(function ( Doo ) {
    /* jshint laxcomma: true */
    "use strict";

    Doo.define('ElemInput', Doo, {
        value: function ( val ) {
            var elem = this.elem;

            if ( val !== void 0 )
                elem.value = val;

            return elem.value;
        }
    });

})( Doo );
