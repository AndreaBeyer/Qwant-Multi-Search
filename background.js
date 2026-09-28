const DEEPL_URL = "https://oneshot-free.www.deepl.com/v1/storefront/translate";

browserApi = globalThis.browser || globalThis.chrome;

browserApi.runtime.onMessage.addListener((message) => {
  if (!message || message.action !== "translateWithDeepL") {
    return undefined;
  }

  return translateWithDeepL(message.text, message.sourceLang, message.targetLang);
});

async function translateWithDeepL(text, sourceLang = "fr", targetLang = "en-US") {
  if (typeof text !== "string" || !text.trim()) {
    return { ok: false, error: "Texte vide." };
  }

  try {
    const response = await fetch(DEEPL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        language_model: "next-gen",
        source_lang: sourceLang,
        target_lang: targetLang,
        usage_type: "Translate",
        text: [text]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const translation = data?.translations?.[0]?.text;

    if (!translation) {
      throw new Error("Réponse DeepL invalide.");
    }

    return { ok: true, translation };
  } catch (error) {
    console.error("DeepL request failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
