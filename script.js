window.onload = function () {

    if ($url.startsWith("https://www.qwant.com/")) {

        //////////////////////////// Creating buttons //////////////////////////////////

        const buttonDefinitions = [
            { id: "google", svg: googleSVG, onClick: clickGoogleHandler, home: "https://www.google.com/" },
            { id: "wikipedia", svg: wikiSVG, onClick: clickWikiHandler, home: () => "https://" + navigator.language.slice(0, 2) + ".wikipedia.org/" },
            { id: "youtube", svg: ytbSVG, onClick: clickYtbHandler, home: "https://www.youtube.com/" },
            { id: "maps", svg: mapSVG, onClick: clickMapHandler, home: "https://www.google.com/maps/" },
            { id: "news", svg: newsSVG, onClick: clickNewsHandler, home: "https://news.google.com/" },
            { id: "deepl", svg: deeplSVG, onClick: clickTranslateHandler, home: "https://www.deepl.com/" },
            { id: "chatgpt", svg: gptSVG, onClick: clickGptSiteHandler, home: "https://chat.openai.com/" }
        ];

        const extensionApi = globalThis.browser || globalThis.chrome;
        const preferences = extensionApi && extensionApi.storage
            ? extensionApi.storage.local.get("enabledButtons").catch(() => ({}))
            : Promise.resolve({});

        preferences.then(({ enabledButtons = {} } = {}) => {
            const container = $create("div");
            container.className = "button_container";

            buttonDefinitions.forEach(({ id, svg, onClick, home }) => {
                // Missing preferences keep the original behavior: every button is enabled.
                if (enabledButtons[id] === false) return;

                const button = createButton(svg);
                button.onclick = onClick;
                button.addEventListener('mousedown', function (e) {
                    if (e.button === 1) {
                        $openBlank(typeof home === "function" ? home() : home);
                    }
                });
                container.appendChild(button);
            });

            // Keep the original column in place, including when every button is disabled.
            $("nav").appendChild(container);
        });

        addListeners();
    }
}

///////////////////////////////// ClickHandlers ////////////////////////////////////////

function clickHandler(default_search_url, search_url) {

    // if search box is not empty, we search for the input value
    if ($('input[type="search"]').value) {
        $open(search_url + encodeURIComponent($('input[type="search"]').value));
    }
    // else we launch a default url
    else {
        $open(default_search_url);
    }
}

function clickGoogleHandler() {
    // if search box is not empty, we search for the input value
    if ($('input[type="search"]').value) {
        $open("https://www.google.com/search?client=qwant&q=" + encodeURIComponent($('input[type="search"]').value));
    }
    // else we launch a default url
    else {
        $open("https://www.google.com/");
    }
}

function clickWikiHandler() {
    // get wiki version from browser language
    const wiki_version = navigator.language.slice(0, 2);
    // if search box is not empty, we search for the input value
    if ($('input[type="search"]').value) {
        $open("https://" + wiki_version + ".wikipedia.org/w/index.php?sort=relevance&search=" + encodeURIComponent($('input[type="search"]').value));
    }
    // else we launch a default url
    else {
        $open("https://" + wiki_version + ".wikipedia.org/");
    }

}

function clickYtbHandler() {
    clickHandler("https://www.youtube.com/", "https://www.youtube.com/results?search_query=");
}

function clickMapHandler() {
    clickHandler("https://www.google.com/maps/", "https://www.google.com/maps/search/");
}

function clickNewsHandler() {
    clickHandler("https://news.google.com/", "https://news.google.com/search?q=");
}

function clickGptSiteHandler() {
    clickHandler("https://chat.openai.com/", "https://chat.openai.com/?q=");
}

async function clickTranslateHandler() {

    const input = $('input[type="search"]');
    const text = input && input.value.trim();

    // If the search box is empty, open DeepL normally.
    if (!text) {
        $open("https://www.deepl.com");
        return;
    }

    const extensionApi = globalThis.browser || globalThis.chrome;

    try {
        // Detect the language locally with the browser's Compact Language Detector.
        // We only need to distinguish French and English for the DeepL button.
        let sourceLang = "fr";
        let targetLang = "en-US";

        if (extensionApi.i18n?.detectLanguage) {
            const detection = await extensionApi.i18n.detectLanguage(text);
            const detected = detection?.languages?.[0]?.language?.toLowerCase() || "";

            if (detected.startsWith("en")) {
                sourceLang = "en";
                targetLang = "fr";
            } else if (detected.startsWith("fr")) {
                sourceLang = "fr";
                targetLang = "en-US";
            }
        }

        const response = await extensionApi.runtime.sendMessage({
            action: "translateWithDeepL",
            text,
            sourceLang,
            targetLang
        });

        if (response && response.ok && response.translation) {
            $open("https://www.qwant.com/?q=" + encodeURIComponent(response.translation));
        } else {
            console.error("DeepL translation failed:", response?.error || "unknown error");
        }
    } catch (error) {
        console.error("DeepL translation request failed:", error);
    }
}
function clickImageHandler() {
    if ($('input[type="search"]').value) {
        $open("https://search.brave.com/images?q=" + encodeURIComponent($('input[type="search"]').value) + "+%21gi&source=web");
    }
    else {
        $open("https://www.google.com");
    }
}


///////////////////////////////// Functions ////////////////////////////////////////////////

function createButton(svg) {
    const button = $create("a");
    button.className = "button";

    const svgDocument = new DOMParser().parseFromString(svg, "image/svg+xml");
    if (svgDocument.documentElement.localName === "svg") {
        button.appendChild(document.importNode(svgDocument.documentElement, true));
    }

    return button;
}

function createIndicator(text) {
    var indicator = $create("span");
    indicator.textContent = text;
    indicator.className = "indicator";

    return indicator;
}

///////////////////////////////// Listeners ////////////////////////////////////////////////

function addListeners() {

    var currentFocus = -1;

    document.addEventListener('keydown', function (e) {

        if (document.activeElement == $('input[type="search"]')) {
            return;
        }

        if (e.key === '/') {
            $('input[type="search"]').focus();
            e.preventDefault();
        }

        // AROWN DOWN
        else if (e.key === 'ArrowDown') {

            if (document.activeElement == $('input[type="search"]')) {
                return;
            }

            e.preventDefault();
            // if the first result is not focused, we focus it
            // else we focus the next result
            if (currentFocus < 0) {
                let result = $$('[data-testid="SERVariant-A"]')[0];
                if (result) {
                    let link = result.getElementsByTagName('a')[3];
                    currentFocus = 0;
                    link.focus();
                    link.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }

            else {
                let result = $$('[data-testid="SERVariant-A"]')[currentFocus + 1];
                if (result) {
                    let link = result.getElementsByTagName('a')[3];
                    currentFocus = currentFocus + 1;
                    link.focus();
                    link.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    });

    // AROWN UP
    document.addEventListener('keydown', function (e) {

        if (document.activeElement == $('input[type="search"]')) {
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();

            if (currentFocus < 0) {
                let result = $$('[data-testid="SERVariant-A"]')[0];
                if (result) {
                    let link = result.getElementsByTagName('a')[3];
                    currentFocus = 0;
                    link.focus();
                    link.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
            else {
                let result = $$('[data-testid="SERVariant-A"]')[currentFocus - 1];
                if (result) {
                    let link = result.getElementsByTagName('a')[3];
                    currentFocus = currentFocus - 1;
                    link.focus();
                    link.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }

        }
    });
}
