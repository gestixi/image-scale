// ==========================================================================
// Project:     Image Scale
// Description: Scale images to fit or fill any target size via two simple properties: scale and align.
// Copyright:   ©2012-2013 Nicolas BADIA
// License:     Licensed under the MIT license (see LICENCE)
// Version:     1.3.2
// ==========================================================================

!function($) { "use strict";

  // ..........................................................
  // IMAGE SCALE PLUGIN DEFINITION
  //

  $.fn.imageScale = function( option ) {

    return this.each(function() {
      var $this = $(this),
          data = $this.data('imageScale');
          
      if (!data) {
        $this.css('opacity', 0);

        var didLoad = $this[0].complete,
            options = $.extend({}, $.fn.imageScale.defaults, typeof option == 'object' && option),

            loadFunc = function() {
              $this.data('imageScale', (data = new ImageScale(this, options)));

              if (options.rescaleOnResize) {
                $(window).resize(function(e) { data.scheduleScale(); });
              }

              data.scale(true);

              var callback = options.callback;
              if (typeof callback === 'function') callback($this, data);
              else if (callback && typeof callback === 'object') {
                callback.target[callback.action].apply(callback.target, [$this, data]);
              }
            };

        if (didLoad) {
          loadFunc.apply($this[0]);
        }
        else {
          $this.load(loadFunc);
        }
      }
      else {
        if (typeof option == 'string') data[option]();
      }
    })
  }

  $.fn.imageScale.defaults = {
    /**
      Determines how the image will scale to fit within its containing space. Possible values:

      * **fill** - stretches or compresses the source image to fill the target frame
      * **best-fill** - fits the shortest side of the source image within the target frame while maintaining the original aspect ratio
      * **best-fit** - fits the longest edge of the source image within the target frame while maintaining the original aspect ratio
      * **best-fit-down** - same as *best-fit* but will not stretch the source if it is smaller than the target
      * **none** - the source image is left unscaled

      @type String
      @default best-fill
      @since Version 1.2
    */
    scale: 'best-fill',

    /**
      Align the image within its frame. Possible values:

      * **left**
      * **right**
      * **center**
      * **top**
      * **bottom**
      * **top-left**
      * **top-right**
      * **bottom-left**
      * **bottom-right**

      @type String
      @default center
      @since Version 1.2
    */
    align: 'center',

    /**
      A jQuery Object against which the image size will be calculated.
      If null, the parent of the image will be used.

      @type jQuery Object
      @default null
      @since Version 1.0
    */
    parent: null,

    /**
      A boolean determining if the parent should hide its overflow.

      @type Boolean
      @default true
      @since Version 1.0
    */
    hideParentOverflow: true,

    /**
      A duration in milliseconds determining how long the fadeIn animation will run when your image is scale for the firstTime.

      Set it to 0 if you don't want any animation.

      @type Number|String
      @default 0
      @since Version 1.1
    */
    fadeInDuration: 0,

    /**
      A boolean indicating if the image size should be rescaled when the window is resized. 

      The window size is checked using requestAnimationFrame for good performance.
      
      @type Boolean
      @default true
      @since Version 1.0
    */
    rescaleOnResize: true,

    /**
      A function that will be call once the image has been load and scale. 

      Must be either a function or an object. If an object, it must has a target (an object) 
      and an action (the name of the method in the target) as property.

      Here is an example:

          $images.imageScale({ 
            callback: {
              target: this,
              action: 'didScale'
            }
          });
      
      @type Function|Object
      @default null
      @since Version 1.3
    */
    callback: null,

    /**
      A number indicating the debug level :

      1: error
      2: error & warning
      3: error & warning & notice
      
      @type Number
      @default 0
      @since Version 1.0
    */
    debug: 0
  }

  // ..........................................................
  // IMAGE SCALE PUBLIC CLASS DEFINITION
  //

  var ImageScale = function(element, options) { 
    this.options = options;
    this.element = element;
    var $element = this.$element = $(element);

    this.elementWidth = element.naturalWidth || element.width;
    this.elementHeight = element.naturalHeight || element.height;

    this.$parent = options.parent?options.parent:$($(element).parent()[0]);
  }

  $.fn.imageScale.Constructor = ImageScale;

  ImageScale.prototype = {

    NONE: "none",
    FILL: "fill",
    BEST_FILL: "best-fill",
    BEST_FIT: "best-fit",
    BEST_FIT_DOWN_ONLY: "best-fit-down",
    
    ALIGN_LEFT: 'left',
    ALIGN_RIGHT: 'right',
    ALIGN_CENTER: 'center',
    ALIGN_TOP: 'top',
    ALIGN_BOTTOM: 'bottom',
    ALIGN_TOP_LEFT: 'top-left',
    ALIGN_TOP_RIGHT: 'top-right',
    ALIGN_BOTTOM_LEFT: 'bottom-left',
    ALIGN_BOTTOM_RIGHT: 'bottom-right',

    constructor: ImageScale,

    /**
      Main method. Used to scale the images.

      When `rescaleOnResize` is set to true, this method is executed each time the
      windows size changes.  
      
      If `rescaleOnResize` is set to false, you may want to call it manually. Here is an 
      example on how you should do it:

          $image.imageScale('scale');


      @param {Boolean} firstTime
    */
    scale: function(firstTime) {
      if (this._isDestroyed) return;

      var that = this,   
          options = this.options,
          $parent = this.$parent,
          element = this.element,
          $element = this.$element;

      if (firstTime) {
        if (options.hideParentOverflow) {
          $parent.css({ overflow: 'hidden' });
        }

        $element.css({ opacity: 1 });
      }

      this._didScheduleScale = false;

      if (options.rescaleOnResize) {
        if (!this._needUpdate()) return;
      }
      
      var destWidth = $parent.outerWidth(), 
          destHeight = $parent.outerHeight(),

          destInnerWidth = $parent.innerWidth(), 
          destInnerHeight = $parent.innerHeight(),

          widthOffset = destWidth - destInnerWidth,
          heightOffset = destHeight - destInnerHeight,

          scaleData = $element.attr('data-scale'),
          alignData = $element.attr('data-align'),

          scale = scaleData?scaleData:options.scale,
          align = alignData?alignData:options.align,

          fadeInDuration = options.fadeInDuration;

      if (!scale) {
        if (options.debug > 2) {
          console.log("imageScale - DEBUG NOTICE: The scale property is null.");
        }
        return;
      }

      if (this._cacheDestWidth === destWidth && this._cacheDestHeight === destHeight) {
        if (options.debug > 2) {
          console.log("imageScale - DEBUG NOTICE: The parent size hasn't changed: dest width: '"+destWidth+"' - dest height: '"+destHeight+"'.");
        }
      }

      var sourceWidth = this.elementWidth, 
          sourceHeight = this.elementHeight;
          
      if (!(destWidth && destHeight && sourceWidth && sourceHeight)) {
        if (options.debug > 0) {
          console.error("imageScale - DEBUG ERROR: The dimensions are incorrect: source width: '"+sourceWidth+"' - source height: '"+sourceHeight+"' - dest width: '"+destWidth+"' - dest height: '"+destHeight+"'.");
        }
        return;
      }

      this._cacheDestWidth = destWidth;
      this._cacheDestHeight = destHeight;

      var layout = this._innerFrameForSize(scale, align, sourceWidth, sourceHeight, destWidth, destHeight);

      if (widthOffset) layout.x -= widthOffset/2;
      if (heightOffset) layout.y -= heightOffset/2;

      $element.css({ position: 'absolute', top: layout.y+'px', left: layout.x+'px', width: layout.width+'px', height: layout.height+'px', 'max-width': 'none' });

      if (firstTime && fadeInDuration) {
        $element.css({ display: 'none' });
        $element.fadeIn(fadeInDuration);
      }
    },

    /**
      Removes the data for the element.
    
      Here is an example on how you can call the destroy method:

          $image.imageScale('destroy');

    */
    destroy: function() {
      this._isDestroyed = true;
      this.$element.removeData('imageScale');
    },

    /**
      @private
      
      Returns a frame (x, y, width, height) fitting the source size (sourceWidth & sourceHeight) within the
      destination size (destWidth & destHeight) according to the align and scale properties.
      
      @param {String} scale
      @param {String} align
      @param {Number} sourceWidth
      @param {Number} sourceHeight
      @param {Number} destWidth
      @param {Number} destHeight
      @returns {Object} the inner frame with properties: { x: value, y: value, width: value, height: value }
    */
    _innerFrameForSize: function(scale, align, sourceWidth, sourceHeight, destWidth, destHeight) {
      var scaleX,
          scaleY,
          result;

      // Fast path
      result = { x: 0, y: 0, width: destWidth, height: destHeight };
      if (scale === this.FILL) return result;

      // Determine the appropriate scale
      scaleX = destWidth / sourceWidth;
      scaleY = destHeight / sourceHeight;

      switch (scale) {
        case this.BEST_FILL:
          scale = scaleX > scaleY ? scaleX : scaleY;
          break;
        case this.BEST_FIT:
          scale = scaleX < scaleY ? scaleX : scaleY;
          break;
        
        case this.NONE:
          scale = 1.0;
          break;
        //case this.BEST_FIT_DOWN_ONLY:
        default:
          if (scale !== this.BEST_FIT_DOWN_ONLY && this.options.debug > 1) {
            console.warn("imageScale - DEBUG WARNING: The scale '"+scale+"' was not understood.");
          }
        
          if ((sourceWidth > destWidth) || (sourceHeight > destHeight)) {
            scale = scaleX < scaleY ? scaleX : scaleY;
          } else {
            scale = 1.0;
          }
          break;
      }

      sourceWidth *= scale;
      sourceHeight *= scale;
      result.width = Math.round(sourceWidth);
      result.height = Math.round(sourceHeight);

      // Align the image within its frame
      switch (align) {
        case this.ALIGN_LEFT:
          result.x = 0;
          result.y = (destHeight / 2) - (sourceHeight / 2);
          break;
        case this.ALIGN_RIGHT:
          result.x = destWidth - sourceWidth;
          result.y = (destHeight / 2) - (sourceHeight / 2);
          break;
        case this.ALIGN_TOP:
          result.x = (destWidth / 2) - (sourceWidth / 2);
          result.y = 0;
          break;
        case this.ALIGN_BOTTOM:
          result.x = (destWidth / 2) - (sourceWidth / 2);
          result.y = destHeight - sourceHeight;
          break;
        case this.ALIGN_TOP_LEFT:
          result.x = 0;
          result.y = 0;
          break;
        case this.ALIGN_TOP_RIGHT:
          result.x = destWidth - sourceWidth;
          result.y = 0;
          break;
        case this.ALIGN_BOTTOM_LEFT:
          result.x = 0;
          result.y = destHeight - sourceHeight;
          break;
        case this.ALIGN_BOTTOM_RIGHT:
          result.x = destWidth - sourceWidth;
          result.y = destHeight - sourceHeight;
          break;
        default: // this.ALIGN_CENTER
          if (align !== this.ALIGN_CENTER && this.options.debug > 1) {
            console.warn("imageScale - DEBUG WARNING: The align '"+align+"' was not understood.");
          }
          result.x = (destWidth / 2) - (sourceWidth / 2);
          result.y = (destHeight / 2) - (sourceHeight / 2);
      }

      return result;
    },

    /**
      @private

      Determines if the windows size has changed since the last update.

      @returns {Boolean}
    */
    _needUpdate: function() {
      var size = $(window).height() + ' ' + $(window).width();

      if (this._lastWindowSize !== size) {
        this._lastWindowSize = size;
        return true;
      }
      return false;
    },

    /**
      @private

      Schedule a scale update.
    */
    scheduleScale: function() {
      if (this._didScheduleScale) return; 

      if (window.requestAnimationFrame) {
        var that = this;
        this._didScheduleScale = true;
        requestAnimationFrame(function() { that.scale(); });
      }
      else {
        this.scale();
      }
    },

    /** @private */
    _cacheDestWidth: null,

    /** @private */
    _cacheDestHeight: null,

    /** @private */
    _lastWindowSize: null,

    /** @private */
    _didScheduleScale: null
  }
}(window.jQuery);
