import { Exome } from "exome";

import { runSandboxIframe } from "../sandbox";

class Store extends Exome {
  public active: Workspace | null = null;
  public workspaces: Workspace[] = [];

  public addWorkspace(workspace: Workspace) {
    this.workspaces.push(workspace);
  }

  public setActive(workspace: Workspace | null) {
    this.active = workspace;
  }
}

export class Workspace extends Exome {
  public output = [];

  constructor(public id: string, public snippets: Snippet[] = []) {
    super();
  }

  public insertSnippetBefore(snippet: Snippet, before: number = -1) {
    this.snippets.splice(before + 1, 0, snippet);
  }

  public evaluate() {
    const codeToEvaluate = this.snippets.map((snippet) => snippet.transpiled);

    this.snippets.forEach((snippet) => {
      // Don't activate change detection
      snippet.cachedOutput = JSON.parse(JSON.stringify(snippet.output));
      snippet.output = [];
    });

    runSandboxIframe(
      codeToEvaluate,
      (output, position) => {
        if (position && position.index > -1) {
          this.snippets[position.index].addOutput(output);
        }
      },
      (output) => {
        this.snippets.forEach((snippet) => {
          snippet.clearCache();
        });
      }
    );
  }
}

export class Snippet extends Exome {
  public id = Math.random();
  public output: any[] = [];
  public cachedOutput: any[] = [];

  constructor(
    public code: string = "",
    public transpiled: string = '',
  ) {
    super();
  }

  public setCode(code: string, transpiled: string) {
    this.code = code;
    this.transpiled = transpiled;
  }

  public addOutput(output: any) {
    this.output.push(output);

    // Clear cache
    this.cachedOutput = [];
  }

  public clearCache() {
    this.cachedOutput = [];
  }
}

export const store = new Store();

store.addWorkspace(
  new Workspace("first", [
    new Snippet(
      'const foo: string = "Hello world" as const;\nconsole.log("First");\nconsole.log("Second");'
    ),
    new Snippet('import ms from "ms";\n\nconsole.log({ foo, value: ms(123) })')
  ])
);
store.addWorkspace(new Workspace("sedond", []));
