// Keep service worker alive
let lifeline;

keepAlive();
async function keepAlive() {
  if (lifeline) return;
  for (const tab of await chrome.tabs.query({ url: '*://*/*' })) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          chrome.runtime.connect({ name: 'keepAlive' });
          console.log('keepAlive');
        },
      });
      chrome.tabs.onUpdated.removeListener(retryOnTabUpdate);
      return;
    } catch (e) {}
  }
  chrome.tabs.onUpdated.addListener(retryOnTabUpdate);
}

function keepAliveForced() {
  lifeline?.disconnect();
  lifeline = null;
  keepAlive();
}

async function retryOnTabUpdate(tabId, info, tab) {
  if (info.url && /^(file|https?):/.test(info.url)) {
    keepAlive();
  }
}

chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'keepAlive') {
    lifeline = port;
    setTimeout(keepAliveForced, 295e3);
    port.onDisconnect.addListener(keepAliveForced);
  }
});

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

          // Block all sedo.com subdomains
          '*://*.sedo.com/*',
          // Block all sedo.com domains
          '*://sedo.com/*',

          // Block all dan.com subdomains
          '*://*.dan.com/*',
          // Block all dan.com domains
          '*://dan.com/*',

          // Block all domains.google subdomains
          '*://*.domains.google/*',
          // Block all domains.google domains
          '*://domains.google/*',

          // Block all afternic.com subdomains
          '*://*.afternic.com/*',
          // Block all afternic.com domains
          '*://afternic.com/*',

          // Block all godaddy.co.uk subdomains
          '*://*.godaddy.co.uk/*',
          // Block all godaddy.co.uk domains
          '*://godaddy.co.uk/*',

          // Block all hostinger.com subdomains
          '*://*.hostinger.com/*',
          // Block all hostinger.com domains
          '*://hostinger.com/*',

          // Block all hostinger.co.uk subdomains
          '*://*.hostinger.co.uk/*',
          // Block all hostinger.co.uk domains
          '*://hostinger.co.uk/*',

          // Block all 20i.com subdomains
          '*://*.20i.com/*',
          // Block all 20i.com domains
          '*://20i.com/*',
      ],
    },
    [],
);