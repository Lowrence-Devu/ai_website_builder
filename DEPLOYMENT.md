# Deployment Guide 🚀

This guide will help you deploy your AI Website Builder to various platforms.

## Prerequisites

1. Make sure your project is working locally
2. Get your Gemini API key ready
3. Choose a deployment platform

## Platform Options

### 1. Vercel (Recommended) ⭐

**Pros**: Easy deployment, automatic HTTPS, great performance

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your repository
   - Vercel will auto-detect it's a Vite project

3. **Configure Environment Variables**
   - In your Vercel project dashboard
   - Go to Settings → Environment Variables
   - Add: `VITE_GEMINI_API_KEY` = your API key

4. **Deploy**
   - Vercel will automatically deploy on every push
   - Your site will be live at `https://your-project.vercel.app`

### 2. Netlify

1. **Build locally**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop your `dist` folder
   - Or connect your GitHub repo for auto-deploy

3. **Add Environment Variables**
   - In Netlify dashboard → Site settings → Environment variables
   - Add: `VITE_GEMINI_API_KEY` = your API key

### 3. GitHub Pages

1. **Add GitHub Pages dependency**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json**
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

4. **Enable GitHub Pages**
   - Go to your repo → Settings → Pages
   - Select `gh-pages` branch as source

### 4. Manual Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Upload to your server**
   - Upload the `dist` folder to your web server
   - Configure your server to serve `index.html` for all routes

## Environment Variables

For all deployments, you'll need to set environment variables:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Post-Deployment Checklist

- [ ] Test the application loads correctly
- [ ] Verify Gemini API key is working
- [ ] Test voice input (requires HTTPS)
- [ ] Test file downloads
- [ ] Check mobile responsiveness
- [ ] Verify dark/light mode works

## Troubleshooting

### Common Issues

1. **API Key not working**
   - Check environment variable is set correctly
   - Verify API key has sufficient credits
   - Check browser console for errors

2. **Voice input not working**
   - Voice input requires HTTPS in production
   - Check browser permissions
   - Test in Chrome/Edge (best support)

3. **Build errors**
   - Run `npm install` to ensure all dependencies
   - Check for TypeScript errors
   - Verify all imports are correct

4. **Performance issues**
   - Enable gzip compression on your server
   - Use a CDN for static assets
   - Consider code splitting for large bundles

## Security Considerations

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables
   - Consider rate limiting for production

2. **Content Security Policy**
   - Add CSP headers to prevent XSS
   - Restrict iframe sources if needed

3. **HTTPS**
   - Always use HTTPS in production
   - Required for voice input and secure API calls

## Monitoring

1. **Error Tracking**
   - Consider adding Sentry for error monitoring
   - Monitor API usage and costs

2. **Analytics**
   - Add Google Analytics or similar
   - Track user interactions and popular features

## Cost Optimization

1. **Gemini AI API**
   - Monitor usage and costs
   - Consider implementing usage limits
   - Use appropriate model (Gemini Pro)

2. **Hosting**
   - Choose appropriate hosting plan
   - Monitor bandwidth usage
   - Consider CDN for global performance

## Support

If you encounter deployment issues:

1. Check the platform's documentation
2. Review error logs
3. Test locally first
4. Check environment variables
5. Verify all dependencies are installed

---

**Happy deploying! 🎉** 