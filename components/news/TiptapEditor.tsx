"use client";

import { useEffect } from "react";

import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";

type TiptapEditorProps = {
  initialJson?: Record<string, unknown>;
  onChange: (payload: { json: Record<string, unknown>; html: string }) => void;
};

export function TiptapEditor({ initialJson, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Image,
      Youtube.configure({
        controls: false,
        nocookie: true
      })
    ],
    content: initialJson,
    onUpdate: ({ editor: currentEditor }) => {
      onChange({
        json: currentEditor.getJSON() as Record<string, unknown>,
        html: currentEditor.getHTML()
      });
    },
    editorProps: {
      attributes: {
        class: "editor"
      }
    }
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    onChange({
      json: editor.getJSON() as Record<string, unknown>,
      html: editor.getHTML()
    });
  }, [editor, onChange]);

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-shell">
      <div className="editor-toolbar">
        <button
          type="button"
          className={`editor-toolbar__btn ${editor.isActive("heading", { level: 1 }) ? "is-active" : ""}`}
          aria-pressed={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </button>
        <button
          type="button"
          className={`editor-toolbar__btn ${editor.isActive("heading", { level: 2 }) ? "is-active" : ""}`}
          aria-pressed={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </button>
        <button
          type="button"
          className={`editor-toolbar__btn ${editor.isActive("bold") ? "is-active" : ""}`}
          aria-pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          className={`editor-toolbar__btn ${editor.isActive("blockquote") ? "is-active" : ""}`}
          aria-pressed={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          Quote
        </button>
        <button
          type="button"
          className="editor-toolbar__btn"
          onClick={() => {
            const url = window.prompt("Paste image URL");
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
        >
          Image
        </button>
        <button
          type="button"
          className="editor-toolbar__btn"
          onClick={() => {
            const url = window.prompt("Paste YouTube URL");
            if (url) {
              editor.chain().focus().setYoutubeVideo({ src: url }).run();
            }
          }}
        >
          Embed
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
