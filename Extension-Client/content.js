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
<div id="hiddenDiv", class="${CLASS_NAME}", style="position: absolute; top: 0px; left: 0px"></div>`;

const option_string_str = `
<option value="volvo", style="background-color: grey">Volvo</option>
<option value="saab", style="background-color: grey">Saab</option>
`;

const selection_box_str = `
<select id="selectionBox", class="${CLASS_NAME}", style="background-color: grey;", style="position: absolute">${option_string_str}</select>`;

const floating_element_str = `
<div id="floatingElement", class="${CLASS_NAME}", style="position: absolute">${selection_box_str}</div>`;

const composition_element_str = `
<span id="compositionElement", class="${CLASS_NAME}", readonly= "true"></span>`;

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
  const SpecialCodeMap = {
    Tab: "tab",
    Enter: "enter",
    Backspace: "backspace",
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
    Escape: "escape",
  };
  const CodeMap = {
    Minus: "-",
    Equal: "=",
    BracketLeft: "[",
    BracketRight: "]",
    Backslash: "\\",
    Semicolon: ";",
    Quote: "'",
    Comma: ",",
    Period: ".",
    Slash: "/",
    Backquote: "`",
    Space: " ",
  };

  let key;
  if (SpecialCodeMap[event.code] !== undefined) {
    // is special character
    key = SpecialCodeMap[event.code];
  } else {
    if (event.code.startsWith("Digit") || event.code.startsWith("Key")) {
      key = event.code.slice(-1).toLowerCase();

      if (event.shiftKey) {
        key = key.toUpperCase();
      }
    } else if (CodeMap[event.code] !== undefined) {
      key = CodeMap[event.code];
    } else {
    }
    if (event.ctrlKey && key !== undefined) {
      key = "©" + key;
    }
  }
  return key;
}

const withTimeout = (promise, timeLimit) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Operation timed out")), timeLimit)
  );
  return Promise.race([promise, timeout]);
};

const TIME_LIMIT = 500;

async function client_start() {
  try {
    const response = await withTimeout(
      chrome.runtime.sendMessage({ type: "client-start" }),
      TIME_LIMIT
    );
    console.log(response);
  } catch (error) {
    console.log(error);
  }
}

async function client_close() {
  try {
    const response = await withTimeout(
      chrome.runtime.sendMessage({ type: "client-close" }),
      TIME_LIMIT
    );
    console.log(response);
  } catch (error) {
    console.log(error);
  }
}

async function client_keydown(key) {
  try {
    const response = await withTimeout(
      chrome.runtime.sendMessage({
        type: "client-keydown",
        key: key,
      }),
      TIME_LIMIT
    );
    console.log(response);
    return response.data;
  } catch (error) {
    console.log(error);
  }
}

async function client_keydown_slow(key) {
  try {
    const response = await withTimeout(
      chrome.runtime.sendMessage({
        type: "client-keydown-slow",
        key: key,
      }),
      TIME_LIMIT
    );
    console.log(response);
    return response.data;
  } catch (error) {
    console.log(error);
  }
}

function update_ui(data) {
  if (data === undefined) {
    return;
  }
  console.log(data)
  const seletion_index = data.selection_index;
  const in_seletion_mode = data.in_seletion_mode;
  const candidate_list = data.candidate_list;
  const composition_string = data.composition_string;
  const compostion_index = data.cursor_index;

  if (composition_string === "") {
    // commit
    const commit_string = compositionElement.textContent;
    compositionElement.textContent = "";
    console.log("Commit " + commit_string);
    global_contentEditableArea.focus();
    global_contentEditableArea.textContent =
      global_contentEditableArea.textContent.slice(0, start_cursor_position) +
      commit_string +
      global_contentEditableArea.textContent.slice(start_cursor_position);
    setMainCompositionCursor(global_contentEditableArea, start_cursor_position + commit_string.length);
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

    compositionElement.focus();
    compositionElement.innerHTML = composition_string;
    compositionElement.style.textDecoration = "underline";
    setCompostionCursor(compostion_index);
  }
}

async function handle_key(key) {
  const data = await client_keydown(key);
  update_ui(data);
  updateFloatingElement();
}

async function slow_handle_key(key) {
  const data = await client_keydown_slow(key);
  update_ui(data);
  updateFloatingElement();
}

function getCursorPosition(element) {
  const selection = window.getSelection();
  let cursor_position = 0;

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const clonedRange = range.cloneRange();
    clonedRange.selectNodeContents(element);
    clonedRange.setEnd(range.endContainer, range.endOffset);
    const cursorPosition = clonedRange.toString().length;

    // If there's a selection, get the start position of the selection
    if (!selection.isCollapsed) {
      const selectionStart = range.startOffset;
      cursor_position = selectionStart;
    } else {
      // If no text is selected, show cursor position
      cursor_position = cursorPosition;
    }
  } else {
    console.log("No cursor selection available.");
    // positionDisplay.textContent = 'No selection available.';
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false); // Collapse to the end of the contents
    cursor_position = range.toString().length;
    console.log("No Cursor, Cursor position: " + cursor_position);
  }
  return cursor_position;
}

function setCursorPosition(editableDiv, target_element) {
  // editableDiv.focus();
  target_element.focus();

  const range = document.createRange();
  const selection = window.getSelection();

  range.setStart(target_element, 0);
  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);
}

function setCompostionCursor(index) {
  compositionElement.focus();
  const range = document.createRange();
  const selection = window.getSelection();
  range.setStart(compositionElement.childNodes[0], index);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function setMainCompositionCursor(editabelDiv, index) {
  editabelDiv.focus();
  const range = document.createRange();
  const selection = window.getSelection();
  range.setStart(editabelDiv.childNodes[0], index);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

let timeoutID = null;
let start_cursor_position = null;

function isContentEditable(element) {
  return (
    (element instanceof HTMLDivElement && element.isContentEditable) ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  );
}

const keydownhandler = (event) => {
  event.preventDefault();
  event.stopPropagation();

  const key = parseKey(event);
  console.log(`Key pressed: '${key}'`);

  if (key === undefined) {
    return;
  }

  if (timeoutID !== null) {
    clearTimeout(timeoutID);
  }
  const quick_keys = ["up", "down", "left", "right", "tab", "enter"];

  if (quick_keys.includes(key)) {
    handle_key(key);
  } else {
    handle_key(key).then(() => {
      timeoutID = setTimeout(() => {
        slow_handle_key(key).then(() => {
          timeoutID = null;
        });
      }, 300);
    });
  }
};

const focusouthandler = (event) => {
  event.preventDefault();
  event.stopPropagation();

  client_keydown("enter")
    .then(() => {
      return client_close();
    })
    .then(() => {
      floatingElement.style.display = "none";
      compositionElement.innerHTML = "";
    });
};

window.addEventListener("click", (event) => {
  const clicked_element = event.target;
  if (!isContentEditable(clicked_element)) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();

  const contentEditableElement = clicked_element;
  global_contentEditableArea = contentEditableElement;
  start_cursor_position = getCursorPosition(contentEditableElement);

  (async () => {
    if (compositionElement.innerHTML !== "") {
      console.log("the composition element is not empty");
      await handle_key("enter");
    }
    await client_start();
    
    console.log("move span")
    const tempElement = document.createElement("span");
    tempElement.id = "tempElement";
    const originalContent = contentEditableElement.innerText;
    const updatedContent =
      originalContent.slice(0, start_cursor_position) +
      tempElement.outerHTML +
      originalContent.slice(start_cursor_position);
    contentEditableElement.innerHTML = updatedContent; //this cause
    contentEditableElement.replaceChild(
      compositionElement,
      document.getElementById("tempElement")
    );
    setCursorPosition(contentEditableElement, compositionElement);
    console.log("Start");
  })();

  contentEditableElement.addEventListener("keydown", keydownhandler);
  contentEditableElement.addEventListener("focusout", focusouthandler);
});
