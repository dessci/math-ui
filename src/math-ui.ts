/// <reference path="jquery.d.ts" />
/// <reference path="../bower_components/math-item/math-item.d.ts" />
/// <reference path="requirelibs.ts" />

interface JQuery {
    modal(options?: any): void;
}

interface HTMLElement {
    scrollIntoView() : void;
}

interface HTMLMathItemElement {
    selected?: boolean;
}

interface MouseEvent {
    dataTransfer: DataTransfer;
}

module FlorianMath {
    'use strict';

    var global: Window = window,
        doc: Document = document;

    interface ClipboardEvent extends Event {
        clipboardData: DataTransfer;
    }

    interface MenuItem {
        label: string;
        action: () => void;
    }

    interface ICommandItem {
        label: string;
        submenu?: ICommandItem[];
        action?: () => void;
    }

    export interface MathUI {
        add(mathItem: HTMLMathItemElement): void;
        showDashboard(): void;
    }

    var log: (message: any, arg1?: any, arg2?: any) => void = () => {};
    if ('console' in global && console.log)
        log = (message: any, arg1?: any, arg2?: any) => {
            if (arg2 !== undefined) console.log(message, arg1, arg2);
            else if (arg1 !== undefined) console.log(message, arg1);
            else console.log(message);
        };

    function map<T, S>(list: List<T>, fn: (item: T) => S): S[] {
        var result: S[] = [];
        each(list, (item: T) => {
            result.push(fn(item));
        });
        return result;
    }

    function getWidth(el: HTMLElement) {
        var b = el.getBoundingClientRect();
        return b.right - b.left;
    }

    function getName(mathItem: HTMLMathItemElement) {
        return 'Equation ' + ((<HTMLMathItemElementPrivate> mathItem)._private.id + 1);
    }

    function setDataTransfer(data: DataTransfer, mathItem: HTMLMathItemElement) {
        var sources = mathItem.getSources({ markup: true });
        each(sources, (source: HTMLMathSourceElement) => {
            data.setData(getSourceType(source), getSourceMarkup(source));
        });
    }

    function stopEvent(ev: BaseJQueryEventObject) {
        ev.preventDefault();
        ev.stopPropagation();
    }

    export var mathUI: MathUI;

    requireLibs().then(($: JQueryStatic) => {

        var ACTIVE_CLASS = 'active',
            focusItem, hoverItem, menuItem, menuRemover, sidebar;

        function Sidebar() {
            var body = $('<div class="panel-body" />'),
                closer = $('<button type="button" class="close">&times;</button>');
            $(document.body).append($('<div id="math-ui-viewport" />')
                .append($('<div id="math-ui-bar" class="math-ui" />')
                    .append($('<div class="panel panel-primary" />')
                        .append($('<div class="panel-heading" />').append(closer, $('<h4 class="panel-title">Math UI</h4>')),
                                body))));
            closer.click((ev) => {
                this.hide();
            });
            this.body = body;
            this.reset();
        }

        Sidebar.prototype.reset = function () {
            var nav = $('<ul class="nav nav-pills nav-stacked" />'),
                pagenav = $('<ul class="nav nav-pills nav-stacked" />'),
                body = this.body;
            each(['Markup', 'Permalink', 'Convert to code', 'Open with', 'Share', 'Search', 'Speak'], (label) => {
                nav.append($('<li role="presentation" />').append($('<a href="#" />').append(label)));
            });
            each(['Highlight all equations', 'List all', 'Help', 'About'], (label) => {
                pagenav.append($('<li role="presentation" />').append($('<a href="#" />').append(label)));
            });
            body.empty()
                .append($('<h5>Equation 8</h5>'), $('<h6>Pythagoras\'s Theorem</h6>'), nav)
                .append($('<h5>General</h5>'), pagenav);
            nav.click((ev) => {
                nav.find('a').each((k, elem) => {
                    if (ev.target === elem) {
                        if (k === 0) {
                            body.empty();
                            body.append($('<a href="#"><h5><i class="glyphicon glyphicon-chevron-left"></i> Markup</h5></a>'));
                            body.append($('<h6>Equation 8 (Pythagoras\'s Theorem)</h6>'));
                            body.append($(
                                '<form>' +
                                '  <div class="form-group">' +
                                '    <label for="math-ui-markup-type">Type</label>' +
                                '    <select id="math-ui-markup-type" class="form-control">' +
                                '      <option>MathML</option>' +
                                '      <option>TeX</option>' +
                                '    </select>' +
                                '  </div>' +
                                '  <div class="form-group">' +
                                '    <label for="math-ui-markup">Markup</label> <i class="glyphicon glyphicon-new-window"></i>' +
                                '    <textarea id="math-ui-markup" class="form-control" rows="10"><math display="block">\n    <mstyle displaystyle="true">\n        <mi>f</mi>\n        <mrow>\n            <mo>(</mo>\n            <mi>a</mi>\n            <mo>)</mo>\n        </mrow>\n        <mo>=</mo>\n        <mfrac>\n            <mn>1</mn>\n            <mrow>\n                <mn>2</mn>\n                <mi>π<!-- π --></mi>\n                <mi>i</mi>\n            </mrow>\n        </mfrac>\n        <msub>\n            <mo>∮</mo>\n            <mrow>\n                <mi>γ</mi>\n            </mrow>\n        </msub>\n        <mfrac>\n            <mrow>\n                <mi>F</mi>\n                <mo>(</mo>\n                <mi>z</mi>\n                <mo>)</mo>\n            </mrow>\n            <mrow>\n                <mi>z</mi>\n                <mo>−</mo>\n                <mi>a</mi>\n            </mrow>\n        </mfrac>\n        <mi>d</mi>\n        <mi>z</mi>\n    </mstyle>\n</math></textarea>' +
                                '  </div>' +
                                '</form>'
                            ));
                        } else if (k === 1) {
                            body.empty();
                            body.append($('<h5><button type="button" class="close" aria-label="Close"><span aria-hidden="true">&times;</span></button>Permalink</h5>'));
                            body.append($('<input type="text" class="form-control" value="http://example.com/kjgr983h">'));
                        } else if (k === 2) {
                            body.empty();
                            body.append($('<ol class="breadcrumb"><li><a href="#">Top</a></li><li class="active">Convert to code</li></ol>'));
                            body.append(
                                '<form>' +
                                '  <div class="form-group">' +
                                '    <label for="math-ui-markup-type">Language</label>' +
                                '    <select id="math-ui-markup-type" class="form-control">' +
                                '      <option>JavaScript</option>' +
                                '      <option>C++</option>' +
                                '      <option>Mathematica</option>' +
                                '    </select>' +
                                '  </div>' +
                                '  <div class="form-group">' +
                                '    <label for="math-ui-markup">Code</label> <i class="glyphicon glyphicon-new-window"></i>' +
                                '    <textarea id="math-ui-markup" class="form-control" rows="10">for (int i=0; i < 10; i++)\n  n += i;</textarea>' +
                                '  </div>' +
                                '</form>'
                            );
                        }
                    }
                });
            });
        }

        Sidebar.prototype.show = function () {
            $(document.body).addClass('math-ui-show');
            this.body.find('a').first().focus();
        }

        Sidebar.prototype.hide = function () {
            $(document.body).removeClass('math-ui-show');
            this.reset();
        }

        sidebar = new Sidebar();

        // Zoom

        function zoomAction(item: HTMLMathItemElement) {
            var popup = $('<div class="math-ui item-zoom" />'), contentRef,
                mathItemClone = <HTMLMathItemElement> item.cloneNode(true);
            function handler(ev: BaseJQueryEventObject) {
                if (ev.type === 'mousedown' && ev.which !== 1) return;
                ev.stopPropagation();
                if (contentRef) contentRef.remove();
                popup.remove();
                $(doc).off('mousedown keydown', handler);
            }
            HTMLMathItemElement.manualCreate(mathItemClone, true);
            mathItemClone.clean();
            popup.append(mathItemClone);
            $(doc).on('mousedown keydown', handler);
            $(item).append(popup);
            if (item.shadowRoot) {
                contentRef = $('<content select=".item-zoom" />');
                $(item.shadowRoot).append(contentRef);
            }
            HTMLMathItemElement.manualAttach(mathItemClone, true);
        }

        function showMenu(item: HTMLMathItemElement) {
            var $item = $(item), contentElement, display_inline, bodyHandler,
                eraser = $('<div class="eraser"/>'),
                icons = map(['cog', 'zoom-in', 'unchecked', 'question-sign'], (i: string) =>
                    $('<span class="glyphicon glyphicon-' + i + '" />')),
                top = $('<div class="top" />').append($('<span class="eqn-name" />')
                    .append(getName(item)), icons),
                body = $('<div class="body" />'),
                menu = $('<div class="math-ui focus-menu" />').append(eraser, top, body);

            function doZoom() {
                $item.blur();
                zoomAction(item);
            }
            function toggleSelected() {
                var on = (<HTMLMathItemElementPrivate> item).selected = !(<HTMLMathItemElementPrivate> item).selected;
                icons[2].toggleClass('glyphicon-unchecked', !on).toggleClass('glyphicon-check', on);
            }

            if ($item.hasClass(ACTIVE_CLASS))
                return;
            $item.addClass(ACTIVE_CLASS).append(menu);
            if (item.shadowRoot) {
                contentElement = $('<content select=".focus-menu" />');
                $(item.shadowRoot).append(contentElement);
            }
            display_inline = $item.css('display') === 'inline';
            if (display_inline)
                $item.css('display', 'inline-block');  // correct width on Chrome
            var item_padding = 2, focus_border_width = 2, menu_left = 8, itemWidth = getWidth(item);
            if (itemWidth >= 0) {
                eraser.width(itemWidth - 2*item_padding - focus_border_width - menu_left);
            }
            if (display_inline)
                $item.css('display', 'inline');
            body.on('mousedown keydown', (ev) => {
                if (ev.type === 'mousedown' && ev.which !== 1) return;
                if (bodyHandler) bodyHandler(ev);
            });
            menu.on('mousedown keydown', (ev) => {
                if (ev.type === 'mousedown' && ev.which !== 1) return;
                top.children().each(function (k) {
                    if (ev.target === this) {
                        stopEvent(ev);
                        switch (k) {
                            case 0:
                            case 1:
                                sidebar.show();
                                break;
                            case 2:
                                doZoom();
                                break;
                            case 3:
                                toggleSelected();
                                break;
                        }
                    }
                });
            });
            menuItem = item;
            menuRemover = () => {
                menu.remove();
                if (contentElement) contentElement.remove();
                $item.removeClass(ACTIVE_CLASS);
                menuItem = menuRemover = null;
            };
        }

        function checkState() {
            var item = focusItem || hoverItem;
            if (item === menuItem) return;
            if (menuItem)
                menuRemover();
            if (item)
                showMenu(item);
        }

        function onFocus() {
            focusItem = this;
            checkState();
        }

        function onBlur() {
            focusItem = null;
            checkState();
        }

        function onMouseEnter() {
            hoverItem = this;
            checkState();
        }

        function onMouseLeave() {
            hoverItem = null;
            checkState();
        }

        // Main class

        function BootstrapLookAndFeel(jq: JQueryStatic) {
            this.container = [];
            this.highlighted = false;
            this.$ = jq;
        }

        BootstrapLookAndFeel.prototype.add = function (mathItem: HTMLMathItemElement) {
            var $mathItem = $(mathItem);
            this.container.push(mathItem);
            if (!$mathItem.attr('id'))
                $mathItem.attr('id', 'math-item-' + this.container.length);
            $mathItem.attr('tabindex', 0).attr('draggable', 'true').focus(onFocus).blur(onBlur);
            if (location.hash === '#hoverfocus') {
                $('math-item').mouseenter(onMouseEnter).mouseleave(onMouseLeave);
            }
            $mathItem.on('dragstart', (ev) => {
                if ((<MouseEvent> ev.originalEvent).dataTransfer) {
                    var dt = (<MouseEvent> ev.originalEvent).dataTransfer,
                        mainMarkup = mathItem.getMainMarkup();
                    try {
                        if (mainMarkup)
                            dt.setData(MIME_TYPE_PLAIN, mainMarkup.markup);
                        setDataTransfer(dt, mathItem);
                    }
                    catch (e) {
                        // IE only accepts type 'text' http://stackoverflow.com/a/18051912/212069
                        if (mainMarkup)
                            dt.setData('text', mainMarkup.markup);
                    }
                }
            });
        };

        BootstrapLookAndFeel.prototype.highlightAll = function () {
            var on = this.highlighted = !this.highlighted;
            each(this.container, (mathItem: HTMLMathItemElement) => {
                $(mathItem).toggleClass('highlight', on);
            });
        };

        mathUI = new BootstrapLookAndFeel($);
        dispatchCustomEvent(doc, 'created.math-ui');

        initialized().then(() => {
            log('Applying MathUI to math-items');
            each(doc.querySelectorAll('math-item'), (mathItem: HTMLMathItemElement) => {
                mathUI.add(mathItem);
            });
        });

        function pagerendered() {
            log('page rendered');
            if (location.hash) {
                var item = <HTMLElement> doc.querySelector(MATH_ITEM_TAG + location.hash);
                if (item) {
                    item.scrollIntoView();
                    item.focus();
                }
            }
        }

        if (rendering())
            addCustomEventListener(doc, ALL_RENDERED_EVENT, function onpagerendered() {
                removeCustomEventListener(doc, ALL_RENDERED_EVENT, onpagerendered);
                pagerendered();
            });
        else
            pagerendered();

    });

}
