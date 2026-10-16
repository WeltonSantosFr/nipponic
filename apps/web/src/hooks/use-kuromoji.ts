import { useEffect, useState } from "react";
import kuromoji from "kuromoji";

let cachedTokenizerPromise: Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> | null = null;
let cachedTokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null = null;

function getTokenizerInstance(): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
  if (cachedTokenizer) {
    return Promise.resolve(cachedTokenizer);
  }
  if (!cachedTokenizerPromise) {
    cachedTokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: "/dict" }).build((err, _tokenizer) => {
        if (err) {
          console.error("Error loading Kuromoji dictionary:", err);
          cachedTokenizerPromise = null;
          reject(err);
          return;
        }
        cachedTokenizer = _tokenizer;
        resolve(_tokenizer);
      });
    });
  }
  return cachedTokenizerPromise;
}

export function useKuromoji() {
  const [tokenizer, setTokenizer] = useState<kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null>(
    () => cachedTokenizer
  );

  useEffect(() => {
    if (tokenizer) return;

    let isMounted = true;
    getTokenizerInstance()
      .then((_tokenizer) => {
        if (isMounted) {
          setTokenizer(_tokenizer);
        }
      })
      .catch(() => {
        // Error already logged in getTokenizerInstance
      });

    return () => {
      isMounted = false;
    };
  }, [tokenizer]);

  return tokenizer;
}
