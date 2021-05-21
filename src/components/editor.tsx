import { EmitOutput } from 'typescript';
import React from "react";
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
// import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
// import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

import { fetchTypes } from '../utils/types-fetcher';

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
  id: string;
  value: string;
  onChange: (original: string, transpiled: string) => void;
}

monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
  target: monaco.languages.typescript.ScriptTarget.ES2015,
  allowSyntheticDefaultImports: true,
  typeRoots: ["node_modules/@types"],
});

const preloadedModules: Record<string, boolean> = {};

function extractPackages(code: string): string[] {
  const IMPORTS_REGEX = /import\s+?(?:(?:(?:[\w*\s{},]*)\s+from\s+?)|)((?:".*?")|(?:'.*?'))[\s]*?(?:;|$|)/g;
  const packageNames: string[] = [];

  let match;

  while ((match = IMPORTS_REGEX.exec(code)) !== null) {
    const packageName = match[1].replace(/["' ]+/g, "");

    if (/https?:|\/\/|\.\//.test(packageName)) {
      continue;
    }

    packageNames.push(packageName);

    if (preloadedModules[packageName]) {
      continue;
    }

    preloadedModules[packageName] = true;

    const link = document.createElement('link');

    link.setAttribute('rel', 'modulepreload');
    link.href = `https://jspm.dev/${packageName}`;

    document.head.appendChild(link);
  }

  return packageNames;
}

const installedTypes: Record<string, string> = {};

async function installTypes(code: string) {
  const packageNames = await extractPackages(code);

  await Promise.all(packageNames.map(async (packageName) => {
    if (installedTypes[packageName]) {
      return;
    }

    console.log(`Installing types for "${packageName}"...`);
    console.time(`Installed types for "${packageName}"`);
    const types = await fetchTypes(packageName);

    installedTypes[packageName] = types.reduce((acc, type) => acc + '\n' + type.content, '');

    monaco.languages.typescript.typescriptDefaults.addExtraLib(installedTypes[packageName], `file:///node_modules/@types/${packageName}/index.d.ts`);
    console.timeEnd(`Installed types for "${packageName}"`);
  }));
  
  console.log('All types installed');
}

export function Editor({ id, value, onChange }: EditorProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const width = 500;
    const container = ref.current!;

    const model = monaco.editor.createModel(value, 'typescript', monaco.Uri.parse(`file:///${id}.tsx`));
    const editor = monaco.editor.create(container, {
      model,
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

      // const model = editor.getModel()!;

      installTypes(model.getValue());

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
        .then((worker) => worker(model.uri));
    }

    return () => {
      model.dispose();
      editor.dispose();
    }
  }, []);

  return (
    <div ref={ref}/>
  );
}
