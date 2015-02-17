/// <reference path="jquery.d.ts" />
/// <reference path="../libs/math-item/math-item-element.d.ts" />
/// <reference path="../tmp/loader.d.ts" />

interface JQuery {
    modal(options?: any): void;
}

module FlorianMath {
    'use strict';

    var _ = _utils.common, $ = jQueryLib;

    export interface HTMLMathItemElement {
        selected?: boolean;
    }

    interface MenuItem {
        label: string;
        action: () => void;
    }

    function getName(mathItem: HTMLMathItemElement) {
        return 'Equation ' + ((<any> mathItem)._id + 1);
    }

    // Zoom

    function zoomAction(mathItem: HTMLMathItemElement) {
        var inner = $('<div class="panel-body" />'),
            popup = $('<div class="math-ui math-ui-zoom" />')
                .append($('<div class="panel panel-default" />').append(inner));
        $(mathItem).append(popup);
        mathItem.clonePresentation(inner[0]);
        $(document).on('mousedown keydown', (ev) => {
            ev.stopPropagation();
            popup.remove();
        });
    }

    // View Markup

    function sourceDataToLabel(sd: MarkupData) {
        var label = sd.type;
        if (sd.subtype) label += ' (' + sd.subtype + ')';
        return label;
    }

    function sourceAction(mathItem: HTMLMathItemElement) {
        var tabs = $('<ul class="nav nav-pills" />'),
            markup = $('<textarea class="form-control" readonly />'),
            content = $('<div class="modal-content" />')
                .append($('<div class="modal-header" />')
                    .append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'))
                    .append($('<h4 class="modal-title" />').append('Markup for ' + getName(mathItem)))
                )
                .append($('<div class="modal-body" />').append(tabs, markup))
                .append($('<div class="modal-footer" />')
                    .append($('<button type="button" class="btn btn-primary">Select All</button>'))
                    .append($('<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'))
                ),
            modal = $('<div class="modal" tabindex="-1" role="dialog" aria-hidden="true" />')
                .append($('<div class="modal-dialog modal-lg" />').append(content)),
            wrapper = $('<div class="math-ui" />').append(modal),
            selected = -1,
            sources: MarkupData[] = [];

        function setSelected(s: number) {
            var tabItems = tabs.children();
            if (s === selected) return;
            selected = s;
            tabItems.removeClass('active');
            markup.text(sources[s].markup);
            $(tabItems[s]).addClass('active');
        }

        mathItem.getMarkup().then((_sources: MarkupData[]) => {
            sources = _sources;
            _.each(sources, (sourceData: MarkupData) => {
                tabs.append($('<li role="presentation" />').append($('<a href="#" />')
                    .append(sourceDataToLabel(sourceData))));
            });
            setSelected(0);
        });

        tabs.on('click', (ev) => {
            tabs.find('a').each((k, elem) => {
                ev.preventDefault();
                if (elem === ev.target)
                    setSelected(k);
            });
        });

        content.find('.modal-footer > button').first().on('click', () => {
            markup.focus().select();
        });

        $(document.body).append(wrapper);
        modal.on('hidden.bs.modal',() => {
            wrapper.remove();
        }).modal();
    }

    // Commands menu

    interface ICommandItem {
        label: string;
        submenu?: ICommandItem[];
        action?: () => void;
        link?: string;
    }

    function noOp() {}

    function getCommandItems(mathItem: HTMLMathItemElement): ICommandItem[] {
        return [
            { label: 'Copy to clipboard', action: noOp },
            { label: 'Copy permalink', action: noOp },
            { label: 'Convert to code', submenu: [
                { label: 'C', action: noOp },
                { label: 'JavaScript', action: noOp },
                { label: 'Python', action: noOp }
            ] },
            { label: 'Open with', submenu: [
                { label: 'Mathematica', action: noOp },
                { label: 'Maple', action: noOp },
                { label: 'WolframAlpha', link: 'http://www.wolframalpha.com/input/?i=sin%5Bx%5D*sin%5By%5D' }
            ] },
            { label: 'Share', submenu: [
                { label: 'Twitter', action: noOp },
                { label: 'Email', action: noOp }
            ] },
            { label: 'Search', submenu: [
                { label: 'Google', action: noOp },
                { label: 'Tangent', action: noOp }
            ] },
            { label: 'Speak', action: noOp },
        ];
    }

    function setCommands(mathItem: HTMLMathItemElement, options: JQuery, commands: ICommandItem[]) {
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

        function update() {
            options.children().remove();
            _.each(commands, (item: ICommandItem) => {
                var a = $('<a href="#" class="list-group-item" />');
                if (item.submenu)
                    a.append($('<span class="glyphicon glyphicon-triangle-right"></span>'));
                else if (item.link)
                    (<HTMLAnchorElement> a[0]).href = item.link;
                a.append(item.label);
                options.append(a);
                if (!item.link) {
                    a.on('click', (ev: JQueryMouseEventObject) => {
                        stopEvent(ev);
                        if (item.submenu) {
                            commands = item.submenu;
                            update();
                        } else {
                            modal.modal('hide');
                            item.action();
                        }
                    });
                }
            });
        }

        update();

        $(document.body).append(wrapper);
        modal.on('hidden.bs.modal',() => {
            wrapper.remove();
        }).modal();
    }

    // Equation menu

    function makeMenuItems(mathItem: HTMLMathItemElement): MenuItem[] {
        var result: MenuItem[] = [];
        if (mathItem.clonePresentation)
            result.push({ label: 'Zoom', action: () => { zoomAction(mathItem) } });
        if (mathItem.getMarkup)
            result.push({ label: 'View Markup', action: () => { sourceAction(mathItem) } });
        result.push({ label: 'Dashboard', action: () => { lnf.showDashboard() } });
        return result;
    }

    function stopEvent(ev: BaseJQueryEventObject) {
        ev.preventDefault();
        ev.stopPropagation();
    }

    function gotFocus(mathItem: HTMLMathItemElement) {
        var el = $(mathItem), okItem,
            items = $('<div class="well" />'),
            menu = $('<div class="math-ui math-ui-eqn-menu" />').append(items);
        function doZoom(ev: BaseJQueryEventObject) {
            stopEvent(ev);
            el.blur();
            zoomAction(mathItem);
        }
        function toggleSelection(ev: BaseJQueryEventObject) {
            stopEvent(ev);
            mathItem.selected = !mathItem.selected;
            okItem.toggleClass('glyphicon-star', mathItem.selected);
            okItem.toggleClass('glyphicon-star-empty', !mathItem.selected);
        }
        function showEqnMenu(ev: BaseJQueryEventObject) {
            stopEvent(ev);
            el.blur();
            showEquationMenu(mathItem);            
        }
        items.append($('<span class="title" />').append(getName(mathItem)));
        items.append($('<span class="glyphicon glyphicon-menu-hamburger" aria-hidden="true"></span>'));
        items.append($('<span class="glyphicon glyphicon-zoom-in" aria-hidden="true"></span>'));
        okItem = $('<span class="glyphicon" aria-hidden="true"></span>');
        okItem.addClass(mathItem.selected === true ? 'glyphicon-star' : 'glyphicon-star-empty');
        items.append(okItem);
        el.on('keydown', (ev: JQueryKeyEventObject) => {
            if (ev.which === 13) {
                showEqnMenu(ev);
            } else if (ev.which === 27) {
                stopEvent(ev);
                el.blur();
            } else if (ev.which === 32) {
                toggleSelection(ev);
            } else if (ev.which === 90) {
                doZoom(ev);
            }
        }).on('blur',() => {
            menu.remove();
        }).append(menu);
        menu.on('click', (ev: JQueryMouseEventObject) => {
            if (ev.which !== 1) return;
            items.children().each((k, elem) => {
                if (elem === ev.target) {
                    if (k <= 1)
                        showEqnMenu(ev);
                    if (k === 2)
                        doZoom(ev);
                    else if (k === 3)
                        toggleSelection(ev);
                }
            });
        });
    }

    // Main class

    class BootstrapLookAndFeel {
        private highlighted = false;
        init(mathItem: HTMLMathItemElement) {
            $(mathItem).attr('tabindex', 0).on('focus', (ev) => {
                stopEvent(ev);
                gotFocus(mathItem);
            });
        }
        highlightAll() {
            var on = this.highlighted = !this.highlighted;
            _.each(container, (mathItem: HTMLMathItemElement) => {
                var el = $(mathItem);
                on ? el.addClass('highlight') : el.removeClass('highlight');
            });
        }
        showDashboard() {
            var body = $('<div class="modal-body" />')
                .append($('<div class="btn-group-vertical" />')
                    .append($('<button type="button" class="btn btn-primary form-control">Highlight All Equations</button>'))
                    .append($('<button type="button" class="btn btn-primary form-control">About</button>'))
                    .append($('<button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>'))
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
                body.find('button').each((k, elem) => {
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
            modal.on('hidden.bs.modal',() => {
                wrapper.remove();
            }).modal();
        }
    }

    // Resolve 'lookAndFeel' to signal a successful load
    var lnf = new BootstrapLookAndFeel();
    lookAndFeel.resolve(lnf);

    _.each(container, (mathItem: HTMLMathItemElement) => {
        lnf.init(mathItem);
    });

}
