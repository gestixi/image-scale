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

####updateOnResize####

Set to true if the dimension of the container can change when the window is resize. This way, the image will be automatically update.
      
    Type: Boolean
    Default: true


####hideOverflow####

Set to true to hide the image overflow.

    Type: Boolean
    Default: true

####container####

If null, the container of the image will be use.

    Type: jQuery Object
    Default: null
  

####debug####

Debug level

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

Check out the Sproutcore [Automatic Image Scaling demo](http://showcase.sproutcore.com/#demos/Automatic%20Image%20Scaling) to understand the difference between all the different options.
