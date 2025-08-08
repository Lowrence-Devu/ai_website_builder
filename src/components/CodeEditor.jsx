import React, { useState } from 'react'
import { useCode } from '../contexts/CodeContext'
import Editor from '@monaco-editor/react'
import { Code, Palette, Zap } from 'lucide-react'

const CodeEditor = () => {
  const { html, css, javascript, updateCode } = useCode()
  const [activeTab, setActiveTab] = useState('html')

  const tabs = [
    { id: 'html', label: 'HTML', icon: Code },
    { id: 'css', label: 'CSS', icon: Palette },
    { id: 'javascript', label: 'JavaScript', icon: Zap },
  ]

  const getLanguage = (tab) => {
    switch (tab) {
      case 'html':
        return 'html'
      case 'css':
        return 'css'
      case 'javascript':
        return 'javascript'
      default:
        return 'html'
    }
  }

  const getValue = (tab) => {
    switch (tab) {
      case 'html':
        return html
      case 'css':
        return css
      case 'javascript':
        return javascript
      default:
        return ''
    }
  }

  const handleEditorChange = (value) => {
    updateCode(activeTab, value)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-dark-700 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.id.toUpperCase()}</span>
            </button>
          )
        })}
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={getLanguage(activeTab)}
          value={getValue(activeTab)}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            fontFamily: 'JetBrains Mono, Fira Code, monospace',
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            disableLayerHinting: true,
            renderLineHighlight: 'all',
            selectOnLineNumbers: true,
            glyphMargin: true,
            useTabStops: false,
            tabSize: 2,
            insertSpaces: true,
            detectIndentation: false,
            trimAutoWhitespace: true,
            largeFileOptimizations: true,
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showClasses: true,
              showFunctions: true,
              showVariables: true,
              showModules: true,
              showColors: true,
              showFiles: true,
              showReferences: true,
              showFolders: true,
              showTypeParameters: true,
              showWords: true,
              showUsers: true,
              showIssues: true,
            },
          }}
        />
      </div>
    </div>
  )
}

export default CodeEditor 