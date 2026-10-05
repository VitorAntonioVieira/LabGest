"use client";

import React, { useMemo } from "react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/react/style.css";
import { BlockNoteViewRaw as BlockNoteView, useCreateBlockNote } from "@blocknote/react";
import { Block } from "@blocknote/core";

interface BlockEditorProps {
  initialContent?: any;
  onChange?: (blocks: Block[]) => void;
  editable?: boolean;
  theme?: "light" | "dark";
}

function extractTextFromItem(item: any): string {
  if (typeof item === "string") return item;
  if (item?.text) return item.text;
  if (Array.isArray(item?.content)) {
    return item.content.map(extractTextFromItem).join("");
  }
  return "";
}

/**
 * Sanitiza o conteúdo inicial garantindo que seja um array compatível com o BlockNote
 */
function sanitizeInitialContent(content: any): any[] | undefined {
  if (!content) return undefined;
  
  if (Array.isArray(content) && content.length > 0) {
    // Valida se cada item possui estrutura básica de bloco
    const isValid = content.every((item) => item && typeof item === "object" && typeof item.type === "string");
    if (isValid) return content;
  }

  // Se o conteúdo estiver no formato legado/TipTap { type: "doc", content: [...] }
  if (typeof content === "object" && Array.isArray(content.content)) {
    const blocks: any[] = [];
    for (const item of content.content) {
      if (!item) continue;
      const text = extractTextFromItem(item);
      if (!text.trim()) continue;

      if (item.type === "heading") {
        const rawLevel = item.attrs?.level || 1;
        const level = (rawLevel >= 1 && rawLevel <= 3 ? rawLevel : 1) as 1 | 2 | 3;
        blocks.push({
          type: "heading",
          props: { level },
          content: [{ type: "text", text, styles: {} }],
        });
      } else {
        blocks.push({
          type: "paragraph",
          content: [{ type: "text", text, styles: {} }],
        });
      }
    }
    if (blocks.length > 0) {
      return blocks;
    }
  }

  return undefined;
}


export default function BlockEditor({
  initialContent,
  onChange,
  editable = true,
  theme = "light",
}: BlockEditorProps) {
  const parsedContent = useMemo(() => sanitizeInitialContent(initialContent), [initialContent]);

  const editor = useCreateBlockNote({
    initialContent: parsedContent,
  });

  return (
    <div className="w-full min-h-[350px] relative">
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={theme}
        onChange={() => {
          if (onChange) {
            onChange(editor.document as Block[]);
          }
        }}
        className="w-full bg-transparent"
      />
    </div>
  );
}
