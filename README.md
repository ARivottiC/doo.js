# doo.js

Binds Javascript Objects to HTML Elements using the MVB(Model-View-Binder) pattern.

## Mission

**doo.js** was develop with the following goals:

* use only standards and pure javascript
* use only standards and pure HTML
* total independence between Javascript and HTML
* objects can be reused and extended in an easy way
* easy integration with other Javascript libs

## Usage

```html
<body>
    <a href="#" data-doo="AppButton">Click Me</a>    

    <script src="doo.js"></script>
    <script type="text/javascript">
        Doo.define('AppButton', {
            constructor: function () {
                Doo.apply( this, arguments );
                this.on( 'click' );
            },
            click: function () { alert('Hello World!'); }
        });

        app = new Doo( document.body );
    </script>
</body>
```

See the [Wiki](wiki) for more on **doo.js**.

## Acknowledges

The following were involved, or contributed in any way, for the final implementation of **doo.js**:

* [Shemahmforash](https://github.com/Shemahmforash)
* [JWebCoder](https://github.com/JWebCoder)
* [LuRsT](https://github.com/LuRsT)
* [andremiguelaa](https://github.com/andremiguelaa)
* [gnribeiro](https://github.com/gnribeiro)
* [goncalo85](https://github.com/goncalo85)
* [mangaru](https://github.com/mangaru)
* [ricardoanjinho](https://github.com/ricardoanjinho)
* [whity](https://github.com/whity)
