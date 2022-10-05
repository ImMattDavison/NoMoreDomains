const PAUSE_BUTTON = document.getElementById("pause-button");
const PAUSE_MINUTES = 1;

document.getElementById("minute-indicator").innerHTML = PAUSE_MINUTES;

function enableNMD() {
    chrome.storage.local.get(['toggle_value'], (data) => {
        if (data.toggle_value != undefined) {
            if (data.toggle_value === "off") {
                chrome.storage.local.set({ toggle_value: "on" });
                chrome.runtime.sendMessage({ NMD_status: "on" });
            } 
        } else {
                chrome.storage.local.set({ toggle_value: "on" });
                chrome.runtime.sendMessage({ NMD_status: "on" });
            }
        }
    );
}

function disableNMD() {
    chrome.storage.local.get(['toggle_value'], (data) => {
        if (data.toggle_value != undefined) {
            if (data.toggle_value === "on") {
                chrome.storage.local.set({ toggle_value: "off" });
                chrome.runtime.sendMessage({ NMD_status: "off" });
            } 
        } else {
                chrome.storage.local.set({ toggle_value: "off" });
                chrome.runtime.sendMessage({ NMD_status: "off" });
            }
        }
    );
}

function pause() {
    disableNMD();
    setTimeout(() => {
        enableNMD();
        PAUSE_BUTTON.setAttribute("disabled", false);
        PAUSE_BUTTON.setAttribute("style", "opacity: 100%");
    }, PAUSE_MINUTES*60*1000);
    PAUSE_BUTTON.setAttribute("disabled", true);
}

PAUSE_BUTTON.addEventListener("click", pause);