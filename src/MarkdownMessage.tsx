// src/components/MarkdownMessage.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import type { Components } from "react-markdown";

/** Nettoie la sortie n8n: enlève ```fences```, dé-escape "\n" et désindentation 4 espaces */
function normalizeMarkdown(raw: string) {
  let s = raw ?? "";

  // 1) Si on reçoit des "\\n" littéraux, convertis-les en vrais sauts de ligne.
  if (s.includes("\\n")) s = s.replace(/\\n/g, "\n");

  // 2) Retire un éventuel fence global ```lang ... ```
  const t = s.trim();
  if (t.startsWith("```") && t.endsWith("```")) {
    s = t.replace(/^```[^\n]*\n?/, "").replace(/```$/, "").trim();
  }

  // 3) Si (presque) toutes les lignes non vides commencent par 4 espaces ou une tab, on désindente.
  const lines = s.split("\n");
  const nonEmpty = lines.filter((l) => l.trim() !== "");
  const mostlyIndented =
    nonEmpty.length > 0 &&
    nonEmpty.filter((l) => /^(\t| {4})/.test(l)).length >= Math.floor(nonEmpty.length * 0.8);
  if (mostlyIndented) {
    s = lines.map((l) => l.replace(/^(\t| {4})/, "")).join("\n");
  }

  return s;
}

const markdownComponents: Components = {
  a: (props) => (
    <a {...props} target="_blank" rel="noopener noreferrer" className="underline" />
  ),
  code(props) {
    const { inline, className, children, ...rest } = props as {
      inline?: boolean;
      className?: string;
      children?: React.ReactNode;
    };
    const base = inline
      ? "px-1 py-0.5 rounded bg-black/30"
      : "block p-3 rounded bg-black/40 overflow-x-auto";
    return (
      <code className={`${base} ${className || ""}`} {...rest}>
        {children}
      </code>
    );
  },
  img(props) {
    const p = props as any;
    return <img {...p} className="max-w-full rounded-lg" loading="lazy" />;
  },
};

type Props = {
  content: string;
  className?: string;
  tone?: "user" | "assistant";
};

const MarkdownMessage: React.FC<Props> = ({ content, className = "", tone = "assistant" }) => {
  const bubble =
    tone === "user"
      ? "bg-blue-600 text-white self-end"
      : "bg-neutral-800 text-neutral-100";

  return (
    <div className={`rounded-2xl px-4 py-3 ${bubble} ${className}`}>
      {/* Mettre les classes sur un wrapper pour éviter les soucis TS */}
      <div className="markdown-body prose prose-invert max-w-none prose-pre:!bg-transparent prose-code:!bg-transparent">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeHighlight]}
          components={markdownComponents as any}
        >
          {normalizeMarkdown(content)}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownMessage;
