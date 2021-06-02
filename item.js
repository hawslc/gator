class Item {
  constructor(type) {
    //contruct a new item
    this.type = type;

    /*type list
    0: stroke
    1: rectangle (included rounded rectangle)
    2: ellipse
    3: line 
    4: text 
    5: eraser 
    6: fill bucket
    7: image 
   
    */

    //pos is for all items
    this.pos = {
      x:0,
      y:0
    };

    //replaced width and height with this
    //used to make bounding box
    this.size = {
      x:0,
      y:0
    };

    //scale for scaling and for a headache
    this.scale = {
      x:1,
      y:1
    };

    this.color = {h: 0, s: 0, v: 0, a: 1};

    this.complete = false; //this variable is changed to true after the item is fully created 
    //while a user is drawing a stroke or rectangle for the first time, this is false 
    //after they let go while drawing it, this turns to true
    //does not change after that, used for resize calculations and stuff

    //type specific

    if (type == 0 || type == 5) {
      this.path = [];
    }
    if (type == 1) {
      this.filled = false;
    }
    if (type == 2) {
      this.filled = false;
    }
    if (type == 3) {
      //nothing yet
    }
    if (type == 4) {
      this.text = "";
      this.font = "12px Helvetica";
    }
    if (type == 7) {
      this.image = {};
    }
  }

  //add getters and setters in the future if necessary
  //update: it wasn't necessary

  updateProperties() {
    //no bugs allowed
    ctx.lineWidth = this.width;
    ctx.lineCap = 'round';
    ctx.strokeStyle = this.colorString();
    ctx.fillStyle = this.colorString();
    ctx.globalAlpha = this.color.a;

    //eraser
    if (this.type == 5) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 1; //no translucent erasers
    } else {
      ctx.globalCompositeOperation = "source-over";
    }
  }

  colorString() {
    //converts this color to a string in hsl
    var a = HSVToHSL(this.color);
    return "hsla(" + a.h + ", " + (a.s * 100) + "%, " + (a.l * 100) + "%, " + this.color.a + ")";
  }

  calculateDimensions() {
    //first prevent duplicates
    if (this.complete) return;
    this.complete = true;
    //called when object is done being created
    //so the idea is to make x and y represent the top left of the object
    //and size.x and size.y are the width and height

    ctx.globalCompositeOperation = "source-over"; //for eraser
    if (this.type == 0 || this.type == 5) {
      //stroke and eraser both use path;
      //this code finds the highest, lowest, most left, most right points
      //and uses those points to find the bounding box
      var leastX = this.path[0]; var leastY = this.path[1];
      var mostX = this.path[0]; var mostY = this.path[1];

      for (var i = 0; i < this.path.length; i += 2) {
        var x = this.path[i]; 
        var y = this.path[i + 1];

        if (x > mostX) mostX = x;
        if (x < leastX) leastX = x;
        if (y > mostY) mostY = y;
        if (y < leastY) leastY = y;
      }

      var padding = 3; //space between the stroke and bounding box
      leastX -= this.width / 2 + padding; mostX += padding;
      leastY -= this.width / 2 + padding; mostY += padding;
      this.size.x = mostX - leastX;
      this.size.y = mostY - leastY;

      //this posOffset stores the pos minus the top left of the image 
      //allows for the bounding box to be correctly positioned
      this.posOffset = {x: -leastX, y: -leastY};

      //testing better code here:
      //basically when the user is finished drawing it changes pos to be a corner
      //and the variable posOffset keeps track of the change 
      //this.posOffset = {x: -this.pos.x + leastX, y: -this.pos.y + leastY};
      this.pos.x = this.pos.x + leastX;
      this.pos.y = this.pos.y + leastY;

      //ps: I ended up combining old and better code to work
    }

    if (this.type == 2) {
      //already accounted for
    }

    if (this.type == 1) {
      //if width and height are negative, fix that
      //or not 
      /*
      if (this.size.x < 0) {
        this.pos.x += this.size.x;
        this.size.x *= -1;
      }
      if (this.size.y < 0) {
        this.pos.y += this.size.y;
        this.size.y *= -1;
      }*/
    }

    //if this object is an eraser and eraseByObject is true then delete it: 
    //this type of eraser is not saved as an item
    if (this.type == 5 && eraseByObject) {
      items.splice(items.length - 1, 1); //tacky solution, assumes this item is the most recent one
    }
  }

  render() {
    //pre-render stuff
    //make the scale correct
    ctx.scale(this.scale.x, this.scale.y);
    this.pos.x /= this.scale.x;
    this.pos.y /= this.scale.y;
    this.updateProperties();
    switch (this.type) {
      case 0:
        this.renderStroke();
        break;
      case 1:
        //decide whether to draw a rectangle or a roundend rectangle
        if (this.roundness && this.filled) {
          this.renderRoundedRectangle();
        } else { 
          this.renderPolygon();
        }
        break;
      case 2:
        this.renderEllipse();
        break;
      case 3:
        this.renderLine();
        break;
      case 4:
        this.renderText();
        break;
      case 5:
        if (eraseByObject) {
          this.eraseObject();
        } else {
          this.renderStroke();
        }
        break;
      case 6:
        this.renderFillBucket();
        break;
      case 7:
        this.renderImage();
        break;
      
      
    }

    //reset scale
    ctx.scale(1 / this.scale.x, 1 / this.scale.y);
    this.pos.x *= this.scale.x;
    this.pos.y *= this.scale.y;
  }

	//stroke functions
  renderStroke() {
    var localOffset = { x: this.pos.x, y: this.pos.y };

    //account for path offset 
    if (this.posOffset) {
      localOffset.x += this.posOffset.x;
      localOffset.y += this.posOffset.y;
    }

    //properties
    ctx.beginPath();

    //go through each point in path and draw it
    
    for (var i = 0; i < this.path.length - 2; i += 2) {
      //draw it
      ctx.moveTo(this.path[i] + localOffset.x, this.path[i + 1] + localOffset.y); //from this spot
      ctx.lineTo(this.path[i + 2] + localOffset.x, this.path[i + 3] + localOffset.y); //to this spot
    }
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  }

  renderLastStroke() {
    //have to update properties: this is only render function that is called from another script
    this.updateProperties();
    var localOffset = { x: 0, y: 0 };
    
    //account for path offset 
    if (this.posOffset) {
      localOffset.x += this.posOffset.x;
      localOffset.y += this.posOffset.y;
    }

    //properties already taken care of
    //ctx.globalCompositeOperation = "source-out";
    ctx.beginPath();

    var len = this.path.length;
    //draw it

		if (len > 3) {
			ctx.moveTo(this.path[len - 4] + localOffset.x + this.pos.x, this.path[len - 3] + localOffset.y + this.pos.y); //from this spot
		} else {
			//account for dots
			ctx.moveTo(this.path[len - 2] + localOffset.x + this.pos.x, this.path[len - 1] + localOffset.y + this.pos.y);
		}

    ctx.lineTo(this.path[len - 2] + localOffset.x + this.pos.x, this.path[len - 1] + localOffset.y + this.pos.y); //to this spot
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  }

	addPath(x, y) {
		//adds an item to the path with x and y
		this.path.push(x - this.pos.x);
		this.path.push(y - this.pos.y);
	}

  //eraseByObject
  eraseObject() {
    //this code should be put into a function, mostly copied from select.js
    var localOffset = { x: this.pos.x, y: this.pos.y };

    var len = this.path.length;
    var itemPos = {x: this.path[len - 2] + localOffset.x, y: this.path[len - 1] + localOffset.y};
    var close = []; //list of items based on how close they are
    
    for (var i = 0; i < items.length; i++) {
      var itemCloseness = Math.abs(itemPos.x - items[i].pos.x);
      itemCloseness += Math.abs(itemPos.y - items[i].pos.y);

      close.push({item: items[i], distance: itemCloseness});
    }

    //sort items by closeness 
    close.sort((a, b) => (a.distance > b.distance) ? 1 : -1);
    //index zero is the closest one 
    //now loop through the first five or so and 
    //the first one we are clicking gets selected
    //if the user did not click on an item then deselect

    var closestItem = undefined;
    
    for (var i = 0; i < 50 && i < close.length; i++) {
      var inBounds = true;

      var bounds = getBoundingBox(close[i].item);
      var size = {x:bounds.size.x, y:bounds.size.y};
      var pos = {x:bounds.pos.x, y:bounds.pos.y};
      var padding = 5; //how far away the mouse can be and it still
      //count as hitting the box

      //check for out of x bounds
      if (size.x > 0) {
        if (itemPos.x < pos.x - padding || itemPos.x - padding > pos.x + size.x) {
          inBounds = false;
        }
      } else {
        if (itemPos.y - padding > pos.y || itemPos.y < pos.y + size.y - padding) {
          inBounds = false;
        }
      }

      //now check if the click is out of y bounds
      if (size.y > 0) {
        if (itemPos.y < pos.y - padding || itemPos.y - padding > pos.y + size.y) {
          inBounds = false;
        }
      } else {
        if (itemPos.y - padding > pos.y || itemPos.y < pos.y + size.y - padding) {
          inBounds = false;
        }
      }

      if (inBounds) {
        closestItem = close[i].item;
        break;
      }
    }

    //if there is an item that we are within the bounding box of, then delete it
    if (closestItem) {
      //find the item in the list of items and delete it 
      var itemIndex = 0;
      for (var i = 0; i < items.length; i++) {
        if (items[i] == closestItem) {
          items.splice(i, 1);
          redraw();
          break;
        }
      }
    }
  }

	//polygon functions
	renderPolygon() {
    if (this.filled) {
  	  ctx.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y);
    } else {
      ctx.beginPath();
      var dif = this.width / 2 + 2; //border is big so draw it a big smaller
      var d = {x: dif * (this.size.x < 0 ? -1 : 1), y: dif * (this.size.y < 0 ? -1 : 1)};
  	  ctx.rect(this.pos.x + d.x, this.pos.y + d.y, this.size.x - d.x * 2, this.size.y - d.y * 2);
      ctx.stroke();
    }
	}

	renderEllipse() {
    ctx.beginPath();
    if (this.size.x == 0 || this.size.y == 0) return;

    //modify scale to draw the ellipse properly
    //note: all ellipses are drawn as a unit circle
    // but this circle has modified scale.
    ctx.scale(this.size.x / 2, this.size.y / 2);
    var tempPos = {x: this.pos.x, y:this.pos.y}; //serves as a backup
    this.pos.x += this.size.x / 2;
    this.pos.y += this.size.y / 2;
    this.pos.x /= this.size.x / 2;
    this.pos.y /= this.size.y / 2;

    if (!this.filled) ctx.beginPath();

		ctx.arc(this.pos.x, this.pos.y, 1, 0, 2 * Math.PI);
    
    if (this.filled) {
		  ctx.fill();
    } else {
      //the problem is that the scale is affecting the stroke 
      ctx.lineWidth = this.width / ((this.size.x + this.size.y) / 2) * 2;
      console.log(ctx.lineWidth);
      ctx.stroke();
    }

    //reset scale and position
    ctx.scale(1 / (this.size.x / 2), 1 / (this.size.y / 2));
    this.pos.x = tempPos.x;
    this.pos.y = tempPos.y;
	}

	renderLine() {
		ctx.beginPath();

		//draw it
		ctx.moveTo(this.pos.x, this.pos.y); //from this spot
		ctx.lineTo(this.pos.x + this.size.x, this.pos.y + this.size.y); //to this spot

		//draw
		ctx.stroke();
	}

  renderText() {
    //the simple days are long past us...
    
    //first solution: filltext(text), no wrapping
    //second solution: draw as svg, security errors
    //third solution: draw line by line
    if (this.text.length < 1) return;
    var words = this.text.split(' ');
    var lines = [""];
    var textOffset = {x: 2, y: 1};
    var maxWidth = this.size.x - 3; //adjust this if text wrapping differs between input and this
    var splitByNewLine;

    for (var j = 0; j < words.length; j++) { 
      splitByNewLine = words[j].split('\n');
      //how to handle newlines:
      //every time a newline appears, split the word its in into two parts
      //for the word vac\ncum, change it to three words 
      // vac    \n     cum
      //each newline will be its own word
      if (splitByNewLine.length > 1) {
        for (var u = 0; u < splitByNewLine.length; u++) {
          words.splice(j + u * 2, 0, splitByNewLine[u]);
          if (u != splitByNewLine.length - 1) words.splice(j + u * 2 + 1, 0, "\n");
        }
        //delete original word, now that it is divided
        words.splice(j + splitByNewLine.length * 2 - 1, 1);
        j += splitByNewLine.length * 2 - 1;
      }
    }

    //go through each word and decide if it can fit on this line or not
    for (var i = 0; i < words.length; i++) {
      //firstly, account for newlines 
      if (words[i] == "\n") {
        lines.push("");
        continue;
      }
      var size = ctx.measureText(lines[lines.length - 1] + words[i]);
      if (size.width < maxWidth) {
        //it will fit on this line
        lines[lines.length - 1] += words[i] + " ";
      } else {
        //it will not fit, make new line 
        //lines.push(words[i] + " ");
        //but its not that simple (it never is)
        //account for the case where the word is stretched over multiple lines
        //so go through each letter until it is too big for the next line
        
        if (ctx.measureText(words[i] + " ").width < maxWidth) {
          //if the entire word will fit on the following line
          lines.push(words[i] + " ");
        } else {
          //entire word will not just fit on the next line
          if (lines.length > 0 && i != 0) lines.push("");

          var overflow = 0;
          //take out sections of the word and keep on creating new lines for them until word is gone
          while (words[i].length > 0 && overflow < 1000) {
            if (ctx.measureText(words[i]).width < maxWidth) {
              lines[lines.length - 1] = (words[i] + " ");
              words[i] = "";
            } else {
              //a single word is too long for the line 
              //example with line width of 4
              //the 
              //leaf
              //was 
              //gree
              //n
              //the "green" is what the code below accounts for
              var k;
              for (k = 1; k < words[i].length; k++) {
                if (ctx.measureText(words[i].substring(0, k)).width > maxWidth) {
                  break;
                }
              }
              var last = k - 1;
              if (last <= 0) last = 1
              lines[lines.length - 1] = words[i].substring(0, last);
              words[i] = words[i].substring(last);
              lines.push("");
            }
            overflow++;
          }
        }
      }
    }
    //go through each line and render it
    ctx.font = this.font;

    for (i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], this.pos.x + textOffset.x, this.pos.y + (i + 1) * (getFontSize() + 2) + textOffset.y * i);
    }

    //get font function
    function getFontSize() {
      //font is like "18px Arial"
      //parse until the "p" to get font size number
      var index = this.font.indexOf('p');
      var size = parseInt(this.font.substring(0, index));
      if (isNaN(size)) size = 12; //defualt
      return size; //return the found size
    }

    //old code
    //ctx.font = this.font;
    //ctx.fillText(this.text, this.pos.x, this.pos.y);
  }

  renderFillBucket() {
    this.updateProperties();
    var bucketColor; //the color that is being filled in
    var bucketPixels = []; //well impliment our own stack since the default one doesn't work
    //credit: http://www.williammalone.com/articles/html5-canvas-javascript-paint-bucket-tool/
    // I used their algorithm, but wrote my own code
    var bucketData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var pixel = {x: this.pos.x, y: this.pos.y};
    var r = getPixel((pixel.y * canvas.width + pixel.x) * 4);
    var startColor = r;
    var fillColor = getCurrentColorRGBA();
    bucketPixels.push({x: pixel.x, y: pixel.y});
    //old fill bucket code will not be missed

    //prevent filling itself
    if (startColor.r == fillColor.r && startColor.g == fillColor.g && startColor.b == fillColor.b) return;

    while (bucketPixels.length > 0) {
      var currentPos = bucketPixels.pop();
      var x = currentPos.x;
      var y = currentPos.y;

      var pos = (y * canvas.width + x) * 4;

      while (y >= 0 && colorMatches(pos)) {
        //go up while color matches 
        y--;
        pos -= canvas.width * 4; //update position
      }

      pos += canvas.width * 4; //prevent overextending
      y++;
      var reachLeft = false;
      var reachRight = false;

      //now go back down as long as within bounds
      //and the color still matches 
      while (y < canvas.height && colorMatches(pos)) {
        setPixelToData(pos);

        if (x > 0) {
          
          if (colorMatches(pos - 4)) {
            if (!reachLeft) {
              bucketPixels.push({x: x - 1, y: y});
              reachLeft = true;
              
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        }

        if (x + 1 < canvas.width) {
          if (colorMatches(pos + 4)) {
            if (!reachRight) {
              bucketPixels.push({x: x + 1, y: y});
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }

        y++;
        pos += canvas.width * 4;
      }
    }

    //finalize
    ctx.putImageData(bucketData, 0, 0);

    //before we go, update the bounding box to be selectable
    this.size.x = 20;
    this.size.y = 20;

    //functions within the function
    function colorMatches(index) {
      //returns true if the two colors match, used in bucket fill
      if (startColor.r != bucketData.data[index + 0]) return false;
      if (startColor.g != bucketData.data[index + 1]) return false;
      if (startColor.b != bucketData.data[index + 2]) return false;
      return true;
    }

    function setPixelToData(index) {
      //times 4 because four numbers per pixel, rgba
      bucketData.data[index + 0] = fillColor.r;
      bucketData.data[index + 1] = fillColor.g;
      bucketData.data[index + 2] = fillColor.b;
      bucketData.data[index + 3] = 255;
    }

    function getPixel(index) {
      return {
        r: bucketData.data[index + 0],
        g: bucketData.data[index + 1],
        b: bucketData.data[index + 2]
      }; 
    }
  }

  renderImage() {
    ctx.drawImage(this.image, this.pos.x, this.pos.y);
	}

  renderRoundedRectangle() {
    //default value
    var round = 12;
    if (this.roundness) round = this.roundness;
    
    var sign = {x: 1, y: 1}; //allows negative size to work 
    if (this.size.x < 0) sign.x = -1;
    if (this.size.y < 0) sign.y = -1;

    

    //now calculate the degree to which drawing rounded corners is viable 
    //it looks weird if the width is 3px and a circle is drawn 20px wide
    var lowestSize = Math.abs(this.size.x);
    if (Math.abs(this.size.y) < lowestSize) lowestSize = Math.abs(this.size.y);
    if (lowestSize < round * 2) round = lowestSize / 2;

    var r = {x: round * sign.x, y: round * sign.y};

  	ctx.fillRect(this.pos.x + r.x, this.pos.y, this.size.x - r.x * 2, this.size.y);
    ctx.fillRect(this.pos.x, this.pos.y + r.y, this.size.x, this.size.y - r.y * 2);
    
    //ctx.fillStyle = "#47c90e";
    //uncomment the line above to show how it works

    //circles on corners for rounded effect
    ctx.beginPath();
    ctx.arc(this.pos.x + r.x, this.pos.y + r.y, round, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.pos.x - r.x + this.size.x, this.pos.y + r.y, round, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.pos.x + r.x, this.pos.y - r.y + this.size.y, round, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.pos.x - r.x + this.size.x, this.pos.y - r.y + this.size.y, round, 0, 2 * Math.PI);
    ctx.fill();
  }
}
