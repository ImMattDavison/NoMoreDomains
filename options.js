var WhiteList_Button = document.getElementById("WhiteList_Submit_Button");
var Whitelist_Enter = document.getElementById("whiteListDomain");
var WhiteListed_Section = document.querySelector("#whitelisted-domains")
var Domain = document.getElementById("whiteListDomain");
var Display_whiteList_Domains = document.getElementById("whiteList_domains");
var Erase_Button = document.getElementById("WhiteList_Erase_Button");
var divider = document.querySelector(".divider");
var whiteList_Memory = new Set();
var whiteList_RuleIds = new Map();  // maps { domain -> id }

async function addWhiteList() {
    if(Domain.value==undefined || Domain.value=="") {
        alert("Enter a valid domain value to add to whitelist!");
        return;
    }

    var regex = new RegExp("^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\\.)+[A-Za-z]{2,6}$");
    if(!regex.test(Domain.value)) {
        alert("Enter a valid domain value to add to whitelist!");
        return;
    }

    // Update whiteList_Memory with domains already exisitng in the local storage
    const result = await chrome.storage.local.get(['rules_count','user_whitelist']);
    if(result.user_whitelist && result.user_whitelist.length!=0) {
        whiteList_Memory = new Set([...whiteList_Memory, ...result.user_whitelist]);
        console.log("Values already exists");

    } else {
        console.log("Values doesn't exists");
    }

    // no action needed if domain exists in whiteList_Memory
    if(whiteList_Memory.has(Domain.value)) {
        alert("domain exists in whitelist!!");
        return;
    }

    // alert user if there's no space for new rule and exit
    if(
        whiteList_Memory.size + result.rules_count 
        >= chrome.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_RULES
    ) { 
        console.log("dNr Error: Ruleset Limit overflow");
        alert("max rule capacity exceeded, delete unused rules before adding more")
        return;
    }

    // add domain entered by the user into the whitelist
    whiteList_Memory.add(Domain.value);
    console.log("user whitelist: ", whiteList_Memory);

    // Add decleartiveNetRequest rules beyond the rules already present by default in the extension 
    var id = result.rules_count;
    var protectionRulesArr = [];
    whiteList_Memory.forEach((domain) => {
        id = id + 1;
        // save domain's rule id
        whiteList_RuleIds.set(domain, id);
        // add rule
        protectionRulesArr.push(createRule(id, true, domain));
    });

    console.log("protection rule generated: ", protectionRulesArr);
    console.log("whitelist {domain, ruleId}: ", whiteList_RuleIds);
    await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: protectionRulesArr,
            removeRuleIds: [...whiteList_RuleIds.values()], // extract ids for the rules
        },
    );

    // Assuming all whitelist entries is re-generated when
    // entry is added, we don't need to access whiteList_RuleIds
    // while updating it on storage.local
    await chrome.storage.local.set({
        "whiteList_RuleIds": [...whiteList_RuleIds.entries()],
        "user_whitelist": [...whiteList_Memory]
    });
    
    chrome.declarativeNetRequest.getDynamicRules((rules) => showModifiedRules(
        "after adding: ", rules
    ));

    // Display all whitelisted domains
    displayWhiteListTable();

    // clear the input field
    Domain.value = "";
}

// Disable the whitelisting for the domains
async function removeWhiteList(){
    const result = await chrome.storage.local.get(['whiteList_RuleIds', 'rules_count']);
    
    // whitelist is empty
    if(!result.whiteList_RuleIds || result.whiteList_RuleIds.length==0) {
        alert("Add domains to whitelist before removing!");
        return;
    }

    whiteList_RuleIds = new Map([...result.whiteList_RuleIds]);
    console.log("removeWhiteList: ", whiteList_RuleIds);

    // update rules
    let removeRuleIds = [...whiteList_RuleIds.values()]
    console.log("Ids to remove", removeRuleIds);
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeRuleIds });

    // Reset whilelist
    await chrome.storage.local.remove(["user_whitelist", "whiteList_RuleIds"]);
    whiteList_Memory.clear();
    whiteList_RuleIds.clear();
    setTimeout(() => alert("Whitelist Removed!"), 500);

    chrome.declarativeNetRequest.getDynamicRules((rules)=> showModifiedRules("after removing all: ", rules));
   
    // hide table from the page
    WhiteListed_Section.style.display = "none";
}

async function restore_options() {
    displayWhiteListTable();
    chrome.declarativeNetRequest.getDynamicRules((rules)=> showModifiedRules("restored: ", rules));
}

function genWhiteListTabEnt(website) {
    return (
        "<div class='whitelist-ent'> \
            <div class='whitelist-txt'>" + website + "</div> \
            <div class='whitelist-del-container'> \
                <button class='whitelist-ent-del-btn' data-wl-ent='" + website + "'> \
                <img src='assets/cross.svg'> \
                </button> \
            </div> \
        </div>"
    );
}

async function displayWhiteListTable() {
    const data = await chrome.storage.local.get(["user_whitelist"]);
    if (!data.user_whitelist || data.user_whitelist.length==0) {
        WhiteListed_Section.style.display = "none";
        return;
    }

    var tds = "";
    data.user_whitelist.forEach(website => {
        tds += genWhiteListTabEnt(website);
    });
    Display_whiteList_Domains.innerHTML = tds;

    // add event listeners to facilitate deletion
    let delBtns = document.querySelectorAll(".whitelist-ent-del-btn");
    delBtns.forEach((node) => 
        node.addEventListener("click", (e) => handleWhiteListEntDeletion(e))
    );

    WhiteListed_Section.style.display = "block";
}

async function handleWhiteListEntDeletion(e) {
    const domain = e.currentTarget.dataset.wlEnt; 

    // retrieve whiteList rule-ids from the storage and merge with existing ones
    let result = await chrome.storage.local.get(["whiteList_RuleIds", "user_whitelist"]);
    if(result.whiteList_RuleIds) {
        whiteList_RuleIds = new Map([...whiteList_RuleIds, ...result.whiteList_RuleIds]);
    }
    if(result.user_whitelist) { 
        whiteList_Memory = new Set([...whiteList_Memory, ...result.user_whitelist]); 
    }

    const ruleId = domain && whiteList_RuleIds.get(domain);
    if(ruleId==undefined) {
        console.error("no rule id found for: ", domain);
        return;
    }
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [ruleId] });

    // update whiteList_Memory and storage.local
    whiteList_Memory.delete(domain);
    whiteList_RuleIds.delete(domain);
    
    // wait until saved before reading/displaying whitelist to the user
    if (whiteList_Memory.size) {
        await chrome.storage.local.set({
            "user_whitelist": [...whiteList_Memory],
            "whiteList_RuleIds": [...whiteList_RuleIds]
        });
        // display remaining WhiteList entries
        displayWhiteListTable();
    
    } else { 
        // no whitelist entry to save
        await chrome.storage.local.remove(["user_whitelist", "whiteList_RuleIds"]);
        WhiteListed_Section.style.display = "none";
    }
    chrome.declarativeNetRequest.getDynamicRules((rules)=> showModifiedRules("after deleting one: ", rules));
}

/**
 * 
 * @param id rule's id
 * @param allow if set to true, creates 'allow' rule else 'block' rule
 * @param domain url for the domain 
 * @returns output rule based on the args
 */
function createRule(id, allow, domain) {
    return ({
        id: id,
        priority: 2,
        action: allow 
            ? { type: "allow" } 
            : { type: "redirect", redirect: { extensionPath: "/block.html" }},
        condition: {
            urlFilter: "||" + domain + "^",
            resourceTypes: ["main_frame","sub_frame"]
        }
    })
}

document.addEventListener('DOMContentLoaded', restore_options);

WhiteList_Button.addEventListener("click", addWhiteList);
Whitelist_Enter.addEventListener("keypress", function(event) {
    // If the user presses the "Enter" key on the keyboard
    if (event.key === "Enter") {
      addWhiteList();
    }
});

Erase_Button.addEventListener("click", removeWhiteList);


function showModifiedRules(msg, rules) {
    console.log(msg);
    let modRules = rules.filter((rule)=> rule.priority==2);
    console.log("white listed: ", modRules.filter((rule)=> rule.action.type=="allow").map(rule=>rule.condition.urlFilter));
    console.log("blocked: ", modRules.filter((rule)=> rule.action.type=="redirect").map(rule=>rule.condition.urlFilter));
}