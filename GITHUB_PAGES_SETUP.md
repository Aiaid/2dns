# Setting Up GitHub Pages for 2DNS

This guide will help you set up GitHub Pages to host the web frontend of your 2DNS project.

## Prerequisites

1. You have already added the GitHub Pages workflow (`.github/workflows/deploy-github-pages.yml`) to your repository.
2. You have push access to the repository.

## Steps to Enable GitHub Pages

1. **Push your changes to GitHub**
   
   Make sure you've pushed the workflow file and the updated Next.js configuration to your GitHub repository.

   ```bash
   git add .github/workflows/deploy-github-pages.yml web/next.config.mjs GITHUB_PAGES_SETUP.md
   git commit -m "Add GitHub Pages workflow and configuration"
   git push origin main
   ```

2. **Run the workflow manually (optional)**
   
   You can manually trigger the workflow to build and deploy your site:
   
   - Go to your GitHub repository
   - Click on the "Actions" tab
   - Select the "Deploy to GitHub Pages" workflow
   - Click on "Run workflow" and select the branch (usually `main`)

3. **Configure GitHub Pages in repository settings**
   
   - Go to your GitHub repository
   - Click on "Settings"
   - Scroll down to the "Pages" section in the sidebar
   - Under "Build and deployment":
     - Source: Select "Deploy from a branch"
     - Branch: Select "gh-pages" and "/ (root)"
     - Click "Save"

4. **Wait for deployment**
   
   - The first deployment may take a few minutes
   - You can check the status in the "Actions" tab
   - Once deployed, GitHub will show a message with the URL to your site (usually `https://[username].github.io/2dns/`)

5. **Verify your site**
   
   - Visit the URL provided by GitHub
   - Ensure all pages and functionality work as expected
   - Check that assets like images and styles are loading correctly

## Troubleshooting

If your site doesn't appear or has issues:

1. **Check workflow runs**
   
   - Go to the "Actions" tab to see if the workflow completed successfully
   - If there are errors, fix them and push again

2. **Verify the gh-pages branch**
   
   - Check if the `gh-pages` branch was created
   - Ensure it contains the built website files

3. **Check base path configuration**
   
   - If links or assets are broken, ensure the `basePath` in `next.config.mjs` is set correctly
   - The environment variable `NEXT_PUBLIC_BASE_PATH` should be set to `/2dns` in the workflow

4. **Custom domain (optional)**
   
   If you want to use a custom domain:
   
   - Add your domain in the GitHub Pages settings
   - Create a CNAME file in the `web/public` directory with your domain
   - Update the `basePath` in `next.config.mjs` to an empty string when using a custom domain

## Maintaining Your Site

- The site will automatically rebuild and deploy when you push changes to the `web/` directory on the `main` branch
- You can also manually trigger a rebuild from the "Actions" tab
