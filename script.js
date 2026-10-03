///////////////////////////////// Selecteurs internes a Qwant ////////////////////////////

// Le DOM de Qwant change régulièrement: ces sélecteurs sont regroupés ici
// pour réparer rapidement en cas de rupture.
const SEARCH_INPUT_SELECTOR = 'input[type="search"]';
const RESULT_SELECTOR = '[data-testid="SERVariant-A"]';
const SIDEBAR_TOGGLE_SELECTOR = 'nav[tabindex="-1"] a[role="button"][href]';
const extensionApi = globalThis.browser || globalThis.chrome;
const message = (key) => extensionApi.i18n.getMessage(key);
const browserLanguage = (extensionApi.i18n?.getUILanguage?.() || navigator.language || "").toLowerCase();
const deeplEnabledByDefault = browserLanguage.startsWith("fr") || browserLanguage.startsWith("en");

// Valeur de la barre de recherche Qwant, ou "" si elle est absente
// (ex. pages /account/).
function getSearchQuery() {
    const input = $(SEARCH_INPUT_SELECTOR);
    return input ? input.value : "";
}

// Cache des SVG chargés depuis les fichiers
const svgCache = new Map();

// Charge un SVG depuis un fichier et le met en cache
async function loadSVG(id) {
    if (svgCache.has(id)) {
        return svgCache.get(id);
    }

    const url = extensionApi.runtime.getURL(`svgs/${id}.svg`);
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load SVG: ${response.status}`);
        }
        const svgContent = await response.text();
        svgCache.set(id, svgContent);
        return svgContent;
    } catch (error) {
        console.error(`Erreur de chargement du SVG ${id}:`, error);
        // Retourner un SVG vide en cas d'erreur
        return '<svg xmlns="http://www.w3.org/2000/svg" height="1.8em" width="1.8em"></svg>';
    }
}

// Charge tous les SVG nécessaires
async function loadAllSVGs() {
    const svgIds = ['google', 'wiki', 'ytb', 'map', 'news', 'deepl', 'gpt'];
    const promises = svgIds.map(id => loadSVG(id));
    await Promise.all(promises);
}

async function initializeQwantEnhancer() {
    if (!$url.startsWith("https://www.qwant.com/")) return;
    if (document.querySelector(".qse-button-container")) return;

    // Charger tous les SVG avant de créer les boutons
    await loadAllSVGs();

    const buttonDefinitions = [
        { id: "google", label: "google", svg: svgCache.get('google'), onClick: searchOrOpen("https://www.google.com/search?client=qwant&q=", "https://www.google.com/"), home: "https://www.google.com/" },
        { id: "wikipedia", label: "wikipedia", svg: svgCache.get('wiki'), onClick: clickWikiHandler, home: () => "https://" + navigator.language.slice(0, 2) + ".wikipedia.org/" },
        { id: "youtube", label: "youtube", svg: svgCache.get('ytb'), onClick: searchOrOpen("https://www.youtube.com/results?search_query=", "https://www.youtube.com/"), home: "https://www.youtube.com/" },
        { id: "maps", label: "googleMaps", svg: svgCache.get('map'), onClick: searchOrOpen("https://www.google.com/maps/search/", "https://www.google.com/maps/"), home: "https://www.google.com/maps/" },
        { id: "news", label: "googleNews", svg: svgCache.get('news'), onClick: searchOrOpen("https://news.google.com/search?q=", "https://news.google.com/"), home: "https://news.google.com/" },
        { id: "deepl", label: "deepl", svg: svgCache.get('deepl'), onClick: clickTranslateHandler, home: "https://www.deepl.com/" },
        { id: "chatgpt", label: "chatgpt", svg: svgCache.get('gpt'), onClick: searchOrOpen("https://chatgpt.com/?q=", "https://chatgpt.com/"), home: "https://chatgpt.com/" }
    ];

    Promise.resolve()
        .then(() => extensionApi?.storage?.local?.get("enabledButtons"))
        .catch(() => ({}))
        .then(({ enabledButtons = {} } = {}) => {
        const container = $create("div");
        container.className = "qse-button-container";
        container.setAttribute("aria-label", message("searchShortcuts"));

        buttonDefinitions.forEach(({ id, label, svg, onClick, home }) => {
            if (id === "deepl" && enabledButtons[id] === undefined && !deeplEnabledByDefault) return;
            if (enabledButtons[id] === false) return;
            const button = createButton(svg);
            button.setAttribute("aria-label", message(label));
            button.title = message(label);
            button.onclick = onClick;
            button.addEventListener("mousedown", function (event) {
                if (event.button === 1) {
                    $openBlank(typeof home === "function" ? home() : home);
                }
            });
            container.appendChild(button);
        });

        // Qwant remplace parfois son contenu pendant le chargement. Garder le
        // conteneur sous documentElement et le rattacher au body dès qu'il existe.
        keepButtonsMounted(container);
    });

    addListeners();
}

function keepButtonsMounted(container) {
    let mountScheduled = false;
    let observedNav = null;
    let navResizeObserver = null;

    const scheduleMount = () => {
        if (mountScheduled) return;
        mountScheduled = true;
        window.requestAnimationFrame(() => {
            mountScheduled = false;
            mount();
        });
    };

    function mount() {
        if (!document.body) return;
        if (container.parentElement !== document.body) document.body.appendChild(container);
        const isAccountPage = window.location.pathname.startsWith("/account/");
        container.classList.toggle("qse-account-page", isAccountPage);
        const sidebarToggle = document.querySelector(SIDEBAR_TOGGLE_SELECTOR);
        const toggleHref = sidebarToggle?.getAttribute("href");
        const toggleUrl = toggleHref ? new URL(toggleHref, window.location.href) : null;
        // Qwant ajoute lateralBar=1 au lien qui ouvre la barre latérale.
        // Ce signal structurel fonctionne quelle que soit la langue de l'interface.
        const sidebarIsOpen = Boolean(toggleUrl && !toggleUrl.searchParams.has("lateralBar"));
        container.classList.toggle("qse-sidebar-open", sidebarIsOpen);
        const nav = document.querySelector("nav[tabindex='-1']") || document.querySelector("nav");
        if (nav) {
            const bounds = nav.getBoundingClientRect();
            container.style.setProperty("left", `${Math.max(0, bounds.left + bounds.width / 2 - 16)}px`);
            if (nav !== observedNav) {
                navResizeObserver?.disconnect();
                observedNav = nav;
                if (typeof ResizeObserver !== "undefined") {
                    navResizeObserver = new ResizeObserver(scheduleMount);
                    navResizeObserver.observe(nav);
                }
            }
        }
    }

    mount();

    // La page Qwant est une application dynamique: après une navigation ou un
    // rendu, elle peut remplacer le body et supprimer les éléments injectés.
    // Les mutations peuvent être très nombreuses: regrouper les appels à
    // mount() sur une seule image pour éviter les reflows en rafale.
    const observer = new MutationObserver(scheduleMount);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-label", "class", "href"]
    });
    window.addEventListener("resize", scheduleMount);
    // Qwant navigue sans recharger le document: suivre aussi les changements
    // d'URL qui ne déclenchent pas de mutation DOM.
    let previousPath = window.location.pathname;
    window.setInterval(() => {
        if (window.location.pathname !== previousPath) {
            previousPath = window.location.pathname;
            mount();
        }
    }, 300);
}

if ($url.startsWith("https://www.qwant.com/")) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeQwantEnhancer, { once: true });
    } else {
        initializeQwantEnhancer();
    }
}

///////////////////////////////// ClickHandlers ////////////////////////////////////////

// Ouvre la recherche sur le service avec la requête de la barre Qwant si elle
// contient du texte, sinon le site lui-même.
function searchOrOpen(searchUrl, defaultUrl) {
    return () => {
        const query = getSearchQuery();
        $open(query ? searchUrl + encodeURIComponent(query) : defaultUrl);
    };
}

function clickWikiHandler() {
    // get wiki version from browser language
    const wikiLang = navigator.language.slice(0, 2);
    const query = getSearchQuery();
    $open(query
        ? "https://" + wikiLang + ".wikipedia.org/w/index.php?sort=relevance&search=" + encodeURIComponent(query)
        : "https://" + wikiLang + ".wikipedia.org/");
}

async function clickTranslateHandler() {
    const text = getSearchQuery().trim();

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
            $alert(message("translationError"));
        }
    } catch (error) {
        console.error("DeepL translation request failed:", error);
        $alert(message("translationError"));
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

///////////////////////////////// Functions ////////////////////////////////////////////////

function createButton(svg) {
    const button = $create("a");
    button.className = "qse-button";

    const svgDocument = new DOMParser().parseFromString(svg, "image/svg+xml");
    if (svgDocument.documentElement.localName === "svg") {
        button.appendChild(document.importNode(svgDocument.documentElement, true));
    }

    return button;
}

///////////////////////////////// Listeners ////////////////////////////////////////////////

function addListeners() {
    let currentFocus = -1;

    const focusResult = (results, index) => {
        // Le 4e lien d'un résultat est le lien principal.
        const link = results[index]?.getElementsByTagName("a")[3];
        if (!link) return false;
        link.focus();
        link.scrollIntoView({ behavior: "smooth", block: "center" });
        return true;
    };

    document.addEventListener("keydown", (event) => {
        if (document.activeElement === $(SEARCH_INPUT_SELECTOR)) return;

        if (event.key === "/") {
            $(SEARCH_INPUT_SELECTOR)?.focus();
            event.preventDefault();
            return;
        }

        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();

        const results = $$(RESULT_SELECTOR);
        if (results.length === 0) return;

        // ArrowUp sur le premier résultat ne fait rien; ArrowDown/ArrowUp
        // depuis aucun résultat sélectionné ciblent le premier.
        const nextIndex = event.key === "ArrowDown"
            ? currentFocus + 1
            : (currentFocus < 0 ? 0 : currentFocus - 1);
        if (nextIndex < 0) return;

        if (focusResult(results, nextIndex)) currentFocus = nextIndex;
    });
}
