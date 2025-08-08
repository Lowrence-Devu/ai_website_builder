import React, { useState, useRef, useEffect } from 'react'
import { useAI } from '../contexts/AIContext'
import { useCode } from '../contexts/CodeContext'
import { Mic, MicOff, Send, Sparkles } from 'lucide-react'

const PromptInput = ({ setIsLoading, setError }) => {
  const { generateWebsite } = useAI()
  const { updateCode, clearCode, currentPrompt, setPrompt } = useCode()
  const [prompt, setLocalPrompt] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const recognitionRef = useRef(null)

  // Sync local prompt with context prompt
  useEffect(() => {
    if (currentPrompt && currentPrompt !== prompt) {
      setLocalPrompt(currentPrompt)
      // Auto-generate when prompt is set from context
      handleGenerateWithPrompt(currentPrompt)
    }
  }, [currentPrompt])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    console.log('Generating website with prompt:', prompt)
    await handleGenerateWithPrompt(prompt)
  }

  const handleGenerateWithPrompt = async (promptText) => {
    if (!promptText.trim()) {
      setError('Please enter a valid prompt')
      return
    }

    setIsGenerating(true)
    setError(null)
    clearCode()

    try {
      console.log('Calling generateWebsite with:', promptText)
      const result = await generateWebsite(promptText, setIsLoading, setError)
      
      console.log('Generation result:', result)
      
      if (result && result.html) {
        updateCode('html', result.html)
        updateCode('css', result.css || '')
        updateCode('javascript', result.javascript || '')
        console.log('Code updated successfully')
      } else {
        setError('Failed to generate website - no content received')
      }
    } catch (error) {
      console.error('Generation error:', error)
      setError('Failed to generate website: ' + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    
    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = false
    recognitionRef.current.lang = 'en-US'

    recognitionRef.current.onstart = () => {
      setIsListening(true)
    }

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setLocalPrompt(transcript)
      setIsListening(false)
    }

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setError('Speech recognition failed')
      setIsListening(false)
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current.start()
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
  }

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Describe your website
        </h2>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., Create a modern portfolio website with a dark theme, hero section, and contact form..."
            className="input-field min-h-[120px] resize-none pr-12 w-full"
            disabled={isGenerating}
          />
          
          {/* Voice Input Button */}
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isGenerating}
            className={`absolute top-3 right-3 p-2 rounded-lg transition-colors duration-200 ${
              isListening 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-600'
            }`}
            title={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Press Enter to generate or click the button below
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className={`btn-primary flex items-center space-x-2 w-full sm:w-auto justify-center ${
              !prompt.trim() || isGenerating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Generate Website</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PromptInput 