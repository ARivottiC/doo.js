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

    //

    /*
     *  Generic auxiliar Functions
     */

    //
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
    function attachChild( obj, elem, arg ) {
        // if element is not a node, it is a string or number. Get the
        //  corresponding template
        //  TODO: must be able to support multiple childs inside a template
        //  TODO: support global templates
        if ( ! elem.nodeType )
            elem = document.importNode(
                    obj.template[ elem ].content, true
                ).children[0];

        // Merge arg with attr configuration
        arg = merge(
                { 'class': Doo.defaultClass }
                , attributeValueToObject( elem.getAttribute( Doo.defaultAttr ) )
                , arg
            );

        var Constructor = window[ arg['class'] ];

        if ( isUndef( Constructor ) )
            throw new Error(
                    "can't use "
                  + arg['class']
                  + ", maybe you forgot to set it?"
                );

        var child = new Constructor( elem, obj, arg )
            , name  = child.name
            ;

        if ( ! isA( child, Doo ) )
            throw new Error("not a Doo Object!");

        // if a name was given, used as a parent's method
        //  TODO: check if already exists
        if ( ! isUndef( name )  )
            child.context[ '$' + name ] = child;

        attachChildToParent( obj, child, arg.index );

        return child;
    }

    // attach a child to a parent
    //  of the object is an Prepender, set index to 0
    //  if an index is given, attach it to that parent's position
    function attachChildToParent( obj, child, index ) {
        var isAppender = ! obj.length      // empty, push allways work
                      || isUndef( index )  // index is not defined
                      || ! obj[ index ]    // or doesn'ts have that child
                      || index !== 0       // or index not 0
          , childElem  = child.elem
          , parentElem = obj.elem
          ;

        // add element to the dom if the element has no parent
        //  in IE8 an unattached element as a "Document Fragment"? as
        //  parentNode
        if ( !( childElem.parentNode && childElem.parentElement ) )
            if ( isAppender )
                parentElem.appendChild( childElem );
            else
                parentElem.insertBefore( childElem, obj[ index ].elem );

        if ( isUndef( index ) )
            return push.call( obj, child );
        else
            splice.call( obj, index, 0, child );
    }

    // check if object's element has a given class set
    function hasClass( obj, val ) {
        return obj.elem.classList.contains( val );
    }

    function pushChild( obj, values, reverse ) {
        var args = {};

        if ( reverse ) {
            values = values.reverse();
            args.index = 0;
        }

        forEach.call( values, function ( value ) {
            var child = attachChild( obj, ( value.template || 0 ), args );
            if ( value !== void 0 ) {
                delete value.template;
                child.update( value );
            }
        });

        return obj;
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

    merge( dooCollectionProto, {
        // execute a given method in all children
        exec: function ( fn ) {
            var args = splice.call( arguments, 1 );
            this.forEach( function ( child ) {
                child[ fn ].apply( child, args );
            });
            return this;
        }

        // returns a DooCollection (see Array.filter)
      , filter: function () {
            return this.slice.apply( filter.apply( this, arguments ) );
        }

        // returns all hidden children
      , hidden: function () {
            return this.filter( dooHiddenObjectMethod );
        }

        // returns all dooing children
      , dooing: function () {
            return this.filter( dooDooingObjectMethod );
        }

        // returns a DooCollection (see Array.map)
      , map: function () {
            return this.slice.apply( map.apply( this, arguments ) );
        }

        // returns a DooCollection (see Array.slice)
      , slice: function () {
            var obj = new DooCollection();
            push.apply( obj, slice.apply( this, arguments ) );
            return obj;
        }

        // returns a DooCollection (see Array.splice)
      , splice: function () {
            return this.slice.apply( splice.apply( this, arguments ) );
        }
      , pop: popChildOrLastChild
    });

    /*
     * DooGroupCollection
     */
    function DooGroupCollection() { DooCollection.apply( this, arguments ); }
    DooGroupCollection.prototype = Object.create( DooCollection.prototype );
    DooGroupCollection.prototype.byName = oGroup;

    function DooTemplateCollection() { push.apply( this, arguments ); }
    DooTemplateCollection.prototype = Object.create( arrayProto );
    DooTemplateCollection.prototype.byName = oTemplate;

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
            attachChild( obj, child );
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
        console.log( defaultTemplate );
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

    Doo.prototype = Object.create( null );
    merge( Doo.prototype, {
        children  : dooChildrenObjectMethod
      , destructor: dooDestructorObjectMethod
      , doo       : dooDooObjectMethod
      , dooing    : dooDooingObjectMethod
      , doont     : dooDoontObjectMethod
      , hidden    : dooHiddenObjectMethod
      , hide      : dooHideObjectMethod
      , length    : 0
      , next      : dooNextObjectMethod
      , no        : dooNoObjectMethod
      , on        : dooOnObjectMethod
      , pop       : dooPopObjectMethod
      , prev      : dooPrevObjectMethod
      , push      : dooPushObjectMethod
      , shift     : dooShiftObjectMethod
      , show      : dooShowObjectMethod
      , swap      : dooSwapObjectMethod
      , toString  : dooToStringObjectMethod
      , unshift   : dooUnshiftObjectMethod
      , update    : dooUpdateObjectMethod
      , value     : dooValueObjectMethod
    });

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
     * Doo Object Methods
     */

    // returns a DooCollection of this object's children
    //  if an object is given and is a child, returns that child
    //  if a name or number is given, and the child exists, returns if
    //  if a function is givem. use that function as a filter
    //  undefined returns all children
    function dooChildrenObjectMethod( val ) {
        var obj = this;

        switch ( typeof val ) {
            case "object":
                if ( indexOf.call( obj, val ) >= 0 )
                    return new DooCollection( val );

                break;
            case "string":
            case "number":
                if ( has( obj, val ) )
                    return new DooCollection( obj[ val ] );

                break;
            default:
                var array = dooCollectionProto.slice.call( obj );

                if ( isFn( val ) )
                    return array.filter( val );

                return array;
        }
    }

    // cleans up all the references and support data related to this
    //  object.
    function dooDestructorObjectMethod() {
        var obj = this;

        obj.value( null );

        // remove me from group
        obj.group.pop( obj );
        obj.group = null;

        // destroy any templates
        while ( obj.template.length )
            obj.template.pop();
        obj.template = null;

        // remove o from the dom
        obj.elem.dooObject = null;
        obj.elem.parentNode.removeChild( obj.elem );
        obj.elem = null;

        obj.context = null;
        obj.parent  = null;
        obj.root    = null;
    }

    /* doo, doont, dooing */
    function dooDooObjectMethod()   { return addClass( this, 'dooing'); }
    function dooDoontObjectMethod() { return remClass( this, 'dooing'); }
    function dooDooingObjectMethod( /* FOR INTERNAL USE*/ obj ) {
        return hasClass( obj || this, 'dooing' );
    }

    /* hide, hidden, show */
    function dooHideObjectMethod()   { return addClass(this, 'hidden' ); }
    function dooHiddenObjectMethod() { return hasClass(this, 'hidden' ); }
    function dooShowObjectMethod( /* FOR INTERNAL USE */ obj ) {
        return remClass( obj || this, 'hidden' );
    }

    function dooNextObjectMethod() {
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

    function dooPopObjectMethod( child ) {
        var obj    = this;
        var orphan = popChildOrLastChild.call( obj, child );

        if ( orphan )
            orphan.destructor();

        return orphan;
    }

    function dooPrevObjectMethod() {
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

    function dooPushObjectMethod() {
        return pushChild( this, slice.call( arguments ) );
    }

    function dooUnshiftObjectMethod() {
        return pushChild( this, slice.call( arguments ), true );
    }

    function dooShiftObjectMethod() {
        var child = this[0];

        if ( child )
            this.pop( child );

        return this;
    }

    function dooSwapObjectMethod( sibling ) {
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

    function dooToStringObjectMethod() { return '[object Doo]'; }

    function dooUpdateObjectMethod( val ) {
        var obj = this;

        if ( Array.isArray( val ) )
            forEach.call( val, function ( value, index ) {
                var child = obj[ index ];

                if ( child )
                    child.update( value );
            });
        else if ( isObj( val ) ) // TODO: probably better with Object.keys
            for ( var key in val ) {
                var value = val[ key ]
                  , $key  = '$' + key
                  , child = obj[ $key ]
                  ;

                if ( isFn( child ) )
                    ; // do nothing
                else if ( has( obj, $key ) )
                    if ( isA( child, Doo ) )
                        child.update( value );
                    else
                        obj[ $key ] = value;
            }
        else
            obj.value( val );

        return obj;
    }

    // get the content of the object. Set the content if a value is given
    function dooValueObjectMethod( val ) {
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

    function dooNoObjectMethod( event, fn, capture ) {
        // TODO: capture support?
        var obj = this;

        fn = fn || obj[ event ];

        var listener = pathToObj(
                oListener, obj.guid, event, fn.guid
            );

        return obj.elem.removeEventListener( event, listener, capture );
    }

    function dooOnObjectMethod( event, fn, capture ) {
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

    Doo.Internals = {
        group    : oGroup
      , listener : oListener
      , templates: oTemplate
    };

    window.Doo = Doo;
    window.DooCollection = DooCollection;
})( window );
