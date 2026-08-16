import { useEffect, useState } from "react";
import kuromoji from "kuromoji";

export function useKuromoji() {
  const [tokenizer, setTokenizer] =
    useState<kuromoji.Tokenizer<kuromoji.IpadicFeatures> | null>(null);

  useEffect(() => {
    if (tokenizer) return;

    kuromoji.builder({ dicPath: "/dict" }).build((err, _tokenizer) => {
      if (err) {
        console.error("Erro ao carregar o dicionário Kuromoji:", err);
        return;
      }
      setTokenizer(_tokenizer);
    });
  }, [tokenizer]);

  return tokenizer;
}
