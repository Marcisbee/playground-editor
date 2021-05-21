import { parse as parseJSON } from "telejson";
import StackTracey from "stacktracey";

type SandboxData = {
  source: "snippet-console";
  type: "log" | "warn" | "error";
  output: string;
  stack: string;
} | {
  source: "snippet-end";
  output: string;
};

interface CustomHTMLIframeElement extends HTMLIFrameElement {
  onremove?: () => void;
}

const iframe: CustomHTMLIframeElement = document.createElement("iframe");

iframe.src = "./frame.html";

// iframe.style.visibility = "hidden";
// iframe.style.height = "1px";
// iframe.style.width = "1px";
iframe.setAttribute("sandbox", "allow-scripts");
iframe.setAttribute("seamless", "");

document.body.appendChild(iframe);

function findSnippetIndex(
  snippets: string[],
  line: number,
  index: number = 0,
  lineCountBefore: number = 0
): number {
  const code = snippets.shift();

  if (!code) return -1;

  const lineCount = code.split("\n").length - 1 + lineCountBefore;

  if (lineCount >= line) {
    return index;
  }

  return findSnippetIndex(snippets, line, index + 1, lineCount);
}

const IMPORTS_REGEX = /import\s+?(?:(?:(?:[\w*\s{},]*)\s+from\s+?)|)((?:".*?")|(?:'.*?'))[\s]*?(?:;|$|)/g;

function parseImports(code: string): string {
  return code.replace(IMPORTS_REGEX, (match, group) => {
    if (/https?:|\/\/|\.\//.test(group.replace(/["' ]+/g, ""))) {
      return match;
    }

    return match.replace(
      group,
      group.replace(/^(["' ]+)([^"' ]+)(["' ]+)$/g, `$1https://jspm.dev/$2$3`)
    );
  });
}

function transformCode(code: string): string {
  let output = parseImports(code);

  /**
   * @TODO: Code transform happens here
   * 
   * - jsx
   * - typescript
   * - imports
   */

  return output;
}

export function runSandboxIframe(
  code: string[],
  onLog: (
    output: any[],
    position: { index: number; line: number; column: number } | null,
    type: string
  ) => void,
  onEnd?: (output: any[]) => void,
) {
  const parsedCode = code.map(transformCode);

  if (iframe instanceof HTMLElement && iframe.onremove) {
    iframe.onremove();
  }

  function handler(e: MessageEvent<SandboxData>) {
    if (e.source !== iframe.contentWindow) {
      return;
    }

    if (!e.data || !e.data.source) {
      return;
    }

    if (e.data.source === "snippet-console") {
      const parsedData = parseJSON(e.data.output);
      const stack = new StackTracey(e.data.stack);
      const blob = stack.items.find((item) => /^blob:null\//.test(item.file));
      const position = blob
        ? {
          index: findSnippetIndex(parsedCode.slice(), blob.line!),
          line: blob.line,
          column: blob.column
        }
        : null;

      onLog(parsedData, position, e.data.type);
      console.log("RECEIVE", e.data.type, ...parsedData, position);
      return;
    }

    if (e.data.source === "snippet-end") {
      const parsedData = parseJSON(e.data.output);

      onEnd && onEnd(parsedData);

      console.log("END", parsedData);
      return;
    }
  }

  window.addEventListener("message", handler);

  console.log("SEND", parsedCode);
  iframe.contentWindow?.postMessage(parsedCode, "*");

  iframe.onremove = () => {
    window.removeEventListener("message", handler);
  };
}
