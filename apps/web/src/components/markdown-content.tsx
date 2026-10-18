"use client";

import React, { useMemo } from "react";
import { marked, type Tokens, type Token } from "marked";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  const tokens = useMemo(() => {
    if (!content) return [];
    try {
      return marked.lexer(content);
    } catch {
      return [];
    }
  }, [content]);

  if (!content) {
    return null;
  }

  return (
    <div className={`space-y-4 text-foreground ${className}`} data-testid="markdown-content">
      {renderTokens(tokens)}
    </div>
  );
}

function renderTokens(tokens: Token[]): React.ReactNode {
  return tokens.map((token, index) => renderBlockToken(token, index));
}

function renderBlockToken(token: Token, key: number | string): React.ReactNode {
  switch (token.type) {
    case "heading": {
      const headingToken = token as Tokens.Heading;
      const inline = renderInlineTokens(headingToken.tokens);

      switch (headingToken.depth) {
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

    case "paragraph": {
      const pToken = token as Tokens.Paragraph;
      return (
        <p key={key} className="text-sm md:text-base text-foreground/90 leading-relaxed mb-3 last:mb-0">
          {renderInlineTokens(pToken.tokens)}
        </p>
      );
    }

    case "code": {
      const codeToken = token as Tokens.Code;
      return (
        <div
          key={key}
          className="my-3.5 rounded-xl border border-border/80 bg-muted/60 dark:bg-muted/30 p-4 font-mono text-xs md:text-sm text-foreground overflow-x-auto shadow-xs"
        >
          {codeToken.lang && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/50 mb-2">
              {codeToken.lang}
            </div>
          )}
          <pre className="whitespace-pre-wrap break-words">{codeToken.text}</pre>
        </div>
      );
    }

    case "blockquote": {
      const bqToken = token as Tokens.Blockquote;
      return (
        <blockquote
          key={key}
          className="my-3.5 pl-4 border-l-4 border-primary/70 bg-primary/5 dark:bg-primary/10 py-3 pr-4 rounded-r-xl text-sm text-foreground/90 space-y-2"
        >
          {bqToken.tokens ? renderTokens(bqToken.tokens) : <p>{bqToken.text}</p>}
        </blockquote>
      );
    }

    case "list": {
      const listToken = token as Tokens.List;
      if (listToken.ordered) {
        return (
          <ol
            key={key}
            start={listToken.start ? Number(listToken.start) : 1}
            className="my-3 space-y-1.5 pl-5 list-decimal text-sm md:text-base text-foreground/90"
          >
            {listToken.items.map((item, idx) => (
              <li key={idx} className="leading-relaxed pl-1">
                {renderListItem(item)}
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
          {listToken.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed pl-1">
              {renderListItem(item)}
            </li>
          ))}
        </ul>
      );
    }

    case "table": {
      const tableToken = token as Tokens.Table;
      return (
        <div key={key} className="my-4 overflow-x-auto rounded-xl border border-border/80 bg-card shadow-xs">
          <table className="w-full text-xs md:text-sm text-left border-collapse">
            <thead className="bg-muted/50 border-b border-border/80 font-bold text-foreground">
              <tr>
                {tableToken.header.map((cell, idx) => (
                  <th key={idx} className="p-3 text-left">
                    {renderInlineTokens(cell.tokens)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {tableToken.rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-muted/30 transition-colors">
                  {row.map((cell, colIdx) => (
                    <td key={colIdx} className="p-3 align-top">
                      {renderInlineTokens(cell.tokens)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "hr":
      return <hr key={key} className="my-6 border-border/80" />;

    case "space":
      return null;

    default:
      if ("tokens" in token && Array.isArray((token as any).tokens)) {
        return <div key={key}>{renderTokens((token as any).tokens)}</div>;
      }
      if ("text" in token && typeof (token as any).text === "string") {
        return (
          <p key={key} className="text-sm md:text-base text-foreground/90 leading-relaxed mb-3">
            {(token as any).text}
          </p>
        );
      }
      return null;
  }
}

function renderListItem(item: Tokens.ListItem): React.ReactNode {
  if (item.tokens && item.tokens.length > 0) {
    // If list item contains only text/paragraph tokens, render them inline to prevent double spacing
    const firstToken = item.tokens[0];
    const isSingleSimple =
      item.tokens.length === 1 &&
      Boolean(firstToken && (firstToken.type === "text" || firstToken.type === "paragraph"));

    if (isSingleSimple && firstToken) {
      const child = firstToken as Tokens.Text | Tokens.Paragraph;
      return renderInlineTokens(child.tokens || [{ type: "text", raw: child.text, text: child.text }]);
    }

    return item.tokens.map((child, idx) => {
      if (child.type === "text" || child.type === "paragraph") {
        const textChild = child as Tokens.Text | Tokens.Paragraph;
        return (
          <span key={idx}>
            {renderInlineTokens(textChild.tokens || [{ type: "text", raw: textChild.text, text: textChild.text }])}
          </span>
        );
      }
      return renderBlockToken(child, idx);
    });
  }

  return item.text;
}

function renderInlineTokens(tokens?: Token[]): React.ReactNode {
  if (!tokens || tokens.length === 0) {
    return null;
  }

  return tokens.map((token, index) => renderInlineToken(token, index));
}

function renderInlineToken(token: Token, key: number | string): React.ReactNode {
  switch (token.type) {
    case "text": {
      const textToken = token as Tokens.Text;
      if (textToken.tokens && textToken.tokens.length > 0) {
        return <React.Fragment key={key}>{renderInlineTokens(textToken.tokens)}</React.Fragment>;
      }
      return <React.Fragment key={key}>{textToken.text}</React.Fragment>;
    }

    case "strong": {
      const strongToken = token as Tokens.Strong;
      return (
        <strong key={key} className="font-bold text-foreground">
          {renderInlineTokens(strongToken.tokens)}
        </strong>
      );
    }

    case "em": {
      const emToken = token as Tokens.Em;
      return (
        <em key={key} className="italic text-foreground/90">
          {renderInlineTokens(emToken.tokens)}
        </em>
      );
    }

    case "codespan": {
      const codeToken = token as Tokens.Codespan;
      return (
        <code
          key={key}
          className="px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-mono text-xs md:text-sm font-semibold tracking-wide"
        >
          {codeToken.text}
        </code>
      );
    }

    case "del": {
      const delToken = token as Tokens.Del;
      return (
        <del key={key} className="line-through text-muted-foreground">
          {renderInlineTokens(delToken.tokens)}
        </del>
      );
    }

    case "link": {
      const linkToken = token as Tokens.Link;
      return (
        <a
          key={key}
          href={linkToken.href}
          title={linkToken.title ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline font-medium hover:text-primary/80 transition-colors"
        >
          {renderInlineTokens(linkToken.tokens)}
        </a>
      );
    }

    case "br":
      return <br key={key} />;

    case "escape":
      return <React.Fragment key={key}>{(token as Tokens.Escape).text}</React.Fragment>;

    default:
      if ("text" in token && typeof (token as any).text === "string") {
        return <React.Fragment key={key}>{(token as any).text}</React.Fragment>;
      }
      return null;
  }
}
