// Script to enable functionality for toggle(turning extension on/off)
var Button_Toggle = document.getElementById("toggleButton");
var Options_Button = document.querySelector(".settings-icon");

// Update toggle button: on/off in the UI using chrome storage value
chrome.storage.local.get(['extension_state'], (data) => {
        if (data.extension_state != undefined) {
            if (data.extension_state === "on") {
                // extension_state was set to on: We will toggle it
                // Setting extension_state to off
                Button_Toggle.checked = true;
            }
            else if (data.extension_state === "off") {
                // extension_state was set to off: We will toggle it
                // Setting extension_state to on
                Button_Toggle.checked = false;
            }
        }
        else{
            Button_Toggle.checked = true;
        }
    });

// TODO: block user from toggling until toggled state is achieved
function toggleNMD() {
    // Toggle logic
    if(Button_Toggle.checked === true){
        chrome.runtime.sendMessage({ NMD_status: "on" });
        Button_Toggle.checked = true;
    }
    else if(Button_Toggle.checked === false){
        chrome.runtime.sendMessage({ NMD_status: "off" });
        Button_Toggle.checked = false;
    }
}
// Open options(settings page) when clicked on settings in the popup
if (Options_Button != undefined) {
    Options_Button.addEventListener('click', function () {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    });
}
Button_Toggle.addEventListener("change",toggleNMD);