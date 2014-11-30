;(function ( window ) {
    /* jshint laxcomma:true,laxbreak:true,validthis:true */
    "use strict";

    var
        /*
         *  Aliases
         */
        arrayProto = Array.prototype
      , filter     = arrayProto.filter
      , forEach    = arrayProto.forEach
      , indexOf    = arrayProto.indexOf
      , map        = arrayProto.map
      , push       = arrayProto.push
      , reduce     = arrayProto.reduce
      , shift      = arrayProto.shift
      , slice      = arrayProto.slice
      , splice     = arrayProto.splice

        /*
         *  Internal objects, variables
         */
      , oGroup    = {}
      , oTemplate = {}
      , oListener = {}
      , guid      = 1

        /*
         * Regular Expressions
         */
      , rComa    = /\s*,\s*/
      , rDColumn = /\s*:\s*/
      , rIs      = /(?:^|\s+)(?:is\s+)?\#(\w+)/g
      , rIn      = /(?:^|\s+)(?:in\s+)?\@(\w+)/g
      , rAs      = /(?:^|\s+)(?:as\s+)?\$(\w+)/g
      , rUse     = /(?:^|\s+)(?:use\s+)?\&(\w+)/g
      , rArgs    = /(?:^|\s+)\{\s*([^\}]+)\s*}/g
      ;

    /*
     *  Generic auxiliar Functions
     */

    //
    function elemHasParent( elem ) {
        return elem.parentNode && elem.parentElement;
    }

    // Check if a given object has a given key
    function has( obj, key ) {
        return Object.prototype.hasOwnProperty.call( obj, key );
    }

    // Check if one object is an instance of another
    function isA( obj1, obj2 ) { return obj1 instanceof obj2; }

    // Check if a given node is a comment
    function isComment( node ) { return node.nodeType === 8; }

    // Check if a given value is a function
    function isFn( val ) { return typeof val === 'function'; }

    // Check if a given value is null
    function isNull( val ) { return val === null; }

    // Check if a given value is an object
    function isObj( val ) { return val === Object( val ); }

    // Check if a given value is undefined
    function isUndef( val ) { return val === void 0; }

    // Merge 2 or more given objects
    function merge( /* obj1, obj2[, obj3]*/ ) {
        var merged = shift.call( arguments ) || {};

        forEach.call( arguments, mergeWithObj, merged );

        return merged;
    }

    function mergeWithObj( obj ) {
        // TODO: concat Arrays
        if ( obj )
            for ( var key in obj )
                this[ key ] = obj[ key ];
    }

    // In a given object, for each key given, create a nested path.
    //  If the key is not a String, define as value and finish
    function pathToObj( /* key1, key2, ..., value*/ ) {
        return reduce.call( arguments, function( val, key, i, obj ) {
            var nextI = i + 1;

            if ( isObj( key ) ) {
                splice.call( obj, nextI );
                return val;
            }

            if ( isUndef( val[ key ] ) )
                val[ key ] = isObj( obj[ nextI ] ) ? obj[ nextI ] : {};

            return val[ key ];
        }, shift.call( arguments ) );
    }

    // make the first position of a string uppercase
    function ucFirst( str ) {
        return str.replace(
                /^[a-z]/, function ( l ) { return l.toUpperCase(); }
            );
    }

    /*
     *  Auxiliar Methods
     */

    function popChildOrLastChild( child ) {
        var obj = this;
        var index = isUndef( child )
                  ? obj[ obj.length - 1 ]
                  : indexOf.call( obj, child );

        if ( index === -1 )
            return void 0;

        return splice.call( obj, index, 1 ).pop();
    }

    /*
     * Doo auxiliar Functions
     */

    // Inflate doo argument as an object
    function attributeValueToObject( val ) {
        var obj = { 'is': [] };

        val = val.replace( rArgs, function() {
            arguments[1].split( rComa ).forEach( argsStringToObject, obj );
            return '';
        });
        val = val.replace( rIs  , function() { obj.is.push( arguments[1] ) ; return ''; } );
        val = val.replace( rIn  , function() { obj.group     = arguments[1]; return ''; } );
        val = val.replace( rAs  , function() { obj.name      = arguments[1]; return ''; } );
        val = val.replace( rUse , function() { obj.template  = arguments[1]; return ''; } );

        if ( val.length ) {
            var Class = window[ val ];

            if ( Class && Class.prototype instanceof Doo )  // it's a Doo Class
                obj['class'] = val;
            else                                            // it's your fault
                throw new Error('something is wrong here: ' + val + '!');
        }

        return obj;
    }

    function argsStringToObject( value ) {
        var values = value.split( rDColumn );
        this[ values[0] ] = values[1] ;
    }

    /*
     * Object functions
     */

    // add a class to object's element.
    function addClass( obj, val ) {
        obj.elem.classList.add( val );
        return obj;
    }

    // attach a child to the object
    function dooChild( parent, elem ) {
        // if element is not a node, it is a string or number. Get the
        //  corresponding template
        //  TODO: must be able to support multiple childs inside a template
        //  TODO: support global templates
        if ( ! elem.nodeType )
            elem = document.importNode(
                    parent.template[ elem ].content, true
                ).children[0];

        // Merge arg with attr configuration
        var arg = merge(
                { 'class': Doo.defaultClass }
                , attributeValueToObject( elem.getAttribute( Doo.defaultAttr ) )
            );

        var Constructor = window[ arg['class'] ];

        if ( isUndef( Constructor ) )
            throw new Error(
                    "can't use "
                  + arg['class']
                  + ", maybe you forgot to set it?"
                );

        var child = new Constructor( elem, parent, arg )
            , name  = child.name
            ;

        if ( ! isA( child, Doo ) )
            throw new Error("not a Doo Object!");

        // if a name was given, used as a parent's method
        //  TODO: check if already exists
        if ( ! isUndef( name )  )
            child.context[ '$' + name ] = child;

        return child;
    }

    // check if object's element has a given class set
    function hasClass( obj, val ) {
        return obj.elem.classList.contains( val );
    }

    // remove object's element class
    function remClass( obj, val ) {
        obj.elem.classList.remove( val );
        return obj;
    }

    /*
     * DooCollection
     *  Array object intended to store a collection of Doo objects with
     *  methods that affects all children
     */
    function DooCollection() { push.apply( this, arguments ); }

    var dooCollectionProto
        = DooCollection.prototype = Object.create( arrayProto );

    /*
     * DooCollection Object Methods
     */

    // execute a given method in all children
    function dooCollectionMethodExec( fn ) {
        var obj = this
          , args = splice.call( arguments, 1 )
          ;

        obj.forEach( function ( child ) {
            child[ fn ].apply( child, args );
        });

        return obj;
    }

    // returns a DooCollection (see Array.filter)
    function dooCollectionMethodFilter() {
        return dooCollectionMethodSlice.apply(
            filter.apply( this, arguments )
        );
    }

    // returns all hidden children
    function dooCollectionMethodHidden() {
        return this.filter( dooMethodHidden );
    }

    // returns all dooing children
    function dooCollectionMethodDooing() {
        return this.filter( dooMethodDooing );
    }

    // returns a DooCollection (see Array.map)
    function dooCollectionMethodMap() {
        return dooCollectionMethodSlice.apply(
            map.apply( this, arguments )
        );
    }

    // returns a DooCollection (see Array.slice)
    function dooCollectionMethodSlice() {
        var obj = new DooCollection();
        push.apply( obj, slice.apply( this, arguments ) );
        return obj;
    }

    // returns a DooCollection (see Array.splice)
    function dooCollectionMethodSplice() {
        return dooCollectionMethodSlice.apply(
            splice.apply( this, arguments )
        );
    }

    merge( dooCollectionProto, {
        exec  : dooCollectionMethodExec
      , filter: dooCollectionMethodFilter
      , hidden: dooCollectionMethodHidden
      , dooing: dooCollectionMethodDooing
      , map   : dooCollectionMethodMap
      , slice : dooCollectionMethodSlice
      , splice: dooCollectionMethodSplice
      , pop   : popChildOrLastChild
    });

    /*
     * DooGroupCollection
     */
    function DooGroupCollection() { DooCollection.apply( this, arguments ); }
    var dooGroupCollectionProto
        = DooGroupCollection.prototype
            = Object.create( dooCollectionProto );
    dooGroupCollectionProto.byName = oGroup;

    /*
     * DooTemplateCollection
     */
    function DooTemplateCollection() { push.apply( this, arguments ); }
    var dooTemplateCollectionProto
        = DooTemplateCollection.prototype
            = Object.create( arrayProto );
    dooTemplateCollectionProto.byName = oTemplate;

    /*
     * Doo
     */
    function Doo( elem, parent, args ) {
        args = args || {};

        var obj = this;
        obj.elem = elem;
        elem.dooObject = obj;

        // Guid
        obj.guid = guid++;

        dooObjectSetGroupProp( obj, args.group || obj.group );

        // TODO: dooObjectSetTemplateProp
        var template = new DooTemplateCollection();
        var defaultTemplate = args.template || obj.template;
        if ( defaultTemplate )
            template.push( oTemplate[ defaultTemplate ] );
        obj.template = template;

        // Get the object name (for path relation) and fix the name
        //  if needed
        var name = args.name
                || elem.getAttribute('id')
                || elem.getAttribute('name');

        if ( name )
            obj.name = name;

        dooObjectSetIsProp( obj, args.is || [] );

        if ( isObj( parent ) ) {
            obj.root    = parent.root || parent;
            obj.context = parent.isContext ? parent : parent.context;
            obj.parent  = parent;
        }
        else
            obj.root = obj.context = obj; // TODO: is this really needed???

        dooObjectAttachElem( obj, elem );

        return obj;
    }

    /*
     * Doo Class Functions
     */
    function dooDefineClassFunction( name ) {
        var impClasses = slice.call( arguments, 1 )
          , override   = ( impClasses.pop() || {} ) // TODO: avoind creating unecessary object
          ;

        var ExtClass = impClasses.length > 0 ?
                       impClasses.shift() : window[ Doo.defaultClass ];

        /* jshint -W054 */
        var Class = (
            new Function(
                "c",
                'return function '
                    + name
                    + '(e,p,a) { c.call(this,e,p,a) }'
            )
        )( override.constructor === Object ? ExtClass : override.constructor );

        Class.prototype = Object.create( ExtClass.prototype );

        // TODO: re-avaluate this
        var length = impClasses.length;
        for ( var i = 0; i < length - 1; i++ ) {
            var ImpClass = impClasses[ i ];
            merge( Class.prototype, ImpClass.prototype );
        }

        merge( Class.prototype, override );

        /* jshint boss: true */
        return ( window[ name ] = Class );
    }

    /*
     * Doo Object auxiliar Functions
     */

    // search children elements, with doo attribute set, and attach
    function dooObjectAttachElem( obj, elem ) {
        forEach.call( elem.children, dooObjectAttachElemChildren, obj );
    }

    function dooObjectAttachElemChildren( child ) {
        var obj = this;

        // IE8 wrongly considers comment nodes as children
        if ( isComment( child ) )
            return ;

        if ( ! isNull( child.getAttribute( Doo.defaultAttr ) ) )
            obj.push( child );
        else if ( child.nodeName === 'TEMPLATE' )
            dooObjectAttachTemplate( obj, child );
        else
            dooObjectAttachElem( obj, child );
    }

    // associate a template to an object
    function dooObjectAttachTemplate( obj, elem ) {
        var name = elem.getAttribute('id');
        if ( name )
            oTemplate[ name ] = elem;

        obj.template.push( elem );

        // TODO: re-evaluate, not sure it's a good ideia
        elem.parentNode.removeChild( elem );
    }

    function dooObjectSetGroupProp( obj, group ) {
        obj.group = group
                ? pathToObj( oGroup, group, new DooGroupCollection() )
                : new DooGroupCollection();
        obj.group.push( obj );
    }

    // add is* methods based on type
    //  TODO: re-evaluate
    function dooObjectSetIsProp( obj, arg ) {
        arg.forEach(
                function ( key ) { this[ 'is' + ucFirst( key ) ] = true; }
              , obj
            );
    }

    /*
     * Doo Object Methods
     */

    // cleans up all the references and support data related to this
    //  object.
    function dooMethodDestructor( keepElem ) {
        var obj = this;

        // destroy the objects but keep the elements
        while ( obj.length )
            popChildOrLastChild.call( obj ).destructor( true );

        // remove me from group
        obj.group.pop( obj );
        obj.group = null;

        // destroy any templates
        while ( obj.template.length )
            obj.template.pop();
        obj.template = null;

        // remove o from the dom
        var elem = obj.elem;
        obj.elem = null;
        elem.dooObject = null;
        if ( !keepElem )
            elem.parentNode.removeChild( elem );

        obj.context = null;
        obj.parent  = null;
        obj.root    = null;

        return elem;
    }

    /* doo, doont, dooing */
    function dooMethodDoo()   { return addClass( this, 'dooing'); }
    function dooMethodDoont() { return remClass( this, 'dooing'); }
    function dooMethodDooing( /* FOR INTERNAL USE*/ obj ) {
        return hasClass( obj || this, 'dooing' );
    }

    /* hide, hidden, show */
    function dooMethodHide()   { return addClass(this, 'hidden' ); }
    function dooMethodHidden() { return hasClass(this, 'hidden' ); }
    function dooMethodShow( /* FOR INTERNAL USE */ obj ) {
        return remClass( obj || this, 'hidden' );
    }

    function dooMethodNext() {
        var obj    = this;
        var parent = obj.parent;

        // TODO: maybe return a DooCollection?
        if ( parent ) {
            var index = indexOf.call( parent, obj );
            if ( index < parent.length - 1 )
                return parent[ index + 1 ];
        }

        return false;
    }

    function dooMethodPop( child ) {
        var orphan = popChildOrLastChild.call( this, child );

        return orphan ? orphan.destructor() : null;
    }

    function dooMethodPrev() {
        var obj    = this;
        var parent = obj.parent;

        // TODO: maybe return a DooCollection?
        if ( parent ) {

            var index = indexOf.call( parent, obj );
            if ( index > 0 )
                return parent[ index - 1 ];
        }

        return false;
    }

    function dooMethodPush( elem ) {
        var obj        = this
          , child      = dooChild( obj, elem || 0 )
          , childElem  = child.elem
          , parentElem = obj.elem
          ;

        if ( !elemHasParent( childElem ) )
            parentElem.appendChild( childElem );

        push.call( obj, child );

        return child;
    }

    function dooMethodUnshift( elem ) {
        var obj = this;

        if ( !object.length ) // allways a push if empty
            return obj.push( elem );

        var child      = dooChild( obj, elem || 0 )
          , childElem  = child.elem
          , parentElem = obj.elem
          ;

        if ( !elemHasParent( childElem ) )
            parentElem.insertBefore( childElem, obj[0].elem );

        splice.call( obj, index, 0, child );

        return child;
    }

    function dooMethodShift() {
        var obj   = this
          , child = obj[0];

        return child ? obj.pop( child ) : null;
    }

    function dooMethodSwap( sibling ) {
        var parent = this.parent;

        if ( ! parent )
            return ;

        var index1 = indexOf.call( parent, this )
            , index2 = indexOf.call( parent, sibling )
            ;

        if ( index2 < 0 )
            return false; // TODO: maybe not the best solution...

        parent[ index1 ] = splice.call(
                parent, index2, 1, parent[ index1 ]
            ).pop();

        var a = this.elem;
        var b = sibling.elem;
        var t = a.parentNode.insertBefore(
                document.createTextNode(''), a
            );

        b.parentNode.insertBefore(a, b);
        t.parentNode.insertBefore(b, t);
        t.parentNode.removeChild(t);

        return [ index1, index2 ];
    }

    function dooMethodToString() { return '[object Doo]'; }

    function dooMethodUpdate( val ) {
        var obj = this;

        if ( Array.isArray( val ) )
            forEach.call( val, function ( value, index ) {
                var child = obj[ index ];

                if ( child )
                    child.update( value );
            });
        else if ( isObj( val ) ) // TODO: probably better with Object.keys
            for ( var key in val ) {
                var value  = val[ key ]
                  , child  = obj[ key ]
                  , $key   = '$' + key
                  , $child = obj[ $key ]
                  ;

                if ( isFn( child ) )
                    ; // do nothing
                else if ( has( obj, $key ) && isA( $child, Doo ) )
                    $child.update( value );
                else if ( has( obj, key ) && isA( child, Doo ) )
                    child.update( value );
                else if ( has( obj, key ) )
                    obj[ key ] = value;
            }
        else
            obj.value( val );

        return obj;
    }

    // get the content of the object. Set the content if a value is given
    function dooMethodValue( val ) {
        var obj  = this
          , elem = obj.elem
          ;

        if ( isUndef( val ) )
            return elem.innerHTML;

        // Setting value will change innerHTML, destroy all children
        while ( obj.length )
            obj.pop();

        /* jshint boss: true */
        return ( elem.innerHTML = val );
    }

    function dooMethodNo( event, fn, capture ) {
        // TODO: capture support?
        var obj = this;

        fn = fn || obj[ event ];

        var listener = pathToObj(
                oListener, obj.guid, event, fn.guid
            );

        return obj.elem.removeEventListener( event, listener, capture );
    }

    function dooMethodOn( event, fn, capture ) {
        // TODO: capture support?
        var obj = this;

        // no function given, assume object's method with event name
        fn = fn || obj[ event ];

        // add a unique id to the function to be easyly indexed
        fn.guid = fn.guid || guid++;

        // get the listener for this object ( set if not defined )
        var listener = pathToObj(
            oListener, obj.guid, event, fn.guid, function ( e ) {
                var r = fn.call( obj, e );
                if ( r === false ) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                return r;
            }
        );

        return obj.elem.addEventListener( event, listener, capture );
    }

    Doo.prototype = Object.create( arrayProto );
    merge( Doo.prototype, {
        destructor: dooMethodDestructor
      , doo       : dooMethodDoo
      , dooing    : dooMethodDooing
      , doont     : dooMethodDoont
      , filter    : dooCollectionMethodFilter
      , hidden    : dooMethodHidden
      , hide      : dooMethodHide
      , length    : 0
      , map       : dooCollectionMethodMap
      , next      : dooMethodNext
      , no        : dooMethodNo
      , on        : dooMethodOn
      , pop       : dooMethodPop
      , prev      : dooMethodPrev
      , push      : dooMethodPush
      , shift     : dooMethodShift
      , show      : dooMethodShow
      , slice     : dooCollectionMethodSlice
      , splice    : dooCollectionMethodSplice
      , swap      : dooMethodSwap
      , toString  : dooMethodToString
      , unshift   : dooMethodUnshift
      , update    : dooMethodUpdate
      , value     : dooMethodValue
    });

    Doo.VERSION = '0.0.1';

    // Static object functions/methods
    Doo.define = dooDefineClassFunction;

    /*
     * Attributes intended to be override
     */
      // default attribute name
    Doo.defaultAttr = 'data-doo';

    // default class name
    Doo.defaultClass = 'Doo';

    // Expose Classes
    window.Doo                   = Doo;
    window.DooCollection         = DooCollection;
    window.DooGroupCollection    = DooGroupCollection;
    window.DooTemplateCollection = DooTemplateCollection;
})( window );
