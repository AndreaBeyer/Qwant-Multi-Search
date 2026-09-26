window.onload = function () {

    //////////////////////////// Deepl Translate ///////////////////////////////////

    const deeplUrl = new URL($url);
    const isDeepLTranslator = deeplUrl.hostname === "www.deepl.com"
        && /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?translator\/?$/i.test(deeplUrl.pathname)
        && deeplUrl.hash.endsWith("/qw");

    if (isDeepLTranslator) {
        getTranslation();
    }

    else if ($url.startsWith("https://www.qwant.com/")) {

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

function clickTranslateHandler() {

    // if search box is not empty, we translate the input value
    if ($('input[type="search"]').value) {
        // we use the qw parameter to know we are coming from the brave search page and to redirect to it after the translation
        $open("https://www.deepl.com/translator?share=generic#fr/en-us/" + encodeURIComponent($('input[type="search"]').value) + "/qw");
    }
    // else we launch the deepl website
    else {
        $open("https://www.deepl.com");
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
    button.innerHTML = svg;

    return button;
}

function createIndicator(text) {
    var indicator = $create("span");
    indicator.textContent = text;
    indicator.className = "indicator";

    return indicator;
}

function getTranslation() {
    
    let containerPreTraduction =  $$("[role='textbox']")[0];
    let containerPostTraduction =  $$("[role='textbox']")[1];

    if (containerPreTraduction != null && containerPostTraduction != null) {

        let previous = "";
        let traduction = "";

        let previousP = containerPreTraduction.querySelectorAll("p");

        previousP.forEach(element => {
            previous += element.innerText + " ";
        });

        let traductionP = containerPostTraduction.querySelectorAll("p");

        traductionP.forEach(element => {
            traduction += element.innerText + " ";
        });


        previous = normalizeTranslationText(previous);
        traduction = normalizeTranslationText(traduction);

        if(!traduction.trim()) {
            setTimeout(function () {
                getTranslation();
            }, 100);
        }

        // DeepL may add a locale prefix (for example /fr/translator), so detect
        // the reverse pass from its language fragment instead of the page path.
        else if (traduction.toLocaleLowerCase() === previous.toLocaleLowerCase()
            && !new URL($url).hash.startsWith("#en/fr-fr/")) {
            $open("https://www.deepl.com/translator?share=generic#en/fr-fr/" + encodeURIComponent(traduction) + "/qw");
        }
        else {
           $open("https://www.qwant.com/?q=" + encodeURIComponent(traduction));
        }


    }
    else {
        setTimeout(function () {
            getTranslation();
        }, 100);
    }
}

function normalizeTranslationText(text) {
    return text.normalize("NFC").replace(/\s+/g, " ").trim();
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
