﻿/// <reference path="jquery.d.ts" />
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

        // Zoom

        function zoomAction(mathItem: HTMLMathItemElement) {
            var inner = $('<div class="panel-body" />'),
                popup = $('<div class="math-ui math-ui-zoom" />')
                    .append($('<div class="panel panel-default" />').append(inner)),
                mathItemClone = <HTMLMathItemElement> mathItem.cloneNode(true);
            HTMLMathItemElement.manualCreate(mathItemClone, true);
            mathItemClone.clean();
            inner.append(mathItemClone);
            $(doc).on('mousedown keydown', (ev: BaseJQueryEventObject) => {
                if (ev.type === 'mousedown' && ev.which !== 1) return;
                ev.stopPropagation();
                popup.remove();
            });
            $(mathItem).before(popup);
            HTMLMathItemElement.manualAttach(mathItemClone, true);
        }

        // Commands menu

        function showCopyMultilineDialog(title: string, text: string) {
            var textarea = $('<textarea class="form-control" rows="5" />').append(doc.createTextNode(text)),
                content = $('<div class="modal-content" />')
                    .append($('<div class="modal-header" />')
                        .append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'))
                        .append($('<h4 class="modal-title" />').append(title))
                    ).append($('<div class="modal-body" />').append(textarea))
                    .append($('<div class="modal-footer" />')
                        .append($('<button type="button" class="btn btn-default btn-xs" data-dismiss="modal">Close</button>'))),
                modal = $('<div class="modal" tabindex="-1" role="dialog" aria-hidden="true" />')
                    .append($('<div class="modal-dialog" />').append(content)),
                wrapper = $('<div class="math-ui" />').append(modal);

            $(doc.body).append(wrapper);

            modal.on('shown.bs.modal', () => {
                textarea.focus().select();
            }).on('hidden.bs.modal', () => {
                wrapper.remove();
            }).modal();
        }

        function showCopySingleLineDialog(title: string, text: string) {
            var input = $('<input type="url" class="form-control">'),
                content = $('<div class="modal-content" />')
                    .append($('<div class="modal-header" />')
                        .append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'))
                        .append($('<h4 class="modal-title" />').append(title))
                    ).append($('<div class="modal-body" />').append(input))
                    .append($('<div class="modal-footer" />')
                        .append($('<button type="button" class="btn btn-default btn-xs" data-dismiss="modal">Close</button>'))),
                modal = $('<div class="modal" tabindex="-1" role="dialog" aria-hidden="true" />')
                    .append($('<div class="modal-dialog" />').append(content)),
                wrapper = $('<div class="math-ui" />').append(modal);

            input.val(text);
            $(doc.body).append(wrapper);

            modal.on('shown.bs.modal', () => {
                input.focus().select();
            }).on('hidden.bs.modal', () => {
                wrapper.remove();
            }).modal();
        }

        function mimeTypeToLabel(mimeType: string) {
            switch (mimeType) {
                case MIME_TYPE_PLAIN: return 'Text';
                case MIME_TYPE_HTML: return 'HTML';
                case MIME_TYPE_MATHML: return 'MathML';
                case MIME_TYPE_TEX: return '(La)TeX';
            }
            return null;
        }

        function menuItemGetMarkup(mathItem: HTMLMathItemElement) {
            var submenu = [], sources = mathItem.getSources({ markup: true });
            each(sources, (source: HTMLMathSourceElement) => {
                var type = getSourceType(source), label,
                    markup = getSourceMarkup(source);
                if (markup) {
                    label = mimeTypeToLabel(type) || type;
                    if ($(source).attr('name'))
                        label += ' (' + $(source).attr('name') + ')';
                    submenu.push({
                        label: label,
                        action: () => {
                            showCopyMultilineDialog(label + ' for ' + getName(mathItem), markup);
                        }
                    });
                }
            });
            return submenu.length ? { label: 'Get markup', submenu: submenu } : { label: 'Get markup' };
        }

        function getPermalink(mathItem: HTMLMathItemElement) {
            var url = location.href;
            if ($(mathItem).attr('id')) {
                var pos = url.indexOf('#');
                if (pos >= 0)
                    url = url.substr(0, pos);
                url += '#' + $(mathItem).attr('id');
            }
            return url;
        }

        function menuItemGetPermalink(mathItem: HTMLMathItemElement) {
            return {
                label: 'Get permalink',
                action: () => {
                    showCopySingleLineDialog('Permalink for ' + getName(mathItem), getPermalink(mathItem));
                }
            };
        }

        function menuItemShare(mathItem: HTMLMathItemElement) {
            function share(url: string) {
                url += '?url=' + encodeURIComponent(getPermalink(mathItem));
                global.open(url, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');
            }
            return {
                label: 'Share', submenu: [
                    { label: 'Twitter', action: () => { share('https://twitter.com/share'); } },
                    { label: 'Google+', action: () => { share('https://plus.google.com/share'); } }
                ]
            };
        }

        function showAudioDialog(mathItem: HTMLMathItemElement) {
            var audio = $('<audio src="demo2-1a.mp3" controls style="width: 100%;"></audio>'),
                content = $('<div class="modal-content" />')
                    .append($('<div class="modal-header" />')
                        .append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'))
                        .append($('<h4 class="modal-title" />').append('Speak ' + getName(mathItem)))
                    ).append($('<div class="modal-body" />').append(audio))
                    .append($('<div class="modal-footer" />')
                        .append($('<button type="button" class="btn btn-default btn-xs" data-dismiss="modal">Close</button>'))),
                modal = $('<div class="modal" tabindex="-1" role="dialog" aria-hidden="true" />')
                    .append($('<div class="modal-dialog" />').append(content)),
                wrapper = $('<div class="math-ui" />').append(modal);

            $(doc.body).append(wrapper);

            modal.on('shown.bs.modal', () => {
                audio.focus();
            }).on('hidden.bs.modal', () => {
                wrapper.remove();
            }).modal();
        }

        function menuItemSpeak(mathItem: HTMLMathItemElement) {
            var item: ICommandItem = { label: 'Speak' };
            if ('src' in document.createElement('audio'))
                item.action = () => { showAudioDialog(mathItem); };
            return item;
        }

        function menuItemToCode(mathItem: HTMLMathItemElement) {
            var submenu = [];
            function make(lang: string, code: string) {
                return {
                    label: lang,
                    action: () => { showCopyMultilineDialog(getName(mathItem) + ' in ' + lang, code); }
                };
            }

            submenu.push(make('C', 'for (i = 1; i <= n; i++){\n  sum = sum + i;\n}\n'));
            submenu.push(make('Mathematica', 'Sum[i^2, {i, 1, n}]\n'));
            submenu.push(make('Python', 'sum(range(1, n+1))\n'));

            return { label: 'Convert to code', submenu: submenu };
        }

        function openNewWindow(url: string) {
            global.open(url);
        }

        function menuItemSearch(mathItem: HTMLMathItemElement): ICommandItem {
            var submenu = [], item: ICommandItem, markup,
                source = getSourceWithTypePreference(mathItem, [MIME_TYPE_TEX, MIME_TYPE_MATHML, MIME_TYPE_HTML]);

            item = { label: 'Google' };
            if (source) {
                markup = getSourceMarkup(source);
                item.action = () => {
                    openNewWindow('https://www.google.com/#q=' + encodeURIComponent(markup));
                }
            }
            submenu.push(item);

            item = { label: 'Tangent' };
            if (source && getSourceType(source) === MIME_TYPE_TEX) {
                markup = getSourceMarkup(source);
                item.action = () => {
                    openNewWindow('http://saskatoon.cs.rit.edu/tangent/?query=' + encodeURIComponent(markup));
                }
            }
            submenu.push(item);

            return { label: 'Search', submenu: submenu };
        }

        function menuItemOpenWith(mathItem: HTMLMathItemElement): ICommandItem {
            var submenu = [], item: ICommandItem, markup,
                source = getSourceWithTypePreference(mathItem, [MIME_TYPE_TEX, MIME_TYPE_MATHML, MIME_TYPE_HTML]);
            //submenu.push({ label: 'Mathematica', action: () => {} });
            //submenu.push({ label: 'Maple', action: () => {} });

            item = { label: 'WolframAlpha' };
            if (source) {
                markup = getSourceMarkup(source);
                item.action = () => {
                    openNewWindow('http://www.wolframalpha.com/input/?i=' + encodeURIComponent(markup));
                }
            }
            submenu.push(item);

            return { label: 'Open with...', submenu: submenu };
        }

        function getCommandItems(mathItem: HTMLMathItemElement): ICommandItem[] {
            var items = [];
            items.push(menuItemGetMarkup(mathItem));
            items.push(menuItemGetPermalink(mathItem));
            items.push(menuItemToCode(mathItem));
            items.push(menuItemOpenWith(mathItem));
            items.push(menuItemShare(mathItem));
            items.push(menuItemSearch(mathItem));
            items.push(menuItemSpeak(mathItem));
            return items;
        }

        function showEquationMenu(mathItem: HTMLMathItemElement) {
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
                    else if (!item.action)
                        a.addClass('disabled');
                    a.append(item.label);
                    options.append(a);
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
                });
            }

            $(doc.body).append(wrapper);
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

        function gotFocus(mathItem: HTMLMathItemElement) {
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
                    var mainMarkup = mathItem.getMainMarkup();
                    copyItem = $('<textarea />').val(mainMarkup ? mainMarkup.markup : getName(mathItem))
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
                    setDataTransfer((<ClipboardEvent> ev.originalEvent).clipboardData, mathItem);
                }
                async(() => {
                    removeCopyItem();
                    //blur();
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

        BootstrapLookAndFeel.prototype.add = function (mathItem: HTMLMathItemElement) {
            var $mathItem = $(mathItem);
            this.container.push(mathItem);
            if (!$mathItem.attr('id'))
                $mathItem.attr('id', 'math-item-' + this.container.length);
            $mathItem.attr('tabindex', 0).attr('draggable', 'true').on('focus', (ev) => {
                stopEvent(ev);
                gotFocus(mathItem);
            }).on('dragstart', (ev) => {
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
            })/*.on('dragend', () => {
                $mathItem.blur();
            })*/;
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
