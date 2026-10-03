const DEEPL_URL = "https://oneshot-free.www.deepl.com/v1/storefront/translate";
const browserApi = globalThis.browser || globalThis.chrome;

browserApi.runtime.onMessage.addListener((message) => {
  if (!message || message.action !== "translateWithDeepL") return undefined;
  return translateWithDeepL(message.text, message.sourceLang, message.targetLang);
});

async function translateWithDeepL(text, sourceLang = "fr", preferredTargetLang = "fr") {
  if (typeof text !== "string" || !text.trim()) return { ok: false, error: "Texte vide." };
  const englishQueryTarget = preferredTargetLang.toLowerCase().startsWith("de") ? "de" : "fr";
  try {
    const first = await requestDeepL(text, undefined, "en-US");
    const detectedLanguage = (first.detectedSourceLanguage || sourceLang || "").toLowerCase();
    if (detectedLanguage.startsWith("en")) {
      const translated = await requestDeepL(text, "en", englishQueryTarget);
      return { ok: true, translation: translated.translation };
    }
    return { ok: true, translation: first.translation };
  } catch (error) {
    console.error("DeepL request failed after retries:", error);
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function requestDeepL(text, sourceLang, targetLang) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      let response;
      try {
        const body = { language_model: "next-gen", target_lang: targetLang, usage_type: "Translate", text: [text] };
        if (sourceLang) body.source_lang = sourceLang;
        response = await fetch(DEEPL_URL, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body), signal: controller.signal
        });
      } finally { clearTimeout(timeout); }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = (await response.json())?.translations?.[0];
      if (typeof result?.text !== "string" || !result.text.trim()) throw new Error("Réponse DeepL invalide.");
      return { translation: result.text.trim(), detectedSourceLanguage: result.detected_source_language || "" };
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 500 * (2 ** attempt)));
    }
  }
  throw lastError;
}
