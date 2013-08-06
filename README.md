Image Scale
===========

**Scale images to fit or fill any target container via two simple properties: scale and align.**

*This plugin is greatly inspired from Sproutcore SC.ImageView.*

## Usage ##

image-scale depends on jQuery. To use it, include this in your page :

    <script src="jquery.js" type="text/javascript"></script>
    <script src="image-scale.js" type="text/javascript"></script>

Set the `data-scale` and `data-align` attributes to the images that you want to scale:

    <div class="image-container">
      <img class="scale" data-scale="best-fit" data-align="center" src="img/example.jpg">
    </div>

Then add this JavaScript code to your page :

    $(function() {
      $("img.scale").imageScale();
    });

You're done.


## Options ##

####parent####

A jQuery Object against which the image size will be calculated.
If null, the parent of the image will be used.
      
    Type: jQuery Object
    Default: null

####hideParentOverflow####

A boolean determining if the parent should hide its overflow.

    Type: Boolean
    Default: true

####fadeInDuration####

A duration in milliseconds determining how long the fadeIn animation 
will run when your image is scale for the firstTime.

Set it to 0 if you don't want any animation.

    Type: Number or String
    Default: 0

####rescaleOnResize####

A boolean indicating if the image size should be rescaled when the window is resized. 

The window size is checked using requestAnimationFrame for good performance.

    Type: Boolean
    Default: true
  

####debug####

A number indicating the debug level :

1. error
2. error & warning
3. error & warning & notice

<!-- -->

    Type: Number
    Default: 0


## Properties ##

####Possible `scale` values are:####

* **fill** - stretches or compresses the source image to fill the target frame
* **best-fill** - fits the shortest side of the source image within the target frame while maintaining the original aspect ratio
* **best-fit** - fits the longest edge of the source image within the target frame while maintaining the original aspect ratio
* **best-fit-down** - same as *best-fit* but will not stretch the source if it is smaller than the target
* **none** - the source image is left unscaled


####Possible `align` values are:####

* **left**
* **right**
* **center**
* **top**
* **bottom**
* **top-left**
* **top-right**
* **bottom-left**
* **bottom-right**



## Demo ##

See it in action on our [home page](https://www.gestixi.com). Our logo use it extensively.


You can also check out the Sproutcore [Automatic Image Scaling demo](http://showcase.sproutcore.com/#demos/Automatic%20Image%20Scaling) to understand the difference between all the different options.


## Size ##

Original Size:  2.45KB gzipped (7.5KB uncompressed)

Compiled Size:  **1.33KB gzipped** (3.14KB uncompressed)

