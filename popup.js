// Script to enable functionality for toggle(turning extension on/off)
var Button_Toggle = document.getElementById("toggleButton");
var span_ToggleState = document.getElementById("NVMtoggle_status");
var nvm_wrapper = document.getElementById("NVM_statusWrapper");
console.log(span_ToggleState.innerText);
if (span_ToggleState.innerText === "Initialized") {
    nvm_wrapper.style.display = "none";
}
function toggleNMD() {
    chrome.storage.local.get(['toggle_value'], (data) => {
        if (data.toggle_value != undefined) {
            if (data.toggle_value === "on") {
                // toggle_value was set to on: We will toggle it
                // Setting toggle_value to off
                chrome.storage.local.set({ toggle_value: "off" });
                chrome.runtime.sendMessage({ NMD_status: "off" });
                span_ToggleState.innerText = "OFF";
                nvm_wrapper.style.display = "block";
                span_ToggleState.style.color = "red";
            }
            else if (data.toggle_value === "off") {
                // toggle_value was set to off: We will toggle it
                // Setting toggle_value to on
                chrome.storage.local.set({ toggle_value: "on" });
                chrome.runtime.sendMessage({ NMD_status: "on" });
                span_ToggleState.innerText = "ON";
                nvm_wrapper.style.display = "block";
                span_ToggleState.style.color = "green";
            }
        }
        else{
            chrome.storage.local.set({ toggle_value: "off" });
            chrome.runtime.sendMessage({ NMD_status: "off" });
            span_ToggleState.innerText = "OFF";
            nvm_wrapper.style.display = "block";
            span_ToggleState.style.color = "red";
        }
    });
}
Button_Toggle.addEventListener("click",toggleNMD);