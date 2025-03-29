"use strict";

console.log("content.js loaded");

// Message Types
const CLIENT_START = "client-start";
const CLIENT_KEYDOWN = "client-keydown";
const CLIENT_CLOSE = "client-close";
const ERROR_MESSAGE = "error-message";

// Constants
const CLASS_NAME = "ime-extension";

// Keys
const functional_keys = [
  "up",
  "down",
  "left",
  "right",
  "tab",
  "enter",
  "backspace",
  "escape",
];

// HTML strings
const hidden_div_str = `
<div id="hiddenDiv", class="${CLASS_NAME}", style="position: absolute; top: 0px; left: 0px"></div>`;

const option_string_str = `
<option value="volvo">Volvo</option>
<option value="saab"">Saab</option>
`;

const selection_box_str = `
<select id="selectionBox", class="${CLASS_NAME}", style="position: absolute">${option_string_str}</select>`;

const floating_element_str = `
<div id="floatingElement", class="${CLASS_NAME}", style="position: absolute">${selection_box_str}</div>`;

const composition_element_str = `
<span id="compositionElement", class="${CLASS_NAME}", readonly= "true"></span>`;

const parser = new DOMParser();

let global_contentEditableArea = null;

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
    // if (event.ctrlKey && key !== undefined) {
    //   key = "©" + key;
    // }
  }
  return key;
}

const withTimeout = (promise, timeLimit) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Operation timed out")), timeLimit)
  );
  return Promise.race([promise, timeout]);
};

const TIME_LIMIT = 1000;

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

// Deprecated
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

function setCursorPositionIndex(editableDiv, index) {
  if (!editableDiv) {
    return;
  }
  editableDiv.focus();
  const range = document.createRange();
  const selection = window.getSelection();
  range.setStart(editableDiv.childNodes[0], index);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function isContentEditable(element) {
  return (
    (element instanceof HTMLDivElement && element.isContentEditable) ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLInputElement
  );
}

async function getExtensionEnabled() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["extensionEnabled"], function (result) {
      const isEnabled = result.extensionEnabled || false;
      resolve(isEnabled);
    });
  });
}

class TypingHandler {
  constructor() {
    this.IN_TYPING_MODE = false;
    this.compositionElement = new CompositionElement();
    this.floatingElement = new FloatingElement();
    this.pre_composition_string = "";
    this.timeoutID = null;

    this.start_cursor_position = null;
  }
  async handle_key(key) {
    const data = await client_keydown(key);
    this.update_ui(data);
  }

  async slow_handle_key(key) {
    const data = await client_keydown_slow(key);
    this.update_ui(data);
  }

  handleKeyEvent(event) {
    const key = parseKey(event);
    console.log(`Key pressed: '${key}'`);

    if (!key) {
      return false;
    }
    if (functional_keys.includes(key)) {
      if (!this.IN_TYPING_MODE) {
        return false;
      }
    } else if (!this.IN_TYPING_MODE) {
      this.openTypingMode();
    }

    (async () => {
      if (functional_keys.includes(key) && key !== "backspace") {
        // Backspace is functional key, but it is handled with slow_handle_key
        await this.handle_key(key);
      } else {
        if (this.timeoutID !== null) {
          clearTimeout(this.timeoutID);
        }
        await this.handle_key(key);
        this.timeoutID = setTimeout(() => {
          this.slow_handle_key(key).then(() => {
            this.timeoutID = null;
          });
        }, 300);
      }
    })();
    return true;
  }

  update_ui(data) {
    if (data === undefined) {
      return;
    }

    const selection_index = data.selection_index;
    const in_selection_mode = data.in_selection_mode;
    const candidate_list = data.candidate_list;
    const composition_string = data.composition_string;
    const composition_index = data.cursor_index;
    const commit_string = data.commit_string;

    if (commit_string || composition_string === "") {
      this.pre_composition_string = commit_string;
      this.closeTypingMode();
    } else {
      if (in_selection_mode) {
        this.floatingElement.openSelectionBox();
        this.floatingElement.updateSelectionCandidates(candidate_list);
        this.floatingElement.updateSelectedIndex(selection_index);
        this.floatingElement.updateFloatingElementLocation();
      } else {
        this.floatingElement.closeSelectionBox();
      }

      this.compositionElement.setCompositionString(composition_string);
      this.compositionElement.setCompositionCursor(composition_index);
    }

    this.pre_composition_string = composition_string;
  }

  openTypingMode() {
    const this_typingHandler = this;

    if (this.IN_TYPING_MODE) {
      console.log("Already in typing mode, Close the previous typing mode");
      this.closeTypingMode();
    }
    (async () => {
      await client_start();
    })();
    this_typingHandler.compositionElement.updateCompositionLocation();

    this.IN_TYPING_MODE = true;
    console.log("Open typing mode");
  }

  closeTypingMode() {
    (async () => {
      await client_keydown("enter");
      await client_close();
    })();

    this.compositionElement.setCommitString(this.pre_composition_string);
    this.compositionElement.setCompositionString("");
    this.floatingElement.closeSelectionBox();
    this.pre_composition_string = "";

    this.IN_TYPING_MODE = false;
    console.log("Close typing mode");
  }
}

class CompositionElement {
  constructor() {
    this.compositionHTMLElement = parser.parseFromString(
      composition_element_str,
      "text/html"
    ).body.firstChild;
    document.body.appendChild(this.compositionHTMLElement);
    this.start_cursor_position = null;
  }

  setCursorPosition(index) {
    this.compositionHTMLElement.focus();
    const range = document.createRange();
    const selection = window.getSelection();
    range.setStart(this.compositionHTMLElement.childNodes[0], index);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  setCompositionCursor(index) {
    this.compositionHTMLElement.focus();
    const range = document.createRange();
    const selection = window.getSelection();
    range.setStart(this.compositionHTMLElement.childNodes[0], index);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  setCompositionString(composition_string) {
    this.compositionHTMLElement.focus();
    this.compositionHTMLElement.innerHTML = composition_string;
    this.compositionHTMLElement.style.textDecoration = "underline";
  }

  setCommitString(commit_string) {
    if (!commit_string) {
      return;
    }
    this.compositionHTMLElement.textContent = "";
    console.log("Commit " + commit_string);

    global_contentEditableArea.focus();
    global_contentEditableArea.textContent =
      global_contentEditableArea.textContent.slice(
        0,
        this.start_cursor_position
      ) +
      commit_string +
      global_contentEditableArea.textContent.slice(this.start_cursor_position);
    setCursorPositionIndex(
      global_contentEditableArea,
      this.start_cursor_position + commit_string.length
    );
  }

  updateCompositionLocation() {
    this.start_cursor_position = getCursorPosition(global_contentEditableArea);
    const tempElement = document.createElement("span");
    tempElement.id = "tempElement";
    const originalContent = global_contentEditableArea.textContent;

    const updatedContent =
      originalContent.slice(0, this.start_cursor_position) +
      tempElement.outerHTML +
      originalContent.slice(this.start_cursor_position);
    global_contentEditableArea.innerHTML = updatedContent; //this cause
    global_contentEditableArea.replaceChild(
      this.compositionHTMLElement,
      document.getElementById("tempElement")
    );
    setCursorPosition(global_contentEditableArea, this.compositionHTMLElement);
    console.log("Start");
  }
}

class FloatingElement {
  constructor() {
    this.floatingHTMLElement = parser.parseFromString(
      floating_element_str,
      "text/html"
    ).body.firstChild;
    this.hiddenDivHTMLElement = parser.parseFromString(
      hidden_div_str,
      "text/html"
    ).body.firstChild;

    document.body.appendChild(this.hiddenDivHTMLElement);
    document.body.appendChild(this.floatingHTMLElement);
    this.SelectionBoxHTMLElement = document.getElementById("selectionBox");
    this.SelectionBoxHTMLElement.size = 5;
  }

  openSelectionBox() {
    this.floatingHTMLElement.style.display = "block";
  }

  closeSelectionBox() {
    this.floatingHTMLElement.style.display = "none";
  }

  /**
   * Update the selection options in the selection box
   * @param {string} candidate_words
   * @returns {void}
   */
  updateSelectionCandidates(candidate_words) {
    this.SelectionBoxHTMLElement.innerHTML = "";
    for (const candidate_word of candidate_words) {
      const option = document.createElement("option");
      option.value = candidate_word;
      option.text = candidate_word;
      this.SelectionBoxHTMLElement.appendChild(option);
    }
  }

  updateSelectedIndex(index) {
    this.SelectionBoxHTMLElement.options[index].selected = true;
  }

  updateFloatingElementLocation() {
    const textareaRect = global_contentEditableArea.getBoundingClientRect();
    const getCaretCoordinates = () => {
      const text = global_contentEditableArea.textContent.substring(
        0,
        global_contentEditableArea.selectionStart
      );
      this.hiddenDivHTMLElement.textContent = text;
      const rect = this.hiddenDivHTMLElement.getBoundingClientRect();
      return {
        top: rect.height,
        left: rect.width,
      };
    };
    const cursorPosition = getCaretCoordinates();

    const top = textareaRect.top + window.scrollY + cursorPosition.top + 20; // Adjust top position as needed
    const left = textareaRect.left + window.scrollX + cursorPosition.left; // Adjust left position as needed

    this.floatingHTMLElement.style.top = top + "px";
    this.floatingHTMLElement.style.left = left + "px";
  }
}

const typing_handler = new TypingHandler();
let isExtensionEnabled = false;
getExtensionEnabled().then((enabled) => (isExtensionEnabled = enabled));

const keyDownHandler = (event) => {
  if (!isExtensionEnabled) {
    console.log("Extension is disabled");
    return false;
  }

  const handled = typing_handler.handleKeyEvent(event);
  if (handled) {
    event.preventDefault();
    event.stopPropagation();
  }
};

const focusOutHandler = (event) => {
  typing_handler.closeTypingMode();
  event.preventDefault();
  event.stopPropagation();
};

window.addEventListener("click", (event) => {
  const clicked_element = event.target;
  if (!isContentEditable(clicked_element)) {
    return;
  }
  if (typing_handler.IN_TYPING_MODE) {
    const cursor_position = getCursorPosition(global_contentEditableArea);
    typing_handler.closeTypingMode();
    setCursorPositionIndex(global_contentEditableArea, cursor_position);
  }

  const contentEditableHTMLElement = clicked_element;
  global_contentEditableArea = contentEditableHTMLElement;

  contentEditableHTMLElement.addEventListener("keydown", keyDownHandler);
  contentEditableHTMLElement.addEventListener("focusout", focusOutHandler);
});
