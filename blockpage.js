// Keep service worker alive
let lifeline;
const KEEP_ALIVE = "keepAlive";

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

// Handle web requests and block domain registrars
fetch("/domains.json")
  .then((res) => res.json())
  .then((domains) => {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: domains.map((_, index) => index + 1),
      addRules: domains.map((domain, index) => ({
        id: index + 1,
        priority: 1,
        action: { type: "redirect", redirect: { url: "https://google.com/" } },
        condition: {
          urlFilter: `*://*.${domain}/*`,
          resourceTypes: ["main_frame"],
        },
      })),
    });
  });
