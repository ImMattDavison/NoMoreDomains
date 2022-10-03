// Script to enable functionality for toggle(turning extension on/off)
var Button_Toggle = document.getElementById("toggleButton");

// Update toggle button: on/off in the UI using chrome storage value
chrome.storage.local.get(['toggle_value'], (data) => {
        if (data.toggle_value != undefined) {
            if (data.toggle_value === "on") {
                // toggle_value was set to on: We will toggle it
                // Setting toggle_value to off
                Button_Toggle.checked = true;
            }
            else if (data.toggle_value === "off") {
                // toggle_value was set to off: We will toggle it
                // Setting toggle_value to on
                Button_Toggle.checked = false;
            }
        }
        else{
            Button_Toggle.checked = true;
        }
    });
function toggleNMD() {
    // Toggle logic
    if(Button_Toggle.checked === true){
        chrome.storage.local.set({ toggle_value: "on" });
        chrome.runtime.sendMessage({ NMD_status: "on" });
        Button_Toggle.checked = true;
    }
    else if(Button_Toggle.checked === false){
        chrome.storage.local.set({ toggle_value: "off" });
        chrome.runtime.sendMessage({ NMD_status: "off" });
        Button_Toggle.checked = false;
    }
}
Button_Toggle.addEventListener("change",toggleNMD);