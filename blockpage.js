// Handle web requests and block domain registrars
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
