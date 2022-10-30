var WhiteList_Button = document.getElementById("WhiteList_Submit_Button");
var Domain = document.getElementById("whiteListDomain");
var Display_whiteList_Domains = document.getElementById("whiteList_domains");
var Erase_Button = document.getElementById("WhiteList_Erase_Button");
var whiteList_domains_table = document.getElementById("whiteList_domains_table");
var whiteList_Memory = new Set();

function addWhiteList() {
    // Store the user input into an array and update declarativeNetRequest Filters
    if(Domain.value!=undefined && Domain.value!=""){
        whiteList_Memory.add(Domain.value);

        // Update whiteList_Memory variable with domains already exisitng in the local storage
        chrome.storage.local.get(['user_whitelist'], function (data) {
            if(data.user_whitelist!=undefined){
                if(data.user_whitelist.length!=0){
                    whiteList_Memory = new Set([...whiteList_Memory, ...data.user_whitelist]);
                    console.log("Values already exists");
                    console.log(whiteList_Memory);
                    chrome.storage.local.set({ "user_whitelist": [...whiteList_Memory] });
                }
                else{
                    whiteList_Memory = [...whiteList_Memory];
                    console.log("Values doesn't exists");
                    console.log(whiteList_Memory);
                    chrome.storage.local.set({ "user_whitelist": [...whiteList_Memory] });
                }
            }
        });
        chrome.storage.local.set({ "user_whitelist": [...whiteList_Memory] });
        // Add decleartiveNetRequest rules beyond the rules already present by default in the extension 
        chrome.storage.local.get(['rules_count','user_whitelist'], function (result) {
            if(result.user_whitelist!=undefined){
                var id = result.rules_count;
                var protectionRulesArr = [];
                if (result.user_whitelist.length > 0) {
                    console.log("User:",result.user_whitelist);
                    result.user_whitelist.forEach((domain) => {
                        id = id + 1;
                        protectionRulesArr.push({
                            "id": id,
                            "priority": 2,
                            "action": {"type": "allow"},
                            "condition": {
                                "urlFilter": "||" + domain + "^",
                                "resourceTypes": ["main_frame","sub_frame",]
                            }
                        });
                    });
                    if (id > 0) {
                        var ruleIDsCount = [];
                        for (var i = result.rules_count+1; i < id + 1; i++) {
                            ruleIDsCount.push(i);
                        }
                    }
                } else { console.log("dNr Error: Ruleset Limit overflow"); }
                console.log(protectionRulesArr);
                console.log(ruleIDsCount);
                if (protectionRulesArr.length > 0) {
                    chrome.declarativeNetRequest.updateDynamicRules({
                        addRules: protectionRulesArr,
                        removeRuleIds: ruleIDsCount,
                    });
                }
            } 
        });

        // Display all whitelisted domains in tabular format on frontend
        chrome.storage.local.get(['user_whitelist'], function (data) {
            if (data.user_whitelist != undefined && data.user_whitelist!=null) {
                if (data.user_whitelist.length != 0) {
                    var tds = "";
                    data.user_whitelist.forEach(website => {
                        tds += "<tr><td>" + website + "</td></tr>";
                    });
                    Display_whiteList_Domains.innerHTML = tds;
                }
            }
            else{
                var tds = "";
                whiteList_Memory.forEach(website => {
                    tds += "<tr><td>" + website + "</td></tr>";
                }); 
                Display_whiteList_Domains.innerHTML = tds;
            }
        });
        
        whiteList_domains_table.style.display = "block";
        Erase_Button.style.display = "block";
    }
    else{
        alert("Enter a valid domain value to add to whitelist!");
    }
}

function removeWhitelist(){
    // Disable the whitelisting for the domains
    chrome.storage.local.get(['rules_count','user_whitelist'], function (result) {
        if(result.user_whitelist.length!=0){
            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: Array.from({ length: result.user_whitelist.length}, (_, i) => i + result.rules_count + 1),
                addRules: result.user_whitelist.map((domain, index) => ({
                    id: index + result.rules_count + 1,
                    priority: 2,
                    action: { type: "redirect", redirect: { extensionPath: "/block.html" } },
                    condition: {
                        urlFilter: "||" + domain + "^",
                        resourceTypes: ["main_frame", "sub_frame"],
                    },
                })),
            },()=>{
                console.log(whiteList_Memory);
                // Reset whilelist array
                setTimeout(() => {
                    whiteList_Memory.length = 0;
                    chrome.storage.local.remove(["user_whitelist"]);
                    alert("Whitelist Removed!");
                }, 500);
                console.log(whiteList_Memory);
            });
        }
        else{
            alert("Add domains to whitelist before removing!");
        }
    });
    whiteList_domains_table.style.display = "none";
    Erase_Button.style.display = "none";
}

function restore_options() {
    chrome.storage.local.get(['user_whitelist'], function (data) {
        if(data.user_whitelist!=undefined){
            whiteList_domains_table.style.display = "block";
            Erase_Button.style.display = "block";

            var tds = "";
            data.user_whitelist.forEach(website => {
                tds += "<tr><td>" + website + "</td></tr>";
            });
            Display_whiteList_Domains.innerHTML = tds;
        }
        else{
            whiteList_domains_table.style.display = "none";
            Erase_Button.style.display = "none";
        }
    });
}
document.addEventListener('DOMContentLoaded', restore_options);

WhiteList_Button.addEventListener("click", addWhiteList);
Erase_Button.addEventListener("click", removeWhitelist);