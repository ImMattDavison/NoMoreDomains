var PAUSE_TIME = 30000; // in milliseconds
var checkToPauseButton = document.getElementById("NMD_pause");
const getPauseStatus = localStorage.getItem('pausingNMD');

// TODO: Improve Pause functionality
if(checkToPauseButton!=undefined){
  checkToPauseButton.addEventListener("click",()=>{
    if(getPauseStatus!=undefined){
      if(getPauseStatus==="yes"){
        setTimeout(
          ()=>{
            chrome.storage.local.set({ toggle_value: "on" });
            chrome.runtime.sendMessage({ NMD_status: "on" });
          }, PAUSE_TIME);
        localStorage.removeItem("pausingNMD");
        window.history.go(-1);
        console.log(history.length);

        
      }else{
        localStorage.setItem("pausingNMD","yes");
        chrome.storage.local.set({ toggle_value: "off" });
        chrome.runtime.sendMessage({ NMD_status: "off" });
      }
    }else{
      localStorage.setItem("pausingNMD","yes");
      chrome.storage.local.set({ toggle_value: "off" });
      chrome.runtime.sendMessage({ NMD_status: "off" });    

      setTimeout(
          ()=>{
            chrome.storage.local.set({ toggle_value: "on" });
            chrome.runtime.sendMessage({ NMD_status: "on" });
          }, PAUSE_TIME);
        localStorage.removeItem("pausingNMD");
        window.history.go(-1);
    }
  });
}
else{
  console.log("Undef");
}