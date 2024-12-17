"use strict";

console.log("content.js loaded");

// document.body.style.backgroundColor = 'red';

// Message Types
const CLIENT_START = "client-start";
const CLIENT_KEYDOWN = "client-keydown";
const CLIENT_CLOSE = "client-close";
const ERROR_MESSAGE = "error-message";

class Client {
  constructor() {}

  bind_to_textarea(textarea) {
    if (this.binded_textarea) {
      this.binded_textarea.removeEventListener("keydown", this.keydownHandler);
      this.binded_textarea.removeEventListener(
        "focusout",
        this.focusoutHandler
      );
      this.binded_textarea.removeChild(this.compositionElement);
      this.floatingElement;
    }

    // Elements
    this.binded_textarea = textarea;
    this.compositionElement = this.createCompositionElement();
    this.selectElement = this.createSelectElement();
    this.floatingElement = this.createFloatingElement();
    this.hiddenDiv = this.createHiddenDiv();

    if (!this.binded_textarea.querySelector("#compositionElement")) {
      this.binded_textarea.appendChild(this.compositionElement);
    }

    // Variables
    this.composition_string = "";

    // Client ID
    this.client_id = `${Date.now()}`;

    const start_client = async () => {
      const response = await chrome.runtime.sendMessage({
        type: CLIENT_START,
        client_id: this.client_id,
      });
      console.log(response);
    };
    start_client();

    this.keydownHandler = this.keydownHandler.bind(this);
    this.focusoutHandler = this.focusoutHandler.bind(this);

    // this.binded_textarea.removeEventListener("keydown", this.keydownHandler);
    this.binded_textarea.addEventListener("keydown", this.keydownHandler);
    this.binded_textarea.addEventListener("focusout", this.focusoutHandler);
  }

  async keydownHandler(event) {
    const convertKey = (event) => {
      const key = event.key;
      switch (key) {
        case "Enter":
          return "enter";
        case "Backspace":
          return "backspace";
        case "ArrowLeft":
          return "left";
        case "ArrowRight":
          return "right";
        case "ArrowUp":
          return "up";
        case "ArrowDown":
          return "down";
        default:
          return key;
      }
    };

    const key = convertKey(event);
    console.log("textarea keydown: " + key);

    const response = await chrome.runtime.sendMessage({
      type: "client-keydown",
      client_id: this.client_id,
      key: key,
    });

    console.log("res", response);
    if (response.data.in_seletion_mode) {
      console.log("In selection mode");
      this.updateSelectionCandidates(response.data.candidate_list);
      this.updateFloatingElement();
    } else {
      console.log("not in selection mode");
    }
    this.compositionElement.setAttribute("readonly", "false");
    this.compositionElement.value = response.data.composition_string;
    this.compositionElement.setAttribute("readonly", "true");
  }


}

const CLASS_NAME = "ime-extension";

const hidden_div_str = `
<div id="hiddenDiv", class="${CLASS_NAME}", style="position: absolute; top: 0px; left: 0px">
</div>
`;
const option_string_str = `
<option value="volvo", style="background-color: grey">Volvo</option>
<option value="saab", style="background-color: grey">Saab</option>
`
const selection_box_str = `
<select id="selectionBox", class="${CLASS_NAME}", style="background-color: grey;", style="position: absolute"> ${option_string_str}</select>
`;


const floating_element_str = `
<div id="floatingElement", class="${CLASS_NAME}", style="position: absolute"> ${selection_box_str} </div>
`

const composition_element_str = `
<div id="compositionElement", class="${CLASS_NAME}", readonly= "true", style="position: absolute">

</div>
`;
// const assert = require("assert");
const parser = new DOMParser();
const hiddenDivElement = parser.parseFromString(hidden_div_str, "text/html").body.firstChild;
document.body.appendChild(hiddenDivElement);
const floatingElement = parser.parseFromString(floating_element_str, "text/html").body.firstChild;
document.body.appendChild(floatingElement);
const compositionElement = parser.parseFromString(composition_element_str, "text/html").body.firstChild;
document.body.appendChild(compositionElement);
const SelecionBoxElement = document.getElementById("selectionBox")
// console.log(SelecionBoxElement);
// console.assert(SelecionBoxElement !== null, "SelectionBoxElement is null");



/**
 * Update the selection options in the selection box
 * @param {string} candidate_words 
 * @returns {void}
 */
function updateSelectionCandidates(candidate_words) {
  SelecionBoxElement.innerHTML = "";
  for (const candidate_word of candidate_words) {
    const option = document.createElement("option");
    option.value = candidate_word;
    option.text = candidate_word;
    SelecionBoxElement.appendChild(option);
  }
}

let global_contentEditableArea = null;

function updateFloatingElement() {
  const textareaRect = global_contentEditableArea.getBoundingClientRect();
  const getCaretCoordinates = () => {
    const text = global_contentEditableArea.textContent.substring(
      0,
      global_contentEditableArea.selectionStart
    );
    hiddenDivElement.textContent = text;
    const rect = hiddenDivElement.getBoundingClientRect();
    return {
      top: rect.height,
      left: rect.width,
    };
  };
  const cursorPosition = getCaretCoordinates();

  const top = textareaRect.top + window.scrollY + cursorPosition.top + 20; // Adjust top position as needed
  const left = textareaRect.left + window.scrollX + cursorPosition.left; // Adjust left position as needed

  floatingElement.style.top = top + "px";
  floatingElement.style.left = left + "px";
}

function parseKey(event) {
  const key = event.key;
  switch (key) {
    case "Enter":
      return "enter";
    case "Backspace":
      return "backspace";
    case "ArrowLeft":
      return "left";
    case "ArrowRight":
      return "right";
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    default:
      return key;
  }
}

async function client_start() {
  const response = await chrome.runtime.sendMessage({
    type: "client-start",
  });
  console.log(response);
}

async function client_close() {
  const response = await chrome.runtime.sendMessage({
    type: "client-close",
  });
  console.log(response);
}

async function client_keydown(key) {
  const response = await chrome.runtime.sendMessage({
    type: "client-keydown",
    key: key,
  });
  console.log(response);
  return response.data;
}

async function handle_key(key){      
  const data = await client_keydown(key)
  if (data === null) {
    return;
  }
  const seletion_index = data.selection_index;
  const in_seletion_mode = data.in_seletion_mode;
  const candidate_list = data.candidate_list;
  const composition_string = data.composition_string;
  const compostion_index = data.composition_index;
  
  if (composition_string === "" && key === "enter") {
    // Commit
    console.log("Commit " + composition_string);
    compositionElement.innerHTML = "";
    compositionElement.style.textDecoration = "none";
  }else{
    if (in_seletion_mode) {
      floatingElement.style.display = "block";
      SelecionBoxElement.size = candidate_list.length;
      updateSelectionCandidates(candidate_list);
      SelecionBoxElement.options[seletion_index].selected = true;
      updateFloatingElement();
    }else{
      floatingElement.style.display = "none";

        function setCursorPosition(compostion_index){
          const range = document.createRange();
          const selection = window.getSelection();

          selection.removeAllRanges();
          // range.setStart(compositionElement.childNodes[0], compostion_index);
          range.collapse(true);

          selection.addRange(range);
          // compositionElement.focus();
        }
        
        setCursorPosition(compostion_index);
      }
      compositionElement.innerHTML = composition_string;
      compositionElement.style.textDecoration = "underline";
  }
}

window.onload = () => {
  const content_editable_fields = document.querySelectorAll('[contenteditable="true"]');
  for (const contentEditableArea of content_editable_fields) {
    global_contentEditableArea = contentEditableArea;
    contentEditableArea.addEventListener("focusin", async () => {
      await client_start();
      const tempElement = document.createElement("div");
      tempElement.id = "tempElement";
      contentEditableArea.appendChild(tempElement);
      contentEditableArea.replaceChild(compositionElement, tempElement);
    });
    contentEditableArea.addEventListener("keydown", async (event) => {
      const key = parseKey(event);
      handle_key(key);

      updateFloatingElement();
      event.stopPropagation();
      event.preventDefault();
    });
    contentEditableArea.addEventListener("focusout", async () => {
      await client_keydown("enter");
      await client_close();
      floatingElement.style.display = "none";
      contentEditableArea.focus();
    });
  }
};
