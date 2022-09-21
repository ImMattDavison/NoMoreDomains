const host = "https://dynadot.com"

chrome.webRequest.onBeforeRequest.addListener(
    function (request) {
        if(request.url = host){
            chrome.tabs.update({url: "https://google.com"});
        }else{
            return console.log("Not blocked");
        }
    },
    {
      types: ['main_frame'],
      urls: ['<all_urls>'],
    },
    [],
);