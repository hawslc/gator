//main variables and such

//first group: canvas data
var canvas = find('canvas');
var offset = {x: -200, y: -70}; //canvas position relative to top left
var ctx = canvas.getContext('2d');
var buffer = undefined;  
var canvasSize = {x: 320, y: 320}; // the real size of the canvas, not the size displayed on the screen. for canvas scaling.
var canvasPos = {x: 0, y: 0}; //the pos of the canvas, measured the same way any other item would be measured

//second group: core data
var items = []; //stores a list of all the items
var currentItem = undefined;
var mousePos = {x: 0, y: 0};
var isMouseDown = false;
var currentProject = -1;
var canDraw = true; //used for save and loading menus and other GUI

//third group: drawing data
var tool = 0;
var tools = 8; //total number of tools
var writing = false; //if the user is typing text
var isFilled = true; // whether the filled or outlined box is selected
var currentWidth = 5; //width of item
var pos = { x: undefined, y: undefined }; //mouse position 
var isShiftKeyDown = false; //self explanatory lol
var eraseByObject = true; //if this is true, eraser deletes objects at a time
var currentBorderRadius = 0; //border radius of rectangles

//fourth group: selection data
var selectOffset = {x: 0, y: 0};
var selectStartPos = {x: 0, y: 0};
var isStretching = false; //if the user is resizing an item
var selectBoxColor = "#d6cc0f"; //color of selection box
var selectDragBoxes = []; //the little drag boxes
var selectDragBoxSize = 4; //width of little boxes
var selectDragBox = 0; //the current one
var selectStartOrientation = 0; //does something lol

//fifth group: actions data
var versionHistory = []; //like a .git file but less efficient
var redoBuffer = [];//stores the undone actions in the case of a redo
var actions = 10; //number of actions in total
var actionNames = ["Undo", "Redo", "Move to front", "Move to back", "Move forward", "Move backward", "Duplicate", "Delete",
"Toggle Snapping", "Generators"];
var currentTooltip; //keeps track of the current tooltip
var snapping = true; //true or false, whether snapping is on or not
var snapColor = "#8125c5";


//initialize
function init() {
  resizeWindow();
  
  //abstraction making my life easier :)
  for (var i = 0; i < tools; i++) {
    setupEventListenerTool(i);
  }

  changeTool(0);

  //localStorage.a = JSON.stringify(items);
}

window.addEventListener("resize", () => {
  resizeWindow();
  redraw();
});

function resizeWindow() {
  canvas.width = window.innerWidth + offset.x - 50; //50 is for the right side bar
  canvas.height = window.innerHeight + offset.y;
}

//makes the buttons switch between tools
function setupEventListenerTool(i) {
  find("tool-" + i).addEventListener('click', () => {
    changeTool(i);
  });
}

function changeTool(i) {
  tool = i;
  canDraw = true;

  //ui 
  for (var k = 0; k < tools; k++) {
    find("tool-" + k).style.border = "solid #0F1216";
  }
  find("tool-" + i).style.border = "solid #9ea3ae";

  //tool-specific code:
  if (tool == 1 && isFilled){
    setBorderRadiusText();
  } else {
    setWidthText();
  }

  //also deselect
  currentItem = undefined;
}

function setWidthText() {
  find("width-area").style.display = "block";
  find("border-radius-area").style.display = "none";
  find("width-input").value = currentWidth;
  //note: the line above is width-input, not width-text
}

function setBorderRadiusText() {
  find("width-area").style.display = "none";
  find("border-radius-area").style.display = "block";
  find("border-radius-input").value = currentBorderRadius;
}

//function that clears canvas and redraws everything
function redraw() {
  //first get real scale (or not)
  //ctx.setTransform(1, 0, 0, 1, canvasPos.x, canvasPos.y);
  //ctx.scale(canvasSize.x / canvas.width, canvasSize.y / canvas.height);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < items.length; i++) {
    items[i].render();
  }

  //reset scale (or not)
  //ctx.setTransform(1, 0, 0, 1, 0, 0);
}

//now some core functions for bounding boxes and such

//function to get the bounding box of an item, pretty important
function getBoundingBox(item) {
  //bounding box can be negative from this
  var result = {
    pos: {x: item.pos.x, y: item.pos.y},
    size: {x: item.size.x, y: item.size.y}
  }

  //modify dimensions based on things
  //before the stroke modifications
  result.size.x *= item.scale.x;
  result.size.y *= item.scale.y;

  //modify box based on type
  if (item.type == 0 || (item.type == 5 && !eraseByObject) || (item.type == 2 && item.filled == false)) {
    //stroke modifications
    //if the stroke is bigger, then make the bounding box bigger in all directions
    result.size.x += (item.width) * item.scale.x;
    result.pos.x -= (item.width) * item.scale.x / 2;
    result.size.y += (item.width) * item.scale.y;
    result.pos.y -= (item.width) * item.scale.y / 2;
  }
  if (item.type == 3) {
    //lines are the inverse of the above
    result.size.x += (item.width) * item.scale.x;
    result.pos.x -= (item.width) * item.scale.x / 2;
    result.size.y += (item.width) * item.scale.y;
    result.pos.y -= (item.width) * item.scale.y / 2;
  }

  return result;
}

function inBounds(pos, bounds, padding) {
  //given a bounds (the format used in the getBoundingBox function)
  //and a position and padding 
  //calculates whether the pos lies within the bounds (with padding)

  //check for out of x bounds
  //but also account for negative size when applying padding
  if (bounds.size.x > 0) {
    if (pos.x < bounds.pos.x - padding || pos.x - padding > bounds.pos.x + bounds.size.x) {
      return false;
    }
  } else {
    if (pos.x - padding > bounds.pos.x || pos.x < bounds.pos.x + bounds.size.x - padding) {
      return false;
    }
  }

  //now check if the click is out of y bounds
  if (bounds.size.y > 0) {
    if (pos.y < bounds.pos.y - padding || pos.y - padding > bounds.pos.y + bounds.size.y) {
      return false;
    }
  } else {
    if (pos.y - padding > bounds.pos.y || pos.y < bounds.pos.y + bounds.size.y - padding) {
      return false;
    }
  }
  //if the pos is not outside of the bounds, then it is inside of them 
  return true;
}

function fitImageToScreen(item) {
  //given an item of type image, it modifies the scale
  //to fit inside the canvas area
  if (item.size.x > canvas.width || item.size.y > canvas.height) {
    //the image is too big: scale it down

    //first calculate the ratio of the image to the canvas 
    var aspect = {
      x: item.size.x / canvas.width,
      y: item.size.y / canvas.height
    }
    //then make it fit the screen
    var max = Math.max(aspect.x, aspect.y);
    item.scale.x = 1 / max;
    item.scale.y = 1 / max;

    //center it
    /* or not
    if (aspect.x > aspect.y) {
      //white space on vertical margins
      item.pos.y -= (canvas.height - item.size.y) / 2;
    } else {
      item.pos.x -= (canvas.width - item.size.x) / 2;
    }
    */
  }
}

/*some notes:
here are global properties
currentColor
currentWidth
currentBorderRadius
isFilled
they need to be updated on selection of an item
and applied on creation of item

3000 lines on 5/8/2021
*/
