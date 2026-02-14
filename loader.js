// ==UserScript==
// @name         Zombs.io Unix Logger
// @namespace    http://tampermonkey.net/
// @version      v1.0
// @description  A network and game function logger for zombs.io
// @author       kitty92pm
// @match        https://zombs.io/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==


function makeDraggable(el, handle) {
    let isDragging = false;
    let offsetX, offsetY;

    handle.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - el.offsetLeft;
        offsetY = e.clientY - el.offsetTop;
        document.body.style.userSelect = "none";
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        document.body.style.userSelect = "auto";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        el.style.left = e.clientX - offsetX + "px";
        el.style.top = e.clientY - offsetY + "px";
    });
}

function CreateUnixLoader() {
    const container = document.createElement("div");
    container.id = "main-ui";
    container.style.position = "fixed";
    container.style.top = "50px";
    container.style.left = "50px";
    container.style.width = "300px";
    container.style.background = "#111";
    container.style.color = "#fff";
    container.style.borderRadius = "8px";
    container.style.boxShadow = "0 5px 20px rgba(0,0,0,0.6)";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.zIndex = "9999";
    container.style.overflow = "hidden";

    const titleBar = document.createElement("div");
    titleBar.style.background = "#222";
    titleBar.style.opacity = "0.8";
    titleBar.style.padding = "10px";
    titleBar.style.cursor = "move";
    titleBar.style.display = "flex";
    titleBar.style.justifyContent = "space-between";
    titleBar.style.alignItems = "center";

    const title = document.createElement("span");
    title.innerText = "Unix Loader";

    const minimizeBtn = document.createElement("button");
    minimizeBtn.innerText = "-";
    minimizeBtn.style.marginRight = "5px";
    minimizeBtn.style.background = "transparent";
    minimizeBtn.style.border = "none";
    minimizeBtn.style.color = "#fff";
    minimizeBtn.style.cursor = "pointer";

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "X";
    closeBtn.style.background = "transparent";
    closeBtn.style.border = "none";
    closeBtn.style.color = "#fff";
    closeBtn.style.cursor = "pointer";

    const btnContainer = document.createElement("div");
    btnContainer.appendChild(minimizeBtn);
    btnContainer.appendChild(closeBtn);

    titleBar.appendChild(title);
    titleBar.appendChild(btnContainer);

    container.appendChild(titleBar);

    const content = document.createElement("div");
    content.style.padding = "10px";

    const about = document.createElement("div");
    about.innerHTML = "<strong>Info:</strong> To load make sure you are in a game then click to load Unix Logger";
    about.style.marginBottom = "10px";

    const loadBtn = document.createElement("button");
    loadBtn.innerText = "Load Unix Logger";
    loadBtn.style.padding = "8px 12px";
    loadBtn.style.background = "#444";
    loadBtn.style.border = "none";
    loadBtn.style.color = "#fff";
    loadBtn.style.borderRadius = "4px";
    loadBtn.style.cursor = "pointer";

    loadBtn.addEventListener("click", () => {
        loadUnixLogger();
    });

    content.appendChild(about);
    content.appendChild(loadBtn);
    container.appendChild(content);

    document.body.appendChild(container);

    makeDraggable(container, titleBar);

    let minimized = false;
    minimizeBtn.addEventListener("click", () => {
        minimized = !minimized;
        content.style.display = minimized ? "none" : "block";
    });

    closeBtn.addEventListener("click", () => {
        container.remove();
    });
}

let unixLoaderLoaded = false;

function loadUnixLogger() {

  const isConnected = game.network.connected;
  if (!isConnected) {
    alert("Please connect to a game before loading Unix Logger.");
    return false;
  }

  if (unixLoaderLoaded) {
    const reload = confirm("Unix Logger is already loaded. Do you want to load it again? this may break and cause problems if you have already used it.");
    if (!reload) return false;
  }

    fetch("https://raw.githubusercontent.com/kitty92pm/zombs.io-logger/refs/heads/main/src/main.js")
  .then(res => res.text())
  .then(code => {
    Function(code)();
    unixLoaderLoaded = true;
  })
  .catch(err => console.error("Failed to load Unix Logger:", err));

}

CreateUnixLoader();
