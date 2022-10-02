// Keep service worker alive
let lifeline;
const KEEP_ALIVE = "keepAlive";
var DOMAIN_RULES_URL = "https://raw.githubusercontent.com/Rutuj-Runwal/NoMoreDomains/master/domains.json";

keepAlive();

async function keepAlive() {
  if (lifeline) return;
  for (const tab of await chrome.tabs.query({ url: "*://*/*" })) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          chrome.runtime.connect({ name: KEEP_ALIVE });
        },
      });
      chrome.tabs.onUpdated.removeListener(retryOnTabUpdate);
      return;
    } catch (error) {
      console.error("NO_MORE_DOMAINS:ERROR ", error);
    }
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

chrome.runtime.onConnect.addListener((port) => {
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
    if(status==="redirect"){
      console.log("Disabling domains!");
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: domains.map((_, index) => index + 1),
        addRules: domains.map((domain, index) => ({
          id: index + 1,
          priority: 1,
          action: { type: "redirect", redirect: { url: "https://google.com/" } },
          condition: {
            urlFilter: domain,
            resourceTypes: ["main_frame"],
          },
        })),
      });
    }
    else if(status==="off"){
      console.log("Allowing domains!");
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: domains.map((_, index) => index + 1),
        addRules: domains.map((domain, index) => ({
          id: index + 1,
          priority: 2,
          action: { type: "allow"},
          condition: {
            urlFilter: domain,
            resourceTypes: ["main_frame"],
          },
        })),
      });
    }
  });
}

// saveUpdateTime function sets the current date in chrome's local storage
function saveUpdateTime() {
  const tDate = new Date().toLocaleDateString();
  chrome.storage.local.set({ run_day: tDate });
}

function performUpdate(status) {
  try {
    fetchProtectionRules(DOMAIN_RULES_URL,status);
    console.log("Success: Rules Added");
  } catch (err) {
    console.log("Error fetching rules");
  }
}

// Below code checks if a date is added to the chrome storage.
// 1. If date is added, it compares it with current date and if they mismatch it runs the update
// 2. If date is not added(or is undefined) then it performs an update[This will be the "first time" update] and sets the date
try {
  chrome.storage.local.get(['run_day'], function (result) {
    saveUpdateTime();
    performUpdate("off");
    console.log((!result.run_day) ? "First Update Performed!" : "Updated Successfully!");
  });
} catch (err) {
  console.log(err);
}

// Message passing between popup.js and this script to enable toggle(on/off) functionality
chrome.runtime.onMessage.addListener((request) => {
  const status = request.NMD_status === 'off' ? 'off' : 'redirect';
  performUpdate(status);
});