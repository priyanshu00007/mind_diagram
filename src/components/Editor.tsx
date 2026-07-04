import React from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { useStore } from '../store/useStore';

interface DiagramEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
}

// Simple Mermaid language definition for Monaco
const mermaidLanguage = {
  tokenizer: {
    root: [
      [/graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|journey/, 'keyword'],
      [/TD|LR|BT|RL|TB/, 'type'],
      [/\[|\]|\(|\)|\{|\}|-->|---/ , 'operator'],
      [/".*?"/, 'string'],
      [/%%.*/, 'comment'],
      [/[a-zA-Z_$][\w$]*/, {
        cases: {
          'graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph|journey': 'keyword',
          '@default': 'identifier'
        }
      }],
    ]
  }
};

export const DiagramEditor: React.FC<DiagramEditorProps> = ({ code, onChange }) => {
  const handleEditorWillMount = (monaco: any) => {
    // Register Mermaid language if not already registered
    if (!monaco.languages.getLanguages().some((lang: any) => lang.id === 'mermaid')) {
      monaco.languages.register({ id: 'mermaid' });
      monaco.languages.setMonarchTokensProvider('mermaid', mermaidLanguage);
      
      monaco.languages.setLanguageConfiguration('mermaid', {
        comments: {
          lineComment: '%%',
        },
        brackets: [
          ['{', '}'],
          ['[', ']'],
          ['(', ')'],
        ],
        autoClosingPairs: [
          { open: '{', close: '}' },
          { open: '[', close: ']' },
          { open: '(', close: ')' },
          { open: '"', close: '"' },
        ],
      });
    }
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="mermaid"
        theme="vs-dark"
        value={code}
        onChange={onChange}
        beforeMount={handleEditorWillMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16 },
          lineNumbersMinChars: 3,
          glyphMargin: false,
          folding: true,
          lineDecorationsWidth: 0,
          wordWrap: 'on',
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
        }}
        loading={<div className="h-full w-full flex items-center justify-center bg-brand-bg text-brand-text-dim text-xs font-mono">Initializing Editor...</div>}
      />
    </div>
  );
};
