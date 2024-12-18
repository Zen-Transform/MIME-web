"use strict";

console.log("content.js loaded");

// Message Types
const CLIENT_START = "client-start";
const CLIENT_KEYDOWN = "client-keydown";
const CLIENT_CLOSE = "client-close";
const ERROR_MESSAGE = "error-message";

// Constants
const CLASS_NAME = "ime-extension";

// HTML strings
const hidden_div_str = `
<div id="hiddenDiv", class="${CLASS_NAME}", style="position: absolute; top: 0px; left: 0px">
</div>
`;

const option_string_str = `
<option value="volvo", style="background-color: grey">Volvo</option>
<option value="saab", style="background-color: grey">Saab</option>
`;

const selection_box_str = `
<select id="selectionBox", class="${CLASS_NAME}", style="background-color: grey;", style="position: absolute"> ${option_string_str}
</select>`;

const floating_element_str = `
<div id="floatingElement", class="${CLASS_NAME}", style="position: absolute"> ${selection_box_str} 
</div>`;

const composition_element_str = `
<div id="compositionElement", class="${CLASS_NAME}", readonly= "true", style="position: absolute">
</div>`;

const parser = new DOMParser();
const hiddenDivElement = parser.parseFromString(hidden_div_str, "text/html")
  .body.firstChild;
document.body.appendChild(hiddenDivElement);
const floatingElement = parser.parseFromString(
  floating_element_str,
  "text/html"
).body.firstChild;
document.body.appendChild(floatingElement);
const compositionElement = parser.parseFromString(
  composition_element_str,
  "text/html"
).body.firstChild;
document.body.appendChild(compositionElement);
const SelecionBoxElement = document.getElementById("selectionBox");

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

async function client_keydown_slow(key) {
  const response = await chrome.runtime.sendMessage({
    type: "client-keydown-slow",
    key: key,
  });
  console.log(response);
  return response.data;
}

function update_ui(data) {
  if (data === null) {
    return;
  }
  const seletion_index = data.selection_index;
  const in_seletion_mode = data.in_seletion_mode;
  const candidate_list = data.candidate_list;
  const composition_string = data.composition_string;
  const compostion_index = data.composition_index;

  if (composition_string === "") {
    console.log("Commit " + composition_string);
    compositionElement.innerHTML = "";
    compositionElement.style.textDecoration = "none";
  } else {
    if (in_seletion_mode) {
      floatingElement.style.display = "block";
      SelecionBoxElement.size = candidate_list.length;
      updateSelectionCandidates(candidate_list);
      SelecionBoxElement.options[seletion_index].selected = true;
      updateFloatingElement();
    } else {
      floatingElement.style.display = "none";
    }
    function setCursorPosition(index) {
      const range = document.createRange();
      const selection = window.getSelection();

      range.setStart(compositionElement.childNodes[0], index);
      range.collapse(true);

      selection.removeAllRanges();
      selection.addRange(range);
    }

    compositionElement.focus();
    compositionElement.innerHTML = composition_string;
    compositionElement.style.textDecoration = "underline";
    setCursorPosition(compostion_index);
  }
}

async function handle_key(key) {
  const data = await client_keydown(key);
  update_ui(data);
}

async function slow_handle_key(key) {
  const data = await client_keydown_slow(key);
  update_ui(data);
}

let timeoutID = null;

window.onload = () => {
  const content_editable_fields = document.querySelectorAll(
    '[contenteditable="true"]'
  );
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
      if (timeoutID !== null) {
        clearTimeout(timeoutID);
      }

      compositionElement.focus();

      const key = parseKey(event);
      handle_key(key);

      timeoutID = setTimeout(() => {
        slow_handle_key(key);
      }, 300);

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
