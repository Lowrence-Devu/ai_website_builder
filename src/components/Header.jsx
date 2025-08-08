import React, { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useAI } from '../contexts/AIContext'
import { Sun, Moon, Settings, Sparkles } from 'lucide-react'

const Header = () => {
  const { isDark, toggleTheme } = useTheme()
  const { 
    apiKey, 
    huggingFaceKey,
    selectedProvider,
    saveApiKey, 
    saveHuggingFaceKey,
    saveSelectedProvider 
  } = useAI()
  const [showSettings, setShowSettings] = useState(false)
  const [tempApiKey, setTempApiKey] = useState(apiKey)
  const [tempHuggingFaceKey, setTempHuggingFaceKey] = useState(huggingFaceKey)
  const [tempSelectedProvider, setTempSelectedProvider] = useState(selectedProvider)

  const handleSaveSettings = () => {
    saveApiKey(tempApiKey)
    saveHuggingFaceKey(tempHuggingFaceKey)
    saveSelectedProvider(tempSelectedProvider)
    setShowSettings(false)
  }

  return (
    <header className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
      <div className="container mx-auto px-4 py-3 sm:py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg">
              <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                AI Website Builder
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                Generate websites from natural language
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors duration-200"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors duration-200"
              title="Settings"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-800 rounded-lg p-4 sm:p-6 max-w-md mx-4 w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Settings
            </h3>
            
            <div className="space-y-4">
              {/* API Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Provider
                </label>
                <select
                  value={tempSelectedProvider}
                  onChange={(e) => setTempSelectedProvider(e.target.value)}
                  className="input-field"
                >
                  <option value="local">Local Generation (Free - No API needed)</option>
                  <option value="huggingface">Hugging Face (Free - 30k requests/month)</option>
                  <option value="gemini">Google Gemini (Paid)</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {tempSelectedProvider === 'local' 
                    ? 'Generates websites locally using templates. No API key required.'
                    : tempSelectedProvider === 'huggingface'
                    ? 'Free tier with 30,000 requests per month. No credit card required.'
                    : 'Requires API key from Google AI Studio'
                  }
                </p>
              </div>

              {/* Gemini API Key */}
              {tempSelectedProvider === 'gemini' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Google AI Studio</a>
                  </p>
                </div>
              )}

              {/* Hugging Face API Key */}
              {tempSelectedProvider === 'huggingface' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hugging Face API Key
                  </label>
                  <input
                    type="password"
                    value={tempHuggingFaceKey}
                    onChange={(e) => setTempHuggingFaceKey(e.target.value)}
                    placeholder="hf_..."
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Get your free key from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Hugging Face</a>
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="btn-primary flex-1"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header 