function find(s) {
  return document.getElementById(s);
}

function make(s){
  return document.createElement(s);
}

function setClass(element, className){
  element.className = className;
}

function feedback(s){
  var fb = make("p");
  document.body.appendChild(fb);

  fb.style.position = "fixed";
  fb.style['background-color'] = "#E2E9E7";
  fb.style.width = "80vw";
  fb.innerHTML = s;
  fb.style.top = "35px";
  fb.style.left = "10vw";
  fb.style.margin = "0";
  fb.style['border-radius'] = '20px';
  fb.style['z-index'] = '999';
  fb.style['text-align'] = 'center';
  fb.style['font-size'] = '42px';
  fb.style.padding = '20px';
  fb.animate([
    { // from
      top: "-" + fb.clientHeight + "px"
    },
    { // to
      top: "35px"
    }
  ], 1000);
  setTimeout(() => {
    fb.animate([
      { // from
        top: "35px"
      },
      { // to
        top: "-" + fb.clientHeight + "px"
      }
    ], 1000);
    fb.style.top = "-" + fb.clientHeight + "px";
    setTimeout(() => {
      fb.remove();
    }, 1200);
  }, 5000);
}
