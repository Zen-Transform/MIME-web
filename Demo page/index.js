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


    const sentences = [
        // "維基百科 英語 Wikipedia 是一個自由內容",
        // "公開編輯且多語言的網絡百科全書協作計劃",
        // "ASUS Vivobook 16X搭載NVIDIA GeForce RTX 4060",
        // "筆記型電腦GPU加速創意奔放",
        // "身兼教授與創作者多重身分",
        // "劉辰岫博士擁抱AI也善用",
        // "軟硬體設備展現藝術手法新樣貌",
        // "透過Wiki技術使得包括您在內的所有人",
        // "都可以簡單地使用網頁瀏覽器修改其中的內容",
        // "維基百科的名稱取自於本網站核心技術 Wiki以及具有百科全書之意的 encyclopedia",
        "共同創造dangerous出來的新混成詞 wikipedia", // 0
        // "\u5f88\u9ad8\u8208\u8a8d\u8b58\u4f60",
        // "\u0e22\u0e34\u0e19\u0e14\u0e35\u0e17\u0e35\u0e48\u0e44\u0e14\u0e49\u0e23\u0e49\u0e39\u0e08\u0e31\u0e01",
        // "R\u1ea5t vui \u0111\u01b0\u1ee3c g\u1eb7pp b\u1ea1n",
        // "任何使用網路進入維基百科的使用者都可以編寫和修改裡面的文章",
        // "從編already碼源頭展開實驗性創作 NVIDIA GPU加速生成式AI創意流暢落地",
        // "近期將Gen AI工具融入創作",
        // "從程式編碼層次切入",
        // "選擇在Python TensorFlow程式語言架構",
        // "餵養大量資料並訓練AI生成不同藝術形式的媒材或風格",
        // "我們經常會使用深度學習模型VGG-16",
        // "VGG-19來處理圖像運算",
        // "過去輸入的圖片動輒10多萬張",
        // "現在因為有GeForce RTX 40系列GPU",
        // "可以在三至四個小時內完成",
        // "與傳統的angry百科全書相比",
        // "在網際網路上運作的維基百科其文字和絕大部分圖片",
        // "使用創用CC 姓名標示-相同方式分享 4.0協定和GNU自由檔案授權條款來"
    ];
    // const sentences = ['abc',"123"];

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
        myTextArea.value = "";
        resetCurrentResult();
        resetCurrentResultElement();
        startTime = new Date().getTime();
        timerInterval = setInterval(() => { endTime = new Date().getTime(); timer.textContent = `${(endTime - startTime) / 1000} seconds`; }, 1);

        currentSentence = 0;
        startBtn.disabled = true;
        saveBtn.disabled = true;
        exampleSentence.textContent = sentences[currentSentence];
        myTextArea.focus();
    });

    resetBtn.addEventListener("click", function () {
        resetCurrentResult();
        resetCurrentResultElement();
        myTextArea.value = "";
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


        if (myTextArea.value == sentences[currentSentence] && event.key == "Enter") {
            updateSentence();

            function updateSentence() {
                if (currentSentence === sentences.length - 1) {
                    current_result.time_spend = (endTime - startTime) / 1000;
                    clearInterval(timerInterval);
                    exampleSentence.textContent = "You have finished all the sentences! Click the reset button to start again.";
                    startBtn.disabled = false;
                    saveBtn.disabled = false;
                    myTextArea.value = "";
                    return;
                } else {
                    currentSentence++;
                    exampleSentence.textContent = sentences[currentSentence];
                    myTextArea.value = "";
                }
            }
        }
        updateCurrentResultElement();
    });

    function updateSavedResultElement() {
        document.getElementById("save-time-spend").textContent = `${saved_result.time_spend} seconds`;
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
        time_spend.textContent = `${current_result.time_spend} seconds`;

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
