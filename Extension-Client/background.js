// background.js

// Message Types
const CLIENT_START = "client-start";
const CLIENT_KEYDOWN = "client-keydown";
const CLIENT_KEYDOWN_SLOW = "client-keydown-slow";
const CLIENT_CLOSE = "client-close";
const ERROR_MESSAGE = "error-message";
const CLIENT_UPDATE_CONFIG = "client-update_config";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed.");
});

const getStorageValue = (key) =>
  new Promise((resolve, reject) =>
    chrome.storage.sync.get(key, (result) =>
      chrome.runtime.lastError
        ? reject(chrome.runtime.lastError)
        : resolve(result[key] ?? null)
    )
  );

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background.js:", message);

  switch (message.type) {
    case CLIENT_START:
      sendResponse({ message: "Client started" });
      break;
    case CLIENT_KEYDOWN:
      (async () => {
        try {
          console.log("Handling CLIENT_KEYDOWN, key:", message.key);

          const response = await fetch("http://localhost:5000/handle_key", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ key: message.key }),
          });

          const data = await response.json();
          console.log("Fetched data:", data);

          // Send the data back to the content script
          sendResponse({
            message: "Client keydown handled",
            data: data,
          });
        } catch (error) {
          console.error("Error handling CLIENT_KEYDOWN:", error);
          sendResponse({ error: "Failed to handle keydown, with" + key });
        }
      })();
      break;
    case CLIENT_KEYDOWN_SLOW:
      (async () => {
        try {
          console.log("Handling CLIENT_KEYDOWN_SLOW, key:", message.key);

          const response = await fetch("http://localhost:5000/slow_handle", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ key: message.key }),
          });

          const data = await response.json();
          console.log("Fetched data:", data);

          // Send the data back to the content script
          sendResponse({
            message: "Client keydown handled",
            data: data,
          });
        } catch (error) {
          console.error("Error handling CLIENT_KEYDOWN:", error);
          sendResponse({ error: "Failed to handle keydown, with" + key });
        }
      })();
      break;
    case CLIENT_CLOSE:
      const response = fetch("http://localhost:5000/handle_key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: "enter" }), // Reset the server with enter key
      });
      sendResponse({ message: "Client closed" });
      break;
    case CLIENT_UPDATE_CONFIG:
      (async () => {
        const config = {
          bopomofoEnabled: await getStorageValue("bopomofoEnabled"),
          cangjieEnabled: await getStorageValue("cangjieEnabled"),
          englishEnabled: await getStorageValue("englishEnabled"),
          pinyinEnabled: await getStorageValue("pinyinEnabled"),
          japaneseEnabled: await getStorageValue("japaneseEnabled"),
        };
        console.log(config);
        fetch("http://localhost:5000/update_config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ config: config }),
        });
        sendResponse({ message: "Config updated" });
      })();
      break;
    default:
      sendResponse({ message: "Invalid message type" });
      console.log("Invalid message type");
      break;
  }

  // Return true to indicate that the response will be sent asynchronously.
  console.log("Returning true");
  return true;
});
