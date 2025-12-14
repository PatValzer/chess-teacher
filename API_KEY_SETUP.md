# 🔐 API Key Setup Guide

This guide explains how to securely add your OpenRouter API key for deployment without exposing it in your code.

## 📋 Overview

Your application uses **GitHub Secrets** to securely store the API key. The key is injected during the build process and never committed to your repository.

## ✅ Current Setup

Your project is already configured with:

1. **Environment files** that use placeholder values
2. **GitHub Actions workflow** that injects the real API key during deployment
3. **Proper .gitignore** to prevent accidental commits

## 🚀 How to Add Your API Key

### Step 1: Get Your OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign in or create an account
3. Navigate to your API Keys section
4. Copy your API key (it starts with `sk-or-v1-...`)

### Step 2: Add the Secret to GitHub

1. Go to your GitHub repository: `https://github.com/PatValzer/chess-teacher`
2. Click on **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click the **New repository secret** button
5. Enter the following:
   - **Name**: `OPENROUTER_API_KEY`
   - **Secret**: Paste your actual API key (e.g., `sk-or-v1-xxxxxxxxxxxxx`)
6. Click **Add secret**

### Step 3: Verify the Setup

After adding the secret:

1. Push a commit to the `master` branch (or trigger the workflow manually)
2. Go to the **Actions** tab in your repository
3. Watch the deployment workflow run
4. The build step will automatically inject your API key into the production build

## 🔒 Security Features

### What's Protected

✅ **API key is stored as a GitHub Secret** - Only accessible to GitHub Actions  
✅ **Never committed to repository** - Environment files use placeholders  
✅ **Injected at build time** - Key is added during deployment, not in source code  
✅ **Not visible in logs** - GitHub automatically masks secrets in workflow logs

### How It Works

```yaml
# In .github/workflows/deploy.yml
- name: Build
  env:
    OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
  run: |
    # Inject API key into production environment file
    if [ -n "$OPENROUTER_API_KEY" ]; then
      sed -i "s|openRouterApiKey: 'YOUR_API_KEY_HERE'|openRouterApiKey: '$OPENROUTER_API_KEY'|g" src/environments/environment.prod.ts
    fi
    npm run build -- --base-href=/chess-teacher/
```

This script:

1. Reads the secret from GitHub Actions environment
2. Replaces the placeholder in `environment.prod.ts`
3. Builds the production bundle with the real API key
4. The built files are deployed (source files remain unchanged)

## 🛠️ Local Development

For local development, you have two options:

### Option A: Use environment.local.ts (Recommended)

1. Create a file `src/environments/environment.local.ts` (already in .gitignore)
2. Add your API key:
   ```typescript
   export const environment = {
     production: false,
     openRouterApiKey: 'sk-or-v1-your-actual-key-here',
   };
   ```
3. This file is ignored by Git and won't be committed

### Option B: Modify environment.ts temporarily

1. Replace `'YOUR_API_KEY_HERE'` in `src/environments/environment.ts` with your key
2. **IMPORTANT**: Never commit this change!
3. Use `git restore src/environments/environment.ts` before committing

## 📝 Important Notes

### ⚠️ Never Commit Your API Key

The following files should **NEVER** contain your real API key when committed:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

They should always have the placeholder: `'YOUR_API_KEY_HERE'`

### ✅ Safe to Commit

These files are safe to commit as-is:

- `.github/workflows/deploy.yml` - Uses `${{ secrets.OPENROUTER_API_KEY }}`
- `.gitignore` - Excludes sensitive files
- `environment.local.ts` - Already in .gitignore (won't be committed)

## 🔍 Troubleshooting

### API calls fail in production

1. Check that the secret name is exactly `OPENROUTER_API_KEY`
2. Verify the secret value is correct in GitHub Settings
3. Check the Actions logs to ensure the build step completed successfully

### API calls fail locally

1. Ensure you've added your key to `environment.ts` or `environment.local.ts`
2. Restart the development server (`ng serve`)
3. Check the browser console for error messages

### Secret not being injected

1. Verify the secret exists in **Settings** → **Secrets and variables** → **Actions**
2. Check that the workflow has permission to access secrets
3. Review the build logs in the Actions tab

## 📚 Additional Resources

- [GitHub Encrypted Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [Angular Environment Configuration](https://angular.io/guide/build#configuring-application-environments)

## 🎯 Quick Checklist

- [ ] Get API key from OpenRouter
- [ ] Add `OPENROUTER_API_KEY` secret to GitHub repository
- [ ] Verify secret name is exactly `OPENROUTER_API_KEY`
- [ ] Push a commit or manually trigger the workflow
- [ ] Check Actions tab to confirm successful deployment
- [ ] Test the deployed application

---

**Remember**: The API key in your source files should always be `'YOUR_API_KEY_HERE'`. The real key is only stored in GitHub Secrets and injected during deployment.
