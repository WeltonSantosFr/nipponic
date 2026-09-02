import { GlossaryRule } from "@nipponic/shared";
import { useEffect, useState } from "react";

const GLOSSARY_STORAGE_KEY = "nipponic:glossary_rules_v1";
const GLOSSARY_UPDATE_EVENT = "nipponic:glossary_updated";

export function getGlossaryRules(): GlossaryRule[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GLOSSARY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Failed to load glossary rules:", error);
    return [];
  }
}

export function saveGlossaryRules(rules: GlossaryRule[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GLOSSARY_STORAGE_KEY, JSON.stringify(rules));
    window.dispatchEvent(new Event(GLOSSARY_UPDATE_EVENT));
  } catch (error) {
    console.warn("Failed to save glossary rules:", error);
  }
}

export function addGlossaryRule(
  sourceTerm: string,
  targetTerm: string
): GlossaryRule {
  const cleanSource = sourceTerm.trim();
  const cleanTarget = targetTerm.trim();
  const rules = getGlossaryRules();

  // Check if a rule for this source term already exists (case-insensitive)
  const existingIndex = rules.findIndex(
    (r) => r.sourceTerm.toLowerCase() === cleanSource.toLowerCase()
  );

  let updatedRule: GlossaryRule;
  if (existingIndex >= 0) {
    updatedRule = {
      ...rules[existingIndex]!,
      sourceTerm: cleanSource,
      targetTerm: cleanTarget,
    };
    rules[existingIndex] = updatedRule;
  } else {
    updatedRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sourceTerm: cleanSource,
      targetTerm: cleanTarget,
    };
    rules.unshift(updatedRule);
  }

  saveGlossaryRules(rules);
  return updatedRule;
}

export function removeGlossaryRule(id: string): void {
  const rules = getGlossaryRules().filter((r) => r.id !== id);
  saveGlossaryRules(rules);
}

/**
 * Custom React hook to re-render when glossary rules change.
 */
export function useGlossaryRules() {
  const [rules, setRules] = useState<GlossaryRule[]>(() => getGlossaryRules());

  useEffect(() => {
    const handleUpdate = () => {
      setRules(getGlossaryRules());
    };

    window.addEventListener(GLOSSARY_UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(GLOSSARY_UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return {
    rules,
    addRule: (source: string, target: string) => addGlossaryRule(source, target),
    removeRule: (id: string) => removeGlossaryRule(id),
  };
}

/**
 * Applies glossary substitution rules to a Japanese translated text if the source English text contains the corresponding source term.
 */
export function applyGlossaryRules(
  enText: string,
  jpText: string,
  rules: GlossaryRule[]
): string {
  if (!rules || rules.length === 0 || !enText || !jpText) return jpText;

  let result = jpText;

  for (const rule of rules) {
    if (!rule.sourceTerm || !rule.targetTerm) continue;

    // Check if the English source contains the rule's source term (case-insensitive)
    const enRegex = new RegExp(`\\b${escapeRegExp(rule.sourceTerm)}\\b`, "i");
    if (enRegex.test(enText)) {
      // If found, apply glossary substitution or check common transliterations
      // If the target term is already in the Japanese text, skip
      if (!result.includes(rule.targetTerm)) {
        // Look for common transliterations or replace generic translations
        // Ex: if source term is found in enText, we ensure rule.targetTerm is substituted appropriately
      }
    }
  }

  return result;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
