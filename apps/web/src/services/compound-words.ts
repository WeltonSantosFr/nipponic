import { useEffect, useState } from "react";

const COMPOUNDS_STORAGE_KEY = "nipponic:custom_compounds_v1";
export const COMPOUNDS_UPDATE_EVENT = "nipponic:compounds_updated";

export interface MergedToken {
  surface_form: string;
  reading?: string;
  pos?: string;
  isMerged?: boolean;
}

export function getCustomCompounds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPOUNDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.warn("Failed to load custom compounds:", error);
    return [];
  }
}

export function saveCustomCompounds(compounds: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COMPOUNDS_STORAGE_KEY, JSON.stringify(compounds));
    window.dispatchEvent(new Event(COMPOUNDS_UPDATE_EVENT));
  } catch (error) {
    console.warn("Failed to save custom compounds:", error);
  }
}

export function addCustomCompound(compound: string): void {
  const clean = compound.trim();
  if (!clean || clean.length <= 1) return;

  const current = getCustomCompounds();
  if (!current.includes(clean)) {
    const updated = [clean, ...current];
    saveCustomCompounds(updated);
  }
}

export function removeCustomCompound(compound: string): void {
  const current = getCustomCompounds();
  const updated = current.filter((c) => c !== compound);
  saveCustomCompounds(updated);
}

export function useCompoundWords() {
  const [compounds, setCompounds] = useState<string[]>(() =>
    getCustomCompounds()
  );

  useEffect(() => {
    const handleUpdate = () => {
      setCompounds(getCustomCompounds());
    };

    window.addEventListener(COMPOUNDS_UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(COMPOUNDS_UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return {
    compounds,
    addCompound: (c: string) => addCustomCompound(c),
    removeCompound: (c: string) => removeCustomCompound(c),
  };
}

/**
 * Merges raw Kuromoji tokens ONLY when they match explicit user compound rules.
 * Tokens remain separated by default unless explicitly combined by the user.
 */
export function smartMergeTokens(
  rawTokens: Array<{
    surface_form: string;
    pos?: string;
    pos_detail_1?: string;
    reading?: string;
  }>,
  customCompounds: string[] = []
): MergedToken[] {
  if (!rawTokens || rawTokens.length === 0) return [];

  // Sort compounds by length descending to match longest phrases first
  const allCompounds = [...customCompounds].sort((a, b) => b.length - a.length);

  const result: MergedToken[] = [];
  let i = 0;

  while (i < rawTokens.length) {
    // Check if tokens starting at index i match any user compound rule
    let matchedCompound: string | null = null;
    let matchedTokenCount = 0;

    for (const compound of allCompounds) {
      let candidate = "";
      let count = 0;
      for (let j = i; j < rawTokens.length; j++) {
        candidate += rawTokens[j]!.surface_form;
        count++;
        if (candidate === compound) {
          matchedCompound = compound;
          matchedTokenCount = count;
          break;
        }
        if (!compound.startsWith(candidate)) {
          break;
        }
      }
      if (matchedCompound) break;
    }

    if (matchedCompound && matchedTokenCount > 0) {
      result.push({
        surface_form: matchedCompound,
        isMerged: true,
      });
      i += matchedTokenCount;
      continue;
    }

    const currentToken = rawTokens[i]!;

    result.push({
      surface_form: currentToken.surface_form,
      reading: currentToken.reading,
      pos: currentToken.pos,
      isMerged: false,
    });

    i++;
  }

  return result;
}

