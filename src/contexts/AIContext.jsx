import React, { createContext, useContext, useState } from 'react'

const AIContext = createContext()

export const useAI = () => {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error('useAI must be used within an AIProvider')
  }
  return context
}

export const AIProvider = ({ children }) => {
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('gemini_api_key') || ''
  })
  const [huggingFaceKey, setHuggingFaceKey] = useState(() => {
    return localStorage.getItem('huggingface_api_key') || ''
  })
  const [selectedProvider, setSelectedProvider] = useState(() => {
    return localStorage.getItem('selected_provider') || 'local'
  })

  const generateWebsite = async (prompt, setIsLoading, setError) => {
    console.log('generateWebsite called with prompt:', prompt, 'provider:', selectedProvider)
    
    if (selectedProvider === 'gemini' && !apiKey) {
      setError('Please enter your Gemini API key in the settings')
      return null
    }

    if (selectedProvider === 'huggingface' && !huggingFaceKey) {
      setError('Please enter your Hugging Face API key in the settings')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      if (selectedProvider === 'local') {
        // Use local template generation
        console.log('Using local generation')
        const result = generateLocalWebsite(prompt)
        console.log('Local generation result:', result)
        return result
      }

      let response
      
      if (selectedProvider === 'gemini') {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an expert web developer. Generate a complete website based on the user's prompt. 
                    Return the response in the following JSON format:
                    {
                      "html": "The HTML code",
                      "css": "The CSS code", 
                      "javascript": "The JavaScript code",
                      "description": "Brief description of what was generated"
                    }
                    
                    Guidelines:
                    - Create modern, responsive websites
                    - Use semantic HTML5
                    - Write clean, well-commented CSS
                    - Include JavaScript for interactivity when needed
                    - Make sure the website is mobile-friendly
                    - Use modern CSS features like Flexbox/Grid
                    - Include proper accessibility features
                    - Create visually appealing designs
                    
                    User prompt: ${prompt}`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4000,
            }
          })
        })
      } else if (selectedProvider === 'huggingface') {
        response = await fetch('https://api-inference.huggingface.co/models/codellama/CodeLlama-7b-Instruct-hf', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${huggingFaceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: `<s>[INST] Generate a complete website based on this prompt: ${prompt}

Please return the response in this exact JSON format:
{
  "html": "<!DOCTYPE html>...",
  "css": "body { ... }",
  "javascript": "// JavaScript code",
  "description": "Brief description"
}

Guidelines:
- Create modern, responsive websites
- Use semantic HTML5
- Write clean, well-commented CSS
- Include JavaScript for interactivity when needed
- Make sure the website is mobile-friendly
- Use modern CSS features like Flexbox/Grid
- Include proper accessibility features
- Create visually appealing designs

Generate the website now: [/INST]`,
            parameters: {
              max_new_tokens: 4000,
              temperature: 0.3,
              top_p: 0.9,
              do_sample: true,
              return_full_text: false
            }
          })
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error?.message || errorData.message || 'Unknown error'
        throw new Error(`API request failed: ${response.status} - ${errorMessage}`)
      }

      const data = await response.json()
      console.log('API Response:', data)
      
      let content
      if (selectedProvider === 'gemini') {
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          throw new Error('Invalid response from Gemini API')
        }
        content = data.candidates[0].content.parts[0].text
      } else if (selectedProvider === 'huggingface') {
        console.log('Processing Hugging Face response...')
        if (!data[0] || !data[0].generated_text) {
          // Try alternative response format
          if (data.generated_text) {
            content = data.generated_text
          } else {
            console.error('Invalid Hugging Face response format:', data)
            throw new Error('Invalid response from Hugging Face API')
          }
        } else {
          content = data[0].generated_text
        }
        console.log('Hugging Face content:', content)
      }
      
      // Try to parse JSON response
      console.log('Attempting to parse content as JSON...')
      try {
        const parsed = JSON.parse(content)
        console.log('Successfully parsed JSON:', parsed)
        return {
          html: parsed.html || '',
          css: parsed.css || '',
          javascript: parsed.javascript || '',
          description: parsed.description || 'Website generated successfully'
        }
      } catch (parseError) {
        console.log('JSON parsing failed, trying to extract from markdown...')
        console.log('Parse error:', parseError)
        console.log('Content to parse:', content)
        
        // If JSON parsing fails, try to extract code from markdown
        const htmlMatch = content.match(/```html\n([\s\S]*?)\n```/)
        const cssMatch = content.match(/```css\n([\s\S]*?)\n```/)
        const jsMatch = content.match(/```javascript\n([\s\S]*?)\n```/)
        
        const result = {
          html: htmlMatch ? htmlMatch[1] : '',
          css: cssMatch ? cssMatch[1] : '',
          javascript: jsMatch ? jsMatch[1] : '',
          description: 'Website generated successfully'
        }
        
        console.log('Extracted from markdown:', result)
        return result
      }
    } catch (error) {
      console.error('Error generating website:', error)
      
      // If APIs fail, provide a fallback
      if (selectedProvider === 'huggingface' || selectedProvider === 'gemini') {
        console.log('Falling back to local generation')
        return generateLocalWebsite(prompt)
      }
      
      setError(error.message || 'Failed to generate website')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const generateLocalWebsite = (prompt) => {
    console.log('generateLocalWebsite called with prompt:', prompt)
    const lowerPrompt = prompt.toLowerCase()
    
    // Determine template based on prompt keywords
    let template = 'portfolio' // default
    
    if (lowerPrompt.includes('e-commerce') || lowerPrompt.includes('shop') || lowerPrompt.includes('store') || 
        lowerPrompt.includes('product') || lowerPrompt.includes('pricing') || lowerPrompt.includes('cart') ||
        lowerPrompt.includes('ecommerce')) {
      template = 'ecommerce'
    } else if (lowerPrompt.includes('photography') || lowerPrompt.includes('gallery') || 
               lowerPrompt.includes('photo') || lowerPrompt.includes('image')) {
      template = 'photography'
    } else if (lowerPrompt.includes('blog') || lowerPrompt.includes('article') || 
               lowerPrompt.includes('post') || lowerPrompt.includes('content')) {
      template = 'blog'
    } else if (lowerPrompt.includes('team') || lowerPrompt.includes('member') || 
               lowerPrompt.includes('employee') || lowerPrompt.includes('staff')) {
      template = 'team'
    } else if (lowerPrompt.includes('agency') || lowerPrompt.includes('creative') || 
               lowerPrompt.includes('service') || lowerPrompt.includes('business')) {
      template = 'agency'
    } else if (lowerPrompt.includes('netflix') || lowerPrompt.includes('streaming') || 
               lowerPrompt.includes('movie') || lowerPrompt.includes('video') ||
               lowerPrompt.includes('tv') || lowerPrompt.includes('show') ||
               lowerPrompt.includes('film') || lowerPrompt.includes('series')) {
      template = 'netflix'
    }
    
    console.log('Selected template:', template)
    
    // Generate website based on selected template
    console.log('Generating website with template:', template)
    switch (template) {
      case 'ecommerce':
        return generateEcommerceWebsite(prompt)
      case 'photography':
        return generatePhotographyWebsite(prompt)
      case 'blog':
        return generateBlogWebsite(prompt)
      case 'team':
        return generateTeamWebsite(prompt)
      case 'agency':
        return generateAgencyWebsite(prompt)
      case 'netflix':
        return generateNetflixWebsite(prompt)
      default:
        console.log('Using default portfolio template')
        return generatePortfolioWebsite(prompt)
    }
  }

  const generatePortfolioWebsite = (prompt) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional Portfolio</title>
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-logo">Portfolio</div>
            <ul class="nav-menu">
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#projects">Projects</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </div>
    </nav>

    <section id="home" class="hero">
        <div class="hero-content">
            <h1>Hi, I'm a Developer</h1>
            <p>Full-Stack Developer & UI/UX Designer</p>
            <div class="hero-buttons">
                <a href="#projects" class="btn-primary">View My Work</a>
                <a href="#contact" class="btn-secondary">Get In Touch</a>
            </div>
        </div>
    </section>

    <section id="about" class="about">
        <div class="container">
            <h2>About Me</h2>
            <div class="about-content">
                <div class="about-text">
                    <p>I'm a passionate developer with expertise in modern web technologies. I love creating beautiful, functional websites that provide exceptional user experiences.</p>
                    <div class="skills">
                        <h3>Skills</h3>
                        <div class="skill-tags">
                            <span class="skill-tag">HTML5</span>
                            <span class="skill-tag">CSS3</span>
                            <span class="skill-tag">JavaScript</span>
                            <span class="skill-tag">React</span>
                            <span class="skill-tag">Node.js</span>
                            <span class="skill-tag">Python</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="projects" class="projects">
        <div class="container">
            <h2>My Projects</h2>
            <div class="projects-grid">
                <div class="project-card">
                    <div class="project-image">
                        <div class="project-placeholder">Project 1</div>
                    </div>
                    <div class="project-content">
                        <h3>Web Application</h3>
                        <p>A modern web solution with React and Node.js</p>
                        <div class="project-links">
                            <a href="#" class="project-link">Live Demo</a>
                            <a href="#" class="project-link">GitHub</a>
                        </div>
                    </div>
                </div>
                <div class="project-card">
                    <div class="project-image">
                        <div class="project-placeholder">Project 2</div>
                    </div>
                    <div class="project-content">
                        <h3>Mobile App</h3>
                        <p>Cross-platform mobile application</p>
                        <div class="project-links">
                            <a href="#" class="project-link">Live Demo</a>
                            <a href="#" class="project-link">GitHub</a>
                        </div>
                    </div>
                </div>
                <div class="project-card">
                    <div class="project-image">
                        <div class="project-placeholder">Project 3</div>
                    </div>
                    <div class="project-content">
                        <h3>Dashboard App</h3>
                        <p>Analytics dashboard with real-time data</p>
                        <div class="project-links">
                            <a href="#" class="project-link">Live Demo</a>
                            <a href="#" class="project-link">GitHub</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="contact" class="contact">
        <div class="container">
            <h2>Get In Touch</h2>
            <div class="contact-content">
                <div class="contact-info">
                    <h3>Let's work together</h3>
                    <p>I'm always open to discussing new projects, creative ideas or opportunities to be part of your visions.</p>
                    <div class="contact-details">
                        <div class="contact-item">
                            <span class="contact-icon">📧</span>
                            <span>email@example.com</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">📱</span>
                            <span>+1 (555) 123-4567</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">📍</span>
                            <span>San Francisco, CA</span>
                        </div>
                    </div>
                </div>
                <form class="contact-form">
                    <input type="text" placeholder="Your Name" required>
                    <input type="email" placeholder="Your Email" required>
                    <input type="text" placeholder="Company Name" required>
                    <select required>
                        <option value="">Select Project Type</option>
                        <option value="web">Web Development</option>
                        <option value="design">UI/UX Design</option>
                        <option value="consultation">Free Consultation</option>
                        <option value="other">Other</option>
                    </select>
                    <textarea placeholder="Tell us about your project or inquiry" rows="5" required></textarea>
                    <button type="submit" class="btn-primary">Send Message</button>
                </form>
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Portfolio. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`

    const css = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.navbar {
    position: fixed;
    top: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    z-index: 1000;
    padding: 1rem 0;
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: #667eea;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav-menu a:hover {
    color: #667eea;
}

.hero {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-align: center;
}

.hero-content h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: fadeInUp 1s ease;
}

.hero-content p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
    animation: fadeInUp 1s ease 0.2s both;
}

.hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    animation: fadeInUp 1s ease 0.4s both;
}

.btn-primary, .btn-secondary {
    padding: 12px 30px;
    border-radius: 25px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    display: inline-block;
}

.btn-primary {
    background: #667eea;
    color: white;
    border: 2px solid #667eea;
}

.btn-primary:hover {
    background: transparent;
    color: white;
}

.btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
}

.btn-secondary:hover {
    background: white;
    color: #667eea;
}

section {
    padding: 80px 0;
}

section h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #333;
}

.about {
    background: #f8f9fa;
}

.about-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    max-width: 800px;
    margin: 0 auto;
}

.about-text p {
    font-size: 1.1rem;
    margin-bottom: 2rem;
    text-align: center;
}

.skills h3 {
    margin-bottom: 1rem;
    text-align: center;
}

.skill-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
}

.skill-tag {
    background: #667eea;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
}

.projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
}

.project-card {
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.project-card:hover {
    transform: translateY(-5px);
}

.project-image {
    height: 200px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.project-placeholder {
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
}

.project-content {
    padding: 1.5rem;
}

.project-content h3 {
    margin-bottom: 0.5rem;
    color: #333;
}

.project-content p {
    color: #666;
    margin-bottom: 1rem;
}

.project-links {
    display: flex;
    gap: 1rem;
}

.project-link {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
}

.project-link:hover {
    text-decoration: underline;
}

.contact {
    background: #f8f9fa;
}

.contact-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    max-width: 1000px;
    margin: 0 auto;
}

.contact-info h3 {
    margin-bottom: 1rem;
    color: #333;
}

.contact-info p {
    margin-bottom: 2rem;
    color: #666;
}

.contact-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.contact-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
}

.contact-icon {
    font-size: 1.2rem;
}

.contact-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.contact-form input,
.contact-form textarea {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-family: inherit;
}

.contact-form textarea {
    resize: vertical;
}

.contact-form button {
    align-self: flex-start;
}

.footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem 0;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .nav-menu {
        display: none;
    }
    
    .hero-content h1 {
        font-size: 2rem;
    }
    
    .hero-buttons {
        flex-direction: column;
        align-items: center;
    }
    
    .contact-content {
        grid-template-columns: 1fr;
    }
    
    .projects-grid {
        grid-template-columns: 1fr;
    }
}`

    const javascript = `// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission handling
document.querySelector('.contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you for your message! This is a demo form.');
});

// Add scroll effect to navbar
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    }
});

// Add animation to project cards on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.project-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

console.log('Portfolio website loaded successfully!');`

    return {
      html,
      css,
      javascript,
      description: `Generated modern portfolio website based on your prompt: "${prompt}"`
    }
  }

  const generateEcommerceWebsite = (prompt) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modern E-commerce Store</title>
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-logo">ShopName</div>
            <ul class="nav-menu">
                <li><a href="#home">Home</a></li>
                <li><a href="#products">Products</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
            <div class="nav-cart">
                <span class="cart-icon">🛒</span>
                <span class="cart-count">0</span>
            </div>
        </div>
    </nav>

    <section id="home" class="hero">
        <div class="hero-content">
            <h1>Welcome to Our Store</h1>
            <p>Discover amazing products at unbeatable prices</p>
            <div class="hero-buttons">
                <a href="#products" class="btn-primary">Shop Now</a>
                <a href="#about" class="btn-secondary">Learn More</a>
            </div>
        </div>
    </section>

    <section id="products" class="products">
        <div class="container">
            <h2>Featured Products</h2>
            <div class="products-grid">
                <div class="product-card">
                    <div class="product-image">
                        <div class="product-placeholder">Product 1</div>
                        <div class="product-badge">New</div>
                    </div>
                    <div class="product-content">
                        <h3>Premium Product</h3>
                        <p class="product-price">$99.99</p>
                        <p class="product-description">High-quality product with amazing features</p>
                        <button class="btn-add-cart">Add to Cart</button>
                    </div>
                </div>
                <div class="product-card">
                    <div class="product-image">
                        <div class="product-placeholder">Product 2</div>
                        <div class="product-badge sale">Sale</div>
                    </div>
                    <div class="product-content">
                        <h3>Special Offer</h3>
                        <p class="product-price"><span class="old-price">$149.99</span> $79.99</p>
                        <p class="product-description">Limited time offer on this amazing product</p>
                        <button class="btn-add-cart">Add to Cart</button>
                    </div>
                </div>
                <div class="product-card">
                    <div class="product-image">
                        <div class="product-placeholder">Product 3</div>
                    </div>
                    <div class="product-content">
                        <h3>Best Seller</h3>
                        <p class="product-price">$129.99</p>
                        <p class="product-description">Our most popular product</p>
                        <button class="btn-add-cart">Add to Cart</button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="about" class="about">
        <div class="container">
            <h2>About Our Store</h2>
            <div class="about-content">
                <div class="about-text">
                    <p>We are passionate about providing the best products and service to our customers. Our mission is to make quality products accessible to everyone.</p>
                    <div class="features">
                        <div class="feature">
                            <span class="feature-icon">🚚</span>
                            <h3>Free Shipping</h3>
                            <p>On orders over $50</p>
                        </div>
                        <div class="feature">
                            <span class="feature-icon">🛡️</span>
                            <h3>Secure Payment</h3>
                            <p>100% secure checkout</p>
                        </div>
                        <div class="feature">
                            <span class="feature-icon">↩️</span>
                            <h3>Easy Returns</h3>
                            <p>30-day return policy</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="contact" class="contact">
        <div class="container">
            <h2>Get In Touch</h2>
            <div class="contact-content">
                <div class="contact-info">
                    <h3>Customer Service</h3>
                    <p>We're here to help with any questions you might have.</p>
                    <div class="contact-details">
                        <div class="contact-item">
                            <span class="contact-icon">📧</span>
                            <span>support@shopname.com</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">📱</span>
                            <span>1-800-SHOP-NOW</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">📍</span>
                            <span>123 Store Street, City, State</span>
                        </div>
                    </div>
                </div>
                <form class="contact-form">
                    <input type="text" placeholder="Your Name" required>
                    <input type="email" placeholder="Your Email" required>
                    <input type="text" placeholder="Order Number (if applicable)" />
                    <select required>
                        <option value="">Select Inquiry Type</option>
                        <option value="order">Order Status</option>
                        <option value="return">Returns & Refunds</option>
                        <option value="shipping">Shipping Information</option>
                        <option value="product">Product Questions</option>
                        <option value="other">Other</option>
                    </select>
                    <textarea placeholder="Tell us about your inquiry" rows="5" required></textarea>
                    <button type="submit" class="btn-primary">Send Message</button>
                </form>
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>ShopName</h3>
                    <p>Your trusted online store</p>
                </div>
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="#home">Home</a></li>
                        <li><a href="#products">Products</a></li>
                        <li><a href="#about">About</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Customer Service</h4>
                    <ul>
                        <li><a href="#">Shipping Info</a></li>
                        <li><a href="#">Returns</a></li>
                        <li><a href="#">FAQ</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 ShopName. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>`

    const css = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.navbar {
    position: fixed;
    top: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    z-index: 1000;
    padding: 1rem 0;
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: #e74c3c;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav-menu a:hover {
    color: #e74c3c;
}

.nav-cart {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.5rem 1rem;
    border-radius: 25px;
    background: #f8f9fa;
    transition: background 0.3s ease;
}

.nav-cart:hover {
    background: #e9ecef;
}

.cart-count {
    background: #e74c3c;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: bold;
}

.hero {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: white;
    text-align: center;
}

.hero-content h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: fadeInUp 1s ease;
}

.hero-content p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
    animation: fadeInUp 1s ease 0.2s both;
}

.hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    animation: fadeInUp 1s ease 0.4s both;
}

.btn-primary, .btn-secondary {
    padding: 12px 30px;
    border-radius: 25px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    display: inline-block;
    border: none;
    cursor: pointer;
}

.btn-primary {
    background: #e74c3c;
    color: white;
    border: 2px solid #e74c3c;
}

.btn-primary:hover {
    background: transparent;
    color: white;
}

.btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
}

.btn-secondary:hover {
    background: white;
    color: #e74c3c;
}

section {
    padding: 80px 0;
}

section h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #333;
}

.products {
    background: #f8f9fa;
}

.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.product-card {
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
    position: relative;
}

.product-card:hover {
    transform: translateY(-5px);
}

.product-image {
    height: 200px;
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.product-placeholder {
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
}

.product-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #27ae60;
    color: white;
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: bold;
}

.product-badge.sale {
    background: #e74c3c;
}

.product-content {
    padding: 1.5rem;
}

.product-content h3 {
    margin-bottom: 0.5rem;
    color: #333;
}

.product-price {
    font-size: 1.2rem;
    font-weight: bold;
    color: #e74c3c;
    margin-bottom: 0.5rem;
}

.old-price {
    text-decoration: line-through;
    color: #999;
    margin-right: 0.5rem;
}

.product-description {
    color: #666;
    margin-bottom: 1rem;
    font-size: 0.9rem;
}

.btn-add-cart {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: 500;
    transition: background 0.3s ease;
    width: 100%;
}

.btn-add-cart:hover {
    background: #c0392b;
}

.about {
    background: white;
}

.about-content {
    max-width: 800px;
    margin: 0 auto;
}

.about-text p {
    font-size: 1.1rem;
    margin-bottom: 3rem;
    text-align: center;
    color: #666;
}

.features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
}

.feature {
    text-align: center;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 10px;
}

.feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
}

.feature h3 {
    margin-bottom: 0.5rem;
    color: #333;
}

.feature p {
    color: #666;
}

.contact {
    background: #f8f9fa;
}

.contact-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    max-width: 1000px;
    margin: 0 auto;
}

.contact-info h3 {
    margin-bottom: 1rem;
    color: #333;
}

.contact-info p {
    margin-bottom: 2rem;
    color: #666;
}

.contact-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.contact-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
}

.contact-icon {
    font-size: 1.2rem;
}

.contact-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.contact-form input,
.contact-form textarea {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-family: inherit;
}

.contact-form textarea {
    resize: vertical;
}

.contact-form button {
    align-self: flex-start;
}

.footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem 0;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .nav-menu {
        display: none;
    }
    
    .hero-content h1 {
        font-size: 2rem;
    }
    
    .hero-buttons {
        flex-direction: column;
        align-items: center;
    }
    
    .contact-content {
        grid-template-columns: 1fr;
    }
    
    .products-grid {
        grid-template-columns: 1fr;
    }
    
    .features {
        grid-template-columns: 1fr;
    }
}`

    const javascript = `// Cart functionality
let cartCount = 0;
const cartCountElement = document.querySelector('.cart-count');

// Add to cart functionality
document.querySelectorAll('.btn-add-cart').forEach(button => {
    button.addEventListener('click', function() {
        cartCount++;
        cartCountElement.textContent = cartCount;
        
        // Add animation
        this.textContent = 'Added!';
        this.style.background = '#27ae60';
        
        setTimeout(() => {
            this.textContent = 'Add to Cart';
            this.style.background = '#e74c3c';
        }, 1000);
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission handling
document.querySelector('.contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you for your message! We\'ll get back to you soon.');
});

// Add scroll effect to navbar
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    }
});

// Add animation to product cards on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.product-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

console.log('E-commerce website loaded successfully!');`

    return {
      html,
      css,
      javascript,
      description: `Generated modern e-commerce website based on your prompt: "${prompt}"`
    }
  }

  const generatePhotographyWebsite = (prompt) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Photography Portfolio</title>
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-logo">Photo Studio</div>
            <ul class="nav-menu">
                <li><a href="#home">Home</a></li>
                <li><a href="#gallery">Gallery</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </div>
    </nav>

    <section id="home" class="hero">
        <div class="hero-content">
            <h1>Capturing Life's Moments</h1>
            <p>Professional Photography & Visual Storytelling</p>
            <div class="hero-buttons">
                <a href="#gallery" class="btn-primary">View Gallery</a>
                <a href="#contact" class="btn-secondary">Book Session</a>
            </div>
        </div>
    </section>

    <section id="gallery" class="gallery">
        <div class="container">
            <h2>Photo Gallery</h2>
            <div class="gallery-grid">
                <div class="gallery-item">
                    <div class="image-placeholder">Portrait 1</div>
                </div>
                <div class="gallery-item">
                    <div class="image-placeholder">Landscape 1</div>
                </div>
                <div class="gallery-item">
                    <div class="image-placeholder">Event 1</div>
                </div>
                <div class="gallery-item">
                    <div class="image-placeholder">Portrait 2</div>
                </div>
                <div class="gallery-item">
                    <div class="image-placeholder">Landscape 2</div>
                </div>
                <div class="gallery-item">
                    <div class="image-placeholder">Event 2</div>
                </div>
            </div>
        </div>
    </section>

    <section id="about" class="about">
        <div class="container">
            <h2>About My Work</h2>
            <div class="about-content">
                <div class="about-text">
                    <p>I specialize in capturing authentic moments and creating stunning visual stories. From portraits to landscapes, I bring your vision to life through the lens.</p>
                    <div class="services">
                        <h3>Services</h3>
                        <div class="service-tags">
                            <span class="service-tag">Portraits</span>
                            <span class="service-tag">Weddings</span>
                            <span class="service-tag">Events</span>
                            <span class="service-tag">Landscapes</span>
                            <span class="service-tag">Commercial</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="contact" class="contact">
        <div class="container">
            <h2>Book Your Session</h2>
            <div class="contact-content">
                <div class="contact-info">
                    <h3>Let's create something beautiful</h3>
                    <p>Ready to capture your special moments? Get in touch to discuss your photography needs.</p>
                    <div class="contact-details">
                        <div class="contact-item">
                            <span class="contact-icon">📧</span>
                            <span>hello@photostudio.com</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">📱</span>
                            <span>+1 (555) 123-4567</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">📍</span>
                            <span>Studio Location, City</span>
                        </div>
                    </div>
                </div>
                <form class="contact-form">
                    <input type="text" placeholder="Your Name" required>
                    <input type="email" placeholder="Your Email" required>
                    <textarea placeholder="Tell me about your project" rows="5" required></textarea>
                    <button type="submit" class="btn-primary">Send Message</button>
                </form>
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Photo Studio. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`

    const css = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.navbar {
    position: fixed;
    top: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    z-index: 1000;
    padding: 1rem 0;
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: #2c3e50;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav-menu a:hover {
    color: #2c3e50;
}

.hero {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    color: white;
    text-align: center;
}

.hero-content h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: fadeInUp 1s ease;
}

.hero-content p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
    animation: fadeInUp 1s ease 0.2s both;
}

.hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    animation: fadeInUp 1s ease 0.4s both;
}

.btn-primary, .btn-secondary {
    padding: 12px 30px;
    border-radius: 25px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    display: inline-block;
}

.btn-primary {
    background: #2c3e50;
    color: white;
    border: 2px solid #2c3e50;
}

.btn-primary:hover {
    background: transparent;
    color: white;
}

.btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
}

.btn-secondary:hover {
    background: white;
    color: #2c3e50;
}

section {
    padding: 80px 0;
}

section h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #333;
}

.gallery {
    background: #f8f9fa;
}

.gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
}

.gallery-item {
    aspect-ratio: 1;
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.2rem;
    font-weight: bold;
    transition: transform 0.3s ease;
}

.gallery-item:hover {
    transform: scale(1.05);
}

.image-placeholder {
    color: white;
    font-size: 1.2rem;
    font-weight: bold;
}

.about {
    background: white;
}

.about-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    max-width: 800px;
    margin: 0 auto;
}

.about-text p {
    font-size: 1.1rem;
    margin-bottom: 2rem;
    text-align: center;
}

.services h3 {
    margin-bottom: 1rem;
    text-align: center;
}

.service-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
}

.service-tag {
    background: #2c3e50;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
}

.contact {
    background: #f8f9fa;
}

.contact-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    max-width: 1000px;
    margin: 0 auto;
}

.contact-info h3 {
    margin-bottom: 1rem;
    color: #333;
}

.contact-info p {
    margin-bottom: 2rem;
    color: #666;
}

.contact-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.contact-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
}

.contact-icon {
    font-size: 1.2rem;
}

.contact-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.contact-form input,
.contact-form textarea {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-family: inherit;
}

.contact-form textarea {
    resize: vertical;
}

.contact-form button {
    align-self: flex-start;
}

.footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem 0;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .nav-menu {
        display: none;
    }
    
    .hero-content h1 {
        font-size: 2rem;
    }
    
    .hero-buttons {
        flex-direction: column;
        align-items: center;
    }
    
    .contact-content {
        grid-template-columns: 1fr;
    }
    
    .gallery-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
}`

    const javascript = `// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission handling
document.querySelector('.contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you for your message! I\'ll get back to you soon.');
});

// Add scroll effect to navbar
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    }
});

// Add animation to gallery items on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.gallery-item').forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(item);
});

console.log('Photography website loaded successfully!');`

    return {
      html,
      css,
      javascript,
      description: `Generated photography portfolio website based on your prompt: "${prompt}"`
    }
  }

  const generateBlogWebsite = (prompt) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Personal Blog</title>
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-logo">My Blog</div>
            <ul class="nav-menu">
                <li><a href="#home">Home</a></li>
                <li><a href="#posts">Posts</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </div>
    </nav>

    <section id="home" class="hero">
        <div class="hero-content">
            <h1>Welcome to My Blog</h1>
            <p>Thoughts, stories, and ideas worth sharing</p>
            <div class="hero-buttons">
                <a href="#posts" class="btn-primary">Read Posts</a>
                <a href="#about" class="btn-secondary">About Me</a>
            </div>
        </div>
    </section>

    <section id="posts" class="posts">
        <div class="container">
            <h2>Latest Posts</h2>
            <div class="posts-grid">
                <article class="post-card">
                    <div class="post-image">
                        <div class="image-placeholder">Post 1</div>
                    </div>
                    <div class="post-content">
                        <div class="post-meta">
                            <span class="post-date">March 15, 2024</span>
                            <span class="post-category">Technology</span>
                        </div>
                        <h3>The Future of Web Development</h3>
                        <p>Exploring the latest trends and technologies shaping the web development landscape...</p>
                        <a href="#" class="read-more">Read More</a>
                    </div>
                </article>
                <article class="post-card">
                    <div class="post-image">
                        <div class="image-placeholder">Post 2</div>
                    </div>
                    <div class="post-content">
                        <div class="post-meta">
                            <span class="post-date">March 10, 2024</span>
                            <span class="post-category">Design</span>
                        </div>
                        <h3>Design Principles That Matter</h3>
                        <p>Understanding the fundamental principles that make great design work...</p>
                        <a href="#" class="read-more">Read More</a>
                    </div>
                </article>
                <article class="post-card">
                    <div class="post-image">
                        <div class="image-placeholder">Post 3</div>
                    </div>
                    <div class="post-content">
                        <div class="post-meta">
                            <span class="post-date">March 5, 2024</span>
                            <span class="post-category">Life</span>
                        </div>
                        <h3>Finding Balance in a Digital World</h3>
                        <p>How to maintain healthy relationships with technology in our daily lives...</p>
                        <a href="#" class="read-more">Read More</a>
                    </div>
                </article>
            </div>
        </div>
    </section>

    <section id="about" class="about">
        <div class="container">
            <h2>About Me</h2>
            <div class="about-content">
                <div class="about-text">
                    <p>I'm a writer and creator passionate about sharing knowledge and experiences. This blog is my space to explore ideas, share insights, and connect with like-minded individuals.</p>
                    <div class="topics">
                        <h3>Topics I Write About</h3>
                        <div class="topic-tags">
                            <span class="topic-tag">Technology</span>
                            <span class="topic-tag">Design</span>
                            <span class="topic-tag">Life</span>
                            <span class="topic-tag">Creativity</span>
                            <span class="topic-tag">Growth</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="contact" class="contact">
        <div class="container">
            <h2>Get In Touch</h2>
            <div class="contact-content">
                <div class="contact-info">
                    <h3>Let's connect</h3>
                    <p>Have a question or want to collaborate? I'd love to hear from you.</p>
                    <div class="contact-details">
                        <div class="contact-item">
                            <span class="contact-icon">📧</span>
                            <span>hello@myblog.com</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">📱</span>
                            <span>+1 (555) 123-4567</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">📍</span>
                            <span>Digital Nomad</span>
                        </div>
                    </div>
                </div>
                <form class="contact-form">
                    <input type="text" placeholder="Your Name" required>
                    <input type="email" placeholder="Your Email" required>
                    <input type="text" placeholder="Website (optional)" />
                    <select required>
                        <option value="">Select Topic</option>
                        <option value="collaboration">Collaboration</option>
                        <option value="guest-post">Guest Post</option>
                        <option value="feedback">Feedback</option>
                        <option value="question">Question</option>
                        <option value="other">Other</option>
                    </select>
                    <textarea placeholder="Tell us about your message" rows="5" required></textarea>
                    <button type="submit" class="btn-primary">Send Message</button>
                </form>
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 My Blog. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`

    const css = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.navbar {
    position: fixed;
    top: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    z-index: 1000;
    padding: 1rem 0;
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: #e67e22;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav-menu a:hover {
    color: #e67e22;
}

.hero {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
    color: white;
    text-align: center;
}

.hero-content h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: fadeInUp 1s ease;
}

.hero-content p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
    animation: fadeInUp 1s ease 0.2s both;
}

.hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    animation: fadeInUp 1s ease 0.4s both;
}

.btn-primary, .btn-secondary {
    padding: 12px 30px;
    border-radius: 25px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    display: inline-block;
}

.btn-primary {
    background: #e67e22;
    color: white;
    border: 2px solid #e67e22;
}

.btn-primary:hover {
    background: transparent;
    color: white;
}

.btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
}

.btn-secondary:hover {
    background: white;
    color: #e67e22;
}

section {
    padding: 80px 0;
}

section h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #333;
}

.posts {
    background: #f8f9fa;
}

.posts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
}

.post-card {
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.post-card:hover {
    transform: translateY(-5px);
}

.post-image {
    height: 200px;
    background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.image-placeholder {
    color: white;
    font-size: 1.2rem;
    font-weight: bold;
}

.post-content {
    padding: 1.5rem;
}

.post-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: #666;
}

.post-category {
    background: #e67e22;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
}

.post-content h3 {
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.3rem;
}

.post-content p {
    color: #666;
    margin-bottom: 1rem;
    line-height: 1.6;
}

.read-more {
    color: #e67e22;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
}

.read-more:hover {
    text-decoration: underline;
}

.about {
    background: white;
}

.about-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    max-width: 800px;
    margin: 0 auto;
}

.about-text p {
    font-size: 1.1rem;
    margin-bottom: 2rem;
    text-align: center;
}

.topics h3 {
    margin-bottom: 1rem;
    text-align: center;
}

.topic-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
}

.topic-tag {
    background: #e67e22;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
}

.contact {
    background: #f8f9fa;
}

.contact-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    max-width: 1000px;
    margin: 0 auto;
}

.contact-info h3 {
    margin-bottom: 1rem;
    color: #333;
}

.contact-info p {
    margin-bottom: 2rem;
    color: #666;
}

.contact-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.contact-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
}

.contact-icon {
    font-size: 1.2rem;
}

.contact-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.contact-form input,
.contact-form textarea {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-family: inherit;
}

.contact-form textarea {
    resize: vertical;
}

.contact-form button {
    align-self: flex-start;
}

.footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem 0;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .nav-menu {
        display: none;
    }
    
    .hero-content h1 {
        font-size: 2rem;
    }
    
    .hero-buttons {
        flex-direction: column;
        align-items: center;
    }
    
    .contact-content {
        grid-template-columns: 1fr;
    }
    
    .posts-grid {
        grid-template-columns: 1fr;
    }
}`

    const javascript = `// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission handling
document.querySelector('.contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you for your message! I\'ll get back to you soon.');
});

// Add scroll effect to navbar
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    }
});

// Add animation to post cards on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.post-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

console.log('Blog website loaded successfully!');`

    return {
      html,
      css,
      javascript,
      description: `Generated personal blog website based on your prompt: "${prompt}"`
    }
  }

  const generateTeamWebsite = (prompt) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Our Team</title>
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-logo">Team Name</div>
            <ul class="nav-menu">
                <li><a href="#home">Home</a></li>
                <li><a href="#team">Team</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </div>
    </nav>

    <section id="home" class="hero">
        <div class="hero-content">
            <h1>Meet Our Amazing Team</h1>
            <p>Dedicated professionals working together to achieve excellence</p>
            <div class="hero-buttons">
                <a href="#team" class="btn-primary">Meet the Team</a>
                <a href="#services" class="btn-secondary">Our Services</a>
            </div>
        </div>
    </section>

    <section id="team" class="team">
        <div class="container">
            <h2>Our Team Members</h2>
            <div class="team-grid">
                <div class="team-member">
                    <div class="member-image">
                        <div class="image-placeholder">CEO</div>
                    </div>
                    <div class="member-content">
                        <h3>John Smith</h3>
                        <p class="member-role">Chief Executive Officer</p>
                        <p class="member-bio">Leading our company with vision and strategic direction.</p>
                        <div class="member-social">
                            <a href="#" class="social-link">LinkedIn</a>
                            <a href="#" class="social-link">Twitter</a>
                        </div>
                    </div>
                </div>
                <div class="team-member">
                    <div class="member-image">
                        <div class="image-placeholder">CTO</div>
                    </div>
                    <div class="member-content">
                        <h3>Sarah Johnson</h3>
                        <p class="member-role">Chief Technology Officer</p>
                        <p class="member-bio">Driving innovation and technical excellence across all projects.</p>
                        <div class="member-social">
                            <a href="#" class="social-link">LinkedIn</a>
                            <a href="#" class="social-link">GitHub</a>
                        </div>
                    </div>
                </div>
                <div class="team-member">
                    <div class="member-image">
                        <div class="image-placeholder">Designer</div>
                    </div>
                    <div class="member-content">
                        <h3>Mike Chen</h3>
                        <p class="member-role">Lead Designer</p>
                        <p class="member-bio">Creating beautiful and functional user experiences.</p>
                        <div class="member-social">
                            <a href="#" class="social-link">LinkedIn</a>
                            <a href="#" class="social-link">Dribbble</a>
                        </div>
                    </div>
                </div>
                <div class="team-member">
                    <div class="member-image">
                        <div class="image-placeholder">Developer</div>
                    </div>
                    <div class="member-content">
                        <h3>Emily Davis</h3>
                        <p class="member-role">Senior Developer</p>
                        <p class="member-bio">Building robust and scalable solutions for our clients.</p>
                        <div class="member-social">
                            <a href="#" class="social-link">LinkedIn</a>
                            <a href="#" class="social-link">GitHub</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="services" class="services">
        <div class="container">
            <h2>Our Services</h2>
            <div class="services-grid">
                <div class="service-card">
                    <div class="service-icon">💼</div>
                    <h3>Strategy Consulting</h3>
                    <p>We help businesses develop effective strategies for growth and success.</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">🎨</div>
                    <h3>Design & Branding</h3>
                    <p>Creating compelling visual identities and user experiences.</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">💻</div>
                    <h3>Development</h3>
                    <p>Building custom software solutions tailored to your needs.</p>
                </div>
            </div>
        </div>
    </section>

    <section id="contact" class="contact">
        <div class="container">
            <h2>Get In Touch</h2>
            <div class="contact-content">
                <div class="contact-info">
                    <h3>Ready to work with us?</h3>
                    <p>Let's discuss how our team can help you achieve your goals.</p>
                    <div class="contact-details">
                        <div class="contact-item">
                            <span class="contact-icon">📧</span>
                            <span>hello@teamname.com</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">📱</span>
                            <span>1-800-SHOP-NOW</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">📍</span>
                            <span>123 Business St, City, State</span>
                        </div>
                    </div>
                </div>
                <form class="contact-form">
                    <input type="text" placeholder="Your Name" required>
                    <input type="email" placeholder="Your Email" required>
                    <input type="text" placeholder="Company Name" required>
                    <textarea placeholder="Tell us about your project" rows="5" required></textarea>
                    <button type="submit" class="btn-primary">Send Message</button>
                </form>
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>ShopName</h3>
                    <p>Your trusted online store</p>
                </div>
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="#home">Home</a></li>
                        <li><a href="#products">Products</a></li>
                        <li><a href="#about">About</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Customer Service</h4>
                    <ul>
                        <li><a href="#">Shipping Info</a></li>
                        <li><a href="#">Returns</a></li>
                        <li><a href="#">FAQ</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 ShopName. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>`

    const css = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.navbar {
    position: fixed;
    top: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    z-index: 1000;
    padding: 1rem 0;
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: #9b59b6;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav-menu a:hover {
    color: #9b59b6;
}

.hero {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
    color: white;
    text-align: center;
}

.hero-content h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: fadeInUp 1s ease;
}

.hero-content p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
    animation: fadeInUp 1s ease 0.2s both;
}

.hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    animation: fadeInUp 1s ease 0.4s both;
}

.btn-primary, .btn-secondary {
    padding: 12px 30px;
    border-radius: 25px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    display: inline-block;
}

.btn-primary {
    background: #9b59b6;
    color: white;
    border: 2px solid #9b59b6;
}

.btn-primary:hover {
    background: transparent;
    color: white;
}

.btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
}

.btn-secondary:hover {
    background: white;
    color: #9b59b6;
}

section {
    padding: 80px 0;
}

section h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #333;
}

.team {
    background: #f8f9fa;
}

.team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
}

.team-member {
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
    text-align: center;
}

.team-member:hover {
    transform: translateY(-5px);
}

.member-image {
    height: 200px;
    background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.image-placeholder {
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
}

.member-content {
    padding: 1.5rem;
}

.member-content h3 {
    margin-bottom: 0.5rem;
    color: #333;
    font-size: 1.3rem;
}

.member-role {
    color: #9b59b6;
    font-weight: 600;
    margin-bottom: 1rem;
    font-size: 1rem;
}

.member-bio {
    color: #666;
    margin-bottom: 1.5rem;
    line-height: 1.6;
}

.member-social {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.social-link {
    color: #9b59b6;
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
    transition: color 0.3s ease;
}

.social-link:hover {
    color: #8e44ad;
}

.services {
    background: white;
}

.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
}

.service-card {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
    text-align: center;
}

.service-card:hover {
    transform: translateY(-5px);
}

.service-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
}

.service-card h3 {
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.5rem;
}

.service-card p {
    color: #666;
    margin-bottom: 1.5rem;
    line-height: 1.6;
}

.service-features {
    list-style: none;
    text-align: left;
}

.service-features li {
    padding: 0.5rem 0;
    color: #666;
    position: relative;
    padding-left: 1.5rem;
}

.service-features li:before {
    content: "✓";
    position: absolute;
    left: 0;
    color: #9b59b6;
    font-weight: bold;
}

.contact {
    background: #f8f9fa;
}

.contact-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    max-width: 1000px;
    margin: 0 auto;
}

.contact-info h3 {
    margin-bottom: 1rem;
    color: #333;
}

.contact-info p {
    margin-bottom: 2rem;
    color: #666;
}

.contact-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.contact-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
}

.contact-icon {
    font-size: 1.2rem;
}

.contact-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.contact-form input,
.contact-form select,
.contact-form textarea {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-family: inherit;
}

.contact-form textarea {
    resize: vertical;
}

.contact-form button {
    align-self: flex-start;
}

.footer {
    background: #333;
    color: white;
    padding: 3rem 0 1rem;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer-section h3,
.footer-section h4 {
    margin-bottom: 1rem;
    color: #9b59b6;
}

.footer-section ul {
    list-style: none;
}

.footer-section ul li {
    margin-bottom: 0.5rem;
}

.footer-section ul li a {
    color: #ccc;
    text-decoration: none;
    transition: color 0.3s ease;
}

.footer-section ul li a:hover {
    color: #9b59b6;
}

.footer-bottom {
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid #555;
    color: #ccc;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .nav-menu {
        display: none;
    }
    
    .hero-content h1 {
        font-size: 2rem;
    }
    
    .hero-buttons {
        flex-direction: column;
        align-items: center;
    }
    
    .contact-content {
        grid-template-columns: 1fr;
    }
    
    .team-grid {
        grid-template-columns: 1fr;
    }
    
    .services-grid {
        grid-template-columns: 1fr;
    }
}`

    const javascript = `// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission handling
document.querySelector('.contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you for your message! We\'ll get back to you soon.');
});

// Add scroll effect to navbar
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    }
});

// Add animation to team members on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.team-member, .service-card').forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(item);
});

console.log('Team website loaded successfully!');`

    return {
      html,
      css,
      javascript,
      description: `Generated team website based on your prompt: "${prompt}"`
    }
  }

  const generateNetflixWebsite = (prompt) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Netflix Clone</title>
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-logo">NETFLIX</div>
            <ul class="nav-menu">
                <li><a href="#home">Home</a></li>
                <li><a href="#tv-shows">TV Shows</a></li>
                <li><a href="#movies">Movies</a></li>
                <li><a href="#new">New & Popular</a></li>
                <li><a href="#my-list">My List</a></li>
            </ul>
            <div class="nav-actions">
                <button class="search-btn">🔍</button>
                <button class="profile-btn">👤</button>
            </div>
        </div>
    </nav>

    <section id="home" class="hero">
        <div class="hero-background">
            <div class="hero-content">
                <h1 class="hero-title">Stranger Things</h1>
                <p class="hero-description">When a young boy disappears, his mother, a police chief and his friends must confront terrifying supernatural forces in order to get him back.</p>
                <div class="hero-buttons">
                    <button class="btn-play">▶ Play</button>
                    <button class="btn-info">ℹ More Info</button>
                </div>
            </div>
        </div>
    </section>

    <section class="content-section">
        <div class="container">
            <h2 class="section-title">Trending Now</h2>
            <div class="movie-row">
                <div class="movie-card">
                    <div class="movie-image">
                        <div class="image-placeholder">Movie 1</div>
                        <div class="movie-overlay">
                            <button class="play-btn">▶</button>
                            <button class="add-btn">+</button>
                        </div>
                    </div>
                </div>
                <div class="movie-card">
                    <div class="movie-image">
                        <div class="image-placeholder">Movie 2</div>
                        <div class="movie-overlay">
                            <button class="play-btn">▶</button>
                            <button class="add-btn">+</button>
                        </div>
                    </div>
                </div>
                <div class="movie-card">
                    <div class="movie-image">
                        <div class="image-placeholder">Movie 3</div>
                        <div class="movie-overlay">
                            <button class="play-btn">▶</button>
                            <button class="add-btn">+</button>
                        </div>
                    </div>
                </div>
                <div class="movie-card">
                    <div class="movie-image">
                        <div class="image-placeholder">Movie 4</div>
                        <div class="movie-overlay">
                            <button class="play-btn">▶</button>
                            <button class="add-btn">+</button>
                        </div>
                    </div>
                </div>
                <div class="movie-card">
                    <div class="movie-image">
                        <div class="image-placeholder">Movie 5</div>
                        <div class="movie-overlay">
                            <button class="play-btn">▶</button>
                            <button class="add-btn">+</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="content-section">
        <div class="container">
            <h2 class="section-title">Popular on Netflix</h2>
            <div class="movie-row">
                <div class="movie-card">
                    <div class="movie-image">
                        <div class="image-placeholder">Show 1</div>
                        <div class="movie-overlay">
                            <button class="play-btn">▶</button>
                            <button class="add-btn">+</button>
                        </div>
                    </div>
                </div>
                <div class="movie-card">
                    <div class="movie-image">
                        <div class="image-placeholder">Show 2</div>
                        <div class="movie-overlay">
                            <button class="play-btn">▶</button>
                            <button class="add-btn">+</button>
                        </div>
                    </div>
                </div>
                <div class="movie-card">
                    <div class="movie-image">
                        <div class="image-placeholder">Show 3</div>
                        <div class="movie-overlay">
                            <button class="play-btn">▶</button>
                            <button class="add-btn">+</button>
                        </div>
                    </div>
                </div>
                <div class="movie-card">
                    <div class="movie-image">
                        <div class="image-placeholder">Show 4</div>
                        <div class="movie-overlay">
                            <button class="play-btn">▶</button>
                            <button class="add-btn">+</button>
                        </div>
                    </div>
                </div>
                <div class="movie-card">
                    <div class="movie-image">
                        <div class="image-placeholder">Show 5</div>
                        <div class="movie-overlay">
                            <button class="play-btn">▶</button>
                            <button class="add-btn">+</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="content-section">
        <div class="container">
            <h2 class="section-title">New Releases</h2>
            <div class="movie-row">
                <div class="movie-card">
                    <div class="movie-image">
                        <div class="image-placeholder">New 1</div>
                        <div class="movie-overlay">
                            <button class="play-btn">▶</button>
                            <button class="add-btn">+</button>
                        </div>
                    </div>
                </div>
                <div class="movie-card">
                    <div class="movie-image">
                        <div class="image-placeholder">New 2</div>
                        <div class="movie-overlay">
                            <button class="play-btn">▶</button>
                            <button class="add-btn">+</button>
                        </div>
                    </div>
                </div>
                <div class="movie-card">
                    <div class="movie-image">
                        <div class="image-placeholder">New 3</div>
                        <div class="movie-overlay">
                            <button class="play-btn">▶</button>
                            <button class="add-btn">+</button>
                        </div>
                    </div>
                </div>
                <div class="movie-card">
                    <div class="movie-image">
                        <div class="image-placeholder">New 4</div>
                        <div class="movie-overlay">
                            <button class="play-btn">▶</button>
                            <button class="add-btn">+</button>
                        </div>
                    </div>
                </div>
                <div class="movie-card">
                    <div class="movie-image">
                        <div class="image-placeholder">New 5</div>
                        <div class="movie-overlay">
                            <button class="play-btn">▶</button>
                            <button class="add-btn">+</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>NETFLIX</h3>
                    <p>Stream unlimited movies, TV shows, and more.</p>
                </div>
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="#home">Home</a></li>
                        <li><a href="#tv-shows">TV Shows</a></li>
                        <li><a href="#movies">Movies</a></li>
                        <li><a href="#new">New & Popular</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Account</h4>
                    <ul>
                        <li><a href="#profile">Profile</a></li>
                        <li><a href="#settings">Settings</a></li>
                        <li><a href="#help">Help Center</a></li>
                        <li><a href="#contact">Contact Us</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 Netflix Clone. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>`

    const css = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #fff;
    background: #000;
}

.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px;
}

.navbar {
    position: fixed;
    top: 0;
    width: 100%;
    background: linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%);
    z-index: 1000;
    padding: 1rem 0;
    transition: background 0.3s ease;
}

.navbar.scrolled {
    background: #000;
}

.nav-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-logo {
    font-size: 1.8rem;
    font-weight: bold;
    color: #e50914;
    text-transform: uppercase;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: #fff;
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav-menu a:hover {
    color: #e50914;
}

.nav-actions {
    display: flex;
    gap: 1rem;
}

.search-btn, .profile-btn {
    background: none;
    border: none;
    color: #fff;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: background 0.3s ease;
}

.search-btn:hover, .profile-btn:hover {
    background: rgba(255, 255, 255, 0.1);
}

.hero {
    height: 100vh;
    position: relative;
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #e50914 0%, #b20710 100%);
}

.hero-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.8) 100%);
    display: flex;
    align-items: center;
}

.hero-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px;
    width: 100%;
}

.hero-title {
    font-size: 3.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
    animation: fadeInUp 1s ease;
}

.hero-description {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    max-width: 600px;
    opacity: 0.9;
    animation: fadeInUp 1s ease 0.2s both;
}

.hero-buttons {
    display: flex;
    gap: 1rem;
    animation: fadeInUp 1s ease 0.4s both;
}

.btn-play, .btn-info {
    padding: 12px 30px;
    border-radius: 4px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    display: inline-block;
    border: none;
    cursor: pointer;
    font-size: 1rem;
}

.btn-play {
    background: #fff;
    color: #000;
}

.btn-play:hover {
    background: rgba(255, 255, 255, 0.8);
}

.btn-info {
    background: rgba(109, 109, 110, 0.7);
    color: #fff;
}

.btn-info:hover {
    background: rgba(109, 109, 110, 0.9);
}

.content-section {
    padding: 40px 0;
}

.section-title {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
    color: #fff;
}

.movie-row {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding: 1rem 0;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.movie-row::-webkit-scrollbar {
    display: none;
}

.movie-card {
    flex-shrink: 0;
    width: 200px;
    position: relative;
    transition: transform 0.3s ease;
}

.movie-card:hover {
    transform: scale(1.05);
    z-index: 10;
}

.movie-image {
    width: 100%;
    height: 300px;
    background: linear-gradient(135deg, #e50914 0%, #b20710 100%);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.image-placeholder {
    color: white;
    font-size: 1.2rem;
    font-weight: bold;
}

.movie-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.movie-card:hover .movie-overlay {
    opacity: 1;
}

.play-btn, .add-btn {
    background: rgba(255, 255, 255, 0.9);
    color: #000;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.3s ease;
}

.play-btn:hover, .add-btn:hover {
    background: #fff;
    transform: scale(1.1);
}

.footer {
    background: #000;
    color: #fff;
    padding: 3rem 0 1rem;
    margin-top: 2rem;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer-section h3,
.footer-section h4 {
    margin-bottom: 1rem;
    color: #e50914;
}

.footer-section ul {
    list-style: none;
}

.footer-section ul li {
    margin-bottom: 0.5rem;
}

.footer-section ul li a {
    color: #ccc;
    text-decoration: none;
    transition: color 0.3s ease;
}

.footer-section ul li a:hover {
    color: #e50914;
}

.footer-bottom {
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid #333;
    color: #ccc;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .nav-menu {
        display: none;
    }
    
    .hero-title {
        font-size: 2.5rem;
    }
    
    .hero-buttons {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .movie-card {
        width: 150px;
    }
    
    .movie-image {
        height: 225px;
    }
    
    .section-title {
        font-size: 1.3rem;
    }
}

@media (max-width: 480px) {
    .hero-title {
        font-size: 2rem;
    }
    
    .hero-description {
        font-size: 1rem;
    }
    
    .movie-card {
        width: 120px;
    }
    
    .movie-image {
        height: 180px;
    }
}`

    const javascript = `// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Movie card hover effects
document.querySelectorAll('.movie-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
});

// Play button functionality
document.querySelectorAll('.play-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        alert('Play functionality would be implemented here!');
    });
});

// Add to list functionality
document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        this.textContent = '✓';
        this.style.background = '#e50914';
        setTimeout(() => {
            this.textContent = '+';
            this.style.background = 'rgba(255, 255, 255, 0.9)';
        }, 1000);
    });
});

// Search functionality
document.querySelector('.search-btn').addEventListener('click', function() {
    alert('Search functionality would be implemented here!');
});

// Profile functionality
document.querySelector('.profile-btn').addEventListener('click', function() {
    alert('Profile menu would be implemented here!');
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

console.log('Netflix clone loaded successfully!');`

    return {
      html,
      css,
      javascript,
      description: `Generated Netflix-like streaming website based on your prompt: "${prompt}"`
    }
  }

  const generateAgencyWebsite = (prompt) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Creative Agency</title>
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <div class="nav-logo">Creative Agency</div>
            <ul class="nav-menu">
                <li><a href="#home">Home</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#work">Work</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </div>
    </nav>

    <section id="home" class="hero">
        <div class="hero-content">
            <h1>We Create Digital Experiences</h1>
            <p>Full-service creative agency specializing in branding, design, and development</p>
            <div class="hero-buttons">
                <a href="#work" class="btn-primary">View Our Work</a>
                <a href="#contact" class="btn-secondary">Start Project</a>
            </div>
        </div>
    </section>

    <section id="services" class="services">
        <div class="container">
            <h2>Our Services</h2>
            <div class="services-grid">
                <div class="service-card">
                    <div class="service-icon">🎨</div>
                    <h3>Brand Identity</h3>
                    <p>We create compelling brand identities that resonate with your audience and drive business growth.</p>
                    <ul class="service-features">
                        <li>Logo Design</li>
                        <li>Brand Guidelines</li>
                        <li>Visual Identity</li>
                    </ul>
                </div>
                <div class="service-card">
                    <div class="service-icon">💻</div>
                    <h3>Web Development</h3>
                    <p>Custom websites and web applications built with modern technologies and best practices.</p>
                    <ul class="service-features">
                        <li>Custom Websites</li>
                        <li>E-commerce Solutions</li>
                        <li>Web Applications</li>
                    </ul>
                </div>
                <div class="service-card">
                    <div class="service-icon">📱</div>
                    <h3>Digital Marketing</h3>
                    <p>Strategic digital marketing campaigns that increase visibility and drive conversions.</p>
                    <ul class="service-features">
                        <li>SEO Optimization</li>
                        <li>Social Media</li>
                        <li>Content Strategy</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <section id="work" class="work">
        <div class="container">
            <h2>Featured Work</h2>
            <div class="work-grid">
                <div class="work-item">
                    <div class="work-image">
                        <div class="image-placeholder">Project 1</div>
                        <div class="work-overlay">
                            <h3>E-commerce Platform</h3>
                            <p>Brand Identity + Web Development</p>
                        </div>
                    </div>
                </div>
                <div class="work-item">
                    <div class="work-image">
                        <div class="image-placeholder">Project 2</div>
                        <div class="work-overlay">
                            <h3>Mobile App</h3>
                            <p>UI/UX Design + Development</p>
                        </div>
                    </div>
                </div>
                <div class="work-item">
                    <div class="work-image">
                        <div class="image-placeholder">Project 3</div>
                        <div class="work-overlay">
                            <h3>Brand Campaign</h3>
                            <p>Brand Strategy + Marketing</p>
                        </div>
                    </div>
                </div>
                <div class="work-item">
                    <div class="work-image">
                        <div class="image-placeholder">Project 4</div>
                        <div class="work-overlay">
                            <h3>Corporate Website</h3>
                            <p>Design + Development</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section id="contact" class="contact">
        <div class="container">
            <h2>Let's Work Together</h2>
            <div class="contact-content">
                <div class="contact-info">
                    <h3>Ready to start your project?</h3>
                    <p>Tell us about your vision and we'll help bring it to life with our creative expertise.</p>
                    <div class="contact-details">
                        <div class="contact-item">
                            <span class="contact-icon">📧</span>
                            <span>hello@creativeagency.com</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">📱</span>
                            <span>+1 (555) 123-4567</span>
                        </div>
                        <div class="contact-item">
                            <span class="contact-icon">📍</span>
                            <span>123 Creative St, City, State</span>
                        </div>
                    </div>
                </div>
                <form class="contact-form">
                    <input type="text" placeholder="Your Name" required>
                    <input type="email" placeholder="Your Email" required>
                    <input type="text" placeholder="Company Name" required>
                    <select required>
                        <option value="">Select Service</option>
                        <option value="branding">Brand Identity</option>
                        <option value="web">Web Development</option>
                        <option value="marketing">Digital Marketing</option>
                        <option value="other">Other</option>
                    </select>
                    <textarea placeholder="Tell us about your project" rows="5" required></textarea>
                    <button type="submit" class="btn-primary">Send Message</button>
                </form>
            </div>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>Creative Agency</h3>
                    <p>Creating digital experiences that matter.</p>
                </div>
                <div class="footer-section">
                    <h4>Services</h4>
                    <ul>
                        <li><a href="#services">Brand Identity</a></li>
                        <li><a href="#services">Web Development</a></li>
                        <li><a href="#services">Digital Marketing</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Contact</h4>
                    <ul>
                        <li><a href="#contact">Get Quote</a></li>
                        <li><a href="#contact">Start Project</a></li>
                        <li><a href="#contact">Careers</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2024 Creative Agency. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>`

    const css = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.navbar {
    position: fixed;
    top: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    z-index: 1000;
    padding: 1rem 0;
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: #9b59b6;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav-menu a:hover {
    color: #9b59b6;
}

.hero {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
    color: white;
    text-align: center;
}

.hero-content h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: fadeInUp 1s ease;
}

.hero-content p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
    animation: fadeInUp 1s ease 0.2s both;
}

.hero-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    animation: fadeInUp 1s ease 0.4s both;
}

.btn-primary, .btn-secondary {
    padding: 12px 30px;
    border-radius: 25px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    display: inline-block;
}

.btn-primary {
    background: #9b59b6;
    color: white;
    border: 2px solid #9b59b6;
}

.btn-primary:hover {
    background: transparent;
    color: white;
}

.btn-secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
}

.btn-secondary:hover {
    background: white;
    color: #9b59b6;
}

section {
    padding: 80px 0;
}

section h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #333;
}

.services {
    background: #f8f9fa;
}

.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
}

.service-card {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
    text-align: center;
}

.service-card:hover {
    transform: translateY(-5px);
}

.service-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
}

.service-card h3 {
    margin-bottom: 1rem;
    color: #333;
    font-size: 1.5rem;
}

.service-card p {
    color: #666;
    margin-bottom: 1.5rem;
    line-height: 1.6;
}

.service-features {
    list-style: none;
    text-align: left;
}

.service-features li {
    padding: 0.5rem 0;
    color: #666;
    position: relative;
    padding-left: 1.5rem;
}

.service-features li:before {
    content: "✓";
    position: absolute;
    left: 0;
    color: #9b59b6;
    font-weight: bold;
}

.work {
    background: white;
}

.work-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
}

.work-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
}

.work-image {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.image-placeholder {
    color: white;
    font-size: 1.5rem;
    font-weight: bold;
}

.work-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 1.5rem;
    transform: translateY(100%);
    transition: transform 0.3s ease;
}

.work-item:hover .work-overlay {
    transform: translateY(0);
}

.work-overlay h3 {
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
}

.work-overlay p {
    font-size: 0.9rem;
    opacity: 0.8;
}

.contact {
    background: #f8f9fa;
}

.contact-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    max-width: 1000px;
    margin: 0 auto;
}

.contact-info h3 {
    margin-bottom: 1rem;
    color: #333;
}

.contact-info p {
    margin-bottom: 2rem;
    color: #666;
}

.contact-details {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.contact-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #666;
}

.contact-icon {
    font-size: 1.2rem;
}

.contact-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.contact-form input,
.contact-form select,
.contact-form textarea {
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-family: inherit;
}

.contact-form textarea {
    resize: vertical;
}

.contact-form button {
    align-self: flex-start;
}

.footer {
    background: #333;
    color: white;
    padding: 3rem 0 1rem;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer-section h3,
.footer-section h4 {
    margin-bottom: 1rem;
    color: #9b59b6;
}

.footer-section ul {
    list-style: none;
}

.footer-section ul li {
    margin-bottom: 0.5rem;
}

.footer-section ul li a {
    color: #ccc;
    text-decoration: none;
    transition: color 0.3s ease;
}

.footer-section ul li a:hover {
    color: #9b59b6;
}

.footer-bottom {
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid #555;
    color: #ccc;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .nav-menu {
        display: none;
    }
    
    .hero-content h1 {
        font-size: 2rem;
    }
    
    .hero-buttons {
        flex-direction: column;
        align-items: center;
    }
    
    .contact-content {
        grid-template-columns: 1fr;
    }
    
    .services-grid {
        grid-template-columns: 1fr;
    }
    
    .work-grid {
        grid-template-columns: 1fr;
    }
}`

    const javascript = `// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission handling
document.querySelector('.contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you for your message! We\'ll get back to you soon.');
});

// Add scroll effect to navbar
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    }
});

// Add animation to service cards and work items on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card, .work-item').forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(item);
});

console.log('Creative agency website loaded successfully!');`

    return {
      html,
      css,
      javascript,
      description: `Generated creative agency website based on your prompt: "${prompt}"`
    }
  }

  const saveApiKey = (key) => {
    setApiKey(key)
    localStorage.setItem('gemini_api_key', key)
  }

  const saveHuggingFaceKey = (key) => {
    setHuggingFaceKey(key)
    localStorage.setItem('huggingface_api_key', key)
  }

  const saveSelectedProvider = (provider) => {
    setSelectedProvider(provider)
    localStorage.setItem('selected_provider', provider)
  }

  const value = {
    apiKey,
    huggingFaceKey,
    selectedProvider,
    saveApiKey,
    saveHuggingFaceKey,
    saveSelectedProvider,
    generateWebsite,
  }

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  )
} 