import React from 'react'
import { useCode } from '../contexts/CodeContext'
import { Download, Copy, Trash2, ExternalLink } from 'lucide-react'
import JSZip from 'jszip'

const ActionButtons = () => {
  const { html, css, javascript, clearCode, getFullCode } = useCode()

  const hasContent = html.trim() || css.trim() || javascript.trim()

  const downloadZip = async () => {
    if (!hasContent) return

    const zip = new JSZip()
    
    // Add individual files
    zip.file('index.html', getFullCode())
    zip.file('styles.css', css)
    zip.file('script.js', javascript)
    
    // Add a README file
    const readme = `# Generated Website

This website was generated using AI Website Builder.

## Files:
- index.html - Complete HTML file with embedded CSS and JavaScript
- styles.css - CSS styles
- script.js - JavaScript code

## How to use:
1. Open index.html in your web browser
2. Or upload the files to your web hosting service

## Features:
- Responsive design
- Modern CSS
- Interactive JavaScript (if included)

Generated on: ${new Date().toLocaleDateString()}
`
    zip.file('README.md', readme)

    try {
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'generated-website.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error creating ZIP file:', error)
    }
  }

  const copyCode = async (type) => {
    let code = ''
    switch (type) {
      case 'html':
        code = html
        break
      case 'css':
        code = css
        break
      case 'javascript':
        code = javascript
        break
      case 'full':
        code = getFullCode()
        break
      default:
        return
    }

    try {
      await navigator.clipboard.writeText(code)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  const openInNewTab = () => {
    if (!hasContent) return
    
    const fullCode = getFullCode()
    const blob = new Blob([fullCode], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all generated code?')) {
      clearCode()
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
      {/* Download ZIP */}
      <button
        onClick={downloadZip}
        disabled={!hasContent}
        className={`btn-primary flex items-center space-x-2 text-sm sm:text-base ${
          !hasContent ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Download as ZIP file"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Download ZIP</span>
        <span className="sm:hidden">Download</span>
      </button>

      {/* Copy Full Code */}
      <button
        onClick={() => copyCode('full')}
        disabled={!hasContent}
        className={`btn-secondary flex items-center space-x-2 text-sm sm:text-base ${
          !hasContent ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Copy complete HTML code"
      >
        <Copy className="w-4 h-4" />
        <span className="hidden sm:inline">Copy Code</span>
        <span className="sm:hidden">Copy</span>
      </button>

      {/* Open in New Tab */}
      <button
        onClick={openInNewTab}
        disabled={!hasContent}
        className={`btn-secondary flex items-center space-x-2 text-sm sm:text-base ${
          !hasContent ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Open in new tab"
      >
        <ExternalLink className="w-4 h-4" />
        <span className="hidden sm:inline">Open in Tab</span>
        <span className="sm:hidden">Open</span>
      </button>

      {/* Clear Code */}
      <button
        onClick={handleClear}
        disabled={!hasContent}
        className={`btn-secondary flex items-center space-x-2 text-red-600 hover:text-red-700 text-sm sm:text-base ${
          !hasContent ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Clear all generated code"
      >
        <Trash2 className="w-4 h-4" />
        <span>Clear</span>
      </button>
    </div>
  )
}

export default ActionButtons 