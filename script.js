function onoff(){
    if(!chrome.storage.sync.get(['isOn'])){
        chrome.storage.sync.set({isOn: false}, function() {
            console.log('Value is set to ' + value);
        });
    }
    if(chrome.storage.sync.get(['isOn']) == true){
        chrome.storage.sync.set({isOn: false}, function() {
            console.log('Value is set to ' + value);
        });
    }
    if(chrome.storage.sync.get(['isOn']) == false){
        chrome.storage.sync.set({isOn: true}, function() {
            console.log('Value is set to ' + value);
        });
    }
}