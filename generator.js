//handles the generators (triangle gradient backgrounds)
resetGeneratorValues();

function generateTriangleGradient(o) {
  //o (options) should consist of:
  //{colors: ["#654a2e", "#92a23b"], width: 400, height: 300, scale: 7, noise: 3};
  
  //first generate a list of points
  var points = [];
  //points[0] is the first point's x value, points[1] is the first point's y value
  //this is more optimized and less overhead than using objects

  for (var i = 1; i < o.scale; i++) {
    //top edge
    points.push([(o.width * i / o.scale) + gRand(o.noise), 0]);
    //bottom edge
    points.push([(o.width * i / o.scale) + gRand(o.noise), o.height]);
  }

  //helps with even spacing:
  var verticalMultiplier = (o.scale * o.height / o.width) / Math.floor(o.scale * o.height / o.width);

  for (var i = 1; i < (o.scale * o.height / o.width) - 1; i++) {
    //left edge
    points.push([0, (o.height * i / o.scale / o.height * o.width * verticalMultiplier) + gRand(o.noise)]);
    
    //right edge
    points.push([o.width, (o.height * i / o.scale / o.height * o.width * verticalMultiplier) + gRand(o.noise)]);
  }

  //and corners
  points.push([0, 0]);
  points.push([0, o.height]);
  points.push([o.width, 0]);
  points.push([o.width, o.height]);

  //now add all the points in the middle
  /*old code*
  for (var i = 1; i < o.scale; i++) {
    for (var k = 1; k < (o.scale * o.height / o.width) - 1; k++) {
      points.push([(o.width * i / o.scale) + gRand(o.noise), (o.height * k / o.scale / o.height * o.width * verticalMultiplier) + gRand(o.noise)]);
    }
  }*/

  //new method uses Mitchell's best-canidate algorithm
  var samples = 12;

  for (var i = 0; i < o.scale * o.scale * 1.5; i++) {
    //each new point to place
    var d = 0;
    var bestCandidate = {x: 0, y: 0};
    var bestDistance = 0;
    for (var k = 0; k < samples; k++) {
      //each new sample of a point
      var smallestDistance = 10000000;
      var p = {x: Math.random() * o.width, y: Math.random() * o.height};
      for (var j = 0; j < points.length; j++) { 
        d = (points[j][0] - p.x) * (points[j][0] - p.x) + (points[j][1] - p.y) * (points[j][1] - p.y);
        if (d < smallestDistance) {
          smallestDistance = d;
        }
      }
      if (smallestDistance > bestDistance) {
        bestDistance = smallestDistance;
        bestCandidate.x = p.x;
        bestCandidate.y = p.y;
      }
    }
    points.push([bestCandidate.x, bestCandidate.y]);
  }

  //now get the triangles using a handy github mini library
  var triangles = Delaunay.triangulate(points);

  //drawTriangleGradient(points, triangles);

  //now create a gradient in the specified area
  //set the whole canvas to the size
  //draw the gradient and triangles
  //then convert the canvas to an image and reset it's size
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var oldDimensions = {x: canvas.width, y: canvas.height};
  canvas.width = o.width;
  canvas.height = o.height;

  var gradient = ctx.createLinearGradient(0, 0, o.width, o.height);  

  for (var i = 0; i < o.colors.length; i++) {
    gradient.addColorStop(i / (o.colors.length - 1), o.colors[i]);
  }

  // Fill with gradient
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, o.width, o.height);

  //now draw the triangles - the tricky part
  drawTriangleGradient(points, triangles);

  //convert the canvas to an image and make it an item
  
  var dataURL = canvas.toDataURL();
  dataURL.replace(/^data:image\/png;base64,/, "");
  var bufferImage = new Image;

  bufferImage.src = dataURL + "";

  //create canvas element
  currentItem = new Item(7);
  items.push(currentItem);
  currentItem.size.x = canvas.width;
  currentItem.size.y = canvas.height;
  currentItem.image = bufferImage;
  canvas.width = oldDimensions.x;
  canvas.height = oldDimensions.y;
  fitImageToScreen(currentItem);

  setTimeout(() => { 
    redraw();
  }, 1);
}

function drawTriangleGradient(points, triangles) {
  //ctx.clearRect(0, 0, canvas.width, canvas.height);
  /*for (var i = 0; i < points.length; i += 2) {
    ctx.fillRect(points[i] + 10, points[i + 1] + 10, 12, 12);
  }*/

  ctx.width = 2;
  ctx.fillStyle = "black";
  var spacing = 0; //extra transformation

  for (var i = 0; i < triangles.length; i += 3) {
    ctx.beginPath();
    ctx.moveTo(points[triangles[i]][0] + spacing, points[triangles[i]][1] + spacing);
    ctx.lineTo(points[triangles[i + 1]][0] + spacing, points[triangles[i + 1]][1] + spacing);
    ctx.lineTo(points[triangles[i + 2]][0] + spacing, points[triangles[i + 2]][1] + spacing);

    //now get the color at this position
    //first get middle of triangle
    var middle = {x: points[triangles[i]][0] + spacing, y: points[triangles[i]][1] + spacing}
    middle.x += points[triangles[i + 1]][0] + spacing + points[triangles[i + 2]][0] + spacing;
    middle.x /= 3;
    middle.y += points[triangles[i + 1]][1] + spacing + points[triangles[i + 2]][1] + spacing;
    middle.y /= 3;
    //get color at middle of triangle
    var p = ctx.getImageData(middle.x, middle.y, 1, 1).data; 
    var hex = RGBToHex({r: p[0], g: p[1], b: p[2]});
    ctx.fillStyle = hex;
    //fill whole triangle with this color

    ctx.fill();
  }
}

function gRand(noise) {
  //outputs a random value based on noise value passed in
  return (Math.random() * noise * 2) - noise;
  //if noise is 4, this will return from -4 to 4;
}

//now UI stuff

function openGeneratorMenu() {
  find("generator-area").style.display = 'block';
  canDraw = false;
}

function closeGeneratorMenu() {
  find("generator-area").style.display = "none";
  setTimeout(() => {
    canDraw = true;
  }, 100);
}

var projectClickEvent3 = document.getElementById('generator-area-background');

document.addEventListener('mousedown', function(event) {
  if (find("generator-area").style.display == "block") {
    if (!projectClickEvent3.contains(event.target)) {
      closeGeneratorMenu();
    }
  } 
});

find("generator-reset").onclick = function() {
  resetGeneratorValues();
}

find("generator-button").onclick = function() {
  generateTriangleMesh();
}

function resetGeneratorValues() {
  //resets the input fields of all generator options to the default
  //default: {width: 1200, height: 800, scale: 6, noise: 30, colors: ["#76f88c", "#1b20da"]};
  find("gen-width-input").value = "1200";
  find("gen-height-input").value = "800";
  find("gen-frequency-input").value = "6";
  find("gen-noise-input").value = "30";
  find("gen-color1-input").value = "#76f88c";
  find("gen-color2-input").value = "#1b20da";
}

function generateTriangleMesh() {
  //generates a triangle based on input value
  var options = {width: 1200, height: 800, scale: 6, noise: 30, colors: ["#76f88c", "#1b20da"]};
  options.width = parseInt(find("gen-width-input").value);
  options.height = parseInt(find("gen-height-input").value);
  options.scale = parseInt(find("gen-frequency-input").value);
  options.noise = parseInt(find("gen-noise-input").value);
  options.colors = [find("gen-color1-input").value, find("gen-color2-input").value];
  
  if (isNaN(options.width) || isNaN(options.height)) return;
  if (isNaN(options.scale) || isNaN(options.noise)) return;  
  
  generateTriangleGradient(options);
  closeGeneratorMenu();
}