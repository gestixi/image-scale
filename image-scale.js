// ==========================================================================
// Project:     Image Scale
// Description: Scale images to fit or fill any target size via two simple properties: scale and align.
// Copyright:   ©2012-2015 GestiXi
// License:     Licensed under the MIT license (see LICENCE)
// Version:     2.1
// Author:      Nicolas BADIA
// ==========================================================================

!function($) { "use strict";

  // ..........................................................
  // IMAGE SCALE PLUGIN DEFINITION
  //

  $.fn.imageScale = function( options ) {

    return this.each(function() {
      var that = this,
        $this = $(this),
        data = $this.data('imageScale'),
        $img = this.tagName === 'IMG' ? $this : $this.find("img");

      if (!data) {
        var didLoad = $img[0].complete,
            formattedOpt = $.extend({}, $.fn.imageScale.defaults, typeof options == 'object' && options),

            loadFunc = function() {
              $this.data('imageScale', (data = new ImageScale(that, formattedOpt)));

              data.scale(true, formattedOpt);
            };

        if (didLoad) {
          loadFunc.apply($this[0]);
        }
        else {
          $img.on("load", loadFunc).attr("src", $img.attr("src"));
        }
      }
      else {
        if (typeof options == 'string') data[options]();
        else if (typeof options == 'object') {
          var method = options.method || 'scale';
          data[method](false, options);
        }
        else data.scale();
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
      @default false
      @since Version 1.0
    */
    rescaleOnResize: false,

    /**
      A function that will be call each time the receiver is scaled. 

      Example:

          $images.imageScale({ 
            didScale: function() {
              console.log('did scale img: ', this.element);
            }
          });
      
      @type Function
      @param firstTime {Boolean} true if the image was scale for the first time.
      @param options {Object} the options passed to the scale method.
      @since Version 2.0
    */
    didScale: function(firstTime, options) {},

    /**
      A number indicating the log level :
      
      0: silent
      1: error
      2: error & warning
      3: error & warning & notice
      
      @type Number
      @default 0
      @since Version 1.0
    */
    logLevel: 0
  }

  // ..........................................................
  // IMAGE SCALE PUBLIC CLASS DEFINITION
  //

  var ImageScale = function(element, options) { 
    var that = this;
    that.options = options;
    that.element = element;

    var $element = that.$element = $(element),
      $img = that.$img = element.tagName === 'IMG' ? $element : $element.find("img"),
      img = that.img = $img[0];

    that.src = $img.attr('src');

    that.imgWidth = img.naturalWidth || img.width;
    that.imgHeight = img.naturalHeight || img.height;

    var $parent = that.$parent = options.parent?options.parent:$($element.parent()[0]);
    that.parent = $parent[0];

    // Fixes: https://github.com/gestixi/image-scale/issues/1
    if ($parent.css('position') === 'static') {
      $parent.css('position', 'relative');
    }

    if (options.rescaleOnResize) {
      $(window).resize(function(e) { that.scheduleScale(); });
    }
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
      The initial element.

      @type DOM Element
    */
    element: null,

    /**
      The passed options.

      @type Object
    */
    options: null,

    /**
      Main method. Used to scale the images.

      When `rescaleOnResize` is set to true, this method is executed each time the
      windows size changes.  
      
      If `rescaleOnResize` is set to false, you may want to call it manually. Here is an 
      example on how you should do it:

          $image.imageScale('scale');


      @param {Boolean} firstTime
    */
    scale: function(firstTime, opt) {
      if (this._isDestroyed || this._canScale === false) return;

      var that = this,   
          options = this.options,
          $parent = this.$parent,
          element = this.element,
          $element = this.$element,
          img = this.img,
          $img = this.$img;

      if (firstTime) {
        if (options.hideParentOverflow) {
          $parent.css({ overflow: 'hidden' });
        }
      }
      else {
        // If the source of the image has changed
        if (this.src !== $img.attr('src')) {
          this.destroy();
          $element.data('imageScale', null);
          $element.imageScale(options);
          return;
        }
      }

      this._didScheduleScale = false;

      if (options.rescaleOnResize && !opt) {
        if (!this._needUpdate(this.parent)) return;
      }
      opt = opt ? opt : {};

      var transition = opt.transition;
      if (transition) {
        this._canScale = false;
        $element.css('transition', 'all '+transition+'ms');

        setTimeout(function() {
          that._canScale = null;
          $element.css('transition', 'null');
        }, transition);
      }
      
      var destWidth = opt.destWidth ? opt.destWidth : $parent.outerWidth(), 
          destHeight = opt.destHeight ? opt.destHeight : $parent.outerHeight(),

          destInnerWidth = opt.destWidth ? opt.destWidth : $parent.innerWidth(), 
          destInnerHeight = opt.destHeight ? opt.destHeight : $parent.innerHeight(),

          widthOffset = destWidth - destInnerWidth,
          heightOffset = destHeight - destInnerHeight,

          scaleData = $element.attr('data-scale'),
          alignData = $element.attr('data-align'),

          scale = scaleData?scaleData:options.scale,
          align = alignData?alignData:options.align,

          fadeInDuration = options.fadeInDuration;

      if (!scale) {
        if (options.logLevel > 2) {
          console.log("imageScale - DEBUG NOTICE: The scale property is null.", element);
        }
        return;
      }

      if (this._cacheDestWidth === destWidth && this._cacheDestHeight === destHeight) {
        if (options.logLevel > 2) {
          console.log("imageScale - DEBUG NOTICE: The parent size hasn't changed: dest width: '"+destWidth+"' - dest height: '"+destHeight+"'.", element);
        }
      }

      var sourceWidth = this.imgWidth, 
          sourceHeight = this.imgHeight;
          
      if (!(destWidth && destHeight && sourceWidth && sourceHeight)) {
        if (options.logLevel > 0) {
          console.error("imageScale - DEBUG ERROR: The dimensions are incorrect: source width: '"+sourceWidth+"' - source height: '"+sourceHeight+"' - dest width: '"+destWidth+"' - dest height: '"+destHeight+"'.", element);
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

      options.didScale.call(this, firstTime, opt);
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
        case this.BEST_FIT_DOWN_ONLY:
          if (scale !== this.BEST_FIT_DOWN_ONLY && this.options.logLevel > 1) {
            console.warn("imageScale - DEBUG WARNING: The scale '"+scale+"' was not understood.");
          }
        
          if ((sourceWidth > destWidth) || (sourceHeight > destHeight)) {
            scale = scaleX < scaleY ? scaleX : scaleY;
          } else {
            scale = 1.0;
          }
          break;
        case this.BEST_FIT:
          scale = scaleX < scaleY ? scaleX : scaleY;
          break;
        case this.NONE:
          scale = 1.0;
          break;
        //case this.BEST_FILL:
        default:
          scale = scaleX > scaleY ? scaleX : scaleY;
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
          if (align !== this.ALIGN_CENTER && this.options.logLevel > 1) {
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
    _needUpdate: function(parent) {
      var size = parent.clientHeight + ' ' + parent.clientWidth;

      if (this._lastParentSize !== size) {
        this._lastParentSize = size;
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
        // setTimeout important when resizing down if the scrollbar were visible
        requestAnimationFrame(function() { setTimeout(function() { that.scale(); }, 0); });
      }
      else {
        this.scale();
      }
    }
  }
}(window.jQuery);
