import React, { useEffect, useRef } from 'react'
import { useCode } from '../contexts/CodeContext'
import { Eye, RefreshCw } from 'lucide-react'

const LivePreview = () => {
  const { html, css, javascript, getFullCode } = useCode()
  const iframeRef = useRef(null)

  const updatePreview = () => {
    if (iframeRef.current) {
      const fullCode = getFullCode()
      const blob = new Blob([fullCode], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      iframeRef.current.src = url
    }
  }

  useEffect(() => {
    updatePreview()
  }, [html, css, javascript])

  const handleRefresh = () => {
    updatePreview()
  }

  const hasContent = html.trim() || css.trim() || javascript.trim()

  return (
    <div className="h-full flex flex-col">
      {/* Preview Header */}
      <div className="flex items-center justify-between p-2 sm:p-3 border-b border-gray-200 dark:border-dark-700">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
            Live Preview
          </span>
        </div>
        
        <button
          onClick={handleRefresh}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors duration-200"
          title="Refresh preview"
        >
          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Preview Content */}
      <div className="flex-1 min-h-0 relative">
        {hasContent ? (
          <iframe
            ref={iframeRef}
            title="Website Preview"
            className="w-full h-full border-0 rounded-b-lg"
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => {
              // Clean up blob URL after iframe loads
              if (iframeRef.current) {
                const currentSrc = iframeRef.current.src
                setTimeout(() => {
                  URL.revokeObjectURL(currentSrc)
                }, 1000)
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-dark-800 rounded-b-lg">
            <div className="text-center p-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-gray-200 dark:bg-dark-700 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
                No Preview Available
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Generate a website to see the live preview here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LivePreview 