# 🔐 Security Fix: API Key Management

## Problem

The OpenRouter API key was hardcoded in the source code and committed to GitHub, creating a serious security vulnerability.

## Solution Implemented

### 1. Environment-Based Configuration

Created three environment files:

- **`environment.ts`** - Template for development (committed to Git)
- **`environment.prod.ts`** - Production configuration (committed to Git)
- **`environment.local.ts`** - Your actual API key (NOT committed to Git)

### 2. Updated `.gitignore`

Added patterns to prevent committing sensitive files:

```
/src/environments/environment.local.ts
/src/environments/*.local.ts
```

### 3. Updated Service

Modified `open-router.ts` to use environment variables instead of hardcoded keys.

## 🚨 IMMEDIATE ACTION REQUIRED

### Step 1: Revoke the Exposed API Key

Your current API key has been exposed in Git history. You MUST:

1. Go to [OpenRouter Dashboard](https://openrouter.ai/keys)
2. **Delete** the exposed key: `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`
3. **Generate a new API key**
4. Update `src/environments/environment.local.ts` with your new key

### Step 2: Clean Git History (Optional but Recommended)

The old key is still in your Git history. To completely remove it:

```bash
# Install BFG Repo-Cleaner or use git-filter-repo
# This will rewrite history to remove the key
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src/app/services/open-router.ts" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to GitHub (WARNING: This rewrites history)
git push origin --force --all
```

**Note**: Only do this if you haven't shared the repository with others.

### Step 3: Set Up GitHub Secrets for Production

For your GitHub Pages deployment to work with the API:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `OPENROUTER_API_KEY`
5. Value: Your new API key
6. Click **Add secret**

### Step 4: Update GitHub Actions Workflow

The deploy workflow needs to inject the secret during build. Update `.github/workflows/deploy.yml`:

```yaml
- name: Build
  env:
    OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
  run: |
    # Replace the placeholder in environment.prod.ts
    sed -i "s|openRouterApiKey: ''|openRouterApiKey: '$OPENROUTER_API_KEY'|g" src/environments/environment.prod.ts
    npm run build -- --base-href=/chess-teacher/
```

## 📝 How to Use

### Local Development

1. Your API key is in `src/environments/environment.local.ts`
2. This file is ignored by Git
3. The app will use this key when running locally

### Production Deployment

1. GitHub Actions will use the secret from repository settings
2. The secret is injected during the build process
3. Never committed to the repository

## ⚠️ Best Practices Going Forward

1. **Never commit API keys** to version control
2. **Always use environment variables** for sensitive data
3. **Rotate keys regularly** as a security practice
4. **Use different keys** for development and production
5. **Monitor API usage** to detect unauthorized access

## 🔍 Verification

After implementing these changes:

- ✅ API key removed from source code
- ✅ Environment files created
- ✅ `.gitignore` updated
- ✅ Service updated to use environment variables
- ⏳ Old key needs to be revoked (manual step)
- ⏳ GitHub secret needs to be configured (manual step)

## Alternative: Backend Proxy (Recommended for Production)

For better security, consider creating a backend API that:

1. Stores the API key server-side
2. Accepts requests from your frontend
3. Makes OpenRouter API calls on behalf of the frontend
4. Returns results to the frontend

This prevents exposing the API key in the client-side code entirely.
