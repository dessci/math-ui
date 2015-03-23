/// <reference path="../dist/math-item.d.ts" />
/// <reference path="mathjax.d.ts" />
var FlorianMath;
(function (FlorianMath) {
    var global = window, doc = document;
    FlorianMath.WRAPPED_MATH_ITEM_EVENT = 'wrapped.math-item';
    function setAttributes(el, attrs) {
        for (var name in attrs)
            if (attrs.hasOwnProperty(name))
                el.setAttribute(name, attrs[name]);
    }
    function createMathItem(attrs) {
        var mathItem = doc.createElement(FlorianMath.MATH_ITEM_TAG);
        global.HTMLMathItemElement.manualCreate(mathItem);
        setAttributes(mathItem, attrs);
        return mathItem;
    }
    function createMathSource(attrs) {
        var mathSource = doc.createElement(FlorianMath.MATH_SOURCE_TAG);
        global.HTMLMathSourceElement.manualCreate(mathSource);
        setAttributes(mathSource, attrs);
        return mathSource;
    }
    function toMathML(jax, callback) {
        try {
            callback(jax.root.toMathML(""));
        }
        catch (err) {
            if (!err.restart) {
                throw err;
            } // an actual error
            MathJax.Callback.After([toMathML, jax, callback], err.restart);
        }
    }
    FlorianMath.domReady().then(function () {
        var queue = [];
        if (!MathJax || !MathJax.Hub)
            return;
        function wrap(jax) {
            var script, parent, html, display, mimetype, preview, mathitem, mathsrc, output;
            script = jax.SourceElement();
            parent = script.parentElement;
            if (!parent || parent.tagName.toLowerCase() === 'math-item')
                return;
            if (script.type === 'math/tex' || script.type === 'math/tex; mode=display')
                mimetype = 'application/x-tex';
            else if (script.type === 'math/mml')
                mimetype = 'application/mathml+xml';
            else
                return;
            html = script.previousSibling;
            if (!html || html.nodeType !== 1)
                return;
            if (html.tagName.toLowerCase() === 'span' && html.className === 'MathJax')
                display = 'inline';
            else if (html.tagName.toLowerCase() === 'div' && html.className === 'MathJax_Display')
                display = 'block';
            else
                return;
            if (html.previousSibling && html.previousSibling.className === 'MathJax_Preview')
                preview = html.previousSibling;
            mathitem = createMathItem({ 'display': display });
            mathsrc = createMathSource({ 'type': mimetype, 'usage': 'markup' });
            mathsrc.appendChild(doc.createTextNode(jax.originalText));
            mathitem.appendChild(mathsrc);
            parent.insertBefore(mathitem, script);
            global.HTMLMathItemElement.manualAttach(mathitem);
            global.HTMLMathSourceElement.manualAttach(mathsrc);
            output = FlorianMath.mathItemInsertContent(mathitem);
            if (preview)
                output.element.appendChild(preview);
            output.element.appendChild(html);
            output.element.appendChild(script);
            output.done();
            FlorianMath.dispatchCustomEvent(mathitem, FlorianMath.WRAPPED_MATH_ITEM_EVENT, { bubbles: true });
            toMathML(jax, function (mml) {
                mathsrc = createMathSource({ 'type': 'application/mathml+xml', 'name': 'MathJax', 'usage': 'markup' });
                mathsrc.appendChild(doc.createTextNode(mml));
                mathitem.appendChild(mathsrc);
                global.HTMLMathSourceElement.manualAttach(mathsrc);
            });
        }
        MathJax.Hub.Register.MessageHook('New Math', function (message) {
            var jax = MathJax.Hub.getJaxFor(message[1]);
            if (jax)
                queue.push(jax);
        });
        MathJax.Hub.Register.MessageHook('End Process', function () {
            FlorianMath.each(queue, wrap);
            queue = [];
        });
    });
})(FlorianMath || (FlorianMath = {}));
//# sourceMappingURL=autowrap-mathjax.js.map