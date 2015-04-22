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
        doc: Document = document,
        $: JQueryStatic,
        ACTIVE_CLASS = 'active', focusItem, hoverItem, menuItem, menuRemover, sidebar;

    interface ClipboardEvent extends Event {
        clipboardData: DataTransfer;
    }

    interface Dictionary<T> {
        [key: string]: T;
    }

    export interface MathUI {
        add(mathItem: HTMLMathItemElement): void;
        showDashboard(): void;
        highlightAll(): void;
        itemCount(): number;
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

    function getIdName(mathItem: HTMLMathItemElement) {
        return 'Equation ' + ((<HTMLMathItemElementPrivate> mathItem)._private.id + 1);
    }

    function getUserName(mathItem: HTMLMathItemElement) {
        return mathItem.getAttribute('name');
    }

    function getFullName(mathItem: HTMLMathItemElement) {
        var name = getIdName(mathItem), userName = getUserName(mathItem);
        if (userName)
            name += ' (' + userName + ')';
        return name;
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
        var $item = $(item), contentElement, display_inline,
            eraser = $('<div class="eraser"/>'),
            icons = map(['cog', 'zoom-in', 'unchecked', 'question-sign'], (i: string) =>
                $('<span class="glyphicon glyphicon-' + i + '" />')),
            top = $('<div class="top" />').append($('<span class="eqn-name" />')
                .append(getIdName(item)), icons),
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
        menu.on('mousedown keydown', (ev) => {
            if (ev.type === 'mousedown' && ev.which !== 1) return;
            stopEvent(ev);
            top.children().each(function (k) {
                if (ev.target === this) {
                    if (k <= 1)
                        sidebar.show(0);
                    else if (k === 2)
                        doZoom();
                    else
                        toggleSelected();
                }
            });
        });
        sidebar.setEquation(item);
        menuItem = item;
        menuRemover = () => {
            menu.remove();
            if (contentElement) contentElement.remove();
            $item.removeClass(ACTIVE_CLASS);
            sidebar.setEquation(null);
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
        if (sidebar.isShowing()) return;
        focusItem = null;
        checkState();
    }

    function onMouseEnter() {
        if (sidebar.isShowing()) return;
        hoverItem = this;
        checkState();
    }

    function onMouseLeave() {
        if (sidebar.isShowing()) return;
        hoverItem = null;
        checkState();
    }

    class BootstrapLookAndFeel implements MathUI {
        public container: HTMLMathItemElement[] = [];
        private highlighted: boolean = false;
        constructor(public $: JQueryStatic) {
        }
        add(mathItem: HTMLMathItemElement) {
            var $mathItem = $(mathItem);
            this.container.push(mathItem);
            if (!$mathItem.attr('id'))
                $mathItem.attr('id', 'math-item-' + this.container.length);
            $mathItem.attr('tabindex', 0).attr('draggable', 'true').on('focus', onFocus).on('blur', onBlur);
            $mathItem.on('mousedown', (ev) => {
                ev.stopPropagation();
            });
            $mathItem.mouseenter(onMouseEnter).mouseleave(onMouseLeave);
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
        }
        highlightAll() {
            var on = this.highlighted = !this.highlighted;
            each(this.container, (mathItem: HTMLMathItemElement) => {
                $(mathItem).toggleClass('highlight', on);
            });
        }
        showDashboard() {
            sidebar.show(2);
        }
        itemCount() {
            return this.container.length;
        }
    }

    export var mathUI: MathUI;

    interface PageController {
        registerPage(name: string, page: Page);
        pushPage(page: string): void;
        popPage(): void;
    }

    interface Page {
        setEquation(item: HTMLMathItemElement): void;
        getRoot(): JQuery;
    }

    function mimeTypeToName(mime: string) {
        switch (mime) {
            case 'application/mathml+xml':
                return 'MathML';
            case 'application/x-tex':
                return 'TeX';
            default:
                return mime;
        }
    }

    class MarkupPage implements Page {
        static pageName = 'markup';
        private root: JQuery;
        private selector: JQuery;
        private sources: HTMLMathSourceElement[] = [];
        constructor(private controller: PageController) {
            this.root = $('<h5>Markup <a href="#">back</a></h5>'+
                            '<p class="text-info" />'+
                            '<form>' +
                            '  <div class="form-group">' +
                            '    <label for="math-ui-markup-type">Type</label>' +
                            '    <select id="math-ui-markup-type" class="form-control" />' +
                            '  </div>' +
                            '  <div class="form-group">' +
                            '    <label for="math-ui-markup">Markup</label> <a href="#"><i class="glyphicon glyphicon-new-window"></i></a>' +
                            '    <textarea id="math-ui-markup" class="form-control" rows="10" />' +
                            '  </div>' +
                            '</form>');
            $(this.root[0]).find('a').on('click', (ev) => {
                ev.preventDefault();
                controller.popPage();
            });
            this.selector = $(this.root[2]).find('select');
            var textarea = $(this.root[2]).find('textarea');
            this.selector.on('change', (ev) => {
                if (this.sources.length) {
                    var value = +this.selector.val();
                    textarea.val(getSourceMarkup(this.sources[value]));
                }
            });
            textarea.on('focus', () => {
                async(() => {
                    textarea.select();
                });
            });
            $(this.root[2]).find('a').on('click', (ev) => {
                var popup = global.open('', 'Markup', 'width=800,height=600');
                $(popup.document.body).append($('<pre/>').text(textarea.val()));
            });
        }
        setEquation(item: HTMLMathItemElement) {
            this.sources = item ? item.getSources({ markup: true }) : [];
            $(this.root[1]).text(item ? getFullName(item) : '');
            this.selector.empty();
            each(this.sources, (source: HTMLMathSourceElement, k: number) => {
                var name = mimeTypeToName(getSourceType(source));
                if (source.hasAttribute('name'))
                    name += ' (' + source.getAttribute('name') + ')';
                this.selector.append($('<option value="' + k + '">' + name + '</option>'));
            });
            this.selector.trigger('change');
        }
        getRoot(): JQuery {
            return this.root;
        }
    }

    class PermalinkPage implements Page {
        static pageName = 'permalink';
        private root: JQuery;
        constructor(private controller: PageController) {
            this.root = $('<h5>Permalink <a href="#">back</a></h5>'+
                            '<p class="text-info" />'+
                            '<input type="text" class="form-control" value="http://example.com/kjgr983h">');
            $(this.root[0]).find('a').on('click', (ev) => {
                ev.preventDefault();
                controller.popPage();
            });
        }
        setEquation(item: HTMLMathItemElement) {
            $(this.root[1]).text(item ? getFullName(item) : '');
        }
        getRoot(): JQuery {
            return this.root;
        }
    }

    class ToCodePage implements Page {
        static pageName = 'tocode';
        private root: JQuery;
        private nameEl: JQuery;
        constructor(private controller: PageController) {
            this.root = $('<h5>Convert to Code <a href="#">back</a></h5>'+
                            '<p class="text-info" />'+
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
                            '</form>');
            $(this.root[0]).find('a').on('click', (ev) => {
                ev.preventDefault();
                controller.popPage();
            });
        }
        setEquation(item: HTMLMathItemElement) {
            $(this.root[1]).text(item ? getFullName(item) : '');
        }
        getRoot(): JQuery {
            return this.root;
        }
    }

    class EqnPage implements Page {
        static pageName = 'eqn';
        private root: JQuery;
        constructor(private controller: PageController) {
            var nav = $('<ul class="nav nav-pills nav-stacked" />');
            each(['Markup', 'Permalink', 'Convert to code', 'Open with', 'Share', 'Search', 'Speak'], (label) => {
                nav.append($('<li role="presentation" />').append($('<a href="#" />').append(label)));
            });
            nav.on('click', (ev) => {
                nav.find('a').each((k, elem) => {
                    if (ev.target === elem) {
                        ev.preventDefault();
                        var name = [MarkupPage.pageName, PermalinkPage.pageName, ToCodePage.pageName, null, null, null, null][k];
                        if (name)
                            this.controller.pushPage(name);
                    }
                });
            });
            this.root = $([$('<p class="text-info" />')[0], $('<p class="text-info" />')[0], nav[0]]);
            controller.registerPage(MarkupPage.pageName, new MarkupPage(controller));
            controller.registerPage(PermalinkPage.pageName, new PermalinkPage(controller));
            controller.registerPage(ToCodePage.pageName, new ToCodePage(controller));
        }
        setEquation(item: HTMLMathItemElement) {
            $(this.root[0]).text(item
                ? 'Number on page: ' + ((<HTMLMathItemElementPrivate> item)._private.id + 1) + ' out of ' + mathUI.itemCount()
                : '');
            if (item && getUserName(item))
                $(this.root[1]).text('Equation name: ' + getUserName(item)).show();
            else
                $(this.root[1]).hide();            
        }
        getRoot(): JQuery {
            return this.root;
        }
    }

    class SelectionPage implements Page {
        static pageName = 'selection';
        private root: JQuery;
        constructor() {
            this.root = $('<emph>Not implemented yet</emph>');
        }
        setEquation(item: HTMLMathItemElement) {
        }
        getRoot(): JQuery {
            return this.root;
        }
    }

    class GeneralPage implements Page {
        static pageName = 'general';
        private root: JQuery;
        constructor() {
            var p = $('<p/>'),
                nav = $('<ul class="nav nav-pills nav-stacked" />');
            each(['Highlight all equations', 'List all', 'Help', 'About'], (label) => {
                nav.append($('<li role="presentation" />').append($('<a href="#" />').append(label)));
            });
            nav.on('click', (ev) => {
                nav.find('a').each((k, elem) => {
                    if (ev.target === elem) {
                        ev.preventDefault();
                        if (k === 0)
                            mathUI.highlightAll();
                    }
                });
            });
            this.root = $([p[0], nav[0]]);
        }
        setEquation(item: HTMLMathItemElement) {
        }
        getRoot(): JQuery {
            $(this.root[0]).text('Equations on page: ' + mathUI.itemCount());
            return this.root;
        }
    }

    class Sidebar implements PageController {
        private body: JQuery = $('<div class="panel-body" />');
        private topmenu = $('<div class="btn-group btn-group-justified" role="group"><a href="#" class="btn btn-sm btn-primary active">Equation</a><a href="#" class="btn btn-sm btn-primary">Selection</a><a href="#" class="btn btn-sm btn-primary">Page</a></div>');
        private pages: Dictionary<Page> = {};
        private pageStack: Page[] = [];
        private currentItem: HTMLMathItemElement = null;
        constructor() {
            var closer = $('<button type="button" class="close">&times;</button>');
            $(doc.body).append($('<div id="math-ui-viewport" />')
                .append($('<div id="math-ui-bar" class="math-ui" />')
                .append($('<div class="panel panel-primary" />')
                .append($('<div class="panel-heading" />')
                .append(closer, $('<h4 class="panel-title">Math UI</h4>')
                ),
                this.topmenu, this.body))));
            closer.on('click', (ev) => {
                this.hide();
            });
            this.registerPage(EqnPage.pageName, new EqnPage(this));
            this.registerPage(SelectionPage.pageName, new SelectionPage());
            this.registerPage(GeneralPage.pageName, new GeneralPage());
            this.topmenu.on('click', (ev) => {
                ev.preventDefault();
                this.topmenu.find('a').each((k, elem) => {
                    if (ev.target === elem) {
                        this.showTop(k);
                    }
                });
            });
            $(doc).on('mousedown', () => {
                if (this.isShowing())
                    this.hide();
            });
            $('#math-ui-bar').on('mousedown', (ev) => {
                ev.stopPropagation();
            });
        }
        registerPage(name: string, page: Page) {
            this.pages[name] = page;
        }
        _pushPage(page: Page) {
            this.pageStack.push(page);
            this.body.contents().detach();
            this.body.append(page.getRoot());
            this.body.find('a').first().focus();
        }
        pushPage(name: string) {
            this._pushPage(this.pages[name]);
        }
        popPage() {
            this.pageStack.pop();
            this._pushPage(this.pageStack.pop());
        }
        setEquation(item: HTMLMathItemElement) {
            this.currentItem = item;
            this.topmenu.find('a').first().toggleClass('disabled', !item);
            for (var n in this.pages)
                if (this.pages.hasOwnProperty(n))
                    this.pages[n].setEquation(item);
        }
        private showTop(k: number) {
            var as = this.topmenu.find('a');
            as.removeClass('active');
            $(as[k]).addClass('active');
            var name = [EqnPage.pageName, SelectionPage.pageName, GeneralPage.pageName][k];
            this.pageStack = [];
            this.pushPage(name);
        }
        show(topIndex: number) {
            $(document.body).addClass('math-ui-show');
            this.showTop(topIndex);
        }
        hide() {
            $(document.body).removeClass('math-ui-show');
            if (menuRemover) menuRemover();
            if (this.currentItem)
                $(this.currentItem).focus();
        }
        isShowing() {
            return $(document.body).hasClass('math-ui-show');
        }
    }

    requireLibs().then((jq: JQueryStatic) => {

        $ = jq;
        sidebar = new Sidebar();
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
