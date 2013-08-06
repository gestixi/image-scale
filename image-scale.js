// ==========================================================================
// Project:     image-scale
// Description: Scale images to fit or fill any target size via two simple 
//              properties: scale and align.
// Copyright:   ©2012-2013 Nicolas BADIA
// License:     Licensed under the MIT license (see LICENCE)
// Version:     1.1.0
// ==========================================================================

!function($) {

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
                if (!window.requestAnimationFrame) {
                  $(window).resize(function(e) { data.scale(); });
                }
              }

              data.scale(true);
            };

        if (didLoad) {
          loadFunc.apply($this[0]);
        }
        else {
          $this.load(loadFunc);
        }
      }
      else {
        data.scale();
      }
    })
  }

  $.fn.imageScale.defaults = {
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
      A duration in milliseconds determining how long the fadeIn animation 
      will run when your image is scale for the firstTime.

      Set it to 0 if you don't want any animation.

      @type Number or String
      @default 0
      @since Version 1.1
    */
    fadeInDuration: 0,

    /**
      A boolean indicating if the image size should be rescaled when 
      the window is resized. 

      The window size is checked using requestAnimationFrame for good performance.
      
      @type Boolean
      @default true
      @since Version 1.0
    */
    rescaleOnResize: true,

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
    var $element = this.$element = $(element);

    this.elementWidth = $element.attr('width') || element.width;
    this.elementHeight = $element.attr('height') || element.height;

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
      Main method
      
      @param {Boolean} firstTime
    */
    scale: function(firstTime) {
      if (window.requestAnimationFrame) {
        var that = this;
        requestAnimationFrame(function() { that.scale(); });
      }
      if (!this.needUpdate()) return;

      var options = this.options,

          $element = this.$element,
          $parent = this.$parent,

          destWidth = $parent.outerWidth(), 
          destHeight = $parent.outerHeight(),

          destInnerWidth = $parent.innerWidth(), 
          destInnerHeight = $parent.innerHeight(),

          widthOffset = destWidth - destInnerWidth,
          heightOffset = destHeight - destInnerHeight;

      if (this._cacheDestWidth === destWidth && this._cacheDestHeight === destHeight) {
        if (options.debug > 2) {
          console.log("imageScale - DEBUG NOTICE: The parent size didn't change.", destWidth, destHeight);
        }
      }

      var sourceWidth = this.elementWidth, 
          sourceHeight = this.elementHeight;
          
      if (!(destWidth && destHeight && sourceWidth && sourceHeight)) {
        if (options.debug > 0) {
          console.error('imageScale - DEBUG ERROR: The dimensions are incorrect.', sourceWidth, sourceHeight, destWidth, destHeight);
        }

        return;
      }

      this._cacheDestWidth = destWidth;
      this._cacheDestHeight = destHeight;

      var scale = $element.attr('data-scale'),
          align = $element.attr('data-align'),

          layout = this.innerFrameForSize(scale, align, sourceWidth, sourceHeight, destWidth, destHeight);

      if (widthOffset) layout.x -= widthOffset/2;
      if (heightOffset) layout.y -= heightOffset/2;

      $element.css({ position: 'absolute', top: layout.y+'px', left: layout.x+'px', width: layout.width+'px', height: layout.height+'px', 'max-width': 'none' });

      if (firstTime) {
        $element.css({ display: 'none', opacity: 1 });
        $element.fadeIn(options.fadeInDuration);
      }

      if (options.hideParentOverflow) {
        $parent.css({ overflow: 'hidden' });
      }
    },

    /**
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
    innerFrameForSize: function(scale, align, sourceWidth, sourceHeight, destWidth, destHeight) {
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
      Determine if the windows size has changed since the last update.

      @returns {Boolean}
    */
    needUpdate: function() {
      var size = $(window).height() + ' ' + $(window).width();

      if (this.lastWindowSize !== size) {
        this.lastWindowSize = size;
        return true;
      }
      return false;
    },

    /** @private */
    lastWindowSize: null
  }
}(window.jQuery);
