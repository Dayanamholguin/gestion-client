import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

const Btn = ({ onClick, active, title, children }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`px-2 py-1 rounded text-xs font-semibold transition-colors select-none ${
      active
        ? "bg-indigo-600 text-white"
        : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
    }`}
  >
    {children}
  </button>
);

function RichTextEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.isEmpty ? "" : editor.getHTML());
    },
    editorProps: {
      attributes: { class: "focus:outline-none text-gray-900 dark:text-white" },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = value || "";
    if (editor.getHTML() !== incoming) {
      editor.commands.setContent(incoming, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="mt-1 overflow-hidden border border-gray-300 rounded-md dark:border-gray-600 bg-white dark:bg-gray-700">
      {/* Barra de herramientas */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrita (Ctrl+B)">
          B
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Cursiva (Ctrl+I)">
          <span className="italic">I</span>
        </Btn>
        <span className="w-px h-4 mx-0.5 bg-gray-300 dark:bg-gray-600" />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista con viñetas">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="2" cy="4" r="1.5" /><rect x="5" y="3" width="10" height="2" rx="1" />
            <circle cx="2" cy="9" r="1.5" /><rect x="5" y="8" width="10" height="2" rx="1" />
            <circle cx="2" cy="14" r="1.5" /><rect x="5" y="13" width="10" height="2" rx="1" />
          </svg>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerada">
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <text x="0" y="5" fontSize="5" fontFamily="monospace">1.</text>
            <rect x="5" y="3" width="10" height="2" rx="1" />
            <text x="0" y="10" fontSize="5" fontFamily="monospace">2.</text>
            <rect x="5" y="8" width="10" height="2" rx="1" />
            <text x="0" y="15" fontSize="5" fontFamily="monospace">3.</text>
            <rect x="5" y="13" width="10" height="2" rx="1" />
          </svg>
        </Btn>
        <span className="w-px h-4 mx-0.5 bg-gray-300 dark:bg-gray-600" />
        <Btn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} active={false} title="Quitar formato">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5l-7 7 7 7M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;
