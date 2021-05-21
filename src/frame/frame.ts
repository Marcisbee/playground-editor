import { stringify } from "telejson";

window.addEventListener("message", async function (__sandbox_e$) {
  if (!__sandbox_e$.source) {
    return;
  }

  console.log = (...args) => {
    const stacktrace = new Error();
    __sandbox_e$.source!.postMessage(
      {
        source: "snippet-console",
        type: "log",
        output: stringify(args),
        stack: stacktrace.stack
      },
      __sandbox_e$.origin
    );
  };

  (console as any).end = (...args: any[]) => {
    // const stacktrace = new Error();
    __sandbox_e$.source!.postMessage(
      {
        source: "snippet-end",
        type: "end",
        output: stringify(args),
      },
      __sandbox_e$.origin
    );
  };

  const __sandbox_i$ = URL.createObjectURL(
    new Blob(__sandbox_e$.data, { type: "text/javascript" })
  );

  try {
    const __sandbox_md$ = await import(/* @vite-ignore */__sandbox_i$);

    (console as any).end(__sandbox_md$);
  } catch (e) {
    console.error(e)
    // Error
  }
});
