//project loading and saving, GUI as well
updateTitleText();

function jsonToItem() {
  //converts every JSON object in the items list into an item, used for loading a previous gator file
  for (var i = 0; i < items.length; i++) { 
    var newItem = new Item(items[i].type);
    var keys = Object.keys(items[i]);
    //set each property to the new item
    for (var k = 0; k < keys.length; k++) {
      newItem[keys[k]] = items[i][keys[k]];
    }
    items[i] = newItem;
  }
}

/* old code
function saveProject() {
  //saves the current drawing to localStorage
  localStorage.projects = JSON.stringify(items);
}
*/

function loadProject(i) {
  //loads a project from localStorage
  if (!localStorage.projects) return;
  if (i < 0 || i >= localStorage.projects) return;
  currentProject = i;
  items = JSON.parse(JSON.parse(localStorage["p" + i]).items);
  jsonToItem();
  redraw();
  closeProjectMenu();
}


function timeStampToText(time) {
  //given a timestamp, convert that to a string like "43 seconds ago" or "3 hours ago" or "2 weeks ago"
  //convert miliseconds to seconds first
  time /= 1000;
  var end = " ago";
  //tell how long the interval of time is
  if (time < 0) { 
    return "Just now";
  } else if (time < 60){
    return (Math.round(time) + " seconds") + end;
  } else if (time < 60 * 60){
    return (Math.round(time / 60) + " minutes") + end;
  } else if (time < 60 * 60 * 24){
    return (Math.round(time / 60 / 60) + " hours") + end;
  } else if (time < 60 * 60 * 24 * 7){
    return (Math.round(time / 60 / 60 / 24) + " days") + end;
  } else if (time < 60 * 60 * 24 * 7 * 51){
    return (Math.round(time / 60 / 60 / 24 / 7) + " weeks") + end;
  } else if (time < 60 * 60 * 24 * 7 * 51 * 120){
    return (Math.round(time / 60 / 60 / 24 / 7 / 51) + " months") + end;
  } else {
    //over 120 years lol
    return "Too long" + end;
  }
  //reused from old code.org project, yay for reusability
}

function createProjectElements() {
  if (!localStorage.projects) return;
  //first get array of projects and sort them
  list = [];
  for (var i = localStorage.projects - 1; i >= 0; i--) {
    list.push(JSON.parse(localStorage["p" + i]));
  }

  list.sort((a, b) => (a.time < b.time) ? 1 : -1);//sort by timestamp
  //display the projects
  for (i = 0; i < list.length; i++) {
    createProjectElement(list[i].id, list[i]);
  }
}

function createProjectElement(i, project) {
  var time = timeStampToText(new Date().getTime() - project.time);
  //add project element to the right parent element
  find("project-item-area").innerHTML += "\n<div class=\"project-item\" onclick=\"loadProject(" + i + ")\" oncontextmenu=\"rightClickProject(" + i + ")\" id=\"project-item-" + i + "\"> \n<h4 class=\"project-item-title\">" 
  + project.title + "</h4>\n<h5 class=\"project-item-time\">" + time + "</h5>\n</div>";
}

function openProjectMenu() {
  find("project-item-area").innerHTML = "";
  find("project-area").style.display = 'block';
  createProjectElements();
  canDraw = false;
}

function openSaveMenu() {
  if (!localStorage.projects) localStorage.projects = 0;
  find("save-area").style.display = 'block';
  console.log(find("save-area").style.display);
  canDraw = false;
  if (currentProject == -1) {
    find("save-input").value = "New Project " + localStorage.projects;
  } else {
    find("save-input").value = JSON.parse(localStorage["p" + currentProject]).title;
  }
}

find("load-project-text").onclick = function() {
  openProjectMenu();
  find("load-project-text").animate([
    { // from
      border: "solid #0F1216"
    },
    { // to
      border: "solid #edf0f3"
    }
  ], 30);
  setTimeout(() => {
    find("load-project-text").animate([
      { // from
        border: "solid #edf0f3"
      },
      { // to
        border: "solid #0F1216"
      }
    ], 300);
  }, 30);
}

find("save-project-text").onclick = function() {
  openSaveMenu();
  console.log(1);
  find("save-project-text").animate([
    { // from
      border: "solid #0F1216"
    },
    { // to
      border: "solid #edf0f3"
    }
  ], 30);
  setTimeout(() => {
    find("save-project-text").animate([
      { // from
        border: "solid #edf0f3"
      },
      { // to
        border: "solid #0F1216"
      }
    ], 300);
  }, 30);
}

var projectClickEvent = document.getElementById('project-area-background');
var projectClickEvent2 = document.getElementById('save-area-background');

document.addEventListener('mousedown', function(event) {
  if (find("project-area").style.display == "block") {
    if (!projectClickEvent.contains(event.target) && !find("load-project-text").contains(event.target)) {
      closeProjectMenu();
    }
  } 
  
  if (find("save-area").style.display != "none") {
    if (!projectClickEvent2.contains(event.target) && !find("save-project-text").contains(event.target)) {
      closeSaveMenu();
    }
  }
});

function closeProjectMenu() {
  find("project-area").style.display = "none";
  setTimeout(() => {
    canDraw = true;
  }, 100);
  updateTitleText();
}

function closeSaveMenu() {
  find("save-area").style.display = "none";
  setTimeout(() => {
    canDraw = true;
  }, 100);
  updateTitleText();
}

function updateTitleText() {
  if (!localStorage.projects) localStorage.projects = 0;
  var title;
  if (currentProject != -1) {
    title = JSON.parse(localStorage["p" + currentProject]).title;
  } else {
    title = "New Project " + localStorage.projects;
  }
  find("top-title-text").innerHTML = title;
}

find("save-button").onclick = function() { 
  var name = find("save-input").value;
  if (name.length < 1) {
    find("save-area-background").animate([
      { // from
        backgroundColor: "#c9150e"
      },
      { // to
        backgroundColor: "#e9e9f0"
      }
    ], 300);
    return;
  }
  if (currentProject == -1) {
    saveNewProject(name);
  } else {
    saveOldProject(name);
  }
  closeSaveMenu();
}

function saveOldProject(title) {
  //saves a previously created object, using currentProject as the index
  var old = localStorage["p" + currentProject];

  var project = {title: title, id: currentProject, time: new Date().getTime(), items: JSON.stringify(cleanseItems())};

  localStorage["p" + currentProject] = JSON.stringify(project);
}

function saveNewProject(title) {
  //makes sure projects variable is in localStorage
  if (!localStorage.projects) localStorage.projects = 0;
  localStorage.projects++; //there is a new project
  currentProject = localStorage.projects - 1;

  //create metadata for project
  var project = {title: title, id: currentProject, time: new Date().getTime(), items: JSON.stringify(cleanseItems())};
  localStorage["p" + (localStorage.projects - 1)] = JSON.stringify(project);
  //so localstorage.p0 would be the first project
  //localstorage.p1 would be the second project
  //and so on
}

function rightClickProject(i) {
  //duplicate a project on right click.
  localStorage.projects++;
  currentProject = localStorage.projects - 1;

  var oldProject = JSON.parse(localStorage["p" + i]);
  var project = {title: oldProject.title + " (copy)", id: currentProject, time: new Date().getTime(), items: JSON.stringify(JSON.parse(oldProject.items))};
  localStorage["p" + (currentProject)] = JSON.stringify(project);
  loadProject(currentProject);
}

function cleanseItems() {
  //returns a version of the items array with images removed, as they cannot be saved
  var newItems = [];
  for (var i = 0; i < items.length; i++) {
    if (items[i].type != 7) newItems.push(items[i]);
  }
  return newItems;
}