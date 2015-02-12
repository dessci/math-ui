/// <reference path="jquery.d.ts" />
/// <reference path="../libs/math-item/math-item-element.d.ts" />
/// <reference path="../tmp/loader.d.ts" />

interface JQuery {
    modal(options?: any): void;
}

module FlorianMath {
    'use strict';

    var _ = _utils.common, $ = jQueryLib;

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
        var el = $(mathItem),
            menuItems = makeMenuItems(mathItem),
            items = $('<ul class="nav nav-pills" />'),
            menu = $('<div class="math-ui math-ui-eqn-menu" />').append($('<div class="well" />').append(items)),
            selected = -1;
        function setSelected(sel) {
            sel = (sel + menuItems.length) % menuItems.length;
            if (sel === selected) return;
            selected = sel;
            var lis = menu.find('li');
            lis.removeClass('active');
            $(lis[sel+1]).addClass('active');
        }
        function triggerSelected() {
            el.blur();
            _utils.dom.async(() => {
                menuItems[selected].action();
            });
        }
        items.append($('<li />').append($('<span class="title" />').append(getName(mathItem))));
        _.each(menuItems, (menuItem: MenuItem) => {
            items.append($('<li role="presentation" />').append(
                $('<a tabindex="-1" href="#" />').append(menuItem.label)));
        });
        menu.on('mousedown', (ev: JQueryMouseEventObject) => {
            if (ev.which !== 1) return;
            menu.find('a').each((k, elem) => {
                if (elem === ev.target) {
                    stopEvent(ev);
                    setSelected(k);
                    triggerSelected();
                }
            });
        });
        el.on('keydown', (ev: JQueryKeyEventObject) => {
            if (ev.which === 39 || ev.which === 40)
                setSelected(selected + 1);
            else if (ev.which === 37 || ev.which === 38)
                setSelected(selected - 1);
            else if (ev.which === 13)
                triggerSelected();
            else if (ev.which === 27)
                el.blur();
            else
                return;
            stopEvent(ev);
        }).on('blur',() => {
            menu.remove();
        }).append(menu);
        setSelected(0);
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
