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
        // Firefox does not expose i18n.detectLanguage consistently. Use it
        // when available, then fall back to common French/English words.
        const sourceLang = await detectFrenchOrEnglish(text, extensionApi);
        const targetLang = sourceLang === "en" ? "fr" : "en-US";

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
            alert("La traduction n’a pas abouti. Vérifiez votre connexion puis réessayez.");
        }
    } catch (error) {
        console.error("DeepL translation request failed:", error);
        alert("La traduction n’a pas abouti. Vérifiez votre connexion puis réessayez.");
    }
}

async function detectFrenchOrEnglish(text, extensionApi) {
    if (extensionApi.i18n?.detectLanguage) {
        try {
            const detection = await extensionApi.i18n.detectLanguage(text);
            const best = detection?.languages?.[0];
            const language = best?.language?.toLowerCase() || "";
            if ((language.startsWith("en") || language.startsWith("fr")) &&
                (best.percentage >= 50 || detection.isReliable)) {
                return language.startsWith("en") ? "en" : "fr";
            }
        } catch (error) {
            console.debug("Built-in language detection unavailable; using local detection.", error);
        }
    }

    const normalized = text.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const words = normalized.match(/[a-z]+/g) || [];
    const frenchWords = new Set("alors au aucun aussi avec ce ces dans de des du elle en et eux il je la le les leur lui ma mais me meme mes moi mon ne nos notre nous on ou par pas pour pourquoi quand que qui sa se ses son sur ta te tes toi ton tous tout tu un une vos votre vous c est sont comment pourquoi ou quand parce donc".split(" "));
    const englishWords = new Set("a about after again all am an and any are as at be because been before being between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why with you your yours yourself yourselves".split(" "));
    let frenchScore = /[àâçéèêëîïôùûüÿœ]/i.test(text) ? 2 : 0;
    let englishScore = 0;
    for (const word of words) {
        if (frenchWords.has(word)) frenchScore++;
        if (englishWords.has(word)) englishScore++;
    }

    if (englishScore > frenchScore) return "en";
    if (frenchScore > englishScore) return "fr";
    return navigator.language?.toLowerCase().startsWith("en") ? "en" : "fr";
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
