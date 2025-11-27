# Error Reporting Setup Guide

This guide explains how to set up error reporting for the OnePlus 12 Pro Tracker using Sentry, a popular error tracking and monitoring service.

## Overview

The tracker includes built-in support for Sentry error reporting. When configured, the app automatically captures and reports:

- **JavaScript errors** in React components (via ErrorBoundary)
- **Unhandled errors** (window error events)
- **Unhandled promise rejections**
- **Custom error events** for debugging

## Quick Start

### 1. Create a Sentry Account and Project

1. Go to [Sentry.io](https://sentry.io) and sign up for a free account
2. Create a new project:
   - Click **Projects** → **Create Project**
   - Select **React** as the platform
   - Name your project (e.g., "tracker")
   - Click **Create Project**

### 2. Get Your DSN

After creating the project, Sentry will show you a DSN (Data Source Name). It looks like:

```
https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@oXXXXX.ingest.sentry.io/XXXXXXX
```

You can also find it later in:
**Settings** → **Projects** → **[Your Project]** → **Client Keys (DSN)**

### 3. Configure the Environment Variable

#### For Local Development

Create a `.env.local` file in the project root:

```env
VITE_SENTRY_DSN=https://your-dsn-here@oXXXXX.ingest.sentry.io/XXXXXXX
```

#### For Production Deployment

Add the `VITE_SENTRY_DSN` secret to your CI/CD environment:

**GitHub Actions:**
1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `VITE_SENTRY_DSN`
4. Value: Your Sentry DSN
5. Click **Add secret**

Then update your workflow to use the secret:

```yaml
env:
  VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
```

### 4. Verify the Setup

1. Start the development server: `npm run dev`
2. Open the browser console
3. You should see: `Error reporting initialized`

To test error reporting:
1. Open your browser's developer tools console
2. Run: `throw new Error('Test error')`
3. Check your Sentry dashboard for the error

## Configuration Options

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SENTRY_DSN` | Yes | Your Sentry Data Source Name |

### Built-in Features

The error reporting integration includes:

- **Automatic error capture**: All errors in React components are captured
- **Performance tracing**: Basic performance monitoring (10% sample rate in production)
- **Session replay**: On-error replays to help debug issues
- **Breadcrumbs**: Trail of events leading up to an error

## Using Error Reporting in Code

### Capturing Custom Errors

```typescript
import { captureError } from './utils/errorReporting';

try {
  await riskyOperation();
} catch (error) {
  captureError(error, 'error', {
    component: 'WorkoutPlayer',
    action: 'saveWorkout',
    extra: { workoutId: 123 }
  });
}
```

### Adding Context with Breadcrumbs

```typescript
import { addBreadcrumb } from './utils/errorReporting';

// Add breadcrumbs before important actions
addBreadcrumb('User clicked save', 'ui', { workoutId: 123 });
```

### Setting User Context

```typescript
import { setErrorReportingUser } from './utils/errorReporting';

// On user sign in
setErrorReportingUser({
  id: user.uid,
  email: user.email,
});

// On user sign out
setErrorReportingUser(null);
```

### Severity Levels

The `captureError` function supports these severity levels:

- `fatal`: App crash or critical failure
- `error`: Standard error (default)
- `warning`: Potential issues
- `info`: Informational events

## Sentry Dashboard Features

Once errors are flowing to Sentry, you can:

1. **View error details**: Stack traces, browser info, user context
2. **Track error trends**: See if errors are increasing or decreasing
3. **Set up alerts**: Get notified when new errors occur
4. **Analyze performance**: View slow operations and bottlenecks
5. **Watch session replays**: See what users did before an error

## Privacy Considerations

The error reporting is configured with privacy in mind:

- **Text masking**: Session replays mask all text content
- **Media blocking**: Media elements are blocked in replays
- **No PII by default**: User data is only sent if you explicitly call `setErrorReportingUser`
- **Error sampling**: You control how many errors are sent

## Disabling Error Reporting

To disable error reporting:

1. Remove or don't set the `VITE_SENTRY_DSN` environment variable
2. The app will continue to work normally, logging errors to the console only

## Troubleshooting

### Errors Not Appearing in Sentry

1. **Check the DSN**: Ensure `VITE_SENTRY_DSN` is set correctly
2. **Check the console**: Look for "Error reporting initialized" message
3. **Check network tab**: Look for requests to `sentry.io`
4. **Wait a moment**: Errors may take a few seconds to appear in the dashboard

### Too Many Errors

1. Adjust the sample rate in `src/utils/errorReporting.ts`:
   ```typescript
   sampleRate: 0.5, // Only capture 50% of errors
   ```

2. Add error filtering in the `beforeSend` hook to ignore specific errors

### Performance Impact

Sentry is designed to be lightweight. The SDK:
- Is loaded asynchronously
- Has minimal bundle size impact (~20KB gzipped)
- Uses efficient batching for error transport

## Advanced Configuration

For advanced use cases, edit `src/utils/errorReporting.ts`:

```typescript
Sentry.init({
  dsn,
  // Adjust sample rates
  sampleRate: 1.0,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Add custom integrations
  integrations: [...],
  
  // Filter errors
  beforeSend(event) {
    // Return null to drop the event
    if (event.message?.includes('Non-critical')) {
      return null;
    }
    return event;
  },
});
```

## Related Documentation

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Source Maps](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Firebase Setup](FIREBASE_SETUP.md)
- [Deployment Guide](DEPLOYMENT.md)
