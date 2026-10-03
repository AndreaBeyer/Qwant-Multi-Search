const extensionApi = globalThis.browser || globalThis.chrome;
const form = document.querySelector("#settings");
const status = document.querySelector("#status");
const buttonIds = Array.from(form.elements)
  .filter((element) => element.type === "checkbox")
  .map((element) => element.name);

const uiLanguage = extensionApi.i18n?.getUILanguage?.() || navigator.language || "en";
const normalizedUiLanguage = uiLanguage.toLowerCase();
const language = normalizedUiLanguage.startsWith("fr") ? "fr" : "en";
const deeplEnabledByDefault = normalizedUiLanguage.startsWith("fr") || normalizedUiLanguage.startsWith("en");
document.documentElement.lang = language;
document.querySelectorAll("[data-i18n]").forEach((element) => {
  element.textContent = extensionApi.i18n.getMessage(element.dataset.i18n);
});
document.title = extensionApi.i18n.getMessage("optionsTitle");

extensionApi.storage.local.get("enabledButtons").then(({ enabledButtons = {} } = {}) => {
  buttonIds.forEach((id) => {
    const defaultEnabled = id !== "deepl" || deeplEnabledByDefault;
    form.elements.namedItem(id).checked = enabledButtons[id] === undefined
      ? defaultEnabled
      : enabledButtons[id] !== false;
  });
}).catch(() => {
  buttonIds.forEach((id) => {
    form.elements.namedItem(id).checked = id !== "deepl" || deeplEnabledByDefault;
  });
});

form.addEventListener("change", () => {
  const enabledButtons = Object.fromEntries(
    buttonIds.map((id) => [id, form.elements.namedItem(id).checked])
  );

  extensionApi.storage.local.set({ enabledButtons }).then(() => {
    status.textContent = extensionApi.i18n.getMessage("savedStatus");
  }).catch(() => {
    status.textContent = extensionApi.i18n.getMessage("saveError");
  });
});
