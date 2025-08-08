import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import PromptInput from './components/PromptInput'
import CodeEditor from './components/CodeEditor'
import LivePreview from './components/LivePreview'
import ActionButtons from './components/ActionButtons'
import ExamplePrompts from './components/ExamplePrompts'
import { ThemeProvider } from './contexts/ThemeContext'
import { CodeProvider } from './contexts/CodeContext'
import { AIProvider } from './contexts/AIContext'

function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  return (
    <ThemeProvider>
      <AIProvider>
        <CodeProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-200">
            <Header />
            
            <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-7xl">
              {/* Prompt Input Section */}
              <div className="mb-6 sm:mb-8">
                <PromptInput 
                  setIsLoading={setIsLoading}
                  setError={setError}
                />
              </div>

              {/* Example Prompts */}
              <div className="mb-6 sm:mb-8">
                <ExamplePrompts />
              </div>

              {/* Main Content Area - Side by Side Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Code Editor */}
                <div className="card p-3 sm:p-4 h-[600px] sm:h-[700px] flex flex-col">
                  <h3 className="text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">
                    Generated Code
                  </h3>
                  <div className="flex-1 min-h-0">
                    <CodeEditor />
                  </div>
                </div>

                {/* Live Preview */}
                <div className="card p-3 sm:p-4 h-[600px] sm:h-[700px] flex flex-col">
                  <h3 className="text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-gray-100">
                    Live Preview
                  </h3>
                  <div className="flex-1 min-h-0">
                    <LivePreview />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center">
                <ActionButtons />
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-dark-800 rounded-lg p-4 sm:p-6 flex items-center space-x-4 mx-4">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-600"></div>
                    <p className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">Generating your website...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-dark-800 rounded-lg p-4 sm:p-6 max-w-md mx-4">
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
                    <p className="text-gray-900 dark:text-gray-100 mb-4 text-sm sm:text-base">{error}</p>
                    <button 
                      onClick={() => setError(null)}
                      className="btn-primary w-full"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </CodeProvider>
      </AIProvider>
    </ThemeProvider>
  )
}

export default App 
