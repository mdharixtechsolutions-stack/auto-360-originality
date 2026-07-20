import { createContext, useContext, useState, useEffect } from "react";
import translations from "./translations";

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key, fallbackOrVars) => ""
});

export function LanguageProvider({ children }) {
  // Load initial preferred language from localStorage, falling back to 'en'
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("preferred_language") || "en";
  });

  const setLanguage = (lang) => {
    const supported = ["en", "ta", "hi", "te", "ml", "kn"];
    const targetLang = supported.includes(lang) ? lang : "en";
    setLanguageState(targetLang);
    localStorage.setItem("preferred_language", targetLang);
    
    // Set document lang attribute for accessibility & font rendering
    document.documentElement.setAttribute("lang", targetLang);
  };

  /**
   * Translate a key into the active language with optional variables replacement and fallback.
   * @param {string} key - The text key or sentence to translate
   * @param {object|string} [variablesOrFallback] - Object with replacement variables or fallback string
   * @param {string} [explicitFallback] - Fallback string if key is completely missing
   */
  const t = (key, variablesOrFallback, explicitFallback) => {
    if (!key) return "";

    const normalizedKey = key.toString().trim().toLowerCase();
    let variables = {};
    let fallback = explicitFallback || (typeof variablesOrFallback === "string" ? variablesOrFallback : key);

    if (variablesOrFallback && typeof variablesOrFallback === "object") {
      variables = variablesOrFallback;
    }

    // 1. Try active language lookup
    let translated = translations[language]?.[normalizedKey];

    // 2. Fallback to English lookup
    if (translated === undefined) {
      translated = translations["en"]?.[normalizedKey];
    }

    // 3. Fallback to literal provided fallback or key
    if (translated === undefined) {
      translated = fallback;
    }

    // Replace template variables like {customer} or {amount}
    if (translated && typeof translated === "string") {
      Object.keys(variables).forEach((varName) => {
        translated = translated.replace(new RegExp(`{${varName}}`, "g"), variables[varName]);
      });
    }

    return translated;
  };

  useEffect(() => {
    document.documentElement.setAttribute("lang", language);
    window.t = t;
    window.currentLanguage = language;

    if (language === "en") return;

    // Direct DOM translation function
    const translateDOM = () => {
      const dict = translations[language];
      if (!dict) return;

      const walk = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentNode;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            // Reject script/style tags, inputs, or textareas
            if (
              tag === "script" || 
              tag === "style" || 
              tag === "textarea" || 
              parent.isContentEditable ||
              parent.closest("input") ||
              parent.closest("textarea")
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let node;
      while ((node = walk.nextNode())) {
        const text = node.nodeValue.trim();
        if (!text || text.length > 80) continue; // Skip long dynamic texts (database descriptions/remarks)

        const normalized = text.toLowerCase();
        
        // 1. Check exact match
        if (dict[normalized]) {
          node.nodeValue = dict[normalized];
        } else {
          // 2. Check match without trailing colon
          const cleaned = text.replace(/:$/, "").trim().toLowerCase();
          if (dict[cleaned]) {
            const trailingColon = text.endsWith(":") ? ":" : "";
            node.nodeValue = dict[cleaned] + trailingColon;
          }
        }
      }

      // Translate placeholders
      const inputs = document.querySelectorAll("input[placeholder], textarea[placeholder]");
      inputs.forEach(input => {
        const placeholder = input.getAttribute("placeholder");
        if (placeholder) {
          const normalized = placeholder.trim().toLowerCase();
          if (dict[normalized]) {
            input.setAttribute("placeholder", dict[normalized]);
          }
        }
      });
    };

    // Run immediately
    translateDOM();

    // Setup MutationObserver to continuously translate dynamic React updates
    let timer;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(translateDOM, 30);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
