var FlorianMath;
(function (FlorianMath) {
    function each(list, fn) {
        for (var k = 0; k < list.length; k++) {
            fn(list[k], k);
        }
    }
    FlorianMath.each = each;
    function hasPromise(local) {
        return ('Promise' in local && 'resolve' in local.Promise && 'reject' in local.Promise && 'all' in local.Promise && 'race' in local.Promise && (function () {
            var resolve;
            new local.Promise(function (r) {
                resolve = r;
            });
            return typeof resolve === 'function';
        }));
    }
    FlorianMath.Promise = hasPromise(window) ? window.Promise : (function () {
        var Promise = function (callback) {
            var _this = this;
            var flush = function (thenFunc) {
                _this.then = thenFunc;
                each(_this._thens, function (then) {
                    thenFunc(then.resolved, then.rejected);
                });
                delete _this._thens;
            };
            this._thens = [];
            callback(function (val) {
                flush(function (resolved) {
                    resolved(val);
                });
            }, function (reason) {
                flush(function (resolved, rejected) {
                    if (rejected)
                        rejected(reason);
                });
            });
        };
        Promise.prototype.then = function (resolved, rejected) {
            this._thens.push({ resolved: resolved, rejected: rejected });
        };
        Promise.resolve = function (val) {
            return new Promise(function (resolve) {
                resolve(val);
            });
        };
        return Promise;
    })();
    function getElementStyle(el, prop) {
        if (typeof getComputedStyle === 'function')
            return getComputedStyle(el, null).getPropertyValue(prop);
        else
            return el.currentStyle[prop];
    }
    FlorianMath.getElementStyle = getElementStyle;
    function addEventListenerFn(el, type, callback) {
        if (el.addEventListener)
            el.addEventListener(type, callback, false);
        else
            el.attachEvent('on' + type, callback);
    }
    FlorianMath.domReady = (function () {
        var promise = document.readyState === 'complete' ? FlorianMath.Promise.resolve() : new FlorianMath.Promise(function (resolve) {
            var fired = false;
            function trigger() {
                if (fired)
                    return;
                fired = true;
                resolve();
            }
            if (document.addEventListener) {
                document.addEventListener('DOMContentLoaded', trigger);
            }
            if (document.attachEvent) {
                document.attachEvent('onreadystatechange', function () {
                    if (document.readyState === 'complete')
                        trigger();
                });
            }
            addEventListenerFn(window, 'load', trigger);
        });
        return function () { return promise; };
    })();
    FlorianMath.async = typeof requestAnimationFrame === 'function' ? function (fn) {
        requestAnimationFrame(fn);
    } : function (fn) {
        setTimeout(fn, 0);
    };
    FlorianMath.trim = String.prototype.trim ? function (st) { return st.trim(); } : (function () {
        var characters = '[\\s\\uFEFF\\xA0]';
        var regex = new RegExp('^' + characters + '+|' + characters + '+$', 'g');
        return function (st) { return st.replace(regex, ''); };
    })();
})(FlorianMath || (FlorianMath = {}));
/// <reference path="utils.ts" />
var FlorianMath;
(function (FlorianMath) {
    FlorianMath.MATH_ITEM_TAG = 'math-item';
    FlorianMath.MATH_SOURCE_TAG = 'math-source';
    FlorianMath.MIME_TYPE_HTML = 'text/html';
    FlorianMath.MIME_TYPE_TEX = 'application/x-tex';
    FlorianMath.MIME_TYPE_MATHML = 'application/mathml+xml';
    var global = window;
    var doc = document;
    function iterateChildren(n, fn) {
        var c = n.firstChild, next;
        while (c) {
            next = c.nextSibling;
            fn(c);
            c = next;
        }
    }
    function iterateSourceElements(el, fn) {
        iterateChildren(el, function (c) {
            if (c.nodeType === 1 && c.tagName.toLowerCase() === FlorianMath.MATH_SOURCE_TAG)
                fn(c);
        });
    }
    function mathItemClean() {
        var _this = this;
        var shadow = this.shadowRoot;
        iterateChildren(this, function (c) {
            if (c.nodeType === 1 && c.tagName.toLowerCase() === FlorianMath.MATH_SOURCE_TAG)
                c.style.display = 'none';
            else
                _this.removeChild(c);
        });
        if (shadow) {
            iterateChildren(shadow, function (c) {
                shadow.removeChild(c);
            });
        }
    }
    function mathItemRenderDone(mathItem) {
        mathItem.removeAttribute('state');
    }
    function mathItemInsertContent(mathItem) {
        mathItem.clean();
        mathItem.setAttribute('state', 'rendering');
        return {
            element: mathItem.shadowRoot || (mathItem.createShadowRoot ? mathItem.createShadowRoot() : mathItem),
            done: function () {
                mathItemRenderDone(mathItem);
            }
        };
    }
    FlorianMath.mathItemInsertContent = mathItemInsertContent;
    function mathItemShowSources(mathItem, sources) {
        mathItem.clean();
        FlorianMath.each(sources, function (source) {
            source.style.display = '';
        });
        if (mathItem.shadowRoot)
            mathItem.shadowRoot.appendChild(document.createElement('content'));
        mathItemRenderDone(mathItem);
    }
    FlorianMath.mathItemShowSources = mathItemShowSources;
    /*function normalize(el: IHTMLMathItemElement) {
        var nodes: Node[] = [], c = el.firstChild, t, mainMathElement,
            trivial = true, isPreview = el.getAttribute('state') === 'preview';
        while (c) {
            if (c.nodeType === 1 && (<Element> c).tagName.toLowerCase() === MATH_SOURCE_TAG) {
                c = c.nextSibling;
            } else {
                t = c.nextSibling;
                nodes.push(el.removeChild(c));
                c = t;
            }
        }
        each(nodes, (c: Node) => {
            if (c.nodeType === 1) {
                if ((<Element> c).tagName.toLowerCase() === 'math') {
                    if (mainMathElement) {
                        // don't allow multiple math elements
                        mainMathElement = undefined;
                        trivial = false;
                    } else
                        mainMathElement = c;
                } else
                    trivial = false;
            } else if (c.nodeType === 3 && trim(c.nodeValue) !== '') {
                trivial = false;
            }
        });
        if (mainMathElement || !trivial) {
            var source = doc.createElement('math-source');
            if (isPreview)
                source.setAttribute('usage', 'preview');
            if (mainMathElement) {
                source.setAttribute('type', MIME_TYPE_MATHML);
                nodes = [mainMathElement];
            }
            each(nodes, (n: Node) => {
                source.appendChild(n);
            });
            el.appendChild(source);
        }
    }*/
    var counter = 0;
    function doPreview(mathItem) {
        var previewSources = mathItem.getSources({ render: false, markup: false });
        if (previewSources.length) {
            mathItem.setAttribute('state', 'preview');
            FlorianMath.each(previewSources, function (source) {
                source.style.display = '';
            });
        }
    }
    function mathItemEnqueueRender(el) {
        if (!el._private.updatePending) {
            el._private.updatePending = true;
            FlorianMath.async(function () {
                el._private.updatePending = false;
                if (el._private.firstPass) {
                    el._private.firstPass = false;
                    //normalize(el);
                    doPreview(el);
                }
                el.render();
            });
        }
    }
    function renderProxy() {
        global.HTMLMathItemElement.render.call(this);
    }
    function sourceEncoding(src) {
        return src.getAttribute('type') || FlorianMath.MIME_TYPE_HTML;
    }
    /*
     * render  markup  usage
     * -       -       'preview'
     * +       -       'nomarkup'
     * -       +       'norender'
     * +       +       ''
     */
    function getSources(options) {
        var result = [], render, markup, encoding;
        options = options || {};
        if (options.render !== undefined)
            render = !!options.render;
        if (options.markup !== undefined)
            markup = !!options.markup;
        encoding = options.type;
        iterateSourceElements(this, function (source) {
            var usage = source.getAttribute('usage');
            if (render !== undefined && render === (usage === 'preview' || usage === 'norender'))
                return;
            if (markup !== undefined && markup === (usage === 'preview' || usage === 'nomarkup'))
                return;
            if (encoding !== undefined && encoding !== sourceEncoding(source))
                return;
            result.push(source);
        });
        return result;
    }
    function baseItemCreate() {
        this._private = {
            updatePending: false,
            firstPass: true,
            id: counter++
        };
    }
    function manualItemCreate(mathItem, deep) {
        mathItem.render = renderProxy;
        mathItem.clean = mathItemClean;
        mathItem.getSources = getSources;
        baseItemCreate.call(mathItem);
        if (deep) {
            iterateSourceElements(this, function (source) {
                manualSourceCreate(source);
            });
        }
    }
    function baseItemAttach() {
        mathItemEnqueueRender(this);
    }
    function manualItemAttach(mathItem, deep) {
        baseItemAttach.call(mathItem);
        if (deep) {
            iterateSourceElements(this, function (source) {
                manualSourceAttach(source);
            });
        }
    }
    function baseSourceCreate() {
        this.style.display = 'none';
    }
    function manualSourceCreate(mathSource) {
        baseSourceCreate.call(mathSource);
    }
    function baseSourceAttach() {
        var usage = this.getAttribute('usage') || '';
        if (usage === '' || usage === 'nomarkup') {
            var parent = this.parentElement;
            if (parent && parent.tagName.toLowerCase() === FlorianMath.MATH_ITEM_TAG)
                mathItemEnqueueRender(parent);
        }
    }
    function manualSourceAttach(mathSource) {
        baseSourceAttach.call(mathSource);
    }
    var initializedResolver;
    FlorianMath.initialized = (function () {
        var promise = new FlorianMath.Promise(function (resolve) {
            initializedResolver = resolve;
        });
        return function () { return promise; };
    })();
    if (doc.registerElement) {
        var MathItemPrototype = Object.create(HTMLElement.prototype, {
            createdCallback: { enumerable: true, value: baseItemCreate },
            attachedCallback: { enumerable: true, value: baseItemAttach },
            render: { enumerable: true, value: renderProxy, writable: true },
            clean: { enumerable: true, value: mathItemClean, writable: true },
            getSources: { enumerable: true, value: getSources, writable: true }
        });
        var MathSourcePrototype = Object.create(HTMLElement.prototype, {
            createdCallback: { enumerable: true, value: baseSourceCreate },
            attachedCallback: { enumerable: true, value: baseSourceAttach }
        });
        global.HTMLMathItemElement = doc.registerElement(FlorianMath.MATH_ITEM_TAG, { prototype: MathItemPrototype });
        global.HTMLMathSourceElement = doc.registerElement(FlorianMath.MATH_SOURCE_TAG, { prototype: MathSourcePrototype });
        global.HTMLMathItemElement.manualCreate = global.HTMLMathItemElement.manualAttach = global.HTMLMathSourceElement.manualCreate = global.HTMLMathSourceElement.manualAttach = function () {
        };
        initializedResolver();
    }
    else {
        doc.createElement(FlorianMath.MATH_ITEM_TAG);
        doc.createElement(FlorianMath.MATH_SOURCE_TAG);
        global.HTMLMathItemElement = function () {
        };
        global.HTMLMathSourceElement = function () {
        };
        global.HTMLMathItemElement.manualCreate = manualItemCreate;
        global.HTMLMathItemElement.manualAttach = manualItemAttach;
        global.HTMLMathSourceElement.manualCreate = manualSourceCreate;
        global.HTMLMathSourceElement.manualAttach = manualSourceAttach;
        FlorianMath.domReady().then(function () {
            FlorianMath.each(doc.querySelectorAll(FlorianMath.MATH_ITEM_TAG), function (mathItem) {
                manualItemCreate(mathItem, true);
                manualItemAttach(mathItem, true);
            });
            initializedResolver();
        });
    }
    global.HTMLMathItemElement.render = function () {
        var toShow = this.getSources({ render: true, type: FlorianMath.MIME_TYPE_HTML });
        if (toShow.length)
            mathItemShowSources(this, toShow);
    };
})(FlorianMath || (FlorianMath = {}));
//# sourceMappingURL=math-item.js.map