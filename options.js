const extensionApi = globalThis.browser || globalThis.chrome;
const form = document.querySelector("#settings");
const status = document.querySelector("#status");
const buttonIds = Array.from(form.elements)
  .filter((element) => element.type === "checkbox")
  .map((element) => element.name);

extensionApi.storage.local.get("enabledButtons").then(({ enabledButtons = {} } = {}) => {
  buttonIds.forEach((id) => {
    // Existing installs and first runs retain the original all-enabled behavior.
    form.elements.namedItem(id).checked = enabledButtons[id] !== false;
  });
}).catch(() => {
  buttonIds.forEach((id) => { form.elements.namedItem(id).checked = true; });
});

form.addEventListener("change", () => {
  const enabledButtons = Object.fromEntries(
    buttonIds.map((id) => [id, form.elements.namedItem(id).checked])
  );

  extensionApi.storage.local.set({ enabledButtons }).then(() => {
    status.textContent = "Enregistré.";
  }).catch(() => {
    status.textContent = "Impossible d’enregistrer les préférences.";
  });
});
