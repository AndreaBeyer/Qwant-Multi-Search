const extensionApi = globalThis.browser || globalThis.chrome;
const form = document.querySelector("#settings");
const status = document.querySelector("#status");
const buttonIds = Array.from(form.elements)
  .filter((element) => element.type === "checkbox")
  .map((element) => element.name);

const uiLanguage = extensionApi.i18n?.getUILanguage?.() || navigator.language || "en";
const normalizedUiLanguage = uiLanguage.toLowerCase();
const language = normalizedUiLanguage.startsWith("fr") ? "fr" : normalizedUiLanguage.startsWith("de") ? "de" : "en";
const deeplPairLabel = normalizedUiLanguage.startsWith("de") ? "🇩🇪 DeepL 🇬🇧" : "🇫🇷 DeepL 🇬🇧";
const deeplEnabledByDefault = normalizedUiLanguage.startsWith("fr") || normalizedUiLanguage.startsWith("en") || normalizedUiLanguage.startsWith("de");
// Mistral et Perplexity sont désactivés par défaut.
const disabledByDefault = ["mistral", "perplexity"];
const messages = {
  en: {
    optionsTitle: "Qwant Multi-Search — Options",
    settingsIntro: "Choose which buttons to show and drag them to change their order. Changes are saved automatically.",
    wikipedia: "Wikipedia", googleNews: "Google News",
    reloadHint: "Reload Qwant to apply your changes.",
    shortcutLabel: "shortcut",
    savedStatus: "Saved.", saveError: "Could not save your preferences."
  },
  fr: {
    optionsTitle: "Qwant Multi-Search — Options",
    settingsIntro: "Choisissez les boutons à afficher et faites-les glisser pour changer leur ordre. Les changements sont enregistrés automatiquement.",
    wikipedia: "Wikipédia", googleNews: "Google Actualités",
    reloadHint: "Rechargez Qwant pour appliquer les changements.",
    shortcutLabel: "raccourci",
    savedStatus: "Enregistré.", saveError: "Impossible d’enregistrer les préférences."
  },
  de: {
    optionsTitle: "Qwant Multi-Search — Einstellungen",
    settingsIntro: "Wähle die Schaltflächen aus und ziehe sie, um ihre Reihenfolge zu ändern. Änderungen werden automatisch gespeichert.",
    wikipedia: "Wikipedia", googleNews: "Google News",
    reloadHint: "Lade Qwant neu, um deine Änderungen anzuwenden.",
    shortcutLabel: "shortcut",
    savedStatus: "Gespeichert.", saveError: "Deine Einstellungen konnten nicht gespeichert werden."
  }
};
const message = (key) => key === "deepl" ? deeplPairLabel : messages[language][key] || messages.en[key] || key;

document.documentElement.lang = language;
document.querySelectorAll("[data-i18n]").forEach((element) => {
  element.textContent = message(element.dataset.i18n);
});
document.title = message("optionsTitle");

const isEnabledByDefault = (id) => {
  if (disabledByDefault.includes(id)) return false;
  return id !== "deepl" || deeplEnabledByDefault;
};

// Réordonne les lignes du formulaire selon un ordre enregistré: les labels
// sont déplacés dans le DOM avant le hint, dans l'ordre du tableau.
const getLabels = () => Array.from(form.querySelectorAll("label"));
const hint = form.querySelector(".hint");

// Numero du raccourci clavier (touches 1-9) ancre a droite de chaque case:
// il suit l'ordre courant et ne compte que les bouton actives, exactement
// comme les badges poses sur Qwant (script.js). Cases decochees ou au-dela
// du 9e bouton active: pas de numero, pas de raccourci.
const updateShortcutNumbers = () => {
  let position = 0;
  getLabels().forEach((label) => {
    const input = label.querySelector("input");
    const badge = label.querySelector(".shortcut-number");
    position += input.checked ? 1 : 0;
    badge.textContent = input.checked && position <= 9
      ? `${message("shortcutLabel")} ${position}` : "";
  });
};

getLabels().forEach((label) => {
  const badge = document.createElement("span");
  badge.className = "shortcut-number";
  badge.setAttribute("aria-hidden", "true");
  label.appendChild(badge);
});

const applyOrder = (order) => {
  if (!Array.isArray(order)) return;
  order.forEach((id) => {
    const input = form.elements.namedItem(id);
    const label = input && input.closest("label");
    if (label) form.insertBefore(label, hint);
  });
};

const saveButtonOrder = () => {
  const buttonOrder = getLabels().map((label) => label.querySelector("input").name);
  if (buttonOrder.join() === savedOrder.join()) return;
  savedOrder = buttonOrder;
  extensionApi.storage.local.set({ buttonOrder }).then(() => {
    status.textContent = message("savedStatus");
  }).catch(() => {
    status.textContent = message("saveError");
  });
};

let savedOrder = null;

extensionApi.storage.local.get(["enabledButtons", "buttonOrder"]).then(({ enabledButtons = {}, buttonOrder } = {}) => {
  buttonIds.forEach((id) => {
    form.elements.namedItem(id).checked = enabledButtons[id] === undefined ? isEnabledByDefault(id) : enabledButtons[id] !== false;
  });
  applyOrder(buttonOrder);
  savedOrder = getLabels().map((label) => label.querySelector("input").name);
  updateShortcutNumbers();
}).catch(() => {
  buttonIds.forEach((id) => { form.elements.namedItem(id).checked = isEnabledByDefault(id); });
  updateShortcutNumbers();
});

// Glisser-déposer d'une ligne pour réordonner les boutons. La ligne suit le
// pointeur pendant dragover; l'ordre n'est sauvegardé qu'à la fin du
// glissement, et seulement s'il a effectivement changé.
let draggedLabel = null;

getLabels().forEach((label) => {
  label.addEventListener("dragstart", (event) => {
    draggedLabel = label;
    label.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", label.querySelector("input").name);
  });
  label.addEventListener("dragend", () => {
    label.classList.remove("dragging");
    draggedLabel = null;
    saveButtonOrder();
    updateShortcutNumbers();
  });
  label.addEventListener("dragover", (event) => {
    if (!draggedLabel || draggedLabel === label) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const bounds = label.getBoundingClientRect();
    const after = event.clientY > bounds.top + bounds.height / 2;
    form.insertBefore(draggedLabel, after ? label.nextElementSibling : label);
    updateShortcutNumbers();
  });
});

form.addEventListener("change", () => {
  updateShortcutNumbers();
  const enabledButtons = Object.fromEntries(buttonIds.map((id) => [id, form.elements.namedItem(id).checked]));
  extensionApi.storage.local.set({ enabledButtons }).then(() => {
    status.textContent = message("savedStatus");
  }).catch(() => {
    status.textContent = message("saveError");
  });
});
