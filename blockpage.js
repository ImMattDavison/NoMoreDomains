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

fetch("/domains.json")
  .then(res => res.json())
  .then(domains => {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: domains.map((_, i) => i+1),
      addRules: domains.map((domain,i) => ({
        id: i + 1,
        priority: 1,
        action: { type: "redirect", redirect: { url: "https://google.com/" } },
        condition:
          {
            urlFilter: `*://*.${domain}/*`,
            resourceTypes: ["main_frame"],
          },
      })),
    });    
  })
