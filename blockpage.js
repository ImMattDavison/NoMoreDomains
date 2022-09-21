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
          // Remove all dynadot.com subdomains
          '*://*.dynadot.com/*', 
          // Remove all dynadot.com domains
          '*://dynadot.com/*', 

          // Remove all porkbun.com subdomains
          '*://*.porkbun.com/*', 
          // Remove all porkbun.com domains
          '*://porkbun.com/*', 

          // Remove all godaddy.com subdomains
          '*://*.godaddy.com/*',
          // Remove all godaddy.com domains 
          '*://godaddy.com/*', 

          // Remove all register.com subdomains
          '*://*.register.com/*', 
          // Remove all register.com domains
          '*://register.com/*', 

          // Remove all namecheap.com subdomains
          '*://*.namecheap.com/*', 
          // Remove all namecheap.com domains
          '*://namecheap.com/*', 

          // Remove all iwantmyname.com subdomains
          '*://*.iwantmyname.com/*', 
          // Remove all iwantmyname.com domains
          '*://*.iwantmyname.com/*'
      ],
    },
    [],
);