var WhiteList_Button = document.getElementById("WhiteList_Submit_Button");
var Domain = document.getElementById("whiteListDomain");
var Display_whiteList_Domains = document.getElementById("whiteList_domains");
var Erase_Button = document.getElementById("WhiteList_Erase_Button");
var whiteList_domains_table = document.getElementById("whiteList_domains_table");
var divider = document.querySelector(".divider");
var whiteList_Memory = new Set();
var whiteList_RuleIds = new Map();

async function addWhiteList() {
    if(Domain.value==undefined || Domain.value=="") {
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

    // save to local storage
    await chrome.storage.local.set({ "user_whitelist": [...whiteList_Memory] });

    // Add decleartiveNetRequest rules beyond the rules already present by default in the extension 
    var id = result.rules_count;
    var protectionRulesArr = [];
    whiteList_Memory.forEach((domain) => {
        id = id + 1;
        // save domain's rule id
        whiteList_RuleIds.set(domain, id);
        // add rule
        protectionRulesArr.push(createRule(id, "allow", domain));
    });

    // save whiteList_RuleIds to storage.local.
    // Assuming all whitelist entries is re-generated when
    // entry is added, we don't need to access whiteList_RuleIds
    // while updating it on storage.local
    await chrome.storage.local.set({"whiteList_RuleIds": [...whiteList_RuleIds.entries()]})

    console.log("protection rule generated: ", protectionRulesArr);
    console.log("whitelist {domain, ruleId}: ", whiteList_RuleIds);
    await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: protectionRulesArr,
            removeRuleIds: [...whiteList_RuleIds.values()], // extract ids for the rules
        },
    );
    chrome.declarativeNetRequest.getDynamicRules((rules) => showModifiedRules(
        "after adding: ", rules
    ));

    // Display all whitelisted domains
    displayWhiteListTable();
}

async function removeWhiteList(){
    // Disable the whitelisting for the domains
    const result = await chrome.storage.local.get(['rules_count','user_whitelist']);
    console.log("removeWhiteList: ");
    console.log(result.user_whitelist);
    
    // whitelist is empty
    if(result.user_whitelist.length==0) {
        alert("Add domains to whitelist before removing!");
        return;
    }

    // update rules
    let removeRuleIds = Array.from({ length: result.user_whitelist.length}, (_, i) => i + result.rules_count + 1);
    let updatedRules = result.user_whitelist.map((domain, index) => createRule(
        index + result.rules_count + 1,
        false,
        domain
    ));
    
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: removeRuleIds,
        addRules: updatedRules,
    });
    console.log(whiteList_Memory);

    // Reset whilelist
    await chrome.storage.local.remove(["user_whitelist", "whiteList_RuleIds"]);
    whiteList_Memory.clear();
    setTimeout(() => alert("Whitelist Removed!"), 500);

    console.log(whiteList_Memory);
    chrome.declarativeNetRequest.getDynamicRules((rules)=> showModifiedRules("after removing all: ", rules));
   
    // hide table from the page
    whiteList_domains_table.style.display = "none";
    Erase_Button.style.display = "none";
}

async function restore_options() {
    displayWhiteListTable();
    chrome.declarativeNetRequest.getDynamicRules((rules)=> showModifiedRules("restored: ", rules));
}

function genWhiteListTabEnt(website) {
    return (
        "<tr class='whitelist-ent'> \
            <td>" + website + "</td> \
            <td> \
                <button class='whitelist-ent-del-btn' data-wl-ent='" + website + "'> \
                <img src='assets/cross.svg'> \
                </button> \
            </td> \
        </tr>"
    );
}

async function displayWhiteListTable() {
    const data = await chrome.storage.local.get(["user_whitelist"]);
    if (data.user_whitelist && data.user_whitelist.length!=0) {
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

        whiteList_domains_table.style.display = "block";
        Erase_Button.style.display = "block";

    } else if(whiteList_Memory && whiteList_Memory.size!=0) {
        var tds = "";
        whiteList_Memory.forEach(website => {
            // tds += "<tr><td>" + website + "</td></tr>";
            tds += genWhiteListTabEnt(website);
        }); 
        Display_whiteList_Domains.innerHTML = tds;


        // add event listeners to facilitate deletion
        let delBtns = document.querySelectorAll(".whitelist-ent-del-btn");
        delBtns.forEach((node) => 
            node.addEventListener("click", (e) => handleWhiteListEntDeletion(e))
        );
     
        whiteList_domains_table.style.display = "block";
        Erase_Button.style.display = "block";

    } else {
        whiteList_domains_table.style.display = "none";
        Erase_Button.style.display = "none";
    }
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

    let rule = createRule(ruleId, false, domain);
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [ruleId],
        addRules: [rule]
    });

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
        whiteList_domains_table.style.display = "none";
        Erase_Button.style.display = "none";
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
Erase_Button.addEventListener("click", removeWhiteList);


function showModifiedRules(msg, rules) {
    console.log(msg);
    let modRules = rules.filter((rule)=> rule.priority==2);
    console.log("white listed: ", modRules.filter((rule)=> rule.action.type=="allow").map(rule=>rule.condition.urlFilter));
    console.log("blocked: ", modRules.filter((rule)=> rule.action.type=="redirect").map(rule=>rule.condition.urlFilter));
}