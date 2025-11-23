# Deployment Guide

This guide explains how to deploy the tracker application to production.

## Automated Deployment (Recommended)

This repository includes a GitHub Actions workflow that automatically builds and deploys the application to GitHub Pages.

### Setup GitHub Pages Deployment

1. Go to your repository settings on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. Push to the `main` branch to trigger automatic deployment

The workflow will:
- Build the application using `npm ci` and `npm run build`
- Deploy the `dist/` directory to GitHub Pages
- Provide the deployment URL in the workflow summary

### Manual Workflow Trigger

You can also manually trigger the deployment:
1. Go to **Actions** tab in your repository
2. Select **Build and Deploy** workflow
3. Click **Run workflow** button

### Workflow Features

- **Automatic deployment**: Triggers on every push to `main` branch
- **Build validation**: Runs build on pull requests without deploying
- **Node.js caching**: Faster builds with npm dependency caching
- **Concurrency control**: Prevents multiple simultaneous deployments

## Building for Production

```bash
# Install dependencies
npm install

# Create production build
npm run build
```

The build output will be in the `dist/` directory.

## Manual Deployment Options

### Option 1: Static Hosting

The `dist/` directory contains a static website that can be deployed to any static hosting service:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag and drop the `dist/` folder to Netlify
- **GitHub Pages** (manual): Copy contents of `dist/` to the gh-pages branch
- **AWS S3**: Upload `dist/` contents to an S3 bucket with static website hosting
- **Cloudflare Pages**: Connect your repo and set build command to `npm run build`

### Option 2: Simple HTTP Server

For testing locally or simple deployments:

```bash
# Using Python
cd dist && python3 -m http.server 8080

# Using Node.js
npx serve dist

# Using Vite preview (after build)
npm run preview
```

## Deployment Checklist

- [ ] Run `npm install` to ensure all dependencies are installed
- [ ] Run `npm run build` to create production build
- [ ] Verify build completed successfully (check `dist/` directory)
- [ ] Test the build locally with `npm run preview`
- [ ] Deploy the contents of the `dist/` directory
- [ ] Verify the deployed site loads correctly
- [ ] Check browser console for any errors

## Important Notes

### Base URL Configuration

If deploying to a subdirectory (e.g., `example.com/tracker/`), update `vite.config.js`:

```js
export default defineConfig({
  base: '/tracker/', // Add your subdirectory here
  // ... rest of config
})
```

### Environment Variables

The app uses localStorage for data storage. No backend API keys are required except:

- **Optional**: Gemini API key for AI coaching (user-provided via Settings)

### File Requirements

All files in `dist/` are required:
- `index.html` - Main HTML file
- `assets/*.js` - Bundled JavaScript
- `assets/*.css` - Bundled CSS
- `colors.css` - CSS custom properties
- `*.json` - Exercise and schedule data

## Troubleshooting

### Issue: White screen after deployment
- Check browser console for errors
- Verify all files in `dist/` were deployed
- Check base URL configuration

### Issue: 404 errors on reload
- Configure your hosting to serve `index.html` for all routes
- Most static hosts support this via a `_redirects` file or similar

### Issue: Styles not loading
- Verify `colors.css` and assets are deployed
- Check network tab for 404 errors
- Clear browser cache

## Performance

The production build is optimized:
- **Minified JS**: 231 KB (66 KB gzipped)
- **Optimized CSS**: 25 KB (5.7 KB gzipped)
- **Total page weight**: ~260 KB (uncompressed)

Enable gzip/brotli compression on your hosting for best performance.
