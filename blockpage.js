// Keep service worker alive
const now = performance.now();
const keepServiceWorkerActive = () => 
  dispatchEvent(
    new CustomEvent('keepactive', {
      detail: `Active at ${~~(((performance.now() - now) / 1000) / 60)} minutes.`
    })
  );
const handleKeepServiceWorkerActive = (e) => console.log(e.detail);
addEventListener("keepactive", handleKeepServiceWorkerActive);
let interval = setInterval(keepServiceWorkerActive, 1000 * 60 * 5);

// Handle web requests and block domain registrars
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
          // Block all dynadot.com subdomains
          '*://*.dynadot.com/*', 
          // Block all dynadot.com domains
          '*://dynadot.com/*', 

          // Block all porkbun.com subdomains
          '*://*.porkbun.com/*', 
          // Remove all porkbun.com domains
          '*://porkbun.com/*', 

          // BLock all godaddy.com subdomains
          '*://*.godaddy.com/*',
          // Block all godaddy.com domains 
          '*://godaddy.com/*', 

          // Block all register.com subdomains
          '*://*.register.com/*', 
          // Block all register.com domains
          '*://register.com/*', 

          // Block all namecheap.com subdomains
          '*://*.namecheap.com/*', 
          // Block all namecheap.com domains
          '*://namecheap.com/*', 

          // Block all iwantmyname.com subdomains
          '*://*.iwantmyname.com/*', 
          // Block all iwantmyname.com domains
          '*://*.iwantmyname.com/*',

          // Block all enom.com subdomains
          '*://*.enom.com/*',
          // Block all enom.com domains
          '*://enom.com/*',

          // Block all ovhcloud.com subdomains
          '*://*.ovhcloud.com/*',
          // Block all ovhcloud.com domains
          '*://ovhcloud.com/*',

          // Block all ionos.com subdomains
          '*://*.ionos.com/*',
          // Block all ionos.com domains
          '*://ionos.com/*',

          // Block all ionos.co.uk subdomains
          '*://*.ionos.co.uk/*',
          // Block all ionos.co.uk domains
          '*://ionos.co.uk/*',

          // Block all 123-reg.com subdomains
          '*://*.123-reg.com/*',
          // Block all 123-reg.com domains
          '*://123-reg.com/*',

          // Block all 123-reg.co.uk subdomains
          '*://*.123-reg.co.uk/*',
          // Block all 123-reg.co.uk domains
          '*://123-reg.co.uk/*',

          // Block all names.co.uk subdomains
          '*://*.names.co.uk/*',
          // Block all names.co.uk domains
          '*://names.co.uk/*',

          // Block all domain.com subdomains
          '*://*.domain.com/*',
          // Block all domain.com domains
          '*://domain.com/*',
      ],
    },
    [],
);