# AI Website Builder 🚀

A powerful AI-powered website builder that generates beautiful, responsive websites from natural language prompts. Built with React, Tailwind CSS, and multiple AI providers.

## ✨ Features

- **AI-Powered Generation**: Generate complete websites using multiple AI providers
- **Live Preview**: See your website in real-time as you generate it
- **Code Editor**: Monaco Editor with syntax highlighting for HTML, CSS, and JavaScript
- **Voice Input**: Use speech recognition to describe your website
- **Dark/Light Mode**: Beautiful theme switching
- **Download ZIP**: Export your generated website as a complete ZIP file
- **Responsive Design**: All generated websites are mobile-friendly
- **Modern UI**: Clean, intuitive interface with smooth animations

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **Code Editor**: Monaco Editor
- **AI**: Google Gemini AI API / Hugging Face Inference API
- **Icons**: Lucide React
- **File Handling**: JSZip

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- AI API key (see options below)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-website-builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Setup AI API Key

You have three options for AI providers:

#### Option 1: Local Generation (Recommended - FREE)
1. **No API key required!** 
2. Click the settings icon in the header
3. Select "Local Generation" as provider
4. Start generating websites immediately

**Benefits:**
- ✅ **Completely free** - no API keys needed
- ✅ **Works offline** - no internet required
- ✅ **Instant generation** - no waiting
- ✅ **High-quality templates** - modern, responsive designs
- ✅ **No rate limits** - generate unlimited websites

#### Option 2: Hugging Face (Free with API key)
1. Go to [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. **Sign up/Login** if you don't have an account
3. Click **"New token"**
4. **Fill in the details**:
   - **Name**: `AI Website Builder`
   - **Role**: Select `Read` (this is sufficient)
5. Click **"Generate token"**
6. **Copy the token** (it starts with `hf_`)
7. In your app, click the settings icon → Select "Hugging Face" → Paste your key

**Benefits:**
- ✅ 30,000 free requests per month
- ✅ No credit card required
- ✅ Reliable service
- ✅ Fallback generation if API fails

#### Option 3: Google Gemini (Paid)
1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click the settings icon in the header
3. Select "Google Gemini" as provider
4. Enter your API key

## 🎯 How to Use

1. **Describe your website**: Enter a prompt describing the website you want to create
2. **Generate**: Click "Generate Website" or press Enter
3. **Preview**: See your website in the live preview panel
4. **Edit**: Modify the code in the Monaco Editor if needed
5. **Download**: Export your website as a ZIP file

### Example Prompts

- "Create a modern portfolio website with a hero section, about me, projects showcase, and contact form"
- "Design a product landing page with a hero banner, product features, pricing table, and testimonials"
- "Build a photography portfolio with a grid layout, image lightbox, and categories filter"
- "Create a team page with member cards, social links, and responsive design"
- "Design a creative agency website with animated sections and modern typography"
- "Build a personal blog with a clean layout, featured posts, and newsletter signup"

## 🔧 Configuration

### API Providers

The app supports multiple AI providers:

1. **Hugging Face** (Free)
   - 30,000 requests/month
   - No credit card required
   - Uses Llama-2-70b model

2. **Google Gemini** (Paid)
   - Pay-per-use pricing
   - Requires credit card
   - Uses Gemini 1.5 Pro model

### Switching Providers

1. Click the settings icon in the header
2. Select your preferred provider
3. Enter the corresponding API key
4. Save settings

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Built with React and Vite
- Styled with Tailwind CSS
- Powered by Hugging Face and Google AI
- Icons from Lucide React 