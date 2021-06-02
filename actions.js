//handles the actions on the right side bar
//layering, undo, redo, etc.
//in the future, add these:
//rotate right and left
//flip horizontally and vertically
//group and ungroup (I have a feeling this one will result in the most pain)
//delete button to delete current object (easy)

//first setup listeners
for (i = 0; i < actions; i++) {
  setupEventListenerAction(i);
}

//do actions on click
function setupEventListenerAction(i) {
  find("action-" + i).addEventListener('click', () => {
    doAction(i);
  });
  find("action-" + i).addEventListener('mouseenter', () => {
    onMouseOverAction(i);
  });
  find("action-" + i).addEventListener('mouseleave', () => {
    onMouseOutAction(i);
  });
}

function onMouseOverAction(i) {
  //called when mouse enters an action button
  //creates a tooltip element to detail what the action is 
  var box = find("action-" + i).getBoundingClientRect();

  var tooltip = make("p");
  document.body.appendChild(tooltip);

  tooltip.style.position = "fixed";
  tooltip.style['background-color'] = "#0F1216";;
  tooltip.innerHTML = actionNames[i];
  tooltip.style.top = box.top + 7 + "px";
  tooltip.style.right = "55px";
  tooltip.style.margin = "0";
  tooltip.style['border-radius'] = '5px';
  tooltip.style['z-index'] = '999';
  tooltip.style['text-align'] = 'center';
  tooltip.style['font-size'] = '12px';
  tooltip.style.color = '#ffffff';
  tooltip.style.padding = '5px';

  currentTooltip = tooltip;
}

function onMouseOutAction(i) {
  //called when mouse exits actions, deletes tooltip
  currentTooltip.remove();
}

function doAction(action) {
  //performs the action specificied in action
  //if(!currentItem) return;
  switch(action) {
    case 0:
      undo();
      break;
    case 1:
      redo();
      break;
    case 2:
      moveItemToTop();
      break;
    case 3:
      moveItemToBottom();
      break;
    case 4:
      moveItemForward();
      break;
    case 5:
      moveItemBackward();
      break;
    case 6:
      duplicateItem();
      break;
    case 7:
      deleteItem();
      break;
    default:
      break;
  }
  //update UI now
  find("action-" + action).animate([
    { // from
      border: "solid #0F1216"
    },
    { // to
      border: "solid #edf0f3"
    }
  ], 30);
  setTimeout(() => {
    find("action-" + action).animate([
      { // from
        border: "solid #edf0f3"
      },
      { // to
        border: "solid #0F1216"
      }
    ], 300);
  }, 30);
}

//history actions: deal with reverting work

function undo() {
  if (versionHistory.length > 0) {
    redoBuffer.push(versionHistory[versionHistory.length - 1]);
    versionHistory.pop(); //take out most recent version to undo
    refreshHistory(1);
  }
}

function redo() {
  if (redoBuffer.length > 0) {
    versionHistory.push(redoBuffer[redoBuffer.length - 1]);
    redoBuffer.pop();
    refreshHistory(2);
  }
}

function imageChanged(i) {
  //is called whenever the image changes substansially
  //called when mouse is up, but not during resizing or creating dragging
  //i is the source of it: 0 is drawing, 1 is undo, 2 is redo
  versionHistory.push(JSON.stringify(items));
  if (i == 0) redoBuffer = [];
}

function refreshHistory() {
  //sets items array to the latest version 
  //also redraws.
  //meant to be called after version history is changed 

  //I would just do this
  //items = JSON.parse(versionHistory[versionHistory.length - 1]);
  //but it does not save each item as the item class

  if (versionHistory.length > 0) {
    items = JSON.parse(versionHistory[versionHistory.length - 1]);
    for (var i = 0; i < items.length; i++) { 
      var newItem = new Item(items[i].type);
      var keys = Object.keys(items[i]);
      //set each property to the new item
      for (var k = 0; k < keys.length; k++) {
        newItem[keys[k]] = items[i][keys[k]];
      }
      items[i] = newItem;
    }
  } else {
    items = [];
  }

  redraw();
}


//layering actions
//z-index is based on position in the items list 

function moveItemToTop() {
  //moves item to the top layer 
  //this means it goes last in the items array
  if (items.length > 0 && currentItem) {
    var index = items.indexOf(currentItem);
    items.splice(index, 1);
    items.push(currentItem);
  }
  updateSelectedItem();
}

function moveItemToBottom() {
  //moves item to the bottom layer 
  //this means it goes first in the items array
  if (items.length > 0 && currentItem) {
    var index = items.indexOf(currentItem);
    items.splice(index, 1);
    items.unshift(currentItem);
  }
  updateSelectedItem();
}

function moveItemForward() {
  //moves item up by one layer 
  //it is switched with the element after it in items
  if (items.length > 1 && currentItem) {
    var index = items.indexOf(currentItem);
    var switchIndex = index + 1;
    //if the statment below is false it is already at the front
    if (switchIndex < items.length) {
      var temp = items[index];
      items[index] = items[switchIndex];
      items[switchIndex] = temp;
    }
  }
  updateSelectedItem();
}

function moveItemBackward() {
  //moves item down by one layer 
  //it is switched with the element before it in items
  if (items.length > 1 && currentItem) {
    var index = items.indexOf(currentItem);
    var switchIndex = index - 1;
    //if the statment below is false it is already at the back
    if (index > 0) {
      var temp = items[index];
      items[index] = items[switchIndex];
      items[switchIndex] = temp;
    }
  }
  updateSelectedItem();
}

//other actions: idk

function duplicateItem() {
  //duplicates the current item 

  var newItem = new Item(currentItem);
  var keys = Object.keys(currentItem);
  //set each property to the new item
  for (var k = 0; k < keys.length; k++) {
    //oops had to redo following line because shallow copies are linked
    newItem[keys[k]] = JSON.parse(JSON.stringify(currentItem[keys[k]]));
  }
  items.push(newItem);
  currentItem = newItem;
  updateSelectedItem();
}

function deleteItem() {
  //deletes the current item 
  items.splice(items.indexOf(currentItem), 1);
  redraw();
}