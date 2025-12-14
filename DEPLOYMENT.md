# GitHub Pages Deployment Setup

## ✅ Completed Steps

1. Created GitHub Actions workflow (`.github/workflows/deploy.yml`)
2. Updated `angular.json` with output path configuration
3. Committed and pushed changes to GitHub

## 🔧 Next Steps - Enable GitHub Pages

You need to enable GitHub Pages in your repository settings:

1. Go to your repository on GitHub: https://github.com/PatValzer/chess-teacher
2. Click on **Settings** (top menu)
3. In the left sidebar, click on **Pages** (under "Code and automation")
4. Under **Source**, select **GitHub Actions**
5. Save the settings

## 🚀 Deployment

Once you've enabled GitHub Pages:

- The workflow will automatically run when you push to the `main` or `master` branch
- You can also manually trigger it from the **Actions** tab
- Your app will be deployed to: `https://patvalzer.github.io/chess-teacher/`

## 📝 How It Works

The workflow:

1. Checks out your code
2. Installs Node.js and dependencies
3. Builds your Angular app with the correct base href (`/chess-teacher/`)
4. Uploads the build artifacts
5. Deploys to GitHub Pages

## 🔄 Manual Deployment

You can manually trigger deployment:

1. Go to the **Actions** tab in your repository
2. Click on **Deploy to GitHub Pages** workflow
3. Click **Run workflow** button
4. Select the branch and click **Run workflow**

## 🛠️ Local Testing

To test the production build locally:

```bash
npm run build -- --base-href=/chess-teacher/
```

The build output will be in `dist/chess-teacher-app/browser/`
