/// <reference path="jquery.d.ts" />
/// <reference path="../bower_components/math-item/math-item.d.ts" />
/// <reference path="requirelibs.ts" />

interface JQuery {
    modal(options?: any): void;
}

interface IHTMLMathItemElement {
    selected?: boolean;
}

module FlorianMath {
    'use strict';

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

    function getName(mathItem: IHTMLMathItemElement) {
        return 'Equation ' + ((<IHTMLMathItemElementPrivate> mathItem)._private.id + 1);
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

        function gotFocus(mathItem: IHTMLMathItemElement) {
            var $mathItem = $(mathItem), okItem, contentElement,
                items = $('<div class="well" />'),
                menu = $('<div class="math-ui math-ui-eqn-menu" />').append(items);
            function doZoom() {
                $mathItem.blur();
                zoomAction(mathItem);
            }
            function toggleSelection() {
                mathItem.selected = !mathItem.selected;
                okItem.toggleClass('glyphicon-star', mathItem.selected);
                okItem.toggleClass('glyphicon-star-empty', !mathItem.selected);
            }
            function showEqnMenu() {
                $mathItem.blur();
                showEquationMenu(mathItem);
            }
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
            $mathItem.on('keydown', (ev: JQueryKeyEventObject) => {
                switch (ev.which) {
                    case 13:
                        stopEvent(ev);
                        showEqnMenu();
                        break;
                    case 27:
                        stopEvent(ev);
                        $mathItem.blur();
                        break;
                    case 32:
                        toggleSelection();
                        break;
                    case 90:
                        stopEvent(ev);
                        doZoom();
                        break;
                }
            }).on('blur', () => {
                $mathItem.off('keydown');
                menu.remove();
                if (contentElement) contentElement.remove();
            });
            menu.on('mousedown', (ev: JQueryMouseEventObject) => {
                if (ev.which !== 1) return;
                stopEvent(ev);
                items.children().each((k, elem) => {
                    if (elem === ev.target) {
                        switch (k) {
                            default:
                                showEqnMenu();
                                break;
                            case 2:
                                doZoom();
                                break;
                            case 3:
                                toggleSelection();
                                break;
                        }
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
            this.container.push(mathItem);
            $(mathItem).attr('tabindex', 0).on('focus', (ev) => {
                stopEvent(ev);
                gotFocus(mathItem);
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

        initialized().then(() => {
            console.log('Applying MathUI to math-items');
            each(document.querySelectorAll('math-item'), (mathItem: IHTMLMathItemElement) => {
                mathUI.add(mathItem);
            });
            dispatchCustomEvent(document, 'ready.math-ui');
        });

    });

}
