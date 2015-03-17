/// <reference path="jquery.d.ts" />
/// <reference path="../bower_components/math-item/math-item.d.ts" />
var FlorianMath;
(function (FlorianMath) {
    'use strict';
    var requireLibsResolve;
    FlorianMath.requireLibs = (function () {
        var promise = new FlorianMath.Promise(function (resolve) {
            requireLibsResolve = resolve;
        });
        return function () { return promise; };
    })();
    function jQueryPresent() {
        return 'jQuery' in window && jQuery.fn.on;
    }
    function fail() {
        //console.log('Unable to load jQuery');
    }
    FlorianMath.domReady().then(function () {
        if (!jQueryPresent()) {
            var IEpre9 = navigator.userAgent.match(/MSIE [6-8]/i), version = IEpre9 ? '1.11.2' : '2.1.3', script = document.createElement('script'), head = document.querySelector('head'), done = false;
            script.src = 'https://code.jquery.com/jquery-' + version + '.min.js';
            script.async = true;
            script.onload = script.onreadystatechange = function () {
                if (!done && (!script.readyState || script.readyState === "loaded" || script.readyState === "complete")) {
                    done = true;
                    //jQueryPresent() ? requireLibsResolve(<JQueryStatic> jQuery.noConflict(true)) : fail();
                    if (jQueryPresent()) {
                        //console.log('jQuery loaded');
                        requireLibsResolve(jQuery.noConflict(true));
                    }
                    else
                        fail();
                }
            };
            script.onerror = function () {
                if (!done) {
                    done = true;
                    fail();
                }
            };
            head.appendChild(script);
        }
        else
            requireLibsResolve(jQuery);
    });
})(FlorianMath || (FlorianMath = {}));
/// <reference path="jquery.d.ts" />
/// <reference path="../bower_components/math-item/math-item.d.ts" />
/// <reference path="requirelibs.ts" />
var FlorianMath;
(function (FlorianMath) {
    'use strict';
    var global = window, doc = document;
    var log = function () {
    };
    if ('console' in global && console.log)
        log = function (message, arg1, arg2) {
            if (arg2 !== undefined)
                console.log(message, arg1, arg2);
            else if (arg1 !== undefined)
                console.log(message, arg1);
            else
                console.log(message);
        };
    function getName(mathItem) {
        return 'Equation ' + (mathItem._private.id + 1);
    }
    function setDataTransfer(data, mathItem) {
        var sources = mathItem.getSources({ markup: true });
        FlorianMath.each(sources, function (source) {
            data.setData(FlorianMath.getSourceType(source), FlorianMath.getSourceMarkup(source));
        });
    }
    function stopEvent(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    }
    FlorianMath.mathUI;
    FlorianMath.requireLibs().then(function ($) {
        // Zoom
        function zoomAction(mathItem) {
            var inner = $('<div class="panel-body" />'), popup = $('<div class="math-ui math-ui-zoom" />').append($('<div class="panel panel-default" />').append(inner)), mathItemClone = mathItem.cloneNode(true);
            HTMLMathItemElement.manualCreate(mathItemClone, true);
            mathItemClone.clean();
            inner.append(mathItemClone);
            $(doc).on('mousedown keydown', function (ev) {
                if (ev.type === 'mousedown' && ev.which !== 1)
                    return;
                ev.stopPropagation();
                popup.remove();
            });
            $(mathItem).before(popup);
            HTMLMathItemElement.manualAttach(mathItemClone, true);
        }
        // Commands menu
        function showCopyMultilineDialog(title, text) {
            var textarea = $('<textarea class="form-control" rows="5" />').append(doc.createTextNode(text)), content = $('<div class="modal-content" />').append($('<div class="modal-header" />').append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>')).append($('<h4 class="modal-title" />').append(title))).append($('<div class="modal-body" />').append(textarea)).append($('<div class="modal-footer" />').append($('<button type="button" class="btn btn-default btn-xs" data-dismiss="modal">Close</button>'))), modal = $('<div class="modal" tabindex="-1" role="dialog" aria-hidden="true" />').append($('<div class="modal-dialog" />').append(content)), wrapper = $('<div class="math-ui" />').append(modal);
            $(doc.body).append(wrapper);
            modal.on('shown.bs.modal', function () {
                textarea.focus().select();
            }).on('hidden.bs.modal', function () {
                wrapper.remove();
            }).modal();
        }
        function showCopySingleLineDialog(title, text) {
            var input = $('<input type="url" class="form-control">'), content = $('<div class="modal-content" />').append($('<div class="modal-header" />').append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>')).append($('<h4 class="modal-title" />').append(title))).append($('<div class="modal-body" />').append(input)).append($('<div class="modal-footer" />').append($('<button type="button" class="btn btn-default btn-xs" data-dismiss="modal">Close</button>'))), modal = $('<div class="modal" tabindex="-1" role="dialog" aria-hidden="true" />').append($('<div class="modal-dialog" />').append(content)), wrapper = $('<div class="math-ui" />').append(modal);
            input.val(text);
            $(doc.body).append(wrapper);
            modal.on('shown.bs.modal', function () {
                input.focus().select();
            }).on('hidden.bs.modal', function () {
                wrapper.remove();
            }).modal();
        }
        function mimeTypeToLabel(mimeType) {
            switch (mimeType) {
                case FlorianMath.MIME_TYPE_PLAIN: return 'Text';
                case FlorianMath.MIME_TYPE_HTML: return 'HTML';
                case FlorianMath.MIME_TYPE_MATHML: return 'MathML';
                case FlorianMath.MIME_TYPE_TEX: return '(La)TeX';
            }
            return null;
        }
        function menuItemGetMarkup(mathItem) {
            var submenu = [], sources = mathItem.getSources({ markup: true });
            FlorianMath.each(sources, function (source) {
                var type = FlorianMath.getSourceType(source), label, markup = FlorianMath.getSourceMarkup(source);
                if (markup) {
                    label = mimeTypeToLabel(type) || type;
                    if ($(source).attr('name'))
                        label += ' (' + $(source).attr('name') + ')';
                    submenu.push({
                        label: label,
                        action: function () {
                            showCopyMultilineDialog(label + ' for ' + getName(mathItem), markup);
                        }
                    });
                }
            });
            return submenu.length ? { label: 'Get markup', submenu: submenu } : { label: 'Get markup' };
        }
        function getPermalink(mathItem) {
            var url = location.href;
            if ($(mathItem).attr('id')) {
                var pos = url.indexOf('#');
                if (pos >= 0)
                    url = url.substr(0, pos);
                url += '#' + $(mathItem).attr('id');
            }
            return url;
        }
        function menuItemGetPermalink(mathItem) {
            return {
                label: 'Get permalink',
                action: function () {
                    showCopySingleLineDialog('Permalink for ' + getName(mathItem), getPermalink(mathItem));
                }
            };
        }
        function menuItemShare(mathItem) {
            function share(url) {
                url += '?url=' + encodeURIComponent(getPermalink(mathItem));
                global.open(url, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');
            }
            return {
                label: 'Share',
                submenu: [
                    { label: 'Twitter', action: function () {
                        share('https://twitter.com/share');
                    } },
                    { label: 'Google+', action: function () {
                        share('https://plus.google.com/share');
                    } }
                ]
            };
        }
        function showAudioDialog(mathItem) {
            var audio = $('<audio src="demo2-1a.mp3" controls style="width: 100%;"></audio>'), content = $('<div class="modal-content" />').append($('<div class="modal-header" />').append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>')).append($('<h4 class="modal-title" />').append('Speak ' + getName(mathItem)))).append($('<div class="modal-body" />').append(audio)).append($('<div class="modal-footer" />').append($('<button type="button" class="btn btn-default btn-xs" data-dismiss="modal">Close</button>'))), modal = $('<div class="modal" tabindex="-1" role="dialog" aria-hidden="true" />').append($('<div class="modal-dialog" />').append(content)), wrapper = $('<div class="math-ui" />').append(modal);
            $(doc.body).append(wrapper);
            modal.on('shown.bs.modal', function () {
                audio.focus();
            }).on('hidden.bs.modal', function () {
                wrapper.remove();
            }).modal();
        }
        function menuItemSpeak(mathItem) {
            var item = { label: 'Speak' };
            if ('src' in document.createElement('audio'))
                item.action = function () {
                    showAudioDialog(mathItem);
                };
            return item;
        }
        function menuItemToCode(mathItem) {
            var submenu = [];
            function make(lang, code) {
                return {
                    label: lang,
                    action: function () {
                        showCopyMultilineDialog(getName(mathItem) + ' in ' + lang, code);
                    }
                };
            }
            submenu.push(make('C', 'for (i = 1; i <= n; i++){\n  sum = sum + i;\n}\n'));
            submenu.push(make('Mathematica', 'Sum[i^2, {i, 1, n}]\n'));
            submenu.push(make('Python', 'sum(range(1, n+1))\n'));
            return { label: 'Convert to code', submenu: submenu };
        }
        function openNewWindow(url) {
            global.open(url);
        }
        function menuItemSearch(mathItem) {
            var submenu = [], item, markup, source = FlorianMath.getSourceWithTypePreference(mathItem, [FlorianMath.MIME_TYPE_TEX, FlorianMath.MIME_TYPE_MATHML, FlorianMath.MIME_TYPE_HTML]);
            item = { label: 'Google' };
            if (source) {
                markup = FlorianMath.getSourceMarkup(source);
                item.action = function () {
                    openNewWindow('https://www.google.com/#q=' + encodeURIComponent(markup));
                };
            }
            submenu.push(item);
            item = { label: 'Tangent' };
            if (source && FlorianMath.getSourceType(source) === FlorianMath.MIME_TYPE_TEX) {
                markup = FlorianMath.getSourceMarkup(source);
                item.action = function () {
                    openNewWindow('http://saskatoon.cs.rit.edu/tangent/?query=' + encodeURIComponent(markup));
                };
            }
            submenu.push(item);
            return { label: 'Search', submenu: submenu };
        }
        function menuItemOpenWith(mathItem) {
            var submenu = [], item, markup, source = FlorianMath.getSourceWithTypePreference(mathItem, [FlorianMath.MIME_TYPE_TEX, FlorianMath.MIME_TYPE_MATHML, FlorianMath.MIME_TYPE_HTML]);
            //submenu.push({ label: 'Mathematica', action: () => {} });
            //submenu.push({ label: 'Maple', action: () => {} });
            item = { label: 'WolframAlpha' };
            if (source) {
                markup = FlorianMath.getSourceMarkup(source);
                item.action = function () {
                    openNewWindow('http://www.wolframalpha.com/input/?i=' + encodeURIComponent(markup));
                };
            }
            submenu.push(item);
            return { label: 'Open with...', submenu: submenu };
        }
        function getCommandItems(mathItem) {
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
        function showEquationMenu(mathItem) {
            var options = $('<div class="list-group" />'), content = $('<div class="modal-content" />').append($('<div class="modal-header" />').append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>')).append($('<h4 class="modal-title" />').append(getName(mathItem)))).append($('<div class="modal-body" />').append(options)), modal = $('<div class="modal" tabindex="-1" role="dialog" aria-hidden="true" />').append($('<div class="modal-dialog modal-sm" />').append(content)), wrapper = $('<div class="math-ui math-ui-eqn-commands" />').append(modal), commands = getCommandItems(mathItem);
            function focusFirst() {
                options.find('a').first().focus();
            }
            function update() {
                options.children().remove();
                FlorianMath.each(commands, function (item) {
                    var a = $('<a href="#" class="list-group-item" />');
                    if (item.submenu)
                        a.append($('<span class="glyphicon glyphicon-triangle-right"></span>'));
                    else if (!item.action)
                        a.addClass('disabled');
                    a.append(item.label);
                    options.append(a);
                    a.on('click', function (ev) {
                        stopEvent(ev);
                        if (item.submenu) {
                            commands = item.submenu;
                            update();
                            focusFirst();
                        }
                        else {
                            modal.modal('hide');
                            item.action();
                        }
                    });
                });
            }
            $(doc.body).append(wrapper);
            update();
            modal.on('shown.bs.modal', focusFirst).on('hidden.bs.modal', function () {
                wrapper.remove();
            }).modal();
        }
        // Equation menu
        function keyModifiers(ev) {
            return (ev.shiftKey ? 1 : 0) | (ev.ctrlKey ? 2 : 0) | (ev.altKey ? 4 : 0) | (ev.metaKey ? 8 : 0);
        }
        function gotFocus(mathItem) {
            var $mathItem = $(mathItem), okItem, contentElement, copyItem, items = $('<div class="well" />'), menu = $('<div class="math-ui math-ui-eqn-menu" />').append(items);
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
            if ($mathItem.hasClass('focus'))
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
            $mathItem.addClass('focus').on('keydown', function (ev) {
                var mods = keyModifiers(ev);
                if (!copyItem && ((ev.which === 17 && mods === 2) || (ev.which === 91 && mods === 8))) {
                    var mainMarkup = mathItem.getMainMarkup();
                    copyItem = $('<textarea />').val(mainMarkup ? mainMarkup.markup : getName(mathItem)).on('keyup', function (ev) {
                        if (ev.which === 17 || ev.which === 91)
                            removeCopyItem();
                    });
                    menu.append(copyItem);
                    copyItem.focus().select();
                }
                else if (mods === 0) {
                    var k = FlorianMath.indexOf([13, 27, 32, 90], ev.which);
                    if (k >= 0) {
                        stopEvent(ev);
                        [showEqnMenu, blur, toggleSelection, doZoom][k]();
                    }
                }
            }).on('copy', function (ev) {
                log('copy', ev);
                if (ev.originalEvent.clipboardData) {
                    log('decorating copy');
                    setDataTransfer(ev.originalEvent.clipboardData, mathItem);
                }
                FlorianMath.async(function () {
                    removeCopyItem();
                    blur();
                });
            }).on('blur', function () {
                if (!copyItem) {
                    $mathItem.off('keydown copy blur').removeClass('focus');
                    menu.remove();
                    if (contentElement)
                        contentElement.remove();
                }
            });
            menu.on('mousedown', function (ev) {
                if (ev.which !== 1)
                    return;
                stopEvent(ev);
                items.children().each(function (k, elem) {
                    if (elem === ev.target) {
                        [showEqnMenu, showEqnMenu, doZoom, toggleSelection][k]();
                    }
                });
            });
        }
        // Main class
        function BootstrapLookAndFeel(jq) {
            this.container = [];
            this.highlighted = false;
            this.$ = jq;
        }
        BootstrapLookAndFeel.prototype.add = function (mathItem) {
            var $mathItem = $(mathItem);
            this.container.push(mathItem);
            if (!$mathItem.attr('id'))
                $mathItem.attr('id', 'math-item-' + this.container.length);
            $mathItem.attr('tabindex', 0).attr('draggable', 'true').on('focus', function (ev) {
                stopEvent(ev);
                gotFocus(mathItem);
            }).on('dragstart', function (ev) {
                if (ev.originalEvent.dataTransfer) {
                    var dt = ev.originalEvent.dataTransfer, mainMarkup = mathItem.getMainMarkup();
                    try {
                        if (mainMarkup)
                            dt.setData(FlorianMath.MIME_TYPE_PLAIN, mainMarkup.markup);
                        setDataTransfer(dt, mathItem);
                    }
                    catch (e) {
                        // IE only accepts type 'text' http://stackoverflow.com/a/18051912/212069
                        if (mainMarkup)
                            dt.setData('text', mainMarkup.markup);
                    }
                }
            }).on('dragend', function () {
                $mathItem.blur();
            });
        };
        BootstrapLookAndFeel.prototype.highlightAll = function () {
            var on = this.highlighted = !this.highlighted;
            FlorianMath.each(this.container, function (mathItem) {
                $(mathItem).toggleClass('highlight', on);
            });
        };
        BootstrapLookAndFeel.prototype.showDashboard = function () {
            var _this = this;
            var body = $('<div class="modal-body" />').append($('<div class="list-group" />').append($('<a href="#" class="list-group-item">Highlight All Equations</a>')).append($('<a href="#" class="list-group-item">About</a>')).append($('<a href="#" class="list-group-item" data-dismiss="modal">Close</a>'))), modal = $('<div class="modal math-ui-dashboard" tabindex="-1" role="dialog" aria-hidden="true" />').append($('<div class="modal-dialog modal-sm" />').append($('<div class="modal-content" />').append($('<div class="modal-header" />').append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>')).append($('<h4 class="modal-title" />').append('Dashboard'))).append(body))), wrapper = $('<div class="math-ui" />').append(modal);
            body.on('click', function (ev) {
                body.find('a').each(function (k, elem) {
                    if (k <= 1 && elem === ev.target) {
                        ev.preventDefault();
                        modal.modal('hide');
                        if (k === 0) {
                            _this.highlightAll();
                        }
                        else {
                            global.location.href = 'https://github.com/dessci/math-ui';
                        }
                    }
                });
            });
            $(doc.body).append(wrapper);
            modal.on('hidden.bs.modal', function () {
                wrapper.remove();
            }).modal();
        };
        FlorianMath.mathUI = new BootstrapLookAndFeel($);
        FlorianMath.dispatchCustomEvent(doc, 'created.math-ui');
        FlorianMath.initialized().then(function () {
            log('Applying MathUI to math-items');
            FlorianMath.each(doc.querySelectorAll('math-item'), function (mathItem) {
                FlorianMath.mathUI.add(mathItem);
            });
        });
        function pagerendered() {
            log('page rendered');
            if (location.hash) {
                var item = doc.querySelector(FlorianMath.MATH_ITEM_TAG + location.hash);
                if (item) {
                    item.scrollIntoView();
                    item.focus();
                }
            }
        }
        if (FlorianMath.rendering())
            FlorianMath.addCustomEventListener(doc, FlorianMath.ALL_RENDERED_EVENT, function onpagerendered() {
                FlorianMath.removeCustomEventListener(doc, FlorianMath.ALL_RENDERED_EVENT, onpagerendered);
                pagerendered();
            });
        else
            pagerendered();
    });
})(FlorianMath || (FlorianMath = {}));

FlorianMath.requireLibs().then(function (jQuery) {
/*!
 * Bootstrap v3.3.4 (http://getbootstrap.com)
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 */

/*!
 * Generated using the Bootstrap Customizer (http://getbootstrap.com/customize/?id=74d368b4aae45799e9f9)
 * Config saved to config.json and https://gist.github.com/74d368b4aae45799e9f9
 */
if (typeof jQuery === 'undefined') {
  throw new Error('Bootstrap\'s JavaScript requires jQuery')
}
+function ($) {
  'use strict';
  var version = $.fn.jquery.split(' ')[0].split('.')
  if ((version[0] < 2 && version[1] < 9) || (version[0] == 1 && version[1] == 9 && version[2] < 1)) {
    throw new Error('Bootstrap\'s JavaScript requires jQuery version 1.9.1 or higher')
  }
}(jQuery);

/* ========================================================================
 * Bootstrap: modal.js v3.3.2
 * http://getbootstrap.com/javascript/#modals
 * ========================================================================
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // MODAL CLASS DEFINITION
  // ======================

  var Modal = function (element, options) {
    this.options             = options
    this.$body               = $(document.body)
    this.$element            = $(element)
    this.$dialog             = this.$element.find('.modal-dialog')
    this.$backdrop           = null
    this.isShown             = null
    this.originalBodyPad     = null
    this.scrollbarWidth      = 0
    this.ignoreBackdropClick = false

    if (this.options.remote) {
      this.$element
        .find('.modal-content')
        .load(this.options.remote, $.proxy(function () {
          this.$element.trigger('loaded.bs.modal')
        }, this))
    }
  }

  Modal.VERSION  = '3.3.2'

  Modal.TRANSITION_DURATION = 300
  Modal.BACKDROP_TRANSITION_DURATION = 150

  Modal.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  }

  Modal.prototype.toggle = function (_relatedTarget) {
    return this.isShown ? this.hide() : this.show(_relatedTarget)
  }

  Modal.prototype.show = function (_relatedTarget) {
    var that = this
    var e    = $.Event('show.bs.modal', { relatedTarget: _relatedTarget })

    this.$element.trigger(e)

    if (this.isShown || e.isDefaultPrevented()) return

    this.isShown = true

    this.checkScrollbar()
    this.setScrollbar()
    this.$body.addClass('math-ui-modal-open')

    this.escape()
    this.resize()

    this.$element.on('click.dismiss.bs.modal', '[data-dismiss="modal"]', $.proxy(this.hide, this))

    this.$dialog.on('mousedown.dismiss.bs.modal', function () {
      that.$element.one('mouseup.dismiss.bs.modal', function (e) {
        if ($(e.target).is(that.$element)) that.ignoreBackdropClick = true
      })
    })

    this.backdrop(function () {
      var transition = $.support.transition && that.$element.hasClass('fade')

      if (!that.$element.parent().length) {
        that.$element.appendTo(that.$body) // don't move modals dom position
      }

      that.$element
        .show()
        .scrollTop(0)

      that.adjustDialog()

      if (transition) {
        that.$element[0].offsetWidth // force reflow
      }

      that.$element
        .addClass('in')
        .attr('aria-hidden', false)

      that.enforceFocus()

      var e = $.Event('shown.bs.modal', { relatedTarget: _relatedTarget })

      transition ?
        that.$dialog // wait for modal to slide in
          .one('bsTransitionEnd', function () {
            that.$element.trigger('focus').trigger(e)
          })
          .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
        that.$element.trigger('focus').trigger(e)
    })
  }

  Modal.prototype.hide = function (e) {
    if (e) e.preventDefault()

    e = $.Event('hide.bs.modal')

    this.$element.trigger(e)

    if (!this.isShown || e.isDefaultPrevented()) return

    this.isShown = false

    this.escape()
    this.resize()

    $(document).off('focusin.bs.modal')

    this.$element
      .removeClass('in')
      .attr('aria-hidden', true)
      .off('click.dismiss.bs.modal')
      .off('mouseup.dismiss.bs.modal')

    this.$dialog.off('mousedown.dismiss.bs.modal')

    $.support.transition && this.$element.hasClass('fade') ?
      this.$element
        .one('bsTransitionEnd', $.proxy(this.hideModal, this))
        .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
      this.hideModal()
  }

  Modal.prototype.enforceFocus = function () {
    $(document)
      .off('focusin.bs.modal') // guard against infinite focus loop
      .on('focusin.bs.modal', $.proxy(function (e) {
        if (this.$element[0] !== e.target && !this.$element.has(e.target).length) {
          this.$element.trigger('focus')
        }
      }, this))
  }

  Modal.prototype.escape = function () {
    if (this.isShown && this.options.keyboard) {
      this.$element.on('keydown.dismiss.bs.modal', $.proxy(function (e) {
        e.which == 27 && this.hide()
      }, this))
    } else if (!this.isShown) {
      this.$element.off('keydown.dismiss.bs.modal')
    }
  }

  Modal.prototype.resize = function () {
    if (this.isShown) {
      $(window).on('resize.bs.modal', $.proxy(this.handleUpdate, this))
    } else {
      $(window).off('resize.bs.modal')
    }
  }

  Modal.prototype.hideModal = function () {
    var that = this
    this.$element.hide()
    this.backdrop(function () {
      that.$body.removeClass('math-ui-modal-open')
      that.resetAdjustments()
      that.resetScrollbar()
      that.$element.trigger('hidden.bs.modal')
    })
  }

  Modal.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove()
    this.$backdrop = null
  }

  Modal.prototype.backdrop = function (callback) {
    var that = this
    var animate = this.$element.hasClass('fade') ? 'fade' : ''

    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate

      this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
        .appendTo(this.$body)

      this.$element.on('click.dismiss.bs.modal', $.proxy(function (e) {
        if (this.ignoreBackdropClick) {
          this.ignoreBackdropClick = false
          return
        }
        if (e.target !== e.currentTarget) return
        this.options.backdrop == 'static'
          ? this.$element[0].focus()
          : this.hide()
      }, this))

      if (doAnimate) this.$backdrop[0].offsetWidth // force reflow

      this.$backdrop.addClass('in')

      if (!callback) return

      doAnimate ?
        this.$backdrop
          .one('bsTransitionEnd', callback)
          .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
        callback()

    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in')

      var callbackRemove = function () {
        that.removeBackdrop()
        callback && callback()
      }
      $.support.transition && this.$element.hasClass('fade') ?
        this.$backdrop
          .one('bsTransitionEnd', callbackRemove)
          .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
        callbackRemove()

    } else if (callback) {
      callback()
    }
  }

  // these following methods are used to handle overflowing modals

  Modal.prototype.handleUpdate = function () {
    this.adjustDialog()
  }

  Modal.prototype.adjustDialog = function () {
    var modalIsOverflowing = this.$element[0].scrollHeight > document.documentElement.clientHeight

    this.$element.css({
      paddingLeft:  !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
      paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : ''
    })
  }

  Modal.prototype.resetAdjustments = function () {
    this.$element.css({
      paddingLeft: '',
      paddingRight: ''
    })
  }

  Modal.prototype.checkScrollbar = function () {
    var fullWindowWidth = window.innerWidth
    if (!fullWindowWidth) { // workaround for missing window.innerWidth in IE8
      var documentElementRect = document.documentElement.getBoundingClientRect()
      fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left)
    }
    this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth
    this.scrollbarWidth = this.measureScrollbar()
  }

  Modal.prototype.setScrollbar = function () {
    var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10)
    this.originalBodyPad = document.body.style.paddingRight || ''
    if (this.bodyIsOverflowing) this.$body.css('padding-right', bodyPad + this.scrollbarWidth)
  }

  Modal.prototype.resetScrollbar = function () {
    this.$body.css('padding-right', this.originalBodyPad)
  }

  Modal.prototype.measureScrollbar = function () { // thx walsh
    var scrollDiv = document.createElement('div')
    scrollDiv.className = 'modal-scrollbar-measure'
    this.$body.append(scrollDiv)
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
    this.$body[0].removeChild(scrollDiv)
    return scrollbarWidth
  }


  // MODAL PLUGIN DEFINITION
  // =======================

  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this   = $(this)
      var data    = $this.data('bs.modal')
      var options = $.extend({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option)

      if (!data) $this.data('bs.modal', (data = new Modal(this, options)))
      if (typeof option == 'string') data[option](_relatedTarget)
      else if (options.show) data.show(_relatedTarget)
    })
  }

  var old = $.fn.modal

  $.fn.modal             = Plugin
  $.fn.modal.Constructor = Modal


  // MODAL NO CONFLICT
  // =================

  $.fn.modal.noConflict = function () {
    $.fn.modal = old
    return this
  }


  // MODAL DATA-API
  // ==============

  $(document).on('click.bs.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this   = $(this)
    var href    = $this.attr('href')
    var $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))) // strip for ie7
    var option  = $target.data('bs.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data())

    if ($this.is('a')) e.preventDefault()

    $target.one('show.bs.modal', function (showEvent) {
      if (showEvent.isDefaultPrevented()) return // only register focus restorer if modal will actually get shown
      $target.one('hidden.bs.modal', function () {
        $this.is(':visible') && $this.trigger('focus')
      })
    })
    Plugin.call($target, option, this)
  })

}(jQuery);
});
