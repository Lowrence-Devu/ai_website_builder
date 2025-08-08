import React from 'react'
import { useCode } from '../contexts/CodeContext'
import { Sparkles, Briefcase, ShoppingCart, Camera, Users, Palette } from 'lucide-react'

const ExamplePrompts = () => {
  const { setPrompt } = useCode()

  const examples = [
    {
      icon: Briefcase,
      title: 'Portfolio Website',
      prompt: 'Create a modern portfolio website with a hero section, about me, projects showcase, and contact form. Use a dark theme with smooth animations.',
      category: 'Professional'
    },
    {
      icon: ShoppingCart,
      title: 'E-commerce Landing',
      prompt: 'Design a product landing page with a hero banner, product features, pricing table, testimonials, and call-to-action buttons. Make it mobile-responsive.',
      category: 'Business'
    },
    {
      icon: Camera,
      title: 'Photography Gallery',
      prompt: 'Build a photography portfolio with a grid layout, image lightbox, categories filter, and about section. Include smooth transitions and hover effects.',
      category: 'Creative'
    },
    {
      icon: Users,
      title: 'Team Page',
      prompt: 'Create a team page with member cards, social links, skills section, and contact information. Use a clean, professional design.',
      category: 'Professional'
    },
    {
      icon: Palette,
      title: 'Creative Agency',
      prompt: 'Design a creative agency website with animated sections, service cards, client testimonials, and a vibrant color scheme.',
      category: 'Business'
    },
    {
      icon: Sparkles,
      title: 'Personal Blog',
      prompt: 'Build a personal blog with a clean layout, featured posts, categories sidebar, and newsletter signup. Include reading time estimates.',
      category: 'Content'
    }
  ]

  const handlePromptClick = (prompt) => {
    // Set the prompt in context, which will trigger generation
    setPrompt(prompt)
  }

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Example Prompts
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {examples.map((example, index) => {
          const Icon = example.icon
          return (
            <button
              key={index}
              onClick={() => handlePromptClick(example.prompt)}
              className="text-left p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-dark-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-200 group w-full"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-900/50 transition-colors duration-200">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors duration-200">
                      {example.title}
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400">
                      {example.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                    {example.prompt}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click any example to generate a website instantly
        </p>
      </div>
    </div>
  )
}

export default ExamplePrompts 