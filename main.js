//main.js

//variables
var canvas = find('canvas');
var pos = {x:undefined, y:undefined};
var offset = {x:-320, y:-70};
var ctx = canvas.getContext('2d');
var buffer = undefined;
var writing = false; //if the user is typing text
var tool = 3;
var tools = 8; //total number of tools

init();

//events
document.addEventListener('mousedown', mouseDown);
document.addEventListener('mousemove', draw);

//initialize
function init() {
  canvas.width = window.innerWidth + offset.x;
  canvas.height = window.innerHeight + offset.y;

  //abstraction making my life easier :)
  for (var i = 0; i < tools; i++) {
    setupEventListener(i);
  }
}

//makes the buttons switch between tools
function setupEventListener(i) {
  find("tool-" + i).addEventListener('click',() => {
    changeTool(i);
  });
}

function changeTool(i) {
  tool = i;
}

//set the position on a mouse event
function updatePosition(e) {
  pos.x = e.clientX;
  pos.y = e.clientY;
}

function mouseDown(e) {
  //do stuff when the mouse is down
  updatePosition(e);

  if (tool == 1 || tool == 2 || tool == 3) {
    buffer = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
  if (tool == 4) {
    //writing text
  }
}

function draw(e) {
  //first, return if left mouse button is not pressed
  if (e.buttons !== 1) return;

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
      drawPen(e);
      break;
    case 6:
      drawPen(e);
      break;
    case 7:
      drawPen(e);
      break;
    default:
      drawPen(e);
      break;
  }
}

//draw with pen
function drawPen(e) {
  //first make sure we have a valid previous point to draw from
  if (!pos.x || !pos.y) {
    updatePosition(e);
    return;
  }
  //draw from previous position
  ctx.beginPath();

  //properties
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#020304';

  //draw it
  ctx.moveTo(pos.x + offset.x, pos.y + offset.y); //from this spot
  updatePosition(e);
  ctx.lineTo(pos.x + offset.x, pos.y + offset.y); //to this spot

  //draw
  ctx.stroke();
}

function drawPolygon(e) {
  //draws a polygon, right now its only a square
  ctx.putImageData(buffer, 0, 0);
  ctx.fillStyle = '#020304';
  ctx.fillRect(pos.x + offset.x, pos.y + offset.y, e.clientX - pos.x, e.clientY - pos.y);
}

function drawEllipse(e) {
  //draws a polygon, right now its only a square
  ctx.putImageData(buffer, 0, 0);
  ctx.fillStyle = '#020304';
  ctx.beginPath();
  var distance = Math.sqrt((e.clientX - pos.x) * (e.clientX - pos.x) + (e.clientY - pos.y) * (e.clientY - pos.y));
  ctx.arc(pos.x + offset.x, pos.y + offset.y, distance, 0, 2 * Math.PI);
  ctx.fill();
}

function drawLine(e) {
  //draws a line
  ctx.putImageData(buffer, 0, 0);

  ctx.beginPath();

  //properties
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#020304';

  //draw it
  ctx.moveTo(pos.x + offset.x, pos.y + offset.y); //from this spot
  ctx.lineTo(e.clientX + offset.x, e.clientY + offset.y); //to this spot

  //draw
  ctx.stroke();
}
