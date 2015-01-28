(function (jQuery) {
/*!
 * Bootstrap v3.3.2 (http://getbootstrap.com)
 * Copyright 2011-2015 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 */

/*!
 * Generated using the Bootstrap Customizer (http://getbootstrap.com/customize/?id=4133676f2d0441365200)
 * Config saved to config.json and https://gist.github.com/4133676f2d0441365200
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
})(FlorianMath.jQueryLib);

/// <reference path="../libs/math-item/math-item.d.ts" />
/// <reference path="jquery.d.ts" />
/// <reference path="../tmp/loader.d.ts" />
var FlorianMath;
(function (FlorianMath) {
    'use strict';
    var _ = FlorianMath._utils.common, $ = FlorianMath.jQueryLib;
    function getName(mathItem) {
        return 'Equation ' + (mathItem._id + 1);
    }
    // Zoom
    function zoomAction(mathItem) {
        var inner = $('<div class="panel-body" />'), popup = $('<div class="math-ui math-ui-zoom" />').append($('<div class="panel panel-default" />').append(inner));
        mathItem.clonePresentation(inner[0]);
        $(mathItem).append(popup);
        $(document).on('mousedown keydown', function (ev) {
            ev.stopPropagation();
            popup.remove();
        });
    }
    // View Markup
    function sourceDataToLabel(sd) {
        var label = sd.type;
        if (sd.subtype)
            label += ' (' + sd.subtype + ')';
        return label;
    }
    function sourceAction(mathItem) {
        var tabs = $('<ul class="nav nav-pills" />'), markup = $('<textarea class="form-control" readonly />'), content = $('<div class="modal-content" />').append($('<div class="modal-header" />').append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>')).append($('<h4 class="modal-title" />').append('Markup for ' + getName(mathItem)))).append($('<div class="modal-body" />').append(tabs, markup)).append($('<div class="modal-footer" />').append($('<button type="button" class="btn btn-primary">Select All</button>')).append($('<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'))), modal = $('<div class="modal" tabindex="-1" role="dialog" aria-hidden="true" />').append($('<div class="modal-dialog modal-lg" />').append(content)), wrapper = $('<div class="math-ui" />').append(modal), selected = -1, sources = [];
        function setSelected(s) {
            var tabItems = tabs.children();
            if (s === selected)
                return;
            selected = s;
            tabItems.removeClass('active');
            markup.text(sources[s].markup);
            $(tabItems[s]).addClass('active');
        }
        mathItem.getMarkup().then(function (_sources) {
            sources = _sources;
            _.each(sources, function (sourceData) {
                tabs.append($('<li role="presentation" />').append($('<a href="#" />').append(sourceDataToLabel(sourceData))));
            });
            setSelected(0);
        });
        tabs.on('click', function (ev) {
            tabs.find('a').each(function (k, elem) {
                ev.preventDefault();
                if (elem === ev.target)
                    setSelected(k);
            });
        });
        content.find('.modal-footer > button').first().on('click', function () {
            markup.focus().select();
        });
        $(document.body).append(wrapper);
        modal.on('hidden.bs.modal', function () {
            wrapper.remove();
        }).modal();
    }
    // Equation menu
    function makeMenuItems(mathItem) {
        var result = [];
        if (mathItem.clonePresentation)
            result.push({ label: 'Zoom', action: function () {
                zoomAction(mathItem);
            } });
        if (mathItem.getMarkup)
            result.push({ label: 'View Markup', action: function () {
                sourceAction(mathItem);
            } });
        result.push({ label: 'Dashboard', action: function () {
            lnf.showDashboard();
        } });
        return result;
    }
    function stopEvent(ev) {
        ev.preventDefault();
        ev.stopPropagation();
    }
    function gotFocus(mathItem) {
        var el = $(mathItem), menuItems = makeMenuItems(mathItem), items = $('<ul class="nav nav-pills" />'), menu = $('<div class="math-ui math-ui-eqn-menu" />').append($('<div class="well" />').append(items)), selected = -1;
        function setSelected(sel) {
            sel = (sel + menuItems.length) % menuItems.length;
            if (sel === selected)
                return;
            selected = sel;
            var lis = menu.find('li');
            lis.removeClass('active');
            $(lis[sel + 1]).addClass('active');
        }
        function triggerSelected() {
            el.blur();
            FlorianMath._utils.dom.async(function () {
                menuItems[selected].action();
            });
        }
        items.append($('<li />').append($('<span class="title" />').append(getName(mathItem))));
        _.each(menuItems, function (menuItem) {
            items.append($('<li role="presentation" />').append($('<a tabindex="-1" href="#" />').append(menuItem.label)));
        });
        menu.on('mousedown', function (ev) {
            if (ev.which !== 1)
                return;
            menu.find('a').each(function (k, elem) {
                if (elem === ev.target) {
                    stopEvent(ev);
                    setSelected(k);
                    triggerSelected();
                }
            });
        });
        el.on('keydown', function (ev) {
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
        }).on('blur', function () {
            menu.remove();
        }).append(menu);
        setSelected(0);
    }
    // Main class
    var BootstrapLookAndFeel = (function () {
        function BootstrapLookAndFeel() {
            this.highlighted = false;
        }
        BootstrapLookAndFeel.prototype.init = function (mathItem) {
            $(mathItem).attr('tabindex', 0).on('focus', function (ev) {
                stopEvent(ev);
                gotFocus(mathItem);
            });
        };
        BootstrapLookAndFeel.prototype.highlightAll = function () {
            var on = this.highlighted = !this.highlighted;
            _.each(FlorianMath.container, function (mathItem) {
                var el = $(mathItem);
                on ? el.addClass('highlight') : el.removeClass('highlight');
            });
        };
        BootstrapLookAndFeel.prototype.showDashboard = function () {
            var _this = this;
            var body = $('<div class="modal-body" />').append($('<div class="btn-group-vertical" />').append($('<button type="button" class="btn btn-primary form-control">Highlight All Equations</button>')).append($('<button type="button" class="btn btn-primary form-control">About</button>')).append($('<button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>'))), modal = $('<div class="modal math-ui-dashboard" tabindex="-1" role="dialog" aria-hidden="true" />').append($('<div class="modal-dialog modal-sm" />').append($('<div class="modal-content" />').append($('<div class="modal-header" />').append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>')).append($('<h4 class="modal-title" />').append('Dashboard'))).append(body))), wrapper = $('<div class="math-ui" />').append(modal);
            body.on('click', function (ev) {
                body.find('button').each(function (k, elem) {
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
        return BootstrapLookAndFeel;
    })();
    // Resolve 'lookAndFeel' to signal a successful load
    var lnf = new BootstrapLookAndFeel();
    FlorianMath.lookAndFeel.resolve(lnf);
    _.each(FlorianMath.container, function (mathItem) {
        lnf.init(mathItem);
    });
})(FlorianMath || (FlorianMath = {}));
