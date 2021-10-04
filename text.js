//handles all of the text stuff

function textClickMovingCursor(e) {
  //confusing name, but simply determines if a click is moving a cursor
  //if the click is in the bounds of the current item
  //then it is just moving the cursor. otherwise, create new text item
  var mouse = {x: e.clientX + offset.x, y: e.clientY + offset.y};

  if (find("text-tool")) {
    //there is text already, the person might just be  moving their cursor
    if (currentItem) {
      if (currentItem.type == 4) {
        var bounds = getBoundingBox(currentItem);
        if (inBounds(mouse, bounds, 2)) {
          //then the user is moving cursor
          return true;
        }
      }
    }
  }

  return false;
}

function setupTextInput(e) {
  //creates a text input box and allows the user to create text
  //in theory

  //delete old ones first
  if (find("text-tool")) find("text-tool").remove();

  var text = make("textarea");
  document.body.appendChild(text);

  //me: this shouldn't be too many attributes
  //the code:
  text.setAttribute('value', '');
  text.setAttribute('id', 'text-tool');
  
  text.style.position = "fixed";
  text.style['background-color'] = "rgba(0, 0, 0, 0.0)";
  text.style.top = (e.clientY - 8) + "px";
  text.style.left = e.clientX + "px";
  text.style.margin = "0";
  text.style['border-radius'] = '0px';
  text.style['border-width'] = '0px';
  text.style['z-index'] = '998';
  text.style['text-align'] = 'left';
  text.style['font-weight'] = 'bolder';
  text.style['caret-color'] = '#000204';
  text.style.font = '12px Helvetica';
  text.style.color = "rgba(0, 0, 0, 0.0)";
  text.style.padding = '2px';
  text.style.width = (window.innerWidth - e.clientX - 54) + 'px'; //the 54 might change
  text.style.height = '16px';
  text.style.outline = "none";
  text.style.overflow = "hidden";
  text.style.resize = "none";

  //focus after it renders 
  setTimeout(() => {
    text.focus();
  }, 1);

  //add properties
  find("text-tool").addEventListener("input", () => {
    updateToolText();
  });

  //subtract 8 from item to account for offset above
  currentItem.pos.y -= 8;
  updateToolText();
}

function updateToolText() {
  //called whenever the text box is typed in that is selected
  updateTextToolHeight();

  //now update the text item as well
  //update text, height, width
  var size = {x: 0, y: 0};
  //need to parse ints
  var width = find("text-tool").style.width;
  width = width.substring(0, width.length - 2);
  var height = find("text-tool").style.height;
  height = height.substring(0, height.length - 2);
  
  currentItem.size.x = parseInt(width) + 4; //plus 4 is the padding
  currentItem.size.y = parseInt(height) + 4;

  //text -- update it
  currentItem.text = find("text-tool").value;
  ctx.putImageData(buffer, 0, 0);
  currentItem.render();
}

function updateTextToolHeight() {
  //updates the text-tool input as long is the user is typing
  //the -4 is the padding factored in
  find("text-tool").style.height = (find("text-tool").scrollHeight - 4) + "px";
}

function updateTextToolDimensions(){
  //updates the text tool to resize and move along with text item 
  if (find("text-tool") && currentItem && currentItem.type == 4){
    var text = find("text-tool");
    var dim = getBoundingBox(currentItem);
    //-4 because padding of input element
    text.style.width = (dim.size.x - 4) + "px";
    text.style.height = (dim.size.y - 4) + "px";
    text.style.left = (dim.pos.x - offset.x) + "px";
    text.style.top = (dim.pos.y - offset.y) + "px";
  }
}