/// <reference path="jquery.d.ts" />
/// <reference path="../bower_components/math-item/math-item.d.ts" />
/// <reference path="requirelibs.ts" />

interface JQuery {
    modal(options?: any): void;
}

interface IHTMLMathItemElement {
    selected?: boolean;
}

interface MouseEvent {
    dataTransfer: DataTransfer;
}

module FlorianMath {
    'use strict';

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
        link?: string;
    }

    export interface MathUI {
        add(mathItem: IHTMLMathItemElement): void;
        showDashboard(): void;
    }

    var log: (message: any, arg1?: any, arg2?: any) => void = () => {};
    if ('console' in window && console.log)
        log = (message: any, arg1?: any, arg2?: any) => {
            if (arg2 !== undefined) console.log(message, arg1, arg2);
            else if (arg1 !== undefined) console.log(message, arg1);
            else console.log(message);
        };

    function getName(mathItem: IHTMLMathItemElement) {
        return 'Equation ' + ((<IHTMLMathItemElementPrivate> mathItem)._private.id + 1);
    }

    var MARKUP_PREFERENCE = [MIME_TYPE_MATHML, MIME_TYPE_TEX, MIME_TYPE_HTML];

    function getSourceType(source: IHTMLMathSourceElement) {
        return source.getAttribute('type') || MIME_TYPE_HTML;
    }

    function getSourceMarkup(source: IHTMLMathSourceElement) {
        var value = source.firstChild && !source.firstChild.nextSibling && source.firstChild.nodeType === 3 ? source.firstChild.nodeValue : source.innerHTML;
        return trim(value);
    }

    function getDefaultMarkup(mathItem: IHTMLMathItemElement) {
        var k, type, sources;
        for (k = 0; k < MARKUP_PREFERENCE.length; k++) {
            type = MARKUP_PREFERENCE[k];
            sources = mathItem.getSources({ markup: true, type: type });
            if (sources.length)
                return getSourceMarkup(sources[0]);
        }
        return null;
    }

    function setDataTransfer(data: DataTransfer, mathItem: IHTMLMathItemElement) {
        var sources = mathItem.getSources({ markup: true });
        each(sources, (source: IHTMLMathSourceElement) => {
            data.setData(getSourceType(source), getSourceMarkup(source));
        });
    }

    function stopEvent(ev: BaseJQueryEventObject) {
        ev.preventDefault();
        ev.stopPropagation();
    }

    export var mathUI: MathUI;

    requireLibs().then(($: JQueryStatic) => {

        // Zoom

        function zoomAction(mathItem: IHTMLMathItemElement) {
            var inner = $('<div class="panel-body" />'),
                popup = $('<div class="math-ui math-ui-zoom" />')
                    .append($('<div class="panel panel-default" />').append(inner)),
                mathItemClone = <IHTMLMathItemElement> mathItem.cloneNode(true);
            HTMLMathItemElement.manualCreate(mathItemClone, true);
            mathItemClone.clean();
            inner.append(mathItemClone);
            $(document).on('mousedown keydown', (ev: BaseJQueryEventObject) => {
                if (ev.type === 'mousedown' && ev.which !== 1) return;
                ev.stopPropagation();
                popup.remove();
            });
            $(mathItem).before(popup);
            HTMLMathItemElement.manualAttach(mathItemClone, true);
        }

        // Commands menu

        function noOp() { }

        function getCommandItems(mathItem: IHTMLMathItemElement): ICommandItem[] {
            return [
                { label: 'Copy to clipboard', action: noOp },
                { label: 'Copy permalink', action: noOp },
                {
                    label: 'Convert to code', submenu: [
                        { label: 'C', action: noOp },
                        { label: 'JavaScript', action: noOp },
                        { label: 'Python', action: noOp }
                    ]
                },
                {
                    label: 'Open with', submenu: [
                        { label: 'Mathematica', action: noOp },
                        { label: 'Maple', action: noOp },
                        { label: 'WolframAlpha', link: 'http://www.wolframalpha.com/input/?i=sin%5Bx%5D*sin%5By%5D' }
                    ]
                },
                {
                    label: 'Share', submenu: [
                        { label: 'Twitter', action: noOp },
                        { label: 'Email', action: noOp }
                    ]
                },
                {
                    label: 'Search', submenu: [
                        { label: 'Google', action: noOp },
                        { label: 'Tangent', action: noOp }
                    ]
                },
                { label: 'Speak', action: noOp }
            ];
        }

        function showEquationMenu(mathItem: IHTMLMathItemElement) {
            var options = $('<div class="list-group" />'),
                content = $('<div class="modal-content" />')
                    .append($('<div class="modal-header" />')
                    .append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'))
                    .append($('<h4 class="modal-title" />').append(getName(mathItem)))
                    )
                    .append($('<div class="modal-body" />').append(options)),
                modal = $('<div class="modal" tabindex="-1" role="dialog" aria-hidden="true" />')
                    .append($('<div class="modal-dialog modal-sm" />').append(content)),
                wrapper = $('<div class="math-ui math-ui-eqn-commands" />').append(modal),
                commands = getCommandItems(mathItem);

            function focusFirst() {
                options.find('a').first().focus();
            }

            function update() {
                options.children().remove();
                each(commands, (item: ICommandItem) => {
                    var a = $('<a href="#" class="list-group-item" />');
                    if (item.submenu)
                        a.append($('<span class="glyphicon glyphicon-triangle-right"></span>'));
                    else if (item.link)
                        (<HTMLAnchorElement> a[0]).href = item.link;
                    a.append(item.label);
                    options.append(a);
                    if (!item.link) {
                        a.on('click',(ev: JQueryMouseEventObject) => {
                            stopEvent(ev);
                            if (item.submenu) {
                                commands = item.submenu;
                                update();
                                focusFirst();
                            } else {
                                modal.modal('hide');
                                item.action();
                            }
                        });
                    }
                });
            }

            $(document.body).append(wrapper);
            update();

            modal.on('shown.bs.modal', focusFirst)
                .on('hidden.bs.modal', () => {
                    wrapper.remove();
                }).modal();
        }

        // Equation menu

        function keyModifiers(ev: JQueryKeyEventObject) {
            return (ev.shiftKey ? 1 : 0) | (ev.ctrlKey ? 2 : 0) | (ev.altKey ? 4 : 0) | (ev.metaKey ? 8 : 0);
        }

        function gotFocus(mathItem: IHTMLMathItemElement) {
            var $mathItem = $(mathItem), okItem, contentElement, copyItem,
                items = $('<div class="well" />'),
                menu = $('<div class="math-ui math-ui-eqn-menu" />').append(items);
            function blur() {
                $mathItem.blur();
            }
            function doZoom() {
                blur();
                zoomAction(mathItem);
            }
            function toggleSelection() {
                mathItem.selected = !mathItem.selected;
                okItem.toggleClass('glyphicon-star', mathItem.selected);
                okItem.toggleClass('glyphicon-star-empty', !mathItem.selected);
            }
            function showEqnMenu() {
                blur();
                showEquationMenu(mathItem);
            }
            function removeCopyItem() {
                copyItem.remove();
                copyItem = undefined;
                $mathItem.focus();
            }
            if ($mathItem.hasClass('focus'))  // focus returning from copyItem?
                return;
            items.append($('<span class="title" />').append(getName(mathItem)));
            items.append($('<span class="glyphicon glyphicon-menu-hamburger" aria-hidden="true"></span>'));
            items.append($('<span class="glyphicon glyphicon-zoom-in" aria-hidden="true"></span>'));
            okItem = $('<span class="glyphicon" aria-hidden="true"></span>');
            okItem.addClass(mathItem.selected === true ? 'glyphicon-star' : 'glyphicon-star-empty');
            items.append(okItem);
            $mathItem.append(menu);
            if (mathItem.shadowRoot) {
                contentElement = $('<content select=".math-ui-eqn-menu" />');
                $(mathItem.shadowRoot).append(contentElement);
            }
            $mathItem.addClass('focus').on('keydown', (ev: JQueryKeyEventObject) => {
                var mods = keyModifiers(ev);
                if (!copyItem && ((ev.which === 17 && mods === 2) || (ev.which === 91 && mods === 8))) {
                    copyItem = $('<textarea />').val(getDefaultMarkup(mathItem) || getName(mathItem))
                        .on('keyup', (ev: JQueryKeyEventObject) => {
                            if (ev.which === 17 || ev.which === 91)
                                removeCopyItem();
                        });
                    menu.append(copyItem);
                    copyItem.focus().select();
                } else if (mods === 0) {
                    var k = indexOf([13, 27, 32, 90], ev.which);
                    if (k >= 0) {
                        stopEvent(ev);
                        [showEqnMenu, blur, toggleSelection, doZoom][k]();
                    }
                }
            }).on('copy', (ev: BaseJQueryEventObject) => {
                log('copy', ev);
                if ((<ClipboardEvent> ev.originalEvent).clipboardData) {
                    log('decorating copy');
                    setDataTransfer((<ClipboardEvent> ev.originalEvent).clipboardData, mathItem);
                }
                async(() => {
                    removeCopyItem();
                    blur();
                });
            }).on('blur', () => {
                if (!copyItem) {
                    $mathItem.off('keydown copy blur').removeClass('focus');
                    menu.remove();
                    if (contentElement) contentElement.remove();
                }
            });
            menu.on('mousedown', (ev: JQueryMouseEventObject) => {
                if (ev.which !== 1) return;
                stopEvent(ev);
                items.children().each((k, elem) => {
                    if (elem === ev.target) {
                        [showEqnMenu, showEqnMenu, doZoom, toggleSelection][k]();
                    }
                });
            });
        }

        // Main class

        function BootstrapLookAndFeel(jq: JQueryStatic) {
            this.container = [];
            this.highlighted = false;
            this.$ = jq;
        }

        BootstrapLookAndFeel.prototype.add = function (mathItem: IHTMLMathItemElement) {
            var $mathItem = $(mathItem);
            this.container.push(mathItem);
            $mathItem.attr('tabindex', 0).attr('draggable', 'true').on('focus', (ev) => {
                stopEvent(ev);
                gotFocus(mathItem);
            }).on('dragstart', (ev) => {
                if ((<MouseEvent> ev.originalEvent).dataTransfer) {
                    var dt = (<MouseEvent> ev.originalEvent).dataTransfer,
                        defaultMarkup = getDefaultMarkup(mathItem);
                    try {
                        if (defaultMarkup)
                            dt.setData(MIME_TYPE_PLAIN, defaultMarkup);
                        setDataTransfer(dt, mathItem);
                    }
                    catch (e) {
                        // IE only accepts type 'text' http://stackoverflow.com/a/18051912/212069
                        if (defaultMarkup)
                            dt.setData('text', defaultMarkup);
                    }
                }
            }).on('dragend', () => {
                $mathItem.blur();
            });
        };

        BootstrapLookAndFeel.prototype.highlightAll = function () {
            var on = this.highlighted = !this.highlighted;
            each(this.container, (mathItem: IHTMLMathItemElement) => {
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
                            window.location.href = 'https://github.com/dessci/math-item-element'
                        }
                    }
                });
            });
            $(document.body).append(wrapper);
            modal.on('hidden.bs.modal', () => {
                wrapper.remove();
            }).modal();
        };

        mathUI = new BootstrapLookAndFeel($);
        dispatchCustomEvent(document, 'created.math-ui');

        initialized().then(() => {
            log('Applying MathUI to math-items');
            each(document.querySelectorAll('math-item'), (mathItem: IHTMLMathItemElement) => {
                mathUI.add(mathItem);
            });
        });

    });

}
