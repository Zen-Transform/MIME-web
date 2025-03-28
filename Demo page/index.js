"use strict";

function codeToEnglish(code) {
  const specialKeyMap = {
    Backspace: "[Backspace]",
    Tab: "[Tab]",
    Enter: "[Enter]",
    ShiftLeft: "[Shift]",
    ShiftRight: "[Shift]",
    ControlLeft: "[Control]",
    ControlRight: "[Control]",
    AltLeft: "[Alt]",
    AltRight: "[Alt]",
    Pause: "[Pause]",
    CapsLock: "[Caps Lock]",
    Escape: "[Escape]",
    Space: "[Space]",
    PageUp: "[Page Up]",
    PageDown: "[Page Down]",
    End: "[End]",
    Home: "[Home]",
    ArrowLeft: "[Arrow Left]",
    ArrowUp: "[Arrow Up]",
    ArrowRight: "[Arrow Right]",
    ArrowDown: "[Arrow Down]",
    Insert: "[Insert]",
    Delete: "[Delete]",
    OSLeft: "[Left Win]",
    OSRight: "[Right Win]",
    ContextMenu: "[Context Menu]",
    NumpadMultiply: "[Num *]",
    NumpadAdd: "[Num +]",
    NumpadSubtract: "[Num -]",
    NumpadDecimal: "[Num .]",
    NumpadDivide: "[Num /]",
    NumLock: "[Num Lock]",
    ScrollLock: "[Scroll Lock]",
    Semicolon: "[;]",
    Equal: "[=]",
    Comma: "[,]",
    Minus: "[-]",
    Period: "[.]",
    Slash: "[/]",
    Backquote: "[`]",
    BracketLeft: "[[",
    Backslash: "[\\]",
    BracketRight: "[]]",
    Quote: "[']",
    // Add more special keys as needed
  };

  if (specialKeyMap[code]) {
    return specialKeyMap[code];
  } else if (/^Digit\d$/.test(code)) {
    return code.slice(-1); // Extract the digit from "DigitX" format
  } else if (/^Key[a-zA-Z]$/.test(code)) {
    return code.slice(-1).toLowerCase(); // Extract the letter and convert to lowercase
  }

  return "[Unknown]";
}

function readFile(file_name) {
  let textFile = new XMLHttpRequest();
  textFile.open("GET", file_name, false);
  let allText = "";
  textFile.onreadystatechange = function () {
    if (textFile.readyState === 4 && textFile.status == 200) {
      allText = textFile.responseText;
    }
  };

  textFile.onerror = function () {
    console.log("Error: File not found");
  };

  textFile.send(null);

  return allText;
}

document.addEventListener("DOMContentLoaded", function () {
  // Initialize variables
  const SEC_FIXED_PRECISION = 3;
  const testSentences = [
    "學校將於下月舉辦科技創新競賽",
    "我今天吃了 pizza 和 sushi",
    "把學到的知識應用在實際生活中是最重要的 Applying what you've learned is crucial",
    "你喜歡看 Marvel movies 嗎",
    "明天是我的 day off 我計劃去看一場新上映的 movie",
    "The government announced a new tax policy yesterday",
    "專家警告海平面上升威脅沿海城市",
    "UNESCO recognizes Japanese sake tradition as cultural heritage",
    "新研究顯示運動對心理健康有益",
    "The team secured a dramatic victory in the final minutes",
  ];

  let TotalTimerInterval;
  let testResults = [];
  let TotalStartTime;
  let CurrentTime;
  let PreTestEndTime =
    testResults[testResults.length - 1]?.endTime || TotalStartTime;
  let testSentenceIndex = 0;

  let currentResult = {
    time_spend: 0,
    keystroke_count: 0,
    backspace_count: 0,
    shift_count: 0,
    keys: [],
  };

  let totalResult = {
    time_spend: 0,
    keystroke_count: 0,
    backspace_count: 0,
    shift_count: 0,
  };

  // HTML elements
  const myTextArea = document.getElementById("my-textarea");
  const exampleSentence = document.getElementById("example-sentence");
  const startBtn = document.getElementById("start-btn");
  const resetBtn = document.getElementById("reset-btn");

  const timer = document.getElementById("timer");
  const wpm = document.getElementById("wpm");
  const showKeyElement = document.getElementById("key-pressed");

  //   Current
  const currentTimeSpendElement = document.getElementById("current-time-spend");
  const currentShiftCountElement = document.getElementById(
    "current-shift-count"
  );
  const currentBackspaceCountElement = document.getElementById(
    "current-backspace-count"
  );
  const currentKeystrokeCountElement = document.getElementById(
    "current-keystroke-count"
  );

  // Total
  const totalTimeSpendElement = document.getElementById("total-time-spend");
  const totalShiftCountElement = document.getElementById("total-shift-count");
  const totalBackspaceCountElement = document.getElementById(
    "total-backspace-count"
  );
  const totalKeystrokeCountElement = document.getElementById(
    "total-keystroke-count"
  );

  function resetCurrentResult() {
    currentResult.time_spend = 0;
    currentResult.keystroke_count = 0;
    currentResult.backspace_count = 0;
    currentResult.shift_count = 0;
    currentResult.keys = [];
  }

  function updateAllResultElement() {
    const SEC_FIXED_PRECISION = 3;
    currentTimeSpendElement.textContent = `${currentResult.time_spend.toFixed(
      SEC_FIXED_PRECISION
    )} seconds`;
    currentKeystrokeCountElement.textContent = currentResult.keystroke_count;
    currentBackspaceCountElement.textContent = currentResult.backspace_count;
    currentShiftCountElement.textContent = currentResult.shift_count;

    totalTimeSpendElement.textContent = `${currentResult.time_spend.toFixed(
      SEC_FIXED_PRECISION
    )} seconds`;
    totalKeystrokeCountElement.textContent = totalResult.keystroke_count;
    totalBackspaceCountElement.textContent = totalResult.backspace_count;
    totalShiftCountElement.textContent = totalResult.shift_count;
  }

  function showKeyStroke(keystroke) {
    const keyStrokeElement = document.createElement("div");
    keyStrokeElement.classList.add("disappearing-element");
    keyStrokeElement.textContent = keystroke;
    if (showKeyElement.childElementCount < 5) {
      showKeyElement.insertBefore(keyStrokeElement, showKeyElement.firstChild);
    } else {
      showKeyElement.removeChild(showKeyElement.lastChild);
      showKeyElement.insertBefore(keyStrokeElement, showKeyElement.firstChild);
    }
  }

  function DownLoadResultCSV() {
    let csvContent =
      "test_case,time_spend,keystroke_count,shift_count,backspace_count,total_time_spend,end_time,keys\n";

    testResults.forEach((result) => {
      csvContent += `${result.testCase},${result.timeSpend},${result.keystrokeCount},${result.shiftCount},${result.backspaceCount},${result.totalTimeSpend},${result.endTime},${result.keys}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `IME_test_results_${Date.now().toString()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  startBtn.addEventListener("click", function () {
    myTextArea.innerHTML = "";
    updateAllResultElement();
    TotalStartTime = new Date().getTime();
    TotalTimerInterval = setInterval(() => {
      CurrentTime = new Date().getTime();
      timer.textContent = `${((CurrentTime - TotalStartTime) / 1000).toFixed(
        SEC_FIXED_PRECISION
      )} seconds`;
      PreTestEndTime =
        testResults[testResults.length - 1]?.endTime || TotalStartTime;

      currentTimeSpendElement.textContent = `${(
        (CurrentTime - PreTestEndTime) /
        1000
      ).toFixed(SEC_FIXED_PRECISION)} seconds`;
    }, 1);

    testSentenceIndex = 0;
    startBtn.disabled = true;
    exampleSentence.textContent = testSentences[testSentenceIndex];
    myTextArea.focus();
  });

  resetBtn.addEventListener("click", function () {
    updateAllResultElement();

    timer.textContent = "";
    myTextArea.innerHTML = "";
    exampleSentence.textContent = "This is example example sentence.";
    clearInterval(TotalTimerInterval);
    startBtn.disabled = false;
  });

  function updateTestSentence() {
    if (testSentenceIndex === testSentences.length - 1) {
      currentResult.time_spend = (CurrentTime - TotalStartTime) / 1000;
      clearInterval(TotalTimerInterval);
      exampleSentence.textContent =
        "You have finished all the sentences! Click the reset button to start again.";
      startBtn.disabled = false;
      myTextArea.innerHTML = "";
      DownLoadResultCSV();
      return;
    } else {
      myTextArea.innerHTML = "";
      testSentenceIndex++;
      exampleSentence.textContent = testSentences[testSentenceIndex];
    }
  }

  myTextArea.addEventListener("keydown", function (event) {
    if (event.code === "Enter") {
      event.stopPropagation();
      event.preventDefault();
    }
    if (event.code === "Backspace" || event.code === "Delete") {
      currentResult.backspace_count++;
      totalResult.backspace_count++;
    } else if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
      currentResult.shift_count++;
      totalResult.shift_count++;
    }
    currentResult.keystroke_count++;
    totalResult.keystroke_count++;

    const keystroke = codeToEnglish(event.code);
    showKeyStroke(keystroke);
    currentResult.keys.push(keystroke);
    if (
      myTextArea.innerHTML === testSentences[testSentenceIndex] &&
      event.key === "Enter"
    ) {
      testResults.push({
        testCase: testSentences[testSentenceIndex],
        timeSpend: (CurrentTime - PreTestEndTime) / 1000,
        keystrokeCount: currentResult.keystroke_count,
        backspaceCount: currentResult.backspace_count,
        shiftCount: currentResult.shift_count,
        totalTimeSpend: (CurrentTime - TotalStartTime) / 1000,
        endTime: CurrentTime,
        keys: currentResult.keys.join(""),
      });
      updateTestSentence();
      resetCurrentResult();
    }
    updateAllResultElement();
  });
});
