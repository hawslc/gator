//handles the color sliders and color conversion

function HSVToRGB(o) {
  //credit: wikipedia
  //the most reliable source ever (lol)

  //o.h = 0 to 360, hue
  //o.s = 0 to 1, saturation
  //o.v = 0 to 1, value
  var c = o.s * o.v;
  var h = o.h / 60;
  var x = c * (1 - Math.abs(h % 2 - 1));
  var r = {
    r: 0,
    g: 0,
    b: 0
  }

  if (h < 1) {
    r.r = c;
    r.g = x;
    r.b = 0;
  } else if (h < 2) {
    r.r = x;
    r.g = c;
    r.b = 0;
  } else if (h < 3) {
    r.r = 0;
    r.g = c;
    r.b = x;
  } else if (h < 4) {
    r.r = 0;
    r.g = x;
    r.b = c;
  } else if (h < 5) {
    r.r = x;
    r.g = 0;
    r.b = c;
  } else if (h <= 6) {
    r.r = c;
    r.g = 0;
    r.b = x;
  }

  var m = o.v - c;
  r.r += m;
  r.g += m;
  r.b += m;
  r.r *= 255;
  r.g *= 255;
  r.b *= 255;
  r.r = Math.floor(r.r);
  r.g = Math.floor(r.g);
  r.b = Math.floor(r.b);
  return r;
}

function RGBToHSV(o) {
  //credit: wikipedia
  //the most reliable source ever (lol)

  //input structure:
  //o.r 0 to 255
  //o.g same
  //o.b same
  o.r /= 255;
  o.g /= 255;
  o.b /= 255;

  var max = Math.max(o.r, o.g, o.b);
  var min = Math.min(o.r, o.g, o.b);
  var c = max - min;

  var r = {
    h: 0,
    s: 0,
    v: 0
  }

  //first calculate the hue
  if (max == 0 && min == 0) {
    r.h = 0;
  } else if (max == o.r) {
    r.h = (60 * ((o.g - o.b) / c) + 360) % 360;
  } else if (max == o.g) {
    r.h = (60 * ((o.b - o.r) / c) + 120) % 360;
  } else if (max == o.b) {
    r.h = (60 * ((o.r - o.g) / c) + 240) % 360;
  }

  //now calculate  the saturation
  if (max == 0) {
    r.s = 0;
  } else {
    r.s = c / max;
  }

  //finally, calculate the value
  r.v = max;

  //return
  return r;
}

//that was FUN

//now add hexadecimal support
function HexToRGB(s) {
  //takes a hexadecimal color and converts it to rgb
  return {
    r: HexToDecimal(s[1] + s[2]),
    g: HexToDecimal(s[3] + s[4]),
    b: HexToDecimal(s[5] + s[6])
  };
}

function HexToDecimal(s) {
  //used only within the context of the function above
  //converts a two-letter string like "3a" to decimal, "58"
  var hex = "0123456789abcdef";
  return hex.indexOf(s[0]) * 16 + hex.indexOf(s[1]);
}

//these two functions below are the functions above but inverted
function RGBToHex(r) {
  //takes a rgb color and converts it to hex
  return "#" + DecimalToHex(r.r) + DecimalToHex(r.g) + DecimalToHex(r.b);
}

function DecimalToHex(n) {
  //used only within the context of the function above
  //converts decimal like "58" toa two-letter string  "3a"
  var hex = "0123456789abcdef";
  return hex[Math.floor(n / 16)] + hex[n % 16];
}

function HSVToHSL(o) {
  //so many conversion functions, this one allows for alpha
  var r = {h:o.h, s:o.s, l:0};
  r.l = (2 - o.s) * o.v / 2;

  if (r.l != 0) {
    if (r.l == 1) {
      r.s = 0;
    } else if (r.l < 0.5) {
      r.s = o.s * o.v / (r.l * 2);
    } else {
      r.s = o.s * o.v / (2 - r.l * 2);
    }
  }

  return r;
}

//done with color conversion

//now time for the sliders
var slider = {
  isSliding: [false, false, false, false],
  sliderOffset: 0,
  key: "hsva",
  maxWidth: 160,
  sliderWidth: 8,
  xOffset: 33
};

var currentColor = {
  h: 204,
  s: 0.93,
  v: 0.79,
  a: 1
}

updateColorMenu();

find("h-slider").onmousedown = function() {
  sliderClick(0, event);
}

find("s-slider").onmousedown = function() {
  sliderClick(1, event);
}

find("v-slider").onmousedown = function() {
  sliderClick(2, event);
}

find("a-slider").onmousedown = function() {
  sliderClick(3, event);
}

function sliderClick(i, e) {
  slider.isSliding[i] = true;
}

document.addEventListener('mouseup', function() {
  //reset the sliders so it is not sliding anymore
  for (var i = 0; i < slider.isSliding.length; i++) {
    slider.isSliding[i] = false;
  }
});

function updateSliders(e) {
  //update position of sliders when user is draggin mouse
  //check if sliding
  if (slider.isSliding[0] || slider.isSliding[1] || slider.isSliding[2] || slider.isSliding[3]) {

    //if so, update position of slider to be the mouse position
    var n = (slider.isSliding[0] ? 0 : (slider.isSliding[1] ? 1 : (slider.isSliding[2] ? 2 : 3))); //n is the index of the one that is is sliding

    //some variables so they can be easily changed
    var newXPosition = e.clientX - slider.xOffset; //the new position of the slider

    //prevent the slider from going off of the slider background
    if (newXPosition < 0) newXPosition = 0;
    if (newXPosition > slider.maxWidth) newXPosition = slider.maxWidth;

    newXPosition -= (slider.sliderWidth / 2);
    find(slider.key[n] + "-slider").style.left = newXPosition + "px";

    currentColor[slider.key[n]] = (newXPosition) / slider.maxWidth;
    if (n == 0) currentColor[slider.key[n]] *= 360; //hue is on a larger scale

    updateColorMenu();
  }
}

//done with sliders, now color technical stuff




//now doing actual stuff with this conversion power
function updateColorMenu() {
  //updates the whole color menu

  //first some constraints
  currentColor.h = Math.min(Math.max(0, currentColor.h), 360);
  currentColor.s = Math.min(Math.max(0, currentColor.s), 1);
  currentColor.v = Math.min(Math.max(0, currentColor.v), 1);
  currentColor.a = Math.min(Math.max(0, currentColor.a), 1);

  //now calculate apropiate gradients
  var s0 = HSVToRGB({h: currentColor.h, s:0, v:currentColor.v});
  var s1 = HSVToRGB({h: currentColor.h, s:1, v:currentColor.v});
  var v0 = HSVToRGB({h: currentColor.h, s:currentColor.s, v:0});
  var v1 = HSVToRGB({h: currentColor.h, s:currentColor.s, v:1});
  var a = HSVToHSL(currentColor);

  //convert to readable stuff
  s0c = "rgb(" + Math.round(s0.r) + ", " + Math.round(s0.g) + ", " + Math.round(s0.b) + ")";
  s1c = "rgb(" + Math.round(s1.r) + ", " + Math.round(s1.g) + ", " + Math.round(s1.b) + ")";
  v0c = "rgb(" + Math.round(v0.r) + ", " + Math.round(v0.g) + ", " + Math.round(v0.b) + ")";
  v1c = "rgb(" + Math.round(v1.r) + ", " + Math.round(v1.g) + ", " + Math.round(v1.b) + ")";
  a0c = "hsla(" + a.h + ", " + (a.s * 100) + "%, " + (a.l * 100) + "%, " + 0 + ")";
  a1c = "hsla(" + a.h + ", " + (a.s * 100) + "%, " + (a.l * 100) + "%, " + 1 + ")";
  
  find("s-slider-background").style.background = "linear-gradient(90deg, " + s0c + ", " + s1c + ")";
  find("v-slider-background").style.background = "linear-gradient(90deg, " + v0c + ", " + v1c + ")";
  find("a-slider-background").style.background = "linear-gradient(90deg, " + a0c + ", " + a1c + ")";
  
  //cool, now update the color preview and the hexadecimal value
  find("color-input").value = RGBToHex(HSVToRGB(currentColor));
  find("color-preview").style["background-color"] = RGBToHex(HSVToRGB(currentColor));

  //final 
  if (currentItem) {
    currentItem.color = {h: currentColor.h, s: currentColor.s, v: currentColor.v, a: currentColor.a}
    //"hsla(" + a.h + ", " + (a.s * 100) + "%, " + (a.l * 100) + "%, " + currentColor.a + ")";
    updateSelectedItem();
  } 
}

//on user input into the hex input box, update the rest
find("color-input").oninput = function() {
  //first test if the input text is the right format
  var s = find("color-input").value.toLowerCase();

  var validCharacters = "0123456789abcdef";
  if (s[0] != '#') s = "#" + s; //add hash if missing

  if (s.length != 7) return;

  for (var i = 1; i < s.length; i++) {
    if (validCharacters.indexOf(s[i]) == -1) return;
  }
  
  //input is right format, update the menu
  currentColor = RGBToHSV(HexToRGB(s));
  updateColorMenu();

  //that function above updates some things, but there is more to do
  //we have to set the position of each slider as well
  find("h-slider").style.left = (((currentColor.h / 360) * slider.maxWidth) - slider.sliderWidth / 2) + "px";
  find("s-slider").style.left = (((currentColor.s) * slider.maxWidth) - slider.sliderWidth / 2) + "px";
  find("v-slider").style.left = (((currentColor.v) * slider.maxWidth) - slider.sliderWidth / 2) + "px";
  find("a-slider").style.left = (((currentColor.a) * slider.maxWidth) - slider.sliderWidth / 2) + "px";
}

function refreshColorSliders() {
  updateColorMenu();
  //updates the whole color menu based on the current color 
  find("h-slider").style.left = (((currentColor.h / 360) * slider.maxWidth) - slider.sliderWidth / 2) + "px";
  find("s-slider").style.left = (((currentColor.s) * slider.maxWidth) - slider.sliderWidth / 2) + "px";
  find("v-slider").style.left = (((currentColor.v) * slider.maxWidth) - slider.sliderWidth / 2) + "px";
  find("a-slider").style.left = (((currentColor.a) * slider.maxWidth) - slider.sliderWidth / 2) + "px";
}

// a few more functions
function getCurrentColorString() {
  //returns a string that functions as the currentColor, rgba
  var r = {
    r:0,
    g:0,
    b:0,
    a:0
  };

  var rgb = HSVToRGB(currentColor);
  r.r = rgb.r;
  r.g = rgb.g;
  r.b = rgb.b;
  r.a = Math.round(currentColor.a * 255); //alpha is on a 0-255 scale here

  var s = "rgba(" + r.r + ", " + r.g + ", " + r.b + ", " + r.a + ")";
  
  return s;
}

function getCurrentColorRGBA() {
  //returns a string that functions as the currentColor, rgba
  var r = {
    r:0,
    g:0,
    b:0,
    a:0
  };

  var rgb = HSVToRGB(currentColor);
  r.r = rgb.r;
  r.g = rgb.g;
  r.b = rgb.b;
  r.a = Math.round(currentColor.a * 255); //alpha is on a 0-255 scale here
  
  return r;
}

//QoL update, add so when you click on the background of a slider
// then the slider will go to that position and be selected
find("h-slider-background").onmousedown = function(e) {
  sliderClick(0, event);
  updateSliders(e);
}

find("s-slider-background").onmousedown = function(e) {
  sliderClick(1, event);
  updateSliders(e);
}

find("v-slider-background").onmousedown = function(e) {
  sliderClick(2, event);
  updateSliders(e);
}

find("a-slider-background").onmousedown = function(e) {
  sliderClick(3, event);
  updateSliders(e);
}
