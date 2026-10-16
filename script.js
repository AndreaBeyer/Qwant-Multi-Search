///////////////////////////////// Selecteurs internes a Qwant ////////////////////////////

// Le DOM de Qwant change régulièrement: ces sélecteurs sont regroupés ici
// pour réparer rapidement en cas de rupture.
const SEARCH_INPUT_SELECTOR = 'input[type="search"]';
const RESULT_SELECTOR = '[data-testid="SERVariant-A"]';
// Cartes de la section "Vidéos" insérée parmi les résultats. Chaque carte
// porte un lien externe (le plus souvent YouTube) directement cliquable.
const VIDEO_CARD_SELECTOR = '[data-testid="videoCardResult"]';
// Section "Vidéos" insérée parmi les résultats: contient le titre, la
// pastille "Plus de vidéos" de son en-tête et le carrousel des cartes.
const VIDEO_SECTION_SELECTOR = '[data-testid="sectionVideos"]';
// Résultats de l'onglet Images: chaque image est une ancre interne de
// Qwant (paramètre o) qui ouvre la visionneuse via le routage de la
// page. Le data-testid est le repère stable.
const IMAGE_RESULT_SELECTOR = '[data-testid="imageResult"]';
// Barre d'actions de la visionneuse d'image ouverte: contient le lien
// "Voir le site" vers le site source de l'image.
const IMAGE_DRAWER_ACTIONS_SELECTOR = '[data-testid="imageDrawerActions"]';
// Liens "Plus de vidéos" vers l'onglet vidéos de la recherche: liens
// internes de Qwant (paramètre d'URL t=videos). Qwant rend plusieurs
// ancres avec cette URL: la pastille de l'en-tête de la section (celle
// que l'on voit, à côté du titre) et un bouton "Tout afficher" à la fin
// du carrousel (data-testid showAllVideosButton), décalé hors champ
// tant que le carrousel n'est pas défilé jusqu'au bout. Une recherche
// globale des liens t=videos attraperait aussi l'onglet "Vidéos" de la
// barre de navigation: les candidates sont bornées à la section (voir
// getVideoMoreLinks).
const VIDEO_MORE_SELECTOR = 'a[href*="t=videos"]';
const SHOW_MORE_SELECTOR = '[data-testid="buttonShowMore"]';
// Liens des cartes de sources de la Réponse Flash. Les classes du DOM de
// Qwant sont régénérées à chaque build; le paramètre utm_campaign=ai_flash
// ajouté par Qwant à ces liens est le repère stable.
const FLASH_LINK_SELECTOR = 'a[href*="utm_campaign=ai_flash"]';
// Slide du carrousel de la Réponse Flash: c'est lui qui contient la carte
// réellement affichée, les autres liens ai_flash de la page sont des
// renvois ou des gabarits non visibles.
const FLASH_SLIDE_SELECTOR = '[data-slide-index]';
// Bouton "Voir la réponse détaillée" de la Réponse Flash. Même logique que
// pour les autres éléments de Qwant: son data-click-label est plus stable
// que les classes régénérées à chaque build.
const DETAILED_ANSWER_SELECTOR = '[data-click-label="Llm_See_Detailed_Answer"]';
// Recherches associees "Pour aller plus loin", affichees sous les resultats:
// elles sont parcourues a la fin de la navigation.
const RELATED_SEARCH_SELECTOR = '[data-testid="relatedSearchLink"]';
const SIDEBAR_TOGGLE_SELECTOR = 'nav[tabindex="-1"] a[role="button"][href]';
const extensionApi = globalThis.browser || globalThis.chrome;
const browserLanguage = (extensionApi.i18n?.getUILanguage?.() || navigator.language || "").toLowerCase();
const messageLanguage = browserLanguage.startsWith("fr") ? "fr" : browserLanguage.startsWith("de") ? "de" : "en";
const deeplLabel = browserLanguage.startsWith("de") ? "🇩🇪 DeepL 🇬🇧" : "🇫🇷 DeepL 🇬🇧";
const messageCatalog = {
    en: {
        google: "Google", wikipedia: "Wikipedia", youtube: "YouTube",
        googleMaps: "Google Maps", googleNews: "Google News", chatgpt: "ChatGPT",
        mistral: "Mistral", perplexity: "Perplexity",
        openOptions: "Open options",
        searchShortcuts: "Search shortcuts",
        translationError: "Translation failed. Check your connection and try again."
    },
    fr: {
        google: "Google", wikipedia: "Wikipédia", youtube: "YouTube",
        googleMaps: "Google Maps", googleNews: "Google Actualités", chatgpt: "ChatGPT",
        mistral: "Mistral", perplexity: "Perplexity",
        openOptions: "Ouvrir les options",
        searchShortcuts: "Raccourcis de recherche",
        translationError: "La traduction n’a pas abouti. Vérifiez votre connexion puis réessayez."
    },
    de: {
        google: "Google", wikipedia: "Wikipedia", youtube: "YouTube",
        googleMaps: "Google Maps", googleNews: "Google News", chatgpt: "ChatGPT",
        mistral: "Mistral", perplexity: "Perplexity",
        openOptions: "Optionen öffnen",
        searchShortcuts: "Suchverknüpfungen",
        translationError: "Die Übersetzung ist fehlgeschlagen. Prüfe deine Verbindung und versuche es erneut."
    }
};
const message = (key) => key === "deepl" ? deeplLabel : messageCatalog[messageLanguage][key] || key;
const deeplEnabledByDefault = browserLanguage.startsWith("fr") || browserLanguage.startsWith("en") || browserLanguage.startsWith("de");

// Valeur de la barre de recherche Qwant, ou "" si elle est absente
// (ex. pages /account/).
function getSearchQuery() {
    const input = document.querySelector(SEARCH_INPUT_SELECTOR);
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
    const svgIds = ['google', 'wiki', 'ytb', 'map', 'news', 'deepl', 'gpt', 'mistral', 'perplexity'];
    const promises = svgIds.map(id => loadSVG(id));
    await Promise.all(promises);
}

async function initializeQwantEnhancer() {
    if (!window.location.href.startsWith("https://www.qwant.com/")) return;
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
        { id: "chatgpt", label: "chatgpt", svg: svgCache.get('gpt'), onClick: searchOrOpen("https://chatgpt.com/?q=", "https://chatgpt.com/"), home: "https://chatgpt.com/" },
        { id: "mistral", label: "mistral", svg: svgCache.get('mistral'), onClick: searchOrOpen("https://chat.mistral.ai/chat?q=", "https://chat.mistral.ai/"), home: "https://chat.mistral.ai/" },
        { id: "perplexity", label: "perplexity", svg: svgCache.get('perplexity'), onClick: searchOrOpen("https://www.perplexity.ai/search?q=", "https://www.perplexity.ai/"), home: "https://www.perplexity.ai/" }
    ];

    Promise.resolve()
        .then(() => extensionApi?.storage?.local?.get(["enabledButtons", "buttonOrder"]))
        .catch(() => ({}))
        .then(({ enabledButtons = {}, buttonOrder } = {}) => {
        const container = document.createElement("div");
        container.className = "qse-button-container";
        container.setAttribute("aria-label", message("searchShortcuts"));

        const isEnabledByDefault = (id) => {
            if (id === "deepl") return deeplEnabledByDefault;
            // Mistral et Perplexity sont désactivés par défaut.
            const disabledByDefault = new Set(["mistral", "perplexity"]);
            return !disabledByDefault.has(id);
        };

        // Ordre personnalisé défini dans les options (glisser-déposer). Les
        // identifiants absents de l'ordre enregistré gardent leur position
        // par défaut (Array.prototype.sort est stable).
        const orderIndex = new Map(
            (Array.isArray(buttonOrder) ? buttonOrder : []).map((id, index) => [id, index])
        );
        const orderedDefinitions = [...buttonDefinitions].sort((a, b) =>
            (orderIndex.get(a.id) ?? Infinity) - (orderIndex.get(b.id) ?? Infinity)
        );

        let position = 0;
        orderedDefinitions.forEach(({ id, label, svg, onClick, home }) => {
            if (enabledButtons[id] === undefined ? !isEnabledByDefault(id) : enabledButtons[id] === false) return;
            const button = createButton(svg);
            // Badge du raccourci clavier (Alt+1-9), affiche seulement
            // pendant l'appui sur Alt: la classe qse-alt-held est posee
            // dans addListeners, le style vit dans styles.css.
            if (position < 9) button.dataset.shortcut = position + 1;
            position++;
            button.setAttribute("aria-label", message(label));
            // Sur mobile, l'attribut title declenche un tooltip natif qui peut
            // avaler le premier tap. Il n'a d'utilite qu'avec un pointeur precis.
            if (window.matchMedia("(pointer: fine)").matches) button.title = message(label);
            attachTap(button, onClick);
            button.addEventListener("mousedown", function (event) {
                if (event.button === 1) {
                    window.open(typeof home === "function" ? home() : home, "_blank");
                }
            });
            container.appendChild(button);
        });

        // Bouton d'accès aux options: icone de l'extension fixee en bas a
        // droite (desktop uniquement, masquee par media query sur mobile).
        // runtime.openOptionsPage() n'existe pas dans un content script:
        // le clic passe par un message au background.
        const settingsButton = document.createElement("a");
        settingsButton.className = "qse-settings-button";
        settingsButton.setAttribute("aria-label", message("openOptions"));
        settingsButton.title = message("openOptions");
        const settingsIcon = document.createElement("img");
        settingsIcon.src = extensionApi.runtime.getURL("images/action48.png");
        settingsIcon.alt = "";
        settingsButton.appendChild(settingsIcon);
        settingsButton.addEventListener("click", () => {
            Promise.resolve(extensionApi.runtime.sendMessage({ action: "openOptions" })).catch((error) => {
                console.error("Could not request options page:", error);
            });
        });

        // Qwant remplace parfois son contenu pendant le chargement. Garder le
        // conteneur sous documentElement et le rattacher au body dès qu'il existe.
        keepButtonsMounted(container, settingsButton);
    });

    addListeners();
}

function keepButtonsMounted(container, settingsButton) {
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
        if (settingsButton.parentElement !== document.body) document.body.appendChild(settingsButton);
        const isAccountPage = window.location.pathname.startsWith("/account/");
        container.classList.toggle("qse-account-page", isAccountPage);
        const sidebarToggle = document.querySelector(SIDEBAR_TOGGLE_SELECTOR);
        const toggleHref = sidebarToggle?.getAttribute("href");
        const toggleUrl = toggleHref ? new URL(toggleHref, window.location.href) : null;
        // Qwant ajoute lateralBar=1 au lien qui ouvre la barre latérale.
        // Ce signal structurel fonctionne quelle que soit la langue de l'interface.
        const sidebarIsOpen = Boolean(toggleUrl && !toggleUrl.searchParams.has("lateralBar"));
        container.classList.toggle("qse-sidebar-open", sidebarIsOpen);
        // Mobile (voir media query dans styles.css): la barre occupe toute la
        // largeur en bas d'écran, le positionnement relatif à la nav n'a pas de sens.
        const isMobileLayout = window.matchMedia("(max-width: 760px)").matches;
        const nav = isMobileLayout ? null : document.querySelector("nav[tabindex='-1']") || document.querySelector("nav");
        if (isMobileLayout) {
            container.style.removeProperty("left");
        } else if (nav) {
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

if (window.location.href.startsWith("https://www.qwant.com/")) {
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
        window.location.href = query ? searchUrl + encodeURIComponent(query) : defaultUrl;
    };
}

function clickWikiHandler() {
    // get wiki version from browser language
    const wikiLang = navigator.language.slice(0, 2);
    const query = getSearchQuery();
    window.location.href = query
        ? "https://" + wikiLang + ".wikipedia.org/w/index.php?sort=relevance&search=" + encodeURIComponent(query)
        : "https://" + wikiLang + ".wikipedia.org/";
}

async function clickTranslateHandler() {
    const text = getSearchQuery().trim();

    // If the search box is empty, open DeepL normally.
    if (!text) {
        window.location.href = "https://www.deepl.com";
        return;
    }

    const extensionApi = globalThis.browser || globalThis.chrome;

    try {
        // Firefox does not expose i18n.detectLanguage consistently. Use it
        // when available, then fall back to common French/English words.
        const sourceLang = await detectGermanFrenchOrEnglish(text, extensionApi);
        const targetLang = browserLanguage.startsWith("de") ? "de" : "fr";

        const response = await extensionApi.runtime.sendMessage({
            action: "translateWithDeepL",
            text,
            sourceLang,
            targetLang
        });

        if (response && response.ok && response.translation) {
            window.location.href = "https://www.qwant.com/?q=" + encodeURIComponent(response.translation);
        } else {
            console.error("DeepL translation failed:", response?.error || "unknown error");
            alert(message("translationError"));
        }
    } catch (error) {
        console.error("DeepL translation request failed:", error);
        alert(message("translationError"));
    }
}

async function detectGermanFrenchOrEnglish(text, extensionApi) {
    if (extensionApi.i18n?.detectLanguage) {
        try {
            const detection = await extensionApi.i18n.detectLanguage(text);
            const best = detection?.languages?.[0];
            const language = best?.language?.toLowerCase() || "";
            if ((language.startsWith("en") || language.startsWith("fr") || language.startsWith("de")) &&
                (best.percentage >= 50 || detection.isReliable)) {
                if (language.startsWith("en")) return "en";
                if (language.startsWith("de")) return "de";
                return "fr";
            }
        } catch (error) {
            console.debug("Built-in language detection unavailable; using local detection.", error);
        }
    }
    const normalized = text.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ß/g, "ss");
    const words = normalized.match(/[a-z]+/g) || [];
    const frenchWords = new Set("alors au aucun aussi avec ce ces dans de des du elle en et eux il je la le les leur lui ma mais me meme mes moi mon ne nos notre nous on ou par pas pour pourquoi quand que qui sa se ses son sur ta te tes toi ton tous tout tu un une vos votre vous c est sont comment parce donc".split(" "));
    const englishWords = new Set("a about after again all am an and any are as at be because been before being between both but by can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why with you your yours yourself yourselves hello good morning".split(" "));
    const germanWords = new Set("aber alle als also am an andere auch auf aus bei bin bis bist da dabei dafür dagegen daher damals damit dann das dass dein deine dem den denn der des deshalb die diese dieser dieses doch dort du durch ein eine einem einen einer eines er es etwas für gegen gewesen gibt habe haben hat hier hin ich ihm ihn ihr ihre im immer in ins ist ja jede jeder jedes kann kein keine können könnte machen man mehr mein meine mit muss müssen nach nein nicht nichts noch nun ob oder sehr sein seine seit selbst sich sie sind so über um und uns unser unsere unter viel viele vom von vor war warum was weil welche wenn wer wie wir wo zu zum zur hallo guten morgen".split(" "));
    let frenchScore = /[àâçéèêëîïôùûüÿœ]/i.test(text) ? 2 : 0;
    let englishScore = 0;
    let germanScore = /[äöüß]/i.test(text) ? 2 : 0;
    for (const word of words) {
        if (frenchWords.has(word)) frenchScore++;
        if (englishWords.has(word)) englishScore++;
        if (germanWords.has(word)) germanScore++;
    }
    if (germanScore > frenchScore && germanScore > englishScore) return "de";
    if (englishScore > frenchScore && englishScore > germanScore) return "en";
    if (frenchScore > germanScore) return "fr";
    if (browserLanguage.startsWith("de")) return "de";
    return browserLanguage.startsWith("en") ? "en" : "fr";
}
///////////////////////////////// Functions ////////////////////////////////////////////////

function createButton(svg) {
    const button = document.createElement("a");
    button.className = "qse-button";

    const svgDocument = new DOMParser().parseFromString(svg, "image/svg+xml");
    if (svgDocument.documentElement.localName === "svg") {
        button.appendChild(document.importNode(svgDocument.documentElement, true));
    }

    return button;
}

// Sur mobile, le click d'un tap peut etre ave par le navigateur (tooltip du
// title, hover colle, preventDefault sur un touchstart de la page, zoom
// double-tap). On detecte le tap sur les Pointer Events, qui ne sont pas
// supprimes par preventDefault("touchstart"), et on garde le click classique
// en repli pour la souris, avec un garde-fou contre le double declenchement.
function attachTap(element, action) {
    let pointerStart = null;
    let lastTapAt = 0;

    element.addEventListener("pointerdown", (event) => {
        pointerStart = { x: event.clientX, y: event.clientY };
    });

    element.addEventListener("pointercancel", () => {
        pointerStart = null;
    });

    element.addEventListener("pointerup", (event) => {
        if (!pointerStart || event.pointerType === "mouse") return;
        const startX = pointerStart.x;
        const startY = pointerStart.y;
        pointerStart = null;
        if (event.button !== 0) return;
        // Un appui deplace de plus de 12px est un glisse (scroll), pas un tap.
        if (Math.hypot(event.clientX - startX, event.clientY - startY) > 12) return;
        lastTapAt = Date.now();
        action();
    });

    element.addEventListener("click", () => {
        if (Date.now() - lastTapAt < 600) return;
        action();
    });
}

///////////////////////////////// Listeners ////////////////////////////////////////////////

function addListeners() {
    let currentFocus = -1;
    let selectedContainer = null;
    let selectedLink = null;

    const isEditableElement = (element) =>
        Boolean(element?.closest?.("input, textarea, select, [contenteditable='true']"));

    const isVisible = (element) => element.getBoundingClientRect().height > 0;

    // Clique le bouton "Plus de résultats" de Qwant s'il est visible. Un
    // délai minimal évite de re-cliquer pendant le chargement de la page
    // de résultats suivante (le bouton peut rester affiché quelques instants).
    let lastShowMoreClickAt = 0;
    const clickShowMore = () => {
        const button = document.querySelector(SHOW_MORE_SELECTOR);
        if (!button || !isVisible(button)) return;
        if (Date.now() - lastShowMoreClickAt < 800) return;
        lastShowMoreClickAt = Date.now();
        button.click();
    };

    // Un lien de résultat pointe vers le site externe, pas vers Qwant.
    const isExternalLink = (link) => {
        try {
            return /^https?:\/\//.test(link.href) &&
                !new URL(link.href).hostname.endsWith("qwant.com");
        } catch (error) {
            return false;
        }
    };

    // Lien principal d'un résultat: le lien externe au texte le plus long
    // (l'ancre du titre). L'ordre des <a> dans le DOM de Qwant change d'un
    // build à l'autre, le "4e lien" historique n'est qu'un dernier repli.
    const findMainLink = (result) => {
        const links = Array.from(result.getElementsByTagName("a")).filter(isVisible);
        if (links.length === 0) return null;
        const external = links.filter(isExternalLink);
        if (external.length > 0) {
            return external.reduce((best, link) =>
                link.textContent.trim().length > best.textContent.trim().length ? link : best);
        }
        return links[Math.min(3, links.length - 1)];
    };

    // Cartes de sources de la Réponse Flash, affichée au-dessus des résultats.
    // Qwant rend aussi d'autres liens ai_flash avec la même URL que les
    // cartes (renvois de citation dans le texte de la réponse, gabarits non
    // affichés): à URL égale, on garde la carte du carrousel
    // ([data-slide-index]), l'élément réellement visible, plutôt que la
    // première occurrence du DOM. Les résultats organiques peuvent aussi
    // porter le paramètre ai_flash: ils sont déjà couverts par le parcours
    // des résultats et exclus ici.
    const getFlashLinks = () => {
        const all = Array.from(document.querySelectorAll(FLASH_LINK_SELECTOR))
            .filter((link) => !link.closest(RESULT_SELECTOR))
            .filter(isVisible);
        const byUrl = new Map();
        for (const link of all) {
            const current = byUrl.get(link.href);
            // Une carte de carrousel gagne contre un lien hors carrousel.
            if (!current ||
                (!current.closest(FLASH_SLIDE_SELECTOR) && link.closest(FLASH_SLIDE_SELECTOR))) {
                byUrl.set(link.href, link);
            }
        }
        const links = Array.from(byUrl.values());
        return links;
    };

    // Bouton "Voir la réponse détaillée" de la Réponse Flash.
    const getDetailedAnswerButton = () => {
        const button = document.querySelector(DETAILED_ANSWER_SELECTOR);
        return button && isVisible(button) ? button : null;
    };

    // Recherches associees "Pour aller plus loin": liens internes de Qwant
    // (vers une nouvelle recherche), parcourus apres les resultats.
    const getRelatedSearchLinks = () =>
        Array.from(document.querySelectorAll(RELATED_SEARCH_SELECTOR)).filter(isVisible);

    // Page du chat (onglet Chat IA): la navigation clavier des résultats
    // n'y a pas de sens, les flèches haut/bas doivent garder le
    // défilement natif de la conversation. L'URL de l'onglet chat porte
    // t=chat; en repli, l'onglet actif de la barre de catégories.
    const isChatPage = () => {
        try {
            if (new URL(window.location.href).searchParams.get("t") === "chat") return true;
        } catch (error) {
            // URL illisible: essayer la barre d'onglets.
        }
        return Boolean(document.querySelector('[data-testid="chatNavItem"][aria-current]'));
    };

    // Lien "Plus de vidéos" de la section vidéos. Qwant rend plusieurs
    // ancres avec la même URL: la pastille de l'en-tête de la section et
    // le bouton "Tout afficher" à la fin du carrousel. Le bouton du
    // carrousel est décalé hors champ par le défilement: sa hauteur
    // reste positive, le test isVisible ne suffit pas à l'écarter, on
    // filtre en plus sur la position réelle dans la fenêtre. À URL
    // égale, le premier candidat du DOM l'emporte: la pastille de
    // l'en-tête, celle que l'on voit.
    const getVideoMoreLinks = () => {
        const isOnScreen = (element) => {
            const bounds = element.getBoundingClientRect();
            return bounds.left < window.innerWidth && bounds.right > 0;
        };
        const isValid = (link) => {
            if (!isVisible(link) || link.closest(RESULT_SELECTOR) || link.closest(VIDEO_CARD_SELECTOR)) return false;
            // Jamais dans l'en-tête ni la navigation de la page.
            if (link.closest("header, nav")) return false;
            try {
                const url = new URL(link.href);
                if (!url.hostname.endsWith("qwant.com") || url.searchParams.get("t") !== "videos") return false;
            } catch (error) {
                return false;
            }
            return true;
        };
        // Candidats bornés à la section vidéos (repli si son data-testid
        // change: les ancêtres des cartes sans passer par body, sinon
        // l'onglet "Vidéos" de la barre de navigation serait attrapé).
        let candidates = [];
        const sections = Array.from(document.querySelectorAll(VIDEO_SECTION_SELECTOR))
            .filter((section) => section.querySelector(VIDEO_CARD_SELECTOR));
        if (sections.length > 0) {
            for (const section of sections) {
                for (const link of section.querySelectorAll(VIDEO_MORE_SELECTOR)) {
                    if (isValid(link)) candidates.push(link);
                }
            }
        } else {
            const found = new Set();
            for (const card of document.querySelectorAll(VIDEO_CARD_SELECTOR)) {
                for (let scope = card.parentElement; scope && scope !== document.body; scope = scope.parentElement) {
                    for (const link of scope.querySelectorAll(VIDEO_MORE_SELECTOR)) {
                        if (isValid(link)) found.add(link);
                    }
                }
            }
            candidates = Array.from(found);
        }
        const onScreen = candidates.filter(isOnScreen);
        const kept = onScreen.length > 0 ? onScreen : candidates;
        const byUrl = new Map();
        for (const link of kept) {
            if (!byUrl.has(link.href)) byUrl.set(link.href, link);
        }
        return Array.from(byUrl.values());
    };

    // Lien "Voir le site" de la visionneuse d'image: le premier lien
    // externe de sa barre d'actions (le bouton Partager et l'ouverture
    // plein écran de l'image sont respectivement un bouton et un lien
    // d'image, pas un lien vers le site source).
    const getImageDrawerSiteLink = () => {
        const actions = document.querySelector(IMAGE_DRAWER_ACTIONS_SELECTOR);
        if (!actions) return null;
        const link = Array.from(actions.getElementsByTagName("a")).find(isExternalLink);
        return link && isVisible(link) ? link : null;
    };

    const getResultLinks = () => {
        const detailedAnswerButton = getDetailedAnswerButton();
        const flashLinks = getFlashLinks();
        const videoMoreLinksList = getVideoMoreLinks();
        // Les cartes vidéos sont insérées parmi les résultats (carrousel
        // de la section "Vidéos"): on fusionne résultats et cartes dans
        // l'ordre du DOM pour que la navigation suive l'ordre réel de la
        // page. Une carte vidéo imbriquée dans un résultat est déjà
        // couverte par ce résultat.
        const sorted = Array.from(document.querySelectorAll(RESULT_SELECTOR))
            .map((container) => ({ element: container, link: findMainLink(container) }))
            .concat(Array.from(document.querySelectorAll(VIDEO_CARD_SELECTOR))
                .filter((card) => !card.closest(RESULT_SELECTOR))
                .map((card) => ({ element: card, link: findMainLink(card) })))
            // Résultats d'images (onglet Images): l'ancre est le lien,
            // pas de conteneur à parcourir.
            .concat(Array.from(document.querySelectorAll(IMAGE_RESULT_SELECTOR))
                .filter((link) => !link.closest(RESULT_SELECTOR))
                .filter(isVisible)
                .map((link) => ({ element: link, link })))
            .filter((item) => item.link && isVisible(item.element))
            .sort((a, b) =>
                a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
        // La pastille "Plus de vidéos" vit dans l'en-tête de la section,
        // avant le carrousel dans le DOM, mais se parcourt APRÈS les
        // vidéos: l'insérer juste après la dernière carte vidéo. Sans
        // carte vidéo, elle reste à la fin de la liste.
        let lastCardIndex = -1;
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].element.matches(VIDEO_CARD_SELECTOR)) lastCardIndex = i;
        }
        const moreEntries = videoMoreLinksList.map((link) => ({ element: link, link }));
        const navigable = lastCardIndex >= 0
            ? sorted.slice(0, lastCardIndex + 1).concat(moreEntries, sorted.slice(lastCardIndex + 1))
            : sorted.concat(moreEntries);
        const links = navigable.map((item) => item.link);
        // Repli si le data-testid de Qwant change: tous les liens externes
        // visibles de la page. Les liens flash sont exclus de ce repli
        // pour éviter les doublons, ils sont déjà dans la liste.
        const resultLinks = links.length > 0 ? links : Array.from(document.getElementsByTagName("a"))
            .filter(isVisible)
            .filter(isExternalLink)
            .filter((link) => !link.matches(FLASH_LINK_SELECTOR));
        // Ordre de navigation: cartes de la Réponse Flash, puis le bouton
        // "Voir la réponse détaillée" juste après, puis les résultats,
        // cartes vidéos et résultats d'images (à leur place dans la
        // page), et enfin les recherches associées "Pour aller plus
        // loin". Un appui supplémentaire au-delà de la dernière
        // déclenche "Plus de résultats".
        // Visionneuse d'image ouverte: son lien "Voir le site" se parcourt
        // en tête, la visionneuse recouvre la page.
        const imageDrawerSiteLink = getImageDrawerSiteLink();
        const items = imageDrawerSiteLink ? [imageDrawerSiteLink] : [];
        items.push(...flashLinks);
        if (detailedAnswerButton) items.push(detailedAnswerButton);
        return items.concat(resultLinks, getRelatedSearchLinks());
    };

    // Lien hors résultat (carte flash ou bouton détaillé) portant le
    // liseré interne actuel.
    let selectedFlashLink = null;

    const selectResult = (links, index) => {
        const link = links[index];
        if (!link) return false;
        selectedContainer?.classList.remove("qse-selected");
        selectedFlashLink?.classList.remove("qse-flash-selected");
        selectedFlashLink = null;
        selectedContainer = link.closest(RESULT_SELECTOR);
        if (selectedContainer) {
            selectedContainer.classList.add("qse-selected");
        } else {
            // Carte de la Réponse Flash, carte vidéo du carrousel ou
            // bouton "Voir la réponse détaillée": liseré posé
            // directement sur le lien (la carte visible), en surcouche
            // ::after bornée à l'élément (voir .qse-flash-selected dans
            // styles.css) pour échapper au overflow:hidden du carrousel
            // de Qwant.
            selectedFlashLink = link;
            link.classList.add("qse-flash-selected");
        }
        // Pas de link.focus(): le navigateur dessinerait un cadre de focus
        // autour du titre en plus du liseré du conteneur. La touche Entrée
        // est gérée dans le listener keydown.
        selectedLink = link;
        link.scrollIntoView({ behavior: "smooth", block: "center" });
        return true;
    };

    // Abandonne la navigation clavier: retire le liseré et oublie le lien
    // selectionne, pour qu'Entree ne l'ouvre plus.
    const clearSelection = () => {
        selectedContainer?.classList.remove("qse-selected");
        selectedContainer = null;
        selectedFlashLink?.classList.remove("qse-flash-selected");
        selectedFlashLink = null;
        selectedLink = null;
        currentFocus = -1;
    };

    // Après l'ouverture de la visionneuse d'image, la sélection passe à
    // son lien "Voir le site": Entrée à nouveau ouvre le site source.
    // Le rendu de la visionneuse peut prendre quelques images:
    // réessayer jusqu'à ce que le lien apparaisse.
    const focusImageDrawerSiteLink = () => {
        let attempts = 0;
        const trySelect = () => {
            const link = getImageDrawerSiteLink();
            if (link) {
                const links = getResultLinks();
                const index = links.indexOf(link);
                if (index >= 0) selectResult(links, index);
                return;
            }
            if (++attempts < 30) window.requestAnimationFrame(trySelect);
        };
        trySelect();
    };

    // Entrer dans la barre de recherche abandonne la navigation clavier:
    // sinon, Entree dans la searchbox peut ouvrir le lien selectionne au
    // lieu de lancer la recherche (en particulier si Qwant re-render la
    // page pendant la saisie et rend le focus au body). L'evenement
    // "input" couvre aussi une saisie demarree sans focus detectable.
    document.addEventListener("focusin", (event) => {
        if (event.target?.matches?.(SEARCH_INPUT_SELECTOR)) clearSelection();
    });
    document.addEventListener("input", (event) => {
        if (event.target?.matches?.(SEARCH_INPUT_SELECTOR)) clearSelection();
    });

    document.addEventListener("keydown", (event) => {
        // Appui sur Alt: afficher les badges de raccourci (Alt+1-9). La
        // classe est retiree au relachement (keyup) et au blur de la
        // fenetre pour eviter un badge reste apres un Alt+Tab.
        if (event.key === "Alt") {
            document.querySelector(".qse-button-container")?.classList.add("qse-alt-held");
        }

        // Alt + 1-9: declenche le bouton correspondant, y compris pendant
        // la saisie dans la searchbox (avant la garde des champs editables).
        // Touche physique (event.code): en AZERTY, la rangee "&", "é"...
        // sans Shift ou le pavé numérique (NumLock requis). AltGr (Ctrl+Alt
        // sous Windows) est ignore pour ne pas voler les caracteres speciaux,
        // et Meta aussi (Cmd+N change d'onglet sous macOS).
        const digitMatch = /^(?:Digit|Numpad)([1-9])$/.exec(event.code);
        if (digitMatch && event.altKey && !event.ctrlKey && !event.metaKey &&
            (event.code.startsWith("Digit") || (event.getModifierState?.("NumLock") ?? true))) {
            const buttons = document.querySelectorAll(".qse-button-container .qse-button");
            const button = buttons[Number(digitMatch[1]) - 1];
            if (button) {
                event.preventDefault();
                button.click();
            }
            return;
        }

        // Echap quitte la searchbox et rend le focus a la page. Placé avant
        // la garde des champs editables, sinon la touche serait ignoree
        // pendant la saisie.
        if (event.key === "Escape" && document.activeElement?.matches?.(SEARCH_INPUT_SELECTOR)) {
            document.activeElement.blur();
            event.preventDefault();
            return;
        }

        if (isEditableElement(document.activeElement)) return;

        if (event.key === "/") {
            const input = document.querySelector(SEARCH_INPUT_SELECTOR);
            if (input) {
                input.focus();
                // Apres un focus programmatique, le navigateur restaure la
                // derniere position du curseur, parfois au debut du texte:
                // placer le curseur a la fin pour continuer la saisie.
                const end = input.value.length;
                input.setSelectionRange(end, end);
            }
            event.preventDefault();
            return;
        }

        // Entrée ouvre le résultat sélectionné (Ctrl/Cmd+Entrée: nouvel
        // onglet). Le bouton "Voir la réponse détaillée" n'est pas un lien:
        // Entrée le déclenche comme un clic. Seulement si aucun élément
        // interactif n'a le focus, pour ne pas voler les Entrée destinées
        // à la page. Qwant rend le conteneur de la visionneuse d'image
        // focusable (tabindex="-1") et peut lui donner le focus: un
        // élément non interactif focusable ne traite pas Entrée, on ne
        // teste que la nature interactive de l'élément actif.
        const activeElementIsInteractive = (element) =>
            Boolean(element?.closest?.("a, button, input, textarea, select, [role='button']"));
        if (event.key === "Enter" && selectedLink && !activeElementIsInteractive(document.activeElement)) {
            event.preventDefault();
            if (!selectedLink.href) {
                selectedLink.click();
            } else if (selectedLink.matches(IMAGE_RESULT_SELECTOR)) {
                // Résultat d'image: la visionneuse s'ouvre par le routage
                // interne de Qwant, un clic plutôt qu'une navigation, puis
                // la sélection passe à son lien "Voir le site".
                selectedLink.click();
                focusImageDrawerSiteLink();
            } else if (event.ctrlKey || event.metaKey) {
                window.open(selectedLink.href, "_blank");
            } else {
                window.location.href = selectedLink.href;
            }
            return;
        }

        // Escape quitte la navigation clavier et rend le focus à la page.
        if (event.key === "Escape" && currentFocus >= 0) {
            clearSelection();
            return;
        }

        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

        // Onglet Chat IA: pas de navigation clavier des résultats, les
        // flèches gardent le défilement natif de la conversation.
        if (isChatPage()) return;

        const links = getResultLinks();
        // Pas de preventDefault tant que la navigation ne sélectionnera
        // rien: le défilement natif de la page doit continuer de
        // fonctionner quand il n'y a rien à parcourir.
        if (links.length === 0) return;
        event.preventDefault();

        // ArrowUp sur le premier résultat ne fait rien; ArrowDown/ArrowUp
        // depuis aucun résultat sélectionné ciblent le premier.
        const nextIndex = event.key === "ArrowDown"
            ? currentFocus + 1
            : (currentFocus < 0 ? 0 : currentFocus - 1);
        if (nextIndex < 0) return;

        // ArrowDown depuis le dernier résultat: déclencher le bouton
        // "Plus de résultats" de Qwant. Les nouveaux résultats arrivent
        // en fin de liste, l'appui suivant sur ArrowDown sélectionnera
        // le premier d'entre eux.
        if (nextIndex >= links.length) {
            if (event.key === "ArrowDown") clickShowMore();
            return;
        }

        if (selectResult(links, nextIndex)) currentFocus = nextIndex;
    });

    document.addEventListener("keyup", (event) => {
        if (event.key === "Alt") {
            document.querySelector(".qse-button-container")?.classList.remove("qse-alt-held");
        }
    });
    window.addEventListener("blur", () => {
        document.querySelector(".qse-button-container")?.classList.remove("qse-alt-held");
    });
}
