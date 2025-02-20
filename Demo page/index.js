"use strict";

document.addEventListener('DOMContentLoaded', function () {
    const myTextArea = document.getElementById("my-textarea");
    const exampleSentence = document.getElementById("example-sentence");
    const startBtn = document.getElementById("start-btn");
    const resetBtn = document.getElementById("reset-btn");
    const saveBtn = document.getElementById("save-btn");
    const time_spend = document.getElementById("time-spend");
    const timer = document.getElementById("timer");
    const wpm = document.getElementById("wpm");
    const keystroke_count = document.getElementById("keystroke-count");
    const backspace_count = document.getElementById("backspace-count");
    const backspace_rate = document.getElementById("backspace-rate");
    const shift_rate = document.getElementById("shift-rate");
    const shift_count = document.getElementById("shift-count");
    const key_pressed = document.getElementById("key-pressed");

    function readFile (file_name) {
        let textFile = new XMLHttpRequest();
        textFile.open("GET", file_name, false);
        let allText = "";
        textFile.onreadystatechange = function(){
            if (textFile.readyState === 4 && textFile.status == 200){
                allText = textFile.responseText;
            }
        }
        
        textFile.onerror = function(){
            console.log("Error: File not found");
        }
        
        textFile.send(null);

        return allText;
    }

    const SEC_FIXED_PRECISION = 3
    const chinese_test_case = readFile("chinese.txt").split("\r\n");
    const english_test_case = readFile("english.txt").split("\r\n");
    const mixed_test_case = readFile("mix.txt").split("\r\n");

    let test_mode = "chinese";

    const getRandomNItems = (arr, n) => arr.sort(() => 0.5 - Math.random()).slice(0, n);
    const sentences = getRandomNItems(chinese_test_case, 10).concat(getRandomNItems(english_test_case, 10)).concat(getRandomNItems(mixed_test_case, 10));

    let startTime;
    let endTime;
    let currentSentence = 0;
    let timerInterval;

    let saved_result = {
        time_spend: 0,
        keystroke_count: 0,
        backspace_count: 0,
        backspace_rate: 0,
        shift_count: 0,
        shift_rate: 0,
    }

    let current_result = {
        time_spend: 0,
        keystroke_count: 0,
        backspace_count: 0,
        backspace_rate: 0,
        shift_count: 0,
        shift_rate: 0,
    }

    function resetCurrentResult() {
        current_result.time_spend = 0;
        current_result.keystroke_count = 0;
        current_result.backspace_count = 0;
        current_result.backspace_rate = 0;
        current_result.shift_count = 0;
        current_result.shift_rate = 0;
    }

    function resetCurrentResultElement() {
        time_spend.textContent = "";
        key_pressed.textContent = "";
        keystroke_count.textContent = "";
        backspace_count.textContent = "";
        backspace_rate.textContent = "";
        shift_count.textContent = "";
        shift_rate.textContent = "";
    }

    function showKeyStroke(keystroke) {
        const keyStrokeElement = document.createElement("div");
        keyStrokeElement.classList.add("disappearing-element");
        keyStrokeElement.textContent = keystroke;
        if (key_pressed.childElementCount < 5){
            key_pressed.insertBefore(keyStrokeElement, key_pressed.firstChild);
        }else{
            key_pressed.removeChild(key_pressed.lastChild);
            key_pressed.insertBefore(keyStrokeElement, key_pressed.firstChild);
        }
    }

    startBtn.addEventListener("click", function () {
        myTextArea.innerHTML = "";
        resetCurrentResult();
        resetCurrentResultElement();
        startTime = new Date().getTime();
        timerInterval = setInterval(() => { endTime = new Date().getTime(); timer.textContent = `${((endTime - startTime) / 1000).toFixed(SEC_FIXED_PRECISION)} seconds`; }, 1);

        currentSentence = 0;
        startBtn.disabled = true;
        saveBtn.disabled = true;
        exampleSentence.textContent = sentences[currentSentence];
        myTextArea.focus();
    });

    resetBtn.addEventListener("click", function () {
        resetCurrentResult();
        resetCurrentResultElement();
        myTextArea.innerHTML = "";
        exampleSentence.textContent = "";
        timer.textContent = "";
        clearInterval(timerInterval);
        startBtn.disabled = false;
        saveBtn.disabled = false;
    });

    saveBtn.addEventListener("click", function () {
        saved_result = { ...current_result };
        updateSavedResultElement();
    });


    updateSavedResultElement();
    myTextArea.addEventListener('keydown', function (event) {
        if (event.code === "Enter") {
            event.stopPropagation();
            event.preventDefault();
        }
        if (event.code === "Backspace") {
            current_result.backspace_count++;
            current_result.backspace_rate = (current_result.backspace_count / current_result.keystroke_count).toFixed(3);
        } else if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
            current_result.shift_count++;
            current_result.shift_rate = (current_result.shift_count / current_result.keystroke_count).toFixed(3);
        }
        current_result.keystroke_count++;
        const keystroke = codeToEnglish(event.code);
        showKeyStroke(keystroke);

        if (myTextArea.innerHTML === sentences[currentSentence] && event.key === "Enter") {
            updateSentence();

            function updateSentence() {
                if (currentSentence === sentences.length - 1) {
                    current_result.time_spend = (endTime - startTime) / 1000;
                    clearInterval(timerInterval);
                    exampleSentence.textContent = "You have finished all the sentences! Click the reset button to start again.";
                    startBtn.disabled = false;
                    saveBtn.disabled = false;
                    myTextArea.innerHTML = "";
                    return;
                } else {
                    myTextArea.innerHTML = "";
                    currentSentence++;
                    exampleSentence.textContent = sentences[currentSentence];
                }
            }
        }
        updateCurrentResultElement();
    });

    function updateSavedResultElement() {
        document.getElementById("save-time-spend").textContent = `${saved_result.time_spend.toFixed(SEC_FIXED_PRECISION)} seconds`;
        document.getElementById("save-keystroke-count").textContent = saved_result.keystroke_count;
        document.getElementById("save-backspace-count").textContent = saved_result.backspace_count;
        document.getElementById("save-shift-count").textContent = saved_result.shift_count;
        document.getElementById("save-backspace-rate").textContent = saved_result.backspace_rate;
        document.getElementById("save-shift-rate").textContent = saved_result.shift_rate;
    }

    function updateCurrentResultElement() {
        keystroke_count.textContent = current_result.keystroke_count;
        backspace_count.textContent = current_result.backspace_count;
        backspace_rate.textContent = current_result.backspace_rate;
        shift_count.textContent = current_result.shift_count;
        shift_rate.textContent = current_result.shift_rate;
        time_spend.textContent = `${current_result.time_spend.toFixed(SEC_FIXED_PRECISION)} seconds`;

        keystroke_count.style.color = getColor(current_result.keystroke_count, saved_result.keystroke_count);
        backspace_count.style.color = getColor(current_result.backspace_count, saved_result.backspace_count);
        backspace_rate.style.color = getColor(current_result.backspace_rate, saved_result.backspace_rate);
        shift_count.style.color = getColor(current_result.shift_count, saved_result.shift_count);
        shift_rate.style.color = getColor(current_result.shift_rate, saved_result.shift_rate);
        time_spend.style.color = getColor(current_result.time_spend, saved_result.time_spend);

        function getColor(a, b) {
            if (a < b) {
                return "green";
            } else if (a > b) {
                return "red";
            } else {
                return "black";
            }
        }
    }

    function codeToEnglish(code) {
        const specialKeyMap = {
            "Backspace": "[Backspace]",
            "Tab": "[Tab]",
            "Enter": "[Enter]",
            "ShiftLeft": "[Shift]",
            "ShiftRight": "[Shift]",
            "ControlLeft": "[Control]",
            "ControlRight": "[Control]",
            "AltLeft": "[Alt]",
            "AltRight": "[Alt]",
            "Pause": "[Pause]",
            "CapsLock": "[Caps Lock]",
            "Escape": "[Escape]",
            "Space": "[Space]",
            "PageUp": "[Page Up]",
            "PageDown": "[Page Down]",
            "End": "[End]",
            "Home": "[Home]",
            "ArrowLeft": "[Arrow Left]",
            "ArrowUp": "[Arrow Up]",
            "ArrowRight": "[Arrow Right]",
            "ArrowDown": "[Arrow Down]",
            "Insert": "[Insert]",
            "Delete": "[Delete]",
            "OSLeft": "[Left Win]",
            "OSRight": "[Right Win]",
            "ContextMenu": "[Context Menu]",
            "NumpadMultiply": "[Num *]",
            "NumpadAdd": "[Num +]",
            "NumpadSubtract": "[Num -]",
            "NumpadDecimal": "[Num .]",
            "NumpadDivide": "[Num /]",
            "NumLock": "[Num Lock]",
            "ScrollLock": "[Scroll Lock]",
            "Semicolon": "[;]",
            "Equal": "[=]",
            "Comma": "[,]",
            "Minus": "[-]",
            "Period": "[.]",
            "Slash": "[/]",
            "Backquote": "[`]",
            "BracketLeft": "[[",
            "Backslash": "[\\]",
            "BracketRight": "[]]",
            "Quote": "[']",
            // Add more special keys as needed
        };

        if (specialKeyMap[code]) {
            return specialKeyMap[code];
        } else if (/^Digit\d$/.test(code)) {
            return code.slice(-1); // Extract the digit from "DigitX" format
        } else if (/^Key[a-zA-Z]$/.test(code)) {
            return code.slice(-1).toLowerCase(); // Extract the letter and convert to lowercase
        }

        return '[Unknown]';
    }
});
