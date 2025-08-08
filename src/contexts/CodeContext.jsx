import React, { createContext, useContext, useState } from 'react'

const CodeContext = createContext()

export const useCode = () => {
  const context = useContext(CodeContext)
  if (!context) {
    throw new Error('useCode must be used within a CodeProvider')
  }
  return context
}

export const CodeProvider = ({ children }) => {
  const [html, setHtml] = useState('')
  const [css, setCss] = useState('')
  const [javascript, setJavascript] = useState('')
  const [currentPrompt, setCurrentPrompt] = useState('')

  const updateCode = (type, code) => {
    switch (type) {
      case 'html':
        setHtml(code)
        break
      case 'css':
        setCss(code)
        break
      case 'javascript':
        setJavascript(code)
        break
      default:
        console.warn(`Unknown code type: ${type}`)
    }
  }

  const clearCode = () => {
    setHtml('')
    setCss('')
    setJavascript('')
  }

  const setPrompt = (prompt) => {
    setCurrentPrompt(prompt)
  }

  const getFullCode = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Website</title>
    <style>
${css}
    </style>
</head>
<body>
${html}
    <script>
${javascript}
    </script>
</body>
</html>`
  }

  const value = {
    html,
    css,
    javascript,
    currentPrompt,
    updateCode,
    clearCode,
    setPrompt,
    getFullCode,
  }

  return (
    <CodeContext.Provider value={value}>
      {children}
    </CodeContext.Provider>
  )
} 