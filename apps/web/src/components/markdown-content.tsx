"use client";

import React, { memo, useMemo } from "react";

import { FuriganaText } from "@/components/furigana-text";

export interface MarkdownContentProps {
  content: string;
  className?: string;
  showFurigana?: boolean;
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "code"; lang?: string; text: string }
  | { type: "blockquote"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" }
  | { type: "paragraph"; text: string };

type InlineToken =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "strong"; value: string }
  | { type: "em"; value: string }
  | { type: "strong_em"; value: string }
  | { type: "del"; value: string }
  | { type: "link"; text: string; href: string }
  | { type: "ruby"; kanji: string; reading: string };

function parseInlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const regex =
    /(`[^`]+`|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|~~[^~]+~~|\[[^\]]+\]\([^)]+\)|<ruby>[\s\S]*?<\/ruby>|\{[^{}|]+?\|[^{}|]+?\})/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith("`") && raw.endsWith("`")) {
      tokens.push({ type: "code", value: raw.slice(1, -1) });
    } else if (raw.startsWith("***") && raw.endsWith("***")) {
      tokens.push({ type: "strong_em", value: raw.slice(3, -3) });
    } else if (raw.startsWith("**") && raw.endsWith("**")) {
      tokens.push({ type: "strong", value: raw.slice(2, -2) });
    } else if (raw.startsWith("__") && raw.endsWith("__")) {
      tokens.push({ type: "strong", value: raw.slice(2, -2) });
    } else if (raw.startsWith("*") && raw.endsWith("*")) {
      tokens.push({ type: "em", value: raw.slice(1, -1) });
    } else if (raw.startsWith("_") && raw.endsWith("_")) {
      tokens.push({ type: "em", value: raw.slice(1, -1) });
    } else if (raw.startsWith("~~") && raw.endsWith("~~")) {
      tokens.push({ type: "del", value: raw.slice(2, -2) });
    } else if (raw.startsWith("[") && raw.includes("](")) {
      const linkMatch = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch && linkMatch[1] && linkMatch[2]) {
        tokens.push({ type: "link", text: linkMatch[1], href: linkMatch[2] });
      } else {
        tokens.push({ type: "text", value: raw });
      }
    } else if (raw.startsWith("{") && raw.endsWith("}")) {
      const parts = raw.slice(1, -1).split("|");
      if (parts.length === 2 && parts[0] && parts[1]) {
        tokens.push({ type: "ruby", kanji: parts[0], reading: parts[1] });
      } else {
        tokens.push({ type: "text", value: raw });
      }
    } else if (raw.startsWith("<ruby>")) {
      const rtMatch = raw.match(/<ruby>([\s\S]*?)<rt>([\s\S]*?)<\/rt>[\s\S]*?<\/ruby>/i);
      if (rtMatch && rtMatch[1] && rtMatch[2]) {
        tokens.push({
          type: "ruby",
          kanji: rtMatch[1].replace(/<[^>]+>/g, "").trim(),
          reading: rtMatch[2].replace(/<[^>]+>/g, "").trim(),
        });
      } else {
        tokens.push({ type: "text", value: raw.replace(/<[^>]+>/g, "") });
      }
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }
  return tokens;
}

function parseMarkdownBlocks(text: string): Block[] {
  if (!text) return [];

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const currentLine = lines[i];
    if (currentLine === undefined) break;

    // Blank line
    if (!currentLine.trim()) {
      i++;
      continue;
    }

    // Fenced Code Block: ```lang
    if (currentLine.trim().startsWith("```")) {
      const lang = currentLine.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length) {
        const cl = lines[i];
        if (cl === undefined || cl.trim().startsWith("```")) break;
        codeLines.push(cl);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      blocks.push({ type: "code", lang: lang || undefined, text: codeLines.join("\n") });
      continue;
    }

    // Headings: #, ##, ###, ####, etc.
    const headingMatch = currentLine.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch && headingMatch[1] && headingMatch[2]) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // Horizontal Rule: --- or *** or ___
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(currentLine.trim())) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Blockquote: > text
    if (currentLine.trim().startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length) {
        const ql = lines[i];
        if (!ql || !ql.trim().startsWith(">")) break;
        quoteLines.push(ql.replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join("\n").trim() });
      continue;
    }

    // Table: | Header 1 | Header 2 |
    if (currentLine.trim().startsWith("|") && currentLine.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length) {
        const tl = lines[i];
        if (!tl || !tl.trim().startsWith("|") || !tl.trim().endsWith("|")) break;
        tableLines.push(tl.trim());
        i++;
      }
      if (tableLines.length >= 2 && tableLines[0]) {
        const splitRow = (row: string) =>
          row
            .slice(1, -1)
            .split("|")
            .map((cell) => cell.trim());

        const headers = splitRow(tableLines[0]);
        const rows = tableLines.slice(2).map(splitRow);
        blocks.push({ type: "table", headers, rows });
        continue;
      }
    }

    // Unordered List: - item or * item
    if (/^[-*+]\s+/.test(currentLine.trim())) {
      const items: string[] = [];
      while (i < lines.length) {
        const ulLine = lines[i];
        if (!ulLine || !/^[-*+]\s+/.test(ulLine.trim())) break;
        items.push(ulLine.trim().replace(/^[-*+]\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    // Ordered List: 1. item
    if (/^\d+\.\s+/.test(currentLine.trim())) {
      const items: string[] = [];
      while (i < lines.length) {
        const olLine = lines[i];
        if (!olLine || !/^\d+\.\s+/.test(olLine.trim())) break;
        items.push(olLine.trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    // Paragraph (accumulate consecutive non-empty lines that don't start other blocks)
    const paragraphLines: string[] = [currentLine];
    i++;
    while (i < lines.length) {
      const pLine = lines[i];
      if (
        !pLine ||
        !pLine.trim() ||
        pLine.trim().startsWith("#") ||
        pLine.trim().startsWith("```") ||
        pLine.trim().startsWith(">") ||
        /^[-*+]\s+/.test(pLine.trim()) ||
        /^\d+\.\s+/.test(pLine.trim()) ||
        (pLine.trim().startsWith("|") && pLine.trim().endsWith("|")) ||
        /^(\*{3,}|-{3,}|_{3,})$/.test(pLine.trim())
      ) {
        break;
      }
      paragraphLines.push(pLine);
      i++;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join("\n") });
  }

  return blocks;
}

const inlineTokenCache = new Map<string, InlineToken[]>();
const MAX_INLINE_CACHE = 500;

function parseInlineTokensCached(text: string): InlineToken[] {
  const cached = inlineTokenCache.get(text);
  if (cached) return cached;
  const tokens = parseInlineTokens(text);
  if (inlineTokenCache.size >= MAX_INLINE_CACHE) {
    const firstKey = inlineTokenCache.keys().next().value;
    if (firstKey) inlineTokenCache.delete(firstKey);
  }
  inlineTokenCache.set(text, tokens);
  return tokens;
}

export const MarkdownContent = memo(function MarkdownContent({
  content,
  className = "",
  showFurigana = true,
}: MarkdownContentProps) {
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

  if (!content || blocks.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 text-foreground ${className}`} data-testid="markdown-content">
      {blocks.map((block, index) => renderBlock(block, index, showFurigana))}
    </div>
  );
});

function renderInline(text: string, showFurigana: boolean = true): React.ReactNode {
  const lines = text.split("\n");
  if (lines.length > 1) {
    return lines.map((line, idx) => (
      <React.Fragment key={idx}>
        {renderInlineSingleLine(line, showFurigana)}
        {idx < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  }
  return renderInlineSingleLine(text, showFurigana);
}

function renderInlineSingleLine(text: string, showFurigana: boolean = true): React.ReactNode {
  const tokens = parseInlineTokensCached(text);
  return tokens.map((token, index) => {
    switch (token.type) {
      case "code":
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-mono text-xs md:text-sm font-semibold tracking-wide"
          >
            {token.value}
          </code>
        );
      case "strong_em":
        return (
          <strong key={index} className="font-bold italic text-foreground">
            {token.value}
          </strong>
        );
      case "strong":
        return (
          <strong key={index} className="font-bold text-foreground">
            {token.value}
          </strong>
        );
      case "em":
        return (
          <em key={index} className="italic text-foreground/90">
            {token.value}
          </em>
        );
      case "del":
        return (
          <del key={index} className="line-through text-muted-foreground">
            {token.value}
          </del>
        );
      case "link":
        return (
          <a
            key={index}
            href={token.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline font-medium hover:text-primary/80 transition-colors"
          >
            {token.text}
          </a>
        );
      case "ruby":
        if (!showFurigana) {
          return <span key={index}>{token.kanji}</span>;
        }
        return (
          <ruby
            key={index}
            className="inline-flex flex-col items-center leading-none text-center mx-0.5 align-baseline"
          >
            <span className="text-[10px] font-normal select-none pb-0.5 leading-none text-muted-foreground">
              {token.reading}
            </span>
            <span className="leading-tight">{token.kanji}</span>
          </ruby>
        );
      case "text":
      default:
        if (showFurigana && /[\u4e00-\u9faf]/.test(token.value)) {
          return (
            <FuriganaText
              key={index}
              text={token.value}
              showFurigana={showFurigana}
            />
          );
        }
        return <React.Fragment key={index}>{token.value}</React.Fragment>;
    }
  });
}

function renderBlock(
  block: Block,
  key: number | string,
  showFurigana: boolean = true
): React.ReactNode {
  switch (block.type) {
    case "heading": {
      const inline = renderInline(block.text, showFurigana);
      switch (block.level) {
        case 1:
          return (
            <h1
              key={key}
              className="text-2xl sm:text-3xl font-black text-foreground tracking-tight pb-2 border-b border-border/80 mt-6 mb-3 first:mt-0"
            >
              {inline}
            </h1>
          );
        case 2:
          return (
            <h2
              key={key}
              className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight pb-1.5 border-b border-border/60 mt-5 mb-2.5 first:mt-0"
            >
              {inline}
            </h2>
          );
        case 3:
          return (
            <h3
              key={key}
              className="text-lg sm:text-xl font-bold text-foreground mt-4 mb-2 first:mt-0 flex items-center gap-2"
            >
              <span className="w-1.5 h-4 bg-primary rounded-full shrink-0" />
              <span>{inline}</span>
            </h3>
          );
        case 4:
        default:
          return (
            <h4
              key={key}
              className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary mt-3.5 mb-1.5 first:mt-0"
            >
              {inline}
            </h4>
          );
      }
    }

    case "paragraph":
      return (
        <p key={key} className="text-sm md:text-base text-foreground/90 leading-relaxed mb-3 last:mb-0">
          {renderInline(block.text, showFurigana)}
        </p>
      );

    case "code":
      return (
        <div
          key={key}
          className="my-3.5 rounded-xl border border-border/80 bg-muted/60 dark:bg-muted/30 p-4 font-mono text-xs md:text-sm text-foreground overflow-x-auto shadow-xs"
        >
          {block.lang && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/50 mb-2">
              {block.lang}
            </div>
          )}
          <pre className="whitespace-pre-wrap break-words">{block.text}</pre>
        </div>
      );

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="my-3.5 pl-4 border-l-4 border-primary/70 bg-primary/5 dark:bg-primary/10 py-3 pr-4 rounded-r-xl text-sm text-foreground/90 space-y-2"
        >
          {renderInline(block.text, showFurigana)}
        </blockquote>
      );

    case "list":
      if (block.ordered) {
        return (
          <ol
            key={key}
            className="my-3 space-y-1.5 pl-5 list-decimal text-sm md:text-base text-foreground/90"
          >
            {block.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed pl-1">
                {renderInline(item, showFurigana)}
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul
          key={key}
          className="my-3 space-y-1.5 pl-5 list-disc marker:text-primary text-sm md:text-base text-foreground/90"
        >
          {block.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed pl-1">
              {renderInline(item, showFurigana)}
            </li>
          ))}
        </ul>
      );

    case "table":
      return (
        <div key={key} className="my-4 overflow-x-auto rounded-xl border border-border/80 bg-card shadow-xs">
          <table className="w-full text-xs md:text-sm text-left border-collapse">
            <thead className="bg-muted/50 border-b border-border/80 font-bold text-foreground">
              <tr>
                {block.headers.map((header, idx) => (
                  <th key={idx} className="p-3 text-left">
                    {renderInline(header, showFurigana)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {block.rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-muted/30 transition-colors">
                  {row.map((cell, colIdx) => (
                    <td key={colIdx} className="p-3 align-top">
                      {renderInline(cell ?? "", showFurigana)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "hr":
      return <hr key={key} className="my-6 border-border/80" />;

    default:
      return null;
  }
}
