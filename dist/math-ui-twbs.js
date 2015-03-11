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
    var log = function () {
    };
    if ('console' in window && console.log)
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
    var MARKUP_PREFERENCE = [FlorianMath.MIME_TYPE_MATHML, FlorianMath.MIME_TYPE_TEX, FlorianMath.MIME_TYPE_HTML];
    function getSourceType(source) {
        return source.getAttribute('type') || FlorianMath.MIME_TYPE_HTML;
    }
    function getSourceMarkup(source) {
        var value = source.firstChild && !source.firstChild.nextSibling && source.firstChild.nodeType === 3 ? source.firstChild.nodeValue : source.innerHTML;
        return FlorianMath.trim(value);
    }
    function getDefaultMarkup(mathItem) {
        var k, type, sources;
        for (k = 0; k < MARKUP_PREFERENCE.length; k++) {
            type = MARKUP_PREFERENCE[k];
            sources = mathItem.getSources({ markup: true, type: type });
            if (sources.length)
                return getSourceMarkup(sources[0]);
        }
        return null;
    }
    function setDataTransfer(data, mathItem) {
        var sources = mathItem.getSources({ markup: true });
        FlorianMath.each(sources, function (source) {
            data.setData(getSourceType(source), getSourceMarkup(source));
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
            $(document).on('mousedown keydown', function (ev) {
                if (ev.type === 'mousedown' && ev.which !== 1)
                    return;
                ev.stopPropagation();
                popup.remove();
            });
            $(mathItem).before(popup);
            HTMLMathItemElement.manualAttach(mathItemClone, true);
        }
        // Commands menu
        function noOp() {
        }
        function getCommandItems(mathItem) {
            return [
                { label: 'Copy to clipboard', action: noOp },
                { label: 'Copy permalink', action: noOp },
                {
                    label: 'Convert to code',
                    submenu: [
                        { label: 'C', action: noOp },
                        { label: 'JavaScript', action: noOp },
                        { label: 'Python', action: noOp }
                    ]
                },
                {
                    label: 'Open with',
                    submenu: [
                        { label: 'Mathematica', action: noOp },
                        { label: 'Maple', action: noOp },
                        { label: 'WolframAlpha', link: 'http://www.wolframalpha.com/input/?i=sin%5Bx%5D*sin%5By%5D' }
                    ]
                },
                {
                    label: 'Share',
                    submenu: [
                        { label: 'Twitter', action: noOp },
                        { label: 'Email', action: noOp }
                    ]
                },
                {
                    label: 'Search',
                    submenu: [
                        { label: 'Google', action: noOp },
                        { label: 'Tangent', action: noOp }
                    ]
                },
                { label: 'Speak', action: noOp }
            ];
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
                    else if (item.link)
                        a[0].href = item.link;
                    a.append(item.label);
                    options.append(a);
                    if (!item.link) {
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
                    }
                });
            }
            $(document.body).append(wrapper);
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
                    copyItem = $('<textarea />').val(getDefaultMarkup(mathItem) || getName(mathItem)).on('keyup', function (ev) {
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
            $mathItem.attr('tabindex', 0).attr('draggable', 'true').on('focus', function (ev) {
                stopEvent(ev);
                gotFocus(mathItem);
            }).on('dragstart', function (ev) {
                if (ev.originalEvent.dataTransfer) {
                    var dt = ev.originalEvent.dataTransfer, defaultMarkup = getDefaultMarkup(mathItem);
                    if (defaultMarkup)
                        dt.setData(FlorianMath.MIME_TYPE_PLAIN, defaultMarkup);
                    setDataTransfer(dt, mathItem);
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
                            window.location.href = 'https://github.com/dessci/math-item-element';
                        }
                    }
                });
            });
            $(document.body).append(wrapper);
            modal.on('hidden.bs.modal', function () {
                wrapper.remove();
            }).modal();
        };
        FlorianMath.mathUI = new BootstrapLookAndFeel($);
        FlorianMath.dispatchCustomEvent(document, 'created.math-ui');
        FlorianMath.initialized().then(function () {
            log('Applying MathUI to math-items');
            FlorianMath.each(document.querySelectorAll('math-item'), function (mathItem) {
                FlorianMath.mathUI.add(mathItem);
            });
        });
    });
})(FlorianMath || (FlorianMath = {}));

FlorianMath.requireLibs().then(function (jQuery) {
/*!
 * Bootstrap v3.3.2 (http://getbootstrap.com)
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 */

/*!
 * Generated using the Bootstrap Customizer (http://getbootstrap.com/customize/?id=a6ecd0a83c9b51190e8c)
 * Config saved to config.json and https://gist.github.com/a6ecd0a83c9b51190e8c
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
    this.options        = options
    this.$body          = $(document.body)
    this.$element       = $(element)
    this.$backdrop      =
    this.isShown        = null
    this.scrollbarWidth = 0

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

    this.backdrop(function () {
      var transition = $.support.transition && that.$element.hasClass('fade')

      if (!that.$element.parent().length) {
        that.$element.appendTo(that.$body) // don't move modals dom position
      }

      that.$element
        .show()
        .scrollTop(0)

      if (that.options.backdrop) that.adjustBackdrop()
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
        that.$element.find('.modal-dialog') // wait for modal to slide in
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
        .prependTo(this.$element)
        .on('click.dismiss.bs.modal', $.proxy(function (e) {
          if (e.target !== e.currentTarget) return
          this.options.backdrop == 'static'
            ? this.$element[0].focus.call(this.$element[0])
            : this.hide.call(this)
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
    if (this.options.backdrop) this.adjustBackdrop()
    this.adjustDialog()
  }

  Modal.prototype.adjustBackdrop = function () {
    this.$backdrop
      .css('height', 0)
      .css('height', this.$element[0].scrollHeight)
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
    this.bodyIsOverflowing = document.body.scrollHeight > document.documentElement.clientHeight
    this.scrollbarWidth = this.measureScrollbar()
  }

  Modal.prototype.setScrollbar = function () {
    var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10)
    if (this.bodyIsOverflowing) this.$body.css('padding-right', bodyPad + this.scrollbarWidth)
  }

  Modal.prototype.resetScrollbar = function () {
    this.$body.css('padding-right', '')
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
