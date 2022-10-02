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

      // Toggle the value to on/off from previous value
      const toggledValue = (data.toggle_value === 'on' || data.toggle_value === undefined) ? 'off' : 'on';
      chrome.storage.local.set({ toggle_value: toggledValue });
      chrome.runtime.sendMessage({ NMD_status: toggledValue });
      span_ToggleState.innerText = toggledValue.toUpperCase();
      nvm_wrapper.style.display = 'inline-block';

      // Toggle the color to on/off from previous value
      const toggledColorCode = (data.toggle_value === 'on') ? 'red' : 'green';
      span_ToggleState.style.color = toggledColorCode;
    });
}
Button_Toggle.addEventListener("click",toggleNMD);