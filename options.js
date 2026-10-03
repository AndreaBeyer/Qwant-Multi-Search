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
const messages = {
  en: {
    optionsTitle: "Qwant Multi-Search — Options",
    settingsIntro: "Choose which buttons to show. Changes are saved automatically.",
    wikipedia: "Wikipedia", googleNews: "Google News",
    reloadHint: "Reload Qwant to apply your changes.",
    savedStatus: "Saved.", saveError: "Could not save your preferences."
  },
  fr: {
    optionsTitle: "Qwant Multi-Search — Options",
    settingsIntro: "Choisissez les boutons à afficher. Les changements sont enregistrés automatiquement.",
    wikipedia: "Wikipédia", googleNews: "Google Actualités",
    reloadHint: "Rechargez Qwant pour appliquer les changements.",
    savedStatus: "Enregistré.", saveError: "Impossible d’enregistrer les préférences."
  },
  de: {
    optionsTitle: "Qwant Multi-Search — Einstellungen",
    settingsIntro: "Wähle die Schaltflächen aus, die angezeigt werden sollen. Änderungen werden automatisch gespeichert.",
    wikipedia: "Wikipedia", googleNews: "Google News",
    reloadHint: "Lade Qwant neu, um deine Änderungen anzuwenden.",
    savedStatus: "Gespeichert.", saveError: "Deine Einstellungen konnten nicht gespeichert werden."
  }
};
const message = (key) => key === "deepl" ? deeplPairLabel : messages[language][key] || messages.en[key] || key;

document.documentElement.lang = language;
document.querySelectorAll("[data-i18n]").forEach((element) => {
  element.textContent = message(element.dataset.i18n);
});
document.title = message("optionsTitle");

extensionApi.storage.local.get("enabledButtons").then(({ enabledButtons = {} } = {}) => {
  buttonIds.forEach((id) => {
    const defaultEnabled = id !== "deepl" || deeplEnabledByDefault;
    form.elements.namedItem(id).checked = enabledButtons[id] === undefined ? defaultEnabled : enabledButtons[id] !== false;
  });
}).catch(() => {
  buttonIds.forEach((id) => { form.elements.namedItem(id).checked = id !== "deepl" || deeplEnabledByDefault; });
});

form.addEventListener("change", () => {
  const enabledButtons = Object.fromEntries(buttonIds.map((id) => [id, form.elements.namedItem(id).checked]));
  extensionApi.storage.local.set({ enabledButtons }).then(() => {
    status.textContent = message("savedStatus");
  }).catch(() => {
    status.textContent = message("saveError");
  });
});
