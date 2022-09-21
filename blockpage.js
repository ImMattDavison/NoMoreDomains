chrome.webRequest.onBeforeRequest.addListener(
    function (request) {
        if(request.url){
            chrome.tabs.update({url: "https://google.com"});
        }else{
            return console.log("Not blocked");
        }
    },
    {
      types: ['main_frame'],
      urls: [
          '*://*.dynadot.com/*', 
          '*://dynadot.com/*', 
          '*://*.porkbun.com/*', 
          '*://porkbun.com/*', 
          '*://*.godaddy.com/*', 
          '*://godaddy.com/*', 
          '*://*.register.com/*', 
          '*://register.com/*', 
          '*://*.namecheap.com/*', 
          '*://namecheap.com/*', 
          '*://*.iwantmyname.com/*', 
          '*://*.iwantmyname.com/*'
      ],
    },
    [],
);