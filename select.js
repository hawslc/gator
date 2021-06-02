//here we goooo


function selectTool(e) {
  //decides what to do when the select tool is on and clicked
  //if a resize box is clicked then resize
  //otherwise select the nearest object

  var clickedResizeBox = false;

  if (currentItem) {
    var x = e.clientX + offset.x;
    var y = e.clientY + offset.y;
    var b = selectDragBoxSize;// the only point of this line is pain saved
    var padding = 5;

    for (var i = 0; i < selectDragBoxes.length; i++) {
      //check if its in a certain drag box, bounds checking
      if (x + padding > selectDragBoxes[i].x - b){
        if (x - padding < selectDragBoxes[i].x + b){
          if (y + padding > selectDragBoxes[i].y - b){
            if (y - padding < selectDragBoxes[i].y + b){
              clickedResizeBox = true;
              selectDragBox = i;
            }
          }
        }
      }
    }
  }

  if (clickedResizeBox) {
    selectStartOrientation = getItemOrientation(currentItem);
    isStretching = true;
    stretchSelectedItem(e);
  } else {
    selectItem(e);
  }
}

function selectItem(e) {
  var itemPos = {x: e.clientX + offset.x, y: e.clientY + offset.y};
  var close = []; //list of items based on how close they are
  
  for (var i = 0; i < items.length; i++) {
    //closeness is the x offset plus the y offset
    var itemCloseness = Math.abs(itemPos.x - items[i].pos.x);
    itemCloseness += Math.abs(itemPos.y - items[i].pos.y);

    close.push({item: items[i], distance: itemCloseness});
  }

  //sort items by closeness 
  close.sort((a, b) => (a.distance > b.distance) ? 1 : -1);
  //index zero is the closest one 
  //now loop through the first fifty or so and 
  //the first one we are clicking gets selected
  //if the user did not click on an item then deselect

  var closestItem = undefined;
  
  for (var i = 0; i < 10 && i < close.length; i++) {
    //check if bounds for each item
    var bounds = getBoundingBox(close[i].item);
    if (inBounds(itemPos, bounds, 5)) {
      closestItem = close[i].item;
      break;
    }
  }
  
  
  //if click not in bounds, then dont select
  if (closestItem) {
    currentItem = closestItem;
    selectOffset.x = itemPos.x;
    selectOffset.y = itemPos.y;
    selectStartPos.x = currentItem.pos.x;
    selectStartPos.y = currentItem.pos.y;

    //only update global properties if item is right type 
    //for example, images do not have a color property
    if (currentItem.type != 7) {
      matchGlobalProperties();
    }
    
    updateSelectedItem();
  } else {
    //if not on right side bar, deselect
    if (e.clientX < window.innerWidth - 50) {
      currentItem = undefined;
      redraw();
    }
  }
}

function matchGlobalProperties() {
  //when an item is selected, update global properties to match the selected item
  currentColor.h = currentItem.color.h;
  currentColor.s = currentItem.color.s;
  currentColor.v = currentItem.color.v;
  currentColor.a = currentItem.color.a;
  currentWidth = currentItem.width;
  isFilled = currentItem.filled;

  //now that we have set properties, update them
  refreshColorSliders();
  updateFillType();
  if (currentItem.roundness || currentItem.roundness == 0) {
    currentBorderRadius = currentItem.roundness;
    setBorderRadiusText();
  } else {
    setWidthText();
  }
}

function selectMouseUp() {
  //mouse is up 
  if (currentItem) {
    isStretching = false;
  }
}

function moveSelectedItem(e) {
  //moves item as the person is dragging it around
  if (isStretching) {
    stretchSelectedItem(e);
    return;
  }

  if (!currentItem) return;
  var x = (e.clientX + offset.x) - selectOffset.x + selectStartPos.x;
  var y = (e.clientY + offset.y) - selectOffset.y + selectStartPos.y;
  currentItem.pos = {x: x, y: y};

  updateSelectedItem();
  //text stuff
  if (currentItem.type == 4) {
    updateTextToolDimensions();
  }
}

function updateSelectedItem() {
  //correctNegativeSize(currentItem);
  redraw();
  drawBoundingBox();
}

function drawBoundingBox() {
  //draws a bow around the selected object to show that it is selected
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.strokeStyle = selectBoxColor;
  ctx.globalAlpha = 1;

  //the getBoundingBox function will return the bounding box of an item, what to draw
  var bounds = getBoundingBox(currentItem);
  var drawPos = {x: bounds.pos.x, y: bounds.pos.y};
  var dimensions = {x: bounds.size.x, y: bounds.size.y};

  //draw the right corners in the right spots
  var allDimensions = {x: drawPos.x, y:drawPos.y, w: dimensions.x, h:dimensions.y};
  var d = formatDimensions(allDimensions, true, true);
  drawPos.x = d.x;
  drawPos.y = d.y;
  dimensions.x = d.w;
  dimensions.y = d.h;

  //draw the box
  ctx.beginPath();
  ctx.rect(drawPos.x, drawPos.y, dimensions.x, dimensions.y);
  ctx.stroke();
  selectDragBoxes = [];

  //now drag drag boxes 
  drawDragBox(drawPos.x, drawPos.y);
  drawDragBox(drawPos.x + dimensions.x / 2, drawPos.y);
  drawDragBox(drawPos.x + dimensions.x, drawPos.y);
  drawDragBox(drawPos.x, drawPos.y + dimensions.y / 2);
  drawDragBox(drawPos.x + dimensions.x, drawPos.y + dimensions.y / 2);
  drawDragBox(drawPos.x, drawPos.y + dimensions.y);
  drawDragBox(drawPos.x + dimensions.x / 2, drawPos.y + dimensions.y);
  drawDragBox(drawPos.x + dimensions.x, drawPos.y + dimensions.y);

  //chart showing the boxes index
  //   0 1 2
  //   3   4
  //   5 6 7
}

function drawDragBox(x, y) {
  ctx.fillStyle = selectBoxColor;
  ctx.globalAlpha = 1;
  selectDragBoxes.push({x: x, y: y});

  ctx.fillRect(x - selectDragBoxSize, y - selectDragBoxSize, 
  selectDragBoxSize * 2, selectDragBoxSize * 2);
}

function stretchSelectedItem(e) {
  //this is going to be a long function...
  
  var x = e.clientX + offset.x; //x position of mouse
  var y = e.clientY + offset.y; //y position of mouse
 
  //how the mouse has changed since the last mouse position
  var change = {x: e.clientX - mousePos.x, y: e.clientY - mousePos.y};
  //the difference between the current mouse position and the pos
  var dif = {x: x - currentItem.pos.x, y: y - currentItem.pos.y};
  //the item orientation
  var o = selectStartOrientation; //getItemOrientation(currentItem);

  //the new variables to set 
  var newSize = {x:currentItem.size.x, y:currentItem.size.y};
  var newPos = {x:currentItem.pos.x, y:currentItem.pos.y};

  //account for scale 
  newSize.x *= currentItem.scale.x;
  newSize.y *= currentItem.scale.y;

  //store the original dimensions for scaling purposes
  var original = {pos: {x: newPos.x, y: newPos.y},
  size: {x: newSize.x, y: newSize.y}};
  
  //now for the code
  //I'm gonna need to optimize this in the future
  if (selectDragBox == 0) {
    if (o == 0) {
      //case a
      newSize.x -= change.x;
      newSize.y -= change.y;
      newPos.y += change.y;
      newPos.x += change.x;
    } else if (o == 1) {
      //case b
      newSize.x += change.x;
      newSize.y -= change.y;
      newPos.y += change.y;
    } else if (o == 2) {
      //case c
      newSize.x -= change.x;
      newSize.y += change.y;
      newPos.x += change.x;
    } else {
      //case d
      newSize.x += change.x;
      newSize.y += change.y;
    }
  }

  if (selectDragBox == 7) {
    if (o == 0) {
      //case d
      newSize.x += change.x;
      newSize.y += change.y;
    } else if (o == 1) {
      //case c
      newSize.x -= change.x;
      newSize.y += change.y;
      newPos.x += change.x;
    } else if (o == 2) {
      //case b
      newSize.x += change.x;
      newSize.y -= change.y;
      newPos.y += change.y;
    } else {
      //case a
      newSize.x -= change.x;
      newSize.y -= change.y;
      newPos.y += change.y;
      newPos.x += change.x;
    }
  }

  if (selectDragBox == 2) {
    if (o == 0) {
      //case b
      newSize.x += change.x;
      newSize.y -= change.y;
      newPos.y += change.y;
    } else if (o == 1) {
      //case a
      newSize.x -= change.x;
      newSize.y -= change.y;
      newPos.y += change.y;
      newPos.x += change.x;
    } else if (o == 2) {
      //case d
      newSize.x += change.x;
      newSize.y += change.y;
    } else {
      //case c
      newSize.x -= change.x;
      newSize.y += change.y;
      newPos.x += change.x;
    }
  }

  if (selectDragBox == 5) {
    if (o == 0) {
      //case c
      newSize.x -= change.x;
      newSize.y += change.y;
      newPos.x += change.x;
    } else if (o == 1) {
      //case d
      newSize.x += change.x;
      newSize.y += change.y;
    } else if (o == 2) {
      //case a
      newSize.x -= change.x;
      newSize.y -= change.y;
      newPos.y += change.y;
      newPos.x += change.x;
    } else {
       //case b
      newSize.x += change.x;
      newSize.y -= change.y;
      newPos.y += change.y;
    }
  }

  //now edge boxes

  if (selectDragBox == 1) {
    if (o == 0) {
      newPos.y += change.y;
      newSize.y -= change.y;
    } else if (o == 1) {
      newPos.y += change.y;
      newSize.y -= change.y;
    } else if (o == 2) {
      newSize.y += change.y;
    } else {
      newSize.y += change.y;
    }
  }

  if (selectDragBox == 6) {
    if (o == 0) {
      newSize.y += change.y;
    } else if (o == 1) {
      newSize.y += change.y;
    } else if (o == 2) {
      newPos.y += change.y;
      newSize.y -= change.y;
    } else {
      newPos.y += change.y;
      newSize.y -= change.y;
    }
  }

  if (selectDragBox == 3) {
    if (o == 0) {
      newPos.x += change.x;
      newSize.x -= change.x;
    } else if (o == 1) {
      newSize.x += change.x;
    } else if (o == 2) {
      newPos.x += change.x;
      newSize.x -= change.x;
    } else {
      newSize.x += change.x;
    }
  }

  if (selectDragBox == 4) {
    if (o == 0) {
      newSize.x += change.x;
    } else if (o == 1) {
      newPos.x += change.x;
      newSize.x -= change.x;
    } else if (o == 2) {
      newSize.x += change.x;
    } else {
      newPos.x += change.x;
      newSize.x -= change.x;
    }
  }

  //account for scaling with shift key
  if (isShiftKeyDown) {
    //the idea is to keep the same ratio
    //but still update the size and pos

    //calculate ratio of newsize to size and apply it to both 
    //calculates the change and averages the change
    var ratio = {x: newSize.x / currentItem.size.x, y: newSize.y / currentItem.size.y};
    var neg = {x: ratio.x < 0 ? -1 : 1, y: ratio.y < 0 ? -1 : 1};
    var n = (Math.abs(ratio.x) + Math.abs(ratio.y)) / 2;
    newSize.x = n * currentItem.size.x * neg.x;
    newSize.y = n * currentItem.size.y * neg.y;

    //now apply this to the pos
    ratio = {x: newPos.x / currentItem.pos.x, y: newPos.y / currentItem.pos.y};
    neg = {x: ratio.x < 0 ? -1 : 1, y: ratio.y < 0 ? -1 : 1};
    n = (ratio.x + ratio.y) / 2;
    newPos.x = n * currentItem.pos.x * neg.x;
    newPos.y = n * currentItem.pos.y * neg.y;
  }

  //now update the current item according to the properties modified above
  currentItem.pos.x = newPos.x;
  currentItem.pos.y = newPos.y;
  
  //some things scale when stretched 
  //other things get updated sizes
  var t = currentItem.type;
  if (t == 0 || t == 5 || t == 7) {
    currentItem.scale.x = newSize.x / currentItem.size.x;
    currentItem.scale.y = newSize.y / currentItem.size.y;
  } else {
    currentItem.size.x = newSize.x;
    currentItem.size.y = newSize.y;
  }
  

  updateSelectedItem();
  //text resize
  if (currentItem.type == 4) {
    updateTextToolDimensions();
  }
}

function formatDimensions(d, x, y) {
  //so if x is true
  //then the width needs to be positive
  //if it is false then the width needs to be negative
  //if y is true height needs to be positive, etc.
  //also, scale
  

  if (x) {
    if (d.w < 0) {
      d.x += d.w;
      d.w *= -1;
    }
  } else {
    if (d.w > 0) {
      d.x += d.w;
      d.w *= -1;
    }
  }
  
  if (y) {
    if (d.h < 0) {
      d.y += d.h;
      d.h *= -1;
    }
  } else {
    if (d.h > 0) {
      d.y += d.h;
      d.h *= -1;
    }
  }
  
  return d;
}

function findUpperLeftBounds(item) {
  //finds the left and upper bounds of the item
  var size = {x: item.size.x * item.scale.x, y: item.size.y * item.scale.y};
  var pos = {x: item.pos.x, y: item.pos.y};
  var result = {x: 0, y: 0};

  result.x = pos.x;
  if (size.x < 0) {
    result.x -= size.x;
  }
  result.y = pos.y;
  if (size.y < 0) {
    result.y -= size.y;
  }

  return result;
}

function getItemOrientation(item) {
  //returns the orientation of a item as a number
  //according to pos relative to object:
  //0 is top left, 1 is top right.         0 1
  //2 is bottom left, 3 is bottom right.   2 3

  if (item.size.x * item.scale.x > 0) {
    if (item.size.y * item.scale.y > 0) {
      return 0;
    } else {
      return 2;
    }
  } else {
    if (item.size.y * item.scale.y > 0) {
      return 1;
    } else {
      return 3;
    }
  }
}

function correctNegativeSize(item) {
  //makes negative size positive
  if (item.size.x < 0) {
    item.size.x *= -1;
    item.pos.x -= item.size.x;
  }
  if (item.size.y < 0) {
    item.size.y *= -1;
    item.pos.y -= item.size.y;
  }
}


//old stretchSelectedItem code 
/*
var x = e.clientX + offset.x;
  var y = e.clientY + offset.y;
  
  var change = {x: e.clientX - mousePos.x, y: e.clientY - mousePos.y};

  if (currentItem.type != 61) {
    //rectangle 
    var scale = {x: x - currentItem.pos.x, y: y - currentItem.pos.y};
    
    var o = getItemOrientation(currentItem);

    
    //account for the box that was clicked
    if (selectDragBox == 4) {
      //right middle
      scale.y = currentItem.size.y * currentItem.scale.y;
    }
    if (selectDragBox == 6) {
    //bottom middle
    scale.x = currentItem.size.x * currentItem.scale.x;
    }
    if (selectDragBox == 0) {
      //top left
      currentItem.pos.x += change.x;
      currentItem.pos.y += change.y;
      scale.y = currentItem.size.y * currentItem.scale.y - change.y;
      scale.x = currentItem.size.x * currentItem.scale.x - change.x;
    }
    if (selectDragBox == 2) {
      //top right
      currentItem.pos.y += scale.y;
      scale.y = currentItem.size.y * currentItem.scale.y - scale.y;
    }
    if (selectDragBox == 5) {
      //bottom left
      currentItem.pos.x += scale.x;
      scale.x = currentItem.size.x * currentItem.scale.x - scale.x;
    }
    if (selectDragBox == 1) {
      //up middle
      scale.x = currentItem.size.x * currentItem.scale.x;
      currentItem.pos.y += scale.y;
      scale.y = currentItem.size.y * currentItem.scale.y - scale.y;
    }
    if (selectDragBox == 3) { 
      //left middle
      scale.y = currentItem.size.y * currentItem.scale.y;
      currentItem.pos.x += scale.x;
      scale.x = currentItem.size.x * currentItem.scale.x - scale.x;
    }
    if (selectDragBox == 8) {
      scale.x = currentItem.size.x + change.x;
      scale.y = currentItem.size.y + change.y;
    }

    //if the size is negative then change it


    
    //currentItem.scale.x = scale.x / currentItem.size.x;
    //currentItem.scale.y = scale.y / currentItem.size.y;
    currentItem.size.x = scale.x;
    currentItem.size.y = scale.y;
    //currentItem.pos.x += change.x;
    //currentItem.pos.y += change.y;
  }

  updateSelectedItem();
  */