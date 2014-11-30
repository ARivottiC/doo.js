;(function ( Doo ) {
    /* jshint laxcomma: true */
    "use strict";

    var define = Doo.define;

    define('AppButton', {
        constructor: function () {
            Doo.apply( this, arguments );
            this.on( 'click' );
        }
    });

    define('AppContext', {
        isContext: true
      , update: function ( val ) {
            if ( Array.isArray( val ) )
                return this.$container.push().update( val );
        }

    });

    define('AppItem', {
        group: 'items'
      , isContext: true
      , update: function ( val ) {
            this.$value.value( val );
            this.$form.hide();
            this.$view.show();

            return this;
        }
    });

    define('AppForm', {
        constructor: function () {
            Doo.apply( this, arguments );
            this.on( 'submit');
        }
      , isContext: true
      , submit: function () {
            var text  = this.$text
              , value = text.value();

            if ( value ) {
                // context.update knows what to do with this
                this.context.update([value]);
                text.value( null );
            } else
                this.$error.show();

            return false;
        }
    });

    define('AppError', {
        constructor: function ( elem, parent, args ) {
            this.name = 'error';
            this.$delay = args.$delay || 2000;
            Doo.apply( this, arguments );
        }
      , hide: function () {
            delete this.$timeout;
            return Doo.prototype.hide.call( this );
        }
      , show: function () {
            var obj = this;

            Doo.prototype.show.call( obj );
            clearTimeout( obj.$timeout );

            obj.$timeout = setTimeout(
                function () { obj.hide(); }, obj.$delay
            );

            return obj;
        }
    });

    define('AppEdit', AppButton, {
        click: function () {
            var context = this.context;
            context.$view.hide();
            context.$form.update({ text: context.$value.value() } ).show();
            return false;
        }
    });

    define('AppDel', AppButton, {
        click: function () {
            var item = this.context;
            item.context.pop( item );
            return false;
        }
    });

    define('AppSel', {
        constructor: function () {
            Doo.apply( this, arguments );
            this.on( 'click', this.doo );
        }
      , doo: function () {
            if ( ! this.dooing() ) {
                var item = this.context;
                item.group.dooing().exec('doont');
                return AppButton.prototype.doo.call( item );
            }
            return this;
        }
    });

    function move( obj, method ) {
        var sibling = obj[ method ]();

        if ( sibling )
            obj.swap( sibling );

        return false;
    }

    define('AppUp', AppButton, {
        click: function () { return move( this.context, 'prev'); }
    });

    define('AppDown', AppButton, {
        click: function () { return move( this.context, 'next'); }
    });

})( Doo );
