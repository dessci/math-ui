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
            focusItem, hoverItem, menuItem, menuRemover;

        var sidebarClass = (function (hash: string) {
            var a = ['dockleft', 'dockright', 'dockbottom', 'floatleft', 'floatright', 'floatbottom'],
                k = indexOf(a, hash.substr(1));
            return 'math-ui-bar-' + a[k < 0 ? 0 : k];
        })(location.hash);

        $(doc.documentElement).addClass(sidebarClass);

        $('#math-ui-bar-remove').click((ev) => {
            ev.preventDefault();
            $('#math-ui-bar').removeClass('show');
        });

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
                icons = map(['menu-hamburger', 'zoom-in', 'star-empty', 'question-sign'], (i: string) =>
                    $('<span class="glyphicon glyphicon-' + i + '" />')),
                top = $('<div class="top" />').append($('<span class="eqn-name" />')
                    .append(getName(item)), icons),
                body = $('<div class="body" />'),
                menu = $('<div class="math-ui focus-menu" />').append(eraser, top, body);

            function showCommands() {
                $('#math-ui-bar').addClass('show');
            }
            function doZoom() {
                $item.blur();
                zoomAction(item);
            }
            function toggleSelected() {
                var on = (<HTMLMathItemElementPrivate> item).selected = !(<HTMLMathItemElementPrivate> item).selected;
                icons[2].toggleClass('glyphicon-star-empty', !on).toggleClass('glyphicon-star', on);
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
                                showCommands();
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

        BootstrapLookAndFeel.prototype.showDashboard = function () {
            var body = $('<div class="modal-body" />')
                    .append($('<div class="list-group" />')
                        .append($('<a href="#" class="list-group-item">Highlight All Equations</a>'))
                        .append($('<a href="#" class="list-group-item">About</a>'))
                        .append($('<a href="#" class="list-group-item" data-dismiss="modal">Close</a>'))
                ),
                modal = $('<div class="modal math-ui-dashboard" tabindex="-1" role="dialog" aria-hidden="true" />')
                    .append($('<div class="modal-dialog modal-sm" />').append($('<div class="modal-content" />')
                        .append($('<div class="modal-header" />')
                            .append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'))
                            .append($('<h4 class="modal-title" />').append('Dashboard')))
                        .append(body)
                    )
                ),
                wrapper = $('<div class="math-ui" />').append(modal);

            body.on('click', (ev) => {
                body.find('a').each((k, elem) => {
                    if (k <= 1 && elem === ev.target) {
                        ev.preventDefault();
                        modal.modal('hide');
                        if (k === 0) {
                            this.highlightAll();
                        } else {
                            global.location.href = 'https://github.com/dessci/math-ui';
                        }
                    }
                });
            });
            $(doc.body).append(wrapper);
            modal.on('hidden.bs.modal', () => {
                wrapper.remove();
            }).modal();
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
