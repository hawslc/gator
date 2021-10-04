//main.js
//handles main stuff and most of the drawing

//variables
init();

//events
document.addEventListener('mousedown', mouseDown);
document.addEventListener('mousemove', mouseMoved);
document.addEventListener('mouseup', mouseUp); 
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp); 

//set the position on a mouse event
function updatePosition(e) {
  pos.x = e.clientX;
  pos.y = e.clientY;
}

find("canvas").onmouseleave = function mouseLeaveCanvas() {
  if (!canDraw) return;
  //when the mouse leaves the canvas, deselect under certain conditions
  if (tool != 4 && tool != 7) { 
    currentItem = undefined;
    if (isMouseDown) imageChanged();
  }
}

function isOffCanvas(e) {
  //returns true if the mouse is not over the canvas
  return e.clientX < offset.x * -1 || e.clientY < offset.y * -1 || e.clientX > window.innerWidth - 50;
}

function mouseDown(e) {
  if (!canDraw) return;
  //do stuff when the mouse is down
  isMouseDown = true;
  //first make sure we are on the canvas
  if (isOffCanvas(e)) return;

  //now do things
  updatePosition(e);
  buffer = ctx.getImageData(0, 0, canvas.width, canvas.height);
  //non-drawing tools
  if (tool == 7) {
    selectTool(e);
    return;
  }
  if (tool == 4) {
    if (textClickMovingCursor(e)) {
      //just moving the cursor, dont create new item
      redraw(); 
      return;
    }
  }

  currentItem = new Item(tool);

  currentItem.color = {h: currentColor.h, s: currentColor.s, v: currentColor.v, a: currentColor.a};

  currentItem.filled = isFilled;
  currentItem.width = currentWidth;

  items.push(currentItem);
  currentItem.pos = {x: e.clientX + offset.x, y: e.clientY + offset.y};

  if (tool == 0 || (tool == 5 && !eraseByObject)) {
		currentItem.addPath(e.clientX + offset.x, e.clientY + offset.y);
    currentItem.renderLastStroke(ctx);
  } 
  if (tool == 1) {
    currentItem.roundness = currentBorderRadius;
  }
  if (tool == 4) {
    currentItem.font = '12px Helvetica';
    setupTextInput(e);
  }
  if ((tool == 5 && !eraseByObject)) {
    //currentItem.color = "#000000";
  }
  if (tool == 6) {
    fillBucket(e); //fill bucket done on start
  }
}

function mouseMoved(e) {
  if (!canDraw) return;
  updateSliders(e);

  if (isOffCanvas(e)) return;
  draw(e);
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;
  //mousepos updating is after so it allows for offsets
}

function mouseUp(e) {
  if (!canDraw) return;
  //when they finish drawing an object, make that object calculate
  //its height and width
  isMouseDown = false;
  if (currentItem) {
    currentItem.calculateDimensions();
  }

  if (!isOffCanvas(e)) imageChanged(0);//update version history

  if (tool == 7 && !isOffCanvas(e)) {
    selectMouseUp();
  }
}

function draw(e) {
  //first, return if left mouse button is not pressed
  if (e.buttons !== 1) return;
  //also return if outside canvas or the current item is null
  if (isOffCanvas(e)) return;
  if (!currentItem) return;

  //decides what to draw
  switch (tool) {
    case 0:
      drawPen(e);
      break;
    case 1:
      drawPolygon(e);
      break;
    case 2:
      drawEllipse(e);
      break;
    case 3:
      drawLine(e);
      break;
    case 4:
      //text, do nothing
      break;
    case 5:
      //account for object eraser
      if (eraseByObject) { 
        drawObjectEraser(e);
      } else { 
        drawPen(e); //eraser is implimented within the object class
      }
      break;
    case 6:
      fillBucket(e);
      break;
    case 7:
      moveSelectedItem(e);
      break;
    default:
      drawPen(e);
      break;
  }
}

//draw with pen
function drawPen(e) {
  ctx.putImageData(buffer, 0, 0);

  currentItem.addPath(e.clientX + offset.x, e.clientY + offset.y);
  currentItem.render();
}

function drawPolygon(e) {
  //draws a polygon, right now its only a square
  ctx.putImageData(buffer, 0, 0); 

  var size = {x: e.clientX + offset.x - currentItem.pos.x, y: e.clientY + offset.y - currentItem.pos.y};

  //account for squares
  if (isShiftKeyDown) {
    var larger = Math.max(Math.abs(size.x), Math.abs(size.y));
    var neg = {x: size.x < 0, y: size.y < 0};
    size.x = larger * (neg.x ? -1 : 1);
    size.y = larger * (neg.y ? -1 : 1);
  }

	currentItem.size = size;

  //before we render the current item, account for rounded rectangles
  if (isFilled) {
    if (currentBorderRadius > 0) {
      currentItem.type = 8;
      currentItem.roundness = currentBorderRadius;
    } else {
      currentItem.type = 1;
    }
  }
	//render the current item
	currentItem.render();
}

function drawEllipse(e) {
  //draws a polygon, right now its only a square
  ctx.putImageData(buffer, 0, 0);
  var size = {x:e.clientX + offset.x - currentItem.pos.x, y:e.clientY + offset.y - currentItem.pos.y};

  //if shiftKey then only draw circles
  if (isShiftKeyDown) {
    var larger = Math.max(Math.abs(size.x), Math.abs(size.y));
    var neg = {x: size.x < 0, y: size.y < 0};
    size.x = larger * (neg.x ? -1 : 1);
    size.y = larger * (neg.y ? -1 : 1);
  }

  currentItem.size.x = size.x;
  currentItem.size.y = size.y;
	//render the current item
	currentItem.render();
}

function drawLine(e) {
  //draws a line
  ctx.putImageData(buffer, 0, 0);
  var size = {x: e.clientX + offset.x - currentItem.pos.x, y: e.clientY + offset.y - currentItem.pos.y};

  //account for squares
  if (isShiftKeyDown) {
    //basically, math
    var theta = Math.atan2(size.y, size.x);
    theta *= 180 / Math.PI; //still -180 to 180 range
    if (theta < 0) theta += 360; //handle correct range
    var octalet = Math.round((theta + 22.5) / 45 - ((theta + 22.5) % 45) / 45) % 8;
    //the octalect is 0 for 0 degrees (right)
    //and it increases by 1 every time you go up 45 degrees clockwise
    //represents the nearest straight or 45 deg line to snap to

    switch (octalet) {
      case 0:
        //drawing to the right
        size.y = 0;
        break;
      case 1:
        //drawing to the right bottom
        var n = Math.sqrt(size.x * size.x + size.y * size.y);
        n /= Math.sqrt(2);
        size.x = n;
        size.y = n;
        break;
      case 2:
        //drawing to the bottom
        size.x = 0;
        break;
      case 3:
        //drawing to the left bottom
        var n = Math.sqrt(size.x * size.x + size.y * size.y);
        n /= Math.sqrt(2);
        size.x = n * -1;
        size.y = n;
        break;
      case 4:
        //drawing to the left
        size.y = 0;
        break;
      case 5:
        //drawing to the top left
        var n = Math.sqrt(size.x * size.x + size.y * size.y);
        n /= Math.sqrt(2);
        size.x = n * -1;
        size.y = n * -1;
        break;
      case 6:
        //drawing to the top
        size.x = 0;
        break;
      case 7:
        //drawing to the top right 
        var n = Math.sqrt(size.x * size.x + size.y * size.y);
        n /= Math.sqrt(2);
        size.x = n;
        size.y = n * -1;
        break;
      default:
        break;
    }
  }

	currentItem.size = size;
	//render the current item
	currentItem.render();
}

function drawObjectEraser(e) {
  currentItem.addPath(e.clientX + offset.x, e.clientY + offset.y);
  currentItem.render();
}

function fillBucket(e) {
  currentItem.render();
}

find("width-input").oninput = widthInput;
find("border-radius-input").oninput = widthInput;

function widthInput() {
  //also border radius input function
  //currentWidth = find("width-input").value;
  
  if (find("width-area").style.display == "block") {
  var s = parseInt(find("width-input").value);
    currentWidth = s;
    if (currentItem) {
      currentItem.width = currentWidth;
      updateSelectedItem();
    }
    console.log(4);
  } else {
    var s = parseInt(find("border-radius-input").value);
    currentBorderRadius = s;
    if (currentItem) {
      if (currentItem.hasOwnProperty('roundness')) currentItem.roundness = currentBorderRadius;
      updateSelectedItem();
    }
  }
}



//now, related to colors, the fill styles
find("filled-button").onclick = function() {
  isFilled = true;
  updateFillType();
  if(currentItem) updateSelectedItem();
}

find("outlined-button").onclick = function() {
  isFilled = false;
  updateFillType();
  if(currentItem) updateSelectedItem();
}

function updateFillType() {
  //updated the filled / outlined buttons and properties according to isFilled
  if (isFilled) {
    find("outlined-button").style.border = "solid #535359";
    find("filled-button").style.border = "solid #E0E2E5";
  } else {
    find("outlined-button").style.border = "solid #E0E2E5";
    find("filled-button").style.border = "solid #535359";
  }
  
  if (currentItem) currentItem.filled = isFilled;
}

//keydowns and ups 
function keyDown(e) {
  isShiftKeyDown = e.shiftKey;
  checkMoveKey(e);
} 

function keyUp(e) {
  isShiftKeyDown = e.shiftKey;
}

//arrow keys can move objects
function checkMoveKey(e) {
  if (!currentItem) return;
  var moveDistance = 10;
  if (isShiftKeyDown) moveDistance = 2;
  
  if (e.keyCode == 38) {
    // up arrow
    currentItem.pos = {x: currentItem.pos.x + 0, y: currentItem.pos.y - moveDistance}; 
    updateSelectedItem();
  }
  else if (e.keyCode == 40) {
    // down arrow
    currentItem.pos = {x: currentItem.pos.x + 0, y: currentItem.pos.y + moveDistance}; 
    updateSelectedItem();
  }
  else if (e.keyCode == 37) {
    // left arrow
    currentItem.pos = {x: currentItem.pos.x - moveDistance, y: currentItem.pos.y}; 
    updateSelectedItem();
  }
  else if (e.keyCode == 39) {
    // right arrow
    currentItem.pos = {x: currentItem.pos.x + moveDistance, y: currentItem.pos.y}; 
    updateSelectedItem();
  }
}

//uploading an image 
find("import-upload").addEventListener('change', (e) => {
  if (e.target.files) {
    var file = e.target.files[e.target.files.length - 1];
    var fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onloadend = (e) => {
      var image = new Image();
      image.src = e.target.result;
      image.onload = () => {
        //create new item with the image 
        currentItem = new Item(7);
        items.push(currentItem);
        currentItem.size.x = image.width;
        currentItem.size.y = image.height;
        currentItem.image = image;
        fitImageToScreen(currentItem)
        currentItem.render();
      }
    }
  } 
});

//downloading an image 
//4 lines of code from 2 hours of research
find("export-button").addEventListener('click', () => { 
  find("export-button").href = canvas.toDataURL("image/png").replace(/^data:image\/[^;]/, 'data:application/octet-stream');
  find("export-button").click();
}, false);
