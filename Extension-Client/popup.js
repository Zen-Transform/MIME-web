console.log("popup.js loaded");

document.addEventListener("DOMContentLoaded", function () {
  const onOffSwitch = document.getElementById("onOffSwitch");
  const statusText = document.getElementById("statusText");

  const bopomofoSwitch = document.getElementById("bopomofoSwitch");
  const cangjieSwitch = document.getElementById("cangjieSwitch");
  const englishSwitch = document.getElementById("englishSwitch");
  const pinyinSwitch = document.getElementById("pinyinSwitch");
  const japaneseSwitch = document.getElementById("japaneseSwitch");

  const saveButton = document.getElementById("saveSettings");

  // Load saved on/off state when popup opens
  chrome.storage.sync.get(["extensionEnabled"], function (result) {
    const isEnabled = result.extensionEnabled || false;
    onOffSwitch.checked = isEnabled;
    updateStatusText(isEnabled);
  });

  // Update status when switch is toggled
  onOffSwitch.addEventListener("change", function () {
    const isEnabled = onOffSwitch.checked;

    chrome.storage.sync.set(
      {
        extensionEnabled: isEnabled,
      },
      function () {
        chrome.runtime.sendMessage({
          type: "extension-status-update",
        });

        updateStatusText(isEnabled);
      }
    );
  });

  // Function to update status text
  function updateStatusText(isEnabled) {
    statusText.textContent = isEnabled ? "Enabled" : "Disabled";
    statusText.classList.toggle("bg-success", isEnabled);
    statusText.classList.toggle("bg-secondary", !isEnabled);
  }

  // Load saved settings when popup opens
  chrome.storage.sync.get(["bopomofoEnabled"], function (result) {
    bopomofoSwitch.checked = result.bopomofoEnabled || false;
  });
  chrome.storage.sync.get(["cangjieEnabled"], function (result) {
    cangjieSwitch.checked = result.cangjieEnabled || false;
  });
  chrome.storage.sync.get(["englishEnabled"], function (result) {
    englishSwitch.checked = result.englishEnabled || false;
  });
  chrome.storage.sync.get(["pinyinEnabled"], function (result) {
    pinyinSwitch.checked = result.pinyinEnabled || false;
  });
  chrome.storage.sync.get(["japaneseEnabled"], function (result) {
    japaneseSwitch.checked = result.japaneseEnabled || false;
  });

  // Save settings when save button is clicked
  saveButton.addEventListener("click", function () {
    const isBopomofoEnabled = bopomofoSwitch.checked;
    const isCangjieEnabled = cangjieSwitch.checked;
    const isEnglishEnabled = englishSwitch.checked;
    const isPinyinEnabled = pinyinSwitch.checked;
    const isJapaneseEnabled = japaneseSwitch.checked;

    // Save to Chrome storage
    chrome.storage.sync.set(
      {
        bopomofoEnabled: isBopomofoEnabled,
        cangjieEnabled: isCangjieEnabled,
        englishEnabled: isEnglishEnabled,
        pinyinEnabled: isPinyinEnabled,
        japaneseEnabled: isJapaneseEnabled,
      },
      function () {
        // Send message to background.js
        chrome.runtime.sendMessage({
          type: "client-update_config",
        });

        // Optional: Show a save confirmation
        saveButton.textContent = "Saved!";
        saveButton.classList.remove("btn-primary");
        saveButton.classList.add("btn-success");

        setTimeout(() => {
          saveButton.textContent = "Save Settings";
          saveButton.classList.remove("btn-success");
          saveButton.classList.add("btn-primary");
        }, 2000);
      }
    );
  });
});
