console.log("namaste");
chrome.storage.sync.get(["firstTime"]).then((result) => {
    // console.log("Value currently is " + (result.firstTime === undefined)); // REMOVE IN PRODUCTION
    if (result.firstTime === undefined || result.firstTime === true) {
        chrome.storage.sync.set({ firstTime: false }).then(() => {
            // console.log("Value is set to false"); // REMOVE IN PRODUCTION
        });
        //loop through initialSettings and save them to chrome.storage.sync
        chrome.storage.sync.set({ settings: initialSettings }).then(() => {
            // console.log("Initial settings set"); // REMOVE IN PRODUCTION
        });
        updateSettings();
        location.href = "/index.html#settings"
    } else {
        updateSettings();
    }
});


let initialSettings = {
    "font": "sans",
    "fontSize": 16,
    "verse": true,
    "meaning": true,
    "verseNumber": true,
    "textColor": "black",
    "language": "iast"
}

function saveSettings (key, value) {
    initialSettings[key] = value;
    chrome.storage.sync.set({ settings: initialSettings }).then(() => {
        // console.log(`SETTINGS SET ${key}: ${value}`); // REMOVE IN PRODUCTION
    });
    return;
}

const getSettings = async () => {
    let payload;
    await chrome.storage.sync.get(["settings"]).then((result) => {
        payload = result.settings;
    });
    return await new Promise((resolve) => setTimeout(() => resolve(payload)))
}

const getRandomVerse = async () => {
    let translation = await fetch('https://raw.githubusercontent.com/SameeraMurthy/gita/main/translation.json');
    let verse = await fetch('https://raw.githubusercontent.com/SameeraMurthy/gita/main/verse.json');

    let random = Math.floor(Math.random() * 700);

    let tdata = (await translation.json()).filter(item => (item.authorName === "Swami Gambirananda" && item.lang === "english"))[random].description;
    let vdata = (await verse.json())[random];

    let ver;
    await getSettings().then((result) => {
        if (result.language != "devanagari") {
            ver = Sanscript.t(vdata.text.replace(/\r?\n|\r/g, " "), "devanagari", result.language);
        }
    })

    return await new Promise((resolve) => setTimeout(() => resolve([tdata, ver ?? vdata.text])))
}

// Add event listeners for settings elements with ids starting with "settings-" and have values for each of the settings using jquery
function updateSettings() {
    getSettings().then((settings) => {
        $('[id^="settings-"]').each(function () {
            let id = $(this).attr("id").split("-")[1];
            if ($(this).attr("type") == "checkbox") {
                $(this).prop("checked", settings[id]);
            } else {
                $(this).val(settings[id]);
            }
        });  
    });  
}

$('[id^="settings-"]').change(function () {
    let id = $(this).attr("id").split("-")[1];
    if ($(this).attr("type") == "checkbox") {
        saveSettings(id, $(this).prop("checked"));
    } else {
        saveSettings(id, $(this).val());
    }
});

getSettings().then((result) => {
    initialSettings = result;
});

$("#close, #overlay").click(() => {
    location.href = "#";
    location.reload();
});

getRandomVerse().then((result) => {
    if (!initialSettings.verse) {
        $("#verse #verse-text").hide();
    }
    if (!initialSettings.meaning) {
        $("#verse #verse-meaning").hide();
    }
    if (!initialSettings.verseNumber) {
        $("#verse #verse-number").hide();
    }
    let number = /(\।|\|)(\।|\|)(\d*\.\d*)(\।|\|)(\।|\|)/g;
    $("#verse #verse-text").text(result[1].replaceAll(number, "").replaceAll("|", " "))
    let verseNumber = result[1].match(number)[0].replace(/(\।|\|)(\।|\|)/g, "");
    $("#verse #verse-meaning").text(result[0]);
    $("#verse #verse-number").text(verseNumber);
})

$("body").css("background-image", `url("../../assets/png${Math.floor(Math.random() * 3)}.jpg")`);