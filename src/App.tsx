import { useStore } from "exome/react";
import React from "react";

import { Editor } from "./editor";
import { Snippet, store, Workspace } from "./store";

interface SnippetProps {
  snippet: Snippet;
}

function SnippetComponent({ snippet }: SnippetProps) {
  const { code, setCode, output, cachedOutput } = useStore(snippet);
  const isCached = cachedOutput.length > output.length;

  return (
    <div>
      <Editor
        value={code}
        onChange={setCode}
      />
      <ul style={{ opacity: isCached ? 0.5 : 1 }}>
        {(isCached ? cachedOutput : output).map((out, index) => (
          <li key={index}>{JSON.stringify(out)}</li>
        ))}
      </ul>
    </div>
  );
}

// ----

interface WorkspaceProps {
  workspace: Workspace;
}

function WorkspaceComponent({ workspace }: WorkspaceProps) {
  const { id, snippets, insertSnippetBefore, evaluate } = useStore(workspace);

  return (
    <div>
      <span onClick={() => store.setActive(null)}>Workspaces</span>
      {` > `} <strong>{id}</strong>
      <hr />
      <div>
        <button onClick={() => insertSnippetBefore(new Snippet(""))}>
          Add snippet
        </button>
        {snippets.map((snippet, index) => (
          <div key={snippet.id}>
            <SnippetComponent snippet={snippet} />
            <button onClick={() => insertSnippetBefore(new Snippet(""), index)}>
              Add snippet
            </button>
          </div>
        ))}
      </div>
      <hr />
      <button onClick={evaluate}>Run</button>
    </div>
  );
}

// ----

export default function App() {
  const { active, workspaces, setActive } = useStore(store);

  if (active) {
    return (
      <div className="App">
        <WorkspaceComponent workspace={active} />
      </div>
    );
  }

  return (
    <div className="App">
      <span>Workspaces</span>
      <ul>
        {workspaces.map((workspace) => (
          <li key={workspace.id} onClick={() => setActive(workspace)}>
            {workspace.id}
          </li>
        ))}
      </ul>
    </div>
  );
}

// const width = 500;
// const container = document.getElementById("container");
// container.style.border = "1px solid #f00";
// const editor = monaco.editor.create(container, {
//   value: "function hello() {\n\talert('Hello world!');\n}\n\n",
//   language: "javascript",
//   scrollBeyondLastLine: false,
//   wordWrap: "on",
//   wrappingStrategy: "advanced",
//   minimap: {
//     enabled: false
//   },
//   overviewRulerLanes: 0
// });

// const updateHeight = () => {
//   editor.changeViewZones(function (changeAccessor) {
//     changeAccessor.layoutZone(viewZoneId);
//   });
//   const contentHeight = Math.min(1000, editor.getContentHeight());
//   container.style.width = `${width}px`;
//   container.style.height = `${contentHeight}px`;

//   editor.layout({ width, height: contentHeight });
// };
// editor.onDidContentSizeChange(updateHeight);
// updateHeight();

// editor.updateOptions({
//   //lineNumbers: (lineNumber) => lineNumber + (Math.random() * 10)
// });

// // editor.onDidChangeModelLanguageConfiguration(() => {
// //     editor.changeViewZones(function(changeAccessor) {
// //         changeAccessor.layoutZone(viewZoneId);
// //     });
// // });

// // Add a zone to make hit testing more interesting
// var viewZoneId = null;
// editor.changeViewZones(function (changeAccessor) {
//   var domNode = document.createElement("div");
//   domNode.style.background = "lightgreen";
//   domNode.style.position = "relative";
//   domNode.style.overflow = "hidden";
//   domNode.innerHTML = "asd<br/>bbb";

//   const config = {
//     afterLineNumber: 3,
//     heightInLines: 1,
//     domNode: domNode,
//     onDomNodeTop() {
//       if (!domNode.scrollHeight) {
//         return;
//       }
//       this.heightInPx = domNode.scrollHeight;
//     },
//     onComputedHeight() {
//       if (!domNode.scrollHeight) {
//         return;
//       }
//       this.heightInPx = domNode.scrollHeight;
//     }
//   };

//   editor.onDidChangeModelContent((event) => {
//     const change = event.changes[0];
//     const addedNewLines =
//       change.text.split("\n").length -
//       1 +
//       change.range.startLineNumber -
//       change.range.endLineNumber;

//     if (
//       addedNewLines !== 0 &&
//       change.range.startLineNumber <= config.afterLineNumber
//     ) {
//       config.afterLineNumber += addedNewLines;
//     }
//   });

//   viewZoneId = changeAccessor.addZone(config);
// });

// requestAnimationFrame(() => {
//   editor.changeViewZones(function (changeAccessor) {
//     changeAccessor.layoutZone(viewZoneId);
//   });
// });
