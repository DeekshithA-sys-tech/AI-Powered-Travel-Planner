import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const BR_TAG_RE = /<br\s*\/?>/gi;
const SINGLE_BR_RE = /^<br\s*\/?>$/i;

/** Convert literal `<br>` tags in Markdown into AST line breaks without enabling raw HTML. */
function remarkHtmlBr() {
  function transform(node) {
    if (!node.children) return;
    const out = [];
    for (const child of node.children) {
      if (child.type === "html" && SINGLE_BR_RE.test(child.value.trim())) {
        out.push({ type: "break" });
      } else if (child.type === "text" && BR_TAG_RE.test(child.value)) {
        BR_TAG_RE.lastIndex = 0;
        const parts = child.value.split(BR_TAG_RE);
        parts.forEach((part, idx) => {
          if (part) out.push({ type: "text", value: part });
          if (idx < parts.length - 1) out.push({ type: "break" });
        });
      } else {
        transform(child);
        out.push(child);
      }
    }
    node.children = out;
  }
  return (tree) => transform(tree);
}

export default function MarkdownView({ children }) {
  if (!children) return <p className="text-muted">Nothing to show yet.</p>;
  return (
    <div className="prose prose-invert max-w-none text-[#cce0f5] prose-headings:font-semibold prose-headings:text-[#e8f4ff] prose-p:text-[#cce0f5] prose-li:text-[#cce0f5] prose-strong:text-white prose-a:text-[#4ea8f0] prose-code:rounded prose-code:bg-[#0e1a2b] prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[#7ab8f5] prose-code:before:content-none prose-code:after:content-none prose-th:text-[#e8f4ff] prose-td:text-[#cce0f5] prose-thead:border-[#1e3050] prose-tr:border-[#1e2e44] prose-hr:border-[#1e2e44]">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkHtmlBr]}>{children}</ReactMarkdown>
    </div>
  );
}
