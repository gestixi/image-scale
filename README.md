Image Scale
===========

**Scale images to fit or fill any target container via two simple properties: scale and align.**

*This plugin is greatly inspired from Sproutcore SC.ImageView.*

------

## Installation

image-scale depends on jQuery. To use it, include this in your page :

    <script src="jquery.js" type="text/javascript"></script>
    <script src="image-scale.js" type="text/javascript"></script>

------

## Usage

If you want to identify the images that you want to scale, you can add a class to them. In this example we are adding a class call `scale`.

You can also set the `data-scale` and `data-align` attributes directly to the images if you want to override the default setting.

    <div class="image-container">
      <img class="scale" data-scale="best-fit-down" data-align="center" src="img/example.jpg">
    </div>

Now add this JavaScript code to your page :

    $(function() {
      $("img.scale").imageScale();
    });

You're done.

------

## Properties


### scale

Determines how the image will scale to fit within its containing space. Possible values:

* **fill** - stretches or compresses the source image to fill the target frame
* **best-fill** - fits the shortest side of the source image within the target frame while maintaining the original aspect ratio
* **best-fit** - fits the longest edge of the source image within the target frame while maintaining the original aspect ratio
* **best-fit-down** - same as *best-fit* but will not stretch the source if it is smaller than the target
* **none** - the source image is left unscaled

<!-- -->

    Type: String
    Default: best-fill


### align

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

<!-- -->
      
    Type: String
    Default: center


### parent

A jQuery Object against which the image size will be calculated.
If null, the parent of the image will be used.
      
    Type: jQuery Object
    Default: null


### hideParentOverflow

A boolean determining if the parent should hide its overflow.

    Type: Boolean
    Default: true


### fadeInDuration

A duration in milliseconds determining how long the fadeIn animation 
will run when your image is scale for the firstTime.

Set it to 0 if you don't want any animation.

    Type: Number or String
    Default: 0


### rescaleOnResize

A boolean indicating if the image size should be rescaled when the window is resized. 

The window size is checked using requestAnimationFrame for good performance.

Example:

    $images.imageScale({ 
      rescaleOnResize: true
    });

<!-- -->

    Type: Boolean
    Default: false
  

### didScale

A function that will be call each time the receiver is scaled. 

Example:

    $images.imageScale({ 
      didScale: function(firstTime, options) {
        console.log('did scale img: ', this.element);
      }
    });

<!-- -->

    Type: Function
    Parameters: 
      - firstTime {Boolean} true if the image was scale for the first time.
      - options {Object} the options passed to the scale method.
  

### debug

A number indicating the debug level :

0. silent
1. error
2. error & warning
3. error & warning & notice

<!-- -->

    Type: Number
    Default: 0

------

## Methods


### scale

Main method. Used to scale the images.

When `rescaleOnResize` is set to true, this method is executed each time the
windows size changes.  

If `rescaleOnResize` is set to false, you may want to call it manually. Here is an 
example on how you should do it:

    $image.imageScale('scale');


### destroy

Removes the data for the element.

Here is an example on how you can call the destroy method:

    $image.imageScale('destroy');


------

## Demo

See it in action on our [home page](https://www.gestixi.com).


You can also check out the Sproutcore [Automatic Image Scaling demo](http://showcase.sproutcore.com/#demos/Automatic%20Image%20Scaling) to understand the difference between all the different options.


------

## Size

Original Size:  4.3KB gzipped (15.04KB uncompressed)

Compiled Size:  **1.9KB gzipped** (4.65KB uncompressed)


------

## Author

**Nicolas Badia**

+ [https://twitter.com/@nicolas_badia](https://twitter.com/@nicolas_badia)
+ [https://github.com/nicolasbadia](https://github.com/nicolasbadia)


------

## Copyright and license

Copyright 2013-2016 GestiXi under [The MIT License (MIT)](LICENSE).
