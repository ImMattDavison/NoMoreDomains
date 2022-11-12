// Keep service worker alive
let lifeline;
const KEEP_ALIVE = "keepAlive";
var DOMAIN_RULES_URL = "https://raw.githubusercontent.com/immattdavison/NoMoreDomains/master/domains.json";

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
      console.log("NO_MORE_DOMAINS:ERROR ", error);
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

// Fetch and create rules for declarativeNetRequest
async function fetchProtectionRules(url){
  let domains = await fetch(url)
  .then((res) => res.json())
  return domains.map((domain, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: "redirect", redirect: { extensionPath: "/block.html" } },
    condition: {
      urlFilter: "||"+domain+"^",
      resourceTypes: ["main_frame", "sub_frame"],
    },
  }));
}

// saveUpdateTime function sets the current date in chrome's local storage
async function saveUpdateTime() {
  const tDate = new Date().toLocaleDateString();
  await chrome.storage.local.set({ run_day: tDate });
}

async function performUpdate() {
  try {
    console.log("Disabling domains!");
    let rules = await fetchProtectionRules(DOMAIN_RULES_URL);
    await chrome.storage.local.set({ "rules_count": rules.length }); // Save the count(number) of rules
    let ruleIds = rules.map((rule) => rule.id);
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
      addRules: rules 
    })
    console.log("Success: Rules Added");
  } catch (err) {
    console.log("Error fetching rules");
  }
}

// Below code checks if a date is added to the chrome storage.
// 1. If date is not added(or is undefined) then it performs an 
//    update[This will be the "first time" update] and sets the date
// 2. If date is added and extension is enabled,
//    it compares it with current date and if they mismatch it runs the update
try {
  chrome.storage.local.get(['run_day', 'extension_state'], async function (result) {
    let checkerDate = new Date().toLocaleDateString();
    if (result.run_day === undefined) {
      try {
        await saveUpdateTime();
        await toggleExt("on");
        console.log("First Update Performed!");
      } catch (err) { console.log("Error while fetching first-run data:E01!"); }
    }
    else if (result.run_day !== checkerDate && result.extension_state==="on") {
      try {
        await saveUpdateTime();
        await toggleExt("on");
        console.log("Updated Successfully!");
      } catch (err) { console.log("Error while fetching subsequent data: E02!"); }
    }
  });
} catch (err) {
  console.log(err);
}

// Message passing between popup.js and this script to enable toggle(on/off) functionality
chrome.runtime.onMessage.addListener(
  function (request, sender, sendMessage) {
    if (request.NMD_status==="on"){
      toggleExt("on");
    }
    else if(request.revertRules) {
      revertRulesDefault()
      .then(() => sendMessage({ res: "done" }))
      .catch(() => sendMessage({ res: "failed" }));
      // in order to send message back asynchronously, 
      // we need to return true.
      return true; 
    }
    else if (request.NMD_status === "off"){
      toggleExt("off");
    }
  }
);

async function toggleExt(status) {
  if(status==="on") {
    await performUpdate();
    await chrome.storage.local.set({ extension_state: "on" })
    console.log("extension enabled")

  } else {
    // create allow rules for default domains
    let defaultRules = (await chrome.declarativeNetRequest.getDynamicRules())
    .filter((rule)=>rule.priority===1);  // filters default rules
    console.log("Allowing domains!");
    let ruleIds = defaultRules.map((rule) => rule.id);
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ruleIds })
    await chrome.storage.local.set({ extension_state: "off" });
    console.log("extension disabled")
  }
}

// quick delete all rules added by the extensions and regenerate default rules.
async function revertRulesDefault() {
  // remove all rules
  let ruleIds = (await chrome.declarativeNetRequest.getDynamicRules())
    .map((rule)=>rule.id);

  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ruleIds });
  await chrome.storage.local.clear();
  await performUpdate(); //regenerates default rules
}