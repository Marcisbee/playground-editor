import { EmitOutput } from 'typescript';
import React from "react";
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
// import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

let resolveTsWorkerState: Function | null = null;
const tsWorkerLoaded = new Promise((resolve) => { resolveTsWorkerState = resolve; });

// @ts-ignore
self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return;
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return;
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return;
    }
    if (label === 'typescript' || label === 'javascript') {
      resolveTsWorkerState && resolveTsWorkerState();
      return new tsWorker();
    }
    return new editorWorker();
  }
}

interface EditorProps {
  value: string;
  onChange: (original: string, transpiled: string) => void;
}

export function Editor({ value, onChange }: EditorProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const width = 500;
    const container = ref.current!;

    const editor = monaco.editor.create(container, {
      value,
      language: 'typescript',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      wrappingStrategy: 'advanced',
      minimap: {
        enabled: false,
      },
      overviewRulerLanes: 0,
      scrollbar: {
        alwaysConsumeMouseWheel: false,
      },
    });

    const updateHeight = () => {
      const contentHeight = Math.min(1000, editor.getContentHeight());
      container.style.width = `${width}px`;
      container.style.height = `${contentHeight}px`;

      editor.layout({ width, height: contentHeight });
    };

    editor.onDidContentSizeChange(updateHeight);

    updateHeight();

    async function onCodeChange(event?: monaco.editor.IModelContentChangedEvent) {
      if (event !== void 0) {
        // updateHash();
        // updateLocalStorage();
      }

      // showProcessingIndicator();

      const model = editor.getModel()!;

      const output = await getService()
        .then((service) => {
          return service.getEmitOutput(model.uri.toString());
        })
        .then((result: EmitOutput) => {
          if (result.emitSkipped) {
            return '';
          }

          if (!result.outputFiles || !result.outputFiles[0]) {
            return '';
          }

          return result.outputFiles[0].text;
        });
      
      onChange(model.getValue(), output);
    }

    editor.onDidChangeModelContent(onCodeChange);

    // @TODO: Remove this
    tsWorkerLoaded.then(() => {
      onCodeChange();
    });

    function getService() {
      return monaco.languages.typescript
        .getTypeScriptWorker()
        .then((worker) => worker(editor.getModel()!.uri));
    }

    return () => {
      editor.getModel()!.dispose();
      editor.dispose();
    }
  }, []);

  return (
    <div ref={ref}/>
  );
}
