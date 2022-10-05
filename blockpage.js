// Keep service worker alive
let lifeline;
const KEEP_ALIVE = "keepAlive";
var DOMAIN_RULES_URL = "https://raw.githubusercontent.com/Rutuj-Runwal/NoMoreDomains/master/domains.json";

keepAlive();

async function keepAlive() {
  if (lifeline) return;
  for (const tab of await browser.tabs.query({ url: "*://*/*" })) {
    try {
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          browser.runtime.connect({ name: KEEP_ALIVE });
        },
      });
      browser.tabs.onUpdated.removeListener(retryOnTabUpdate);
      return;
    } catch (error) {
      console.log("NO_MORE_DOMAINS:ERROR ", error);
    }
  }
  browser.tabs.onUpdated.addListener(retryOnTabUpdate);
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

browser.runtime.onConnect.addListener((port) => {
  if (port.name === KEEP_ALIVE) {
    lifeline = port;
    setTimeout(keepAliveForced, 295e3);
    port.onDisconnect.addListener(keepAliveForced);
  }
});

// Fetch and add rules to declarativeNetRequest
function fetchProtectionRules(url,status){
  fetch(url)
  .then((res) => res.json())
  .then((domains) => {
    for (var i=0; i<domains.length; i++){
      domains[i]="*://www."+domains[i]+"/*"
    }
    function redirectdom(details) { if (!domains.includes(details.url)) {
      return {redirectUrl: 'http://google.com'};
      }}
    if(status==="redirect"){
      console.log("Disabling domains!");
      console.log(domains);
      browser.webRequest.onBeforeRequest.addListener(
        redirectdom,
        {urls: domains},
        ["blocking"]
      );
      
    }
    else if(status==="off"){
      console.log("Allowing domains!");
      browser.webRequest.onBeforeRequest.removeListener(redirectdom);
    }
  });
}

// saveUpdateTime function sets the current date in browser's local storage
function saveUpdateTime() {
  const tDate = new Date().toLocaleDateString();
  browser.storage.local.set({ run_day: tDate });
}

function performUpdate(status) {
  try {
    fetchProtectionRules(DOMAIN_RULES_URL,status);
    console.log("Success: Rules Added");
  } catch (err) {
    console.log("Error fetching rules");
  }
}

// Below code checks if a date is added to the browser storage.
// 1. If date is added, it compares it with current date and if they mismatch it runs the update
// 2. If date is not added(or is undefined) then it performs an update[This will be the "first time" update] and sets the date
try {
  browser.storage.local.get(['run_day'], function (result) {
    let checkerDate = new Date().toLocaleDateString();
    if (result.run_day === undefined) {
      try {
        saveUpdateTime();
        performUpdate("redirect");
        console.log("First Update Performed!");
      } catch (err) { console.log("Error while fetching first-run data:E01!"); }
    }
    else if (result.run_day !== checkerDate) {
      try {
        saveUpdateTime();
        performUpdate("redirect");
        console.log("Updated Successfully!");
      } catch (err) { console.log("Error while fetching subsequent data: E02!"); }
    }
  });
} catch (err) {
  console.log(err);
}

// Message passing between popup.js and this script to enable toggle(on/off) functionality
browser.runtime.onMessage.addListener(
  function (request) {
    if (request.NMD_status==="on"){
      performUpdate("redirect");
    }
    else if (request.NMD_status === "off"){
      performUpdate("off");
    }
    else{
      performUpdate("redirect");
    }
  }
);