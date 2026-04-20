import Editor from "@monaco-editor/react";
import { useState, useRef, useCallback } from "react";
import "../Styles/CodePanel.css";

const LANGUAGES = [
  { id: "javascript", label: "JS",    full: "JavaScript" },
  { id: "python",     label: "PY",    full: "Python"     },
  { id: "cpp",        label: "C++",   full: "C++"        },
  { id: "java",       label: "Java",  full: "Java"       },
  { id: "typescript", label: "TS",    full: "TypeScript" },
  { id: "rust",       label: "Rust",  full: "Rust"       },
  { id: "go",         label: "Go",    full: "Go"         },
  { id: "sql",        label: "SQL",   full: "SQL"        },
];

const DEFAULT_CODE = {
  javascript: `// JavaScript\nconsole.log("Hello, World!");\n\nconst greet = (name) => \`Hello, \${name}!\`;\nconsole.log(greet("Claude"));`,
  python:     `# Python\nprint("Hello, World!")\n\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Claude"))`,
  cpp:        `// C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
  java:       `// Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  typescript: `// TypeScript\nconst greet = (name: string): string => {\n    return \`Hello, \${name}!\`;\n};\n\nconsole.log(greet("Claude"));`,
  rust:       `// Rust\nfn main() {\n    println!("Hello, World!");\n    let name = "Claude";\n    println!("Hello, {}!", name);\n}`,
  go:         `// Go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n    name := "Claude"\n    fmt.Printf("Hello, %s!\\n", name)\n}`,
  sql:        `-- SQL\nSELECT 'Hello, World!' AS greeting;\n\nSELECT\n    name,\n    COUNT(*) AS total\nFROM users\nGROUP BY name\nORDER BY total DESC;`,
};

const JS_RUNNABLE = new Set(["javascript", "typescript"]);

export default function CodePanel({ isOpen, onClose }) {
  const [lang, setLang]         = useState("javascript");
  const [codes, setCodes]       = useState(DEFAULT_CODE);
  const [output, setOutput]     = useState("");
  const [running, setRunning]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const editorRef               = useRef(null);

  const currentLang = LANGUAGES.find((l) => l.id === lang);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  const handleCodeChange = (val) => {
    setCodes((prev) => ({ ...prev, [lang]: val ?? "" }));
  };

  const runCode = useCallback(() => {
    if (!JS_RUNNABLE.has(lang)) {
      setOutput(`ℹ  Runtime execution is only available for JavaScript.\nFor ${currentLang.full}, copy the code and run it in your local environment.`);
      return;
    }
    setRunning(true);
    setOutput("");
    const logs = [];
    const origLog   = console.log;
    const origWarn  = console.warn;
    const origError = console.error;
    console.log   = (...a) => logs.push("› " + a.join(" "));
    console.warn  = (...a) => logs.push("⚠ " + a.join(" "));
    console.error = (...a) => logs.push("✕ " + a.join(" "));
    try {
      // eslint-disable-next-line no-eval
      eval(codes[lang]);
    } catch (e) {
      logs.push("✕ Error: " + e.message);
    } finally {
      console.log   = origLog;
      console.warn  = origWarn;
      console.error = origError;
    }
    setOutput(logs.length ? logs.join("\n") : "(no output)");
    setRunning(false);
  }, [lang, codes, currentLang]);

  const copyCode = () => {
    navigator.clipboard.writeText(codes[lang]).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const clearOutput = () => setOutput("");

  const resetCode = () => {
    setCodes((prev) => ({ ...prev, [lang]: DEFAULT_CODE[lang] }));
  };

  const switchLang = (id) => {
    setLang(id);
    setLangOpen(false);
    setOutput("");
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="cp-backdrop"
          onClick={onClose}
        />
      )}

      {/* Sliding panel */}
      <div className={`cp-panel ${isOpen ? "cp-panel--open" : ""}`}>
        {/* ── Header ── */}
        <div className="cp-header">
          <div className="cp-header-left">
            <div className="cp-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <div>
              <p className="cp-title">Code Editor</p>
              <p className="cp-sub">{currentLang.full}</p>
            </div>
          </div>

          <div className="cp-header-actions">
            {/* Language picker */}
            <div className="cp-lang-wrapper">
              <button
                className="cp-lang-btn"
                onClick={() => setLangOpen((v) => !v)}
                title="Switch language"
              >
                <span className="cp-lang-label">{currentLang.label}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {langOpen && (
                <div className="cp-lang-dropdown">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      className={`cp-lang-option ${l.id === lang ? "cp-lang-option--active" : ""}`}
                      onClick={() => switchLang(l.id)}
                    >
                      <span className="cp-lang-option-badge">{l.label}</span>
                      <span>{l.full}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Close */}
            <button className="cp-close-btn" onClick={onClose} title="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div className="cp-toolbar">
          <div className="cp-toolbar-left">
            <span className="cp-file-dot" />
            <span className="cp-file-name">main.{lang === "javascript" ? "js" : lang === "typescript" ? "ts" : lang === "python" ? "py" : lang === "cpp" ? "cpp" : lang === "java" ? "java" : lang === "rust" ? "rs" : lang === "go" ? "go" : "sql"}</span>
          </div>
          <div className="cp-toolbar-right">
            <button className="cp-tool-btn" onClick={resetCode} title="Reset to default">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
              </svg>
              Reset
            </button>
            <button className="cp-tool-btn" onClick={copyCode} title="Copy code">
              {copied
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              }
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* ── Monaco Editor ── */}
        <div className="cp-editor-wrap">
          <Editor
            height="100%"
            language={lang === "cpp" ? "cpp" : lang}
            value={codes[lang]}
            onChange={handleCodeChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
              fontLigatures: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: "on",
              wordWrap: "on",
              padding: { top: 12, bottom: 12 },
              renderLineHighlight: "line",
              cursorBlinking: "smooth",
              smoothScrolling: true,
              tabSize: 2,
              roundedSelection: true,
            }}
          />
        </div>

        {/* ── Run bar ── */}
        <div className="cp-run-bar">
          <button
            className={`cp-run-btn ${!JS_RUNNABLE.has(lang) ? "cp-run-btn--disabled" : ""}`}
            onClick={runCode}
            disabled={running}
          >
            {running ? (
              <span className="cp-spinner" />
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
            {running ? "Running…" : "Run"}
          </button>

          {!JS_RUNNABLE.has(lang) && (
            <span className="cp-run-hint">JS / TS only — copy to run locally</span>
          )}
        </div>

        {/* ── Output ── */}
        {output && (
          <div className="cp-output">
            <div className="cp-output-header">
              <span>Output</span>
              <button onClick={clearOutput}>Clear</button>
            </div>
            <pre className="cp-output-pre">{output}</pre>
          </div>
        )}
      </div>
    </>
  );
}