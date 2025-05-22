# Setting Up GitHub Pages for 2DNS

This guide will help you set up GitHub Pages to host the web frontend of your 2DNS project.

## Prerequisites

1. You have already added the GitHub Pages workflow (`.github/workflows/deploy-github-pages.yml`) to your repository.
2. You have push access to the repository.

## Steps to Enable GitHub Pages

1. **Push your changes to GitHub**
   
   Make sure you've pushed the workflow file and the updated Next.js configuration to your GitHub repository.

   ```bash
   git add .github/workflows/deploy-github-pages.yml web/next.config.mjs GITHUB_PAGES_SETUP.md GITHUB_PAGES_SETUP.zh.md
   git commit -m "Add GitHub Pages workflow and configuration"
   git push origin main
   ```

2. **Run the workflow manually (optional)**
   
   You can manually trigger the workflow to build and deploy your site:
   
   - Go to your GitHub repository
   - Click on the "Actions" tab
   - Select the "Deploy Next.js site to Pages" workflow
   - Click on "Run workflow" and select the branch (usually `main`)

3. **Configure GitHub Pages in repository settings**
   
   - Go to your GitHub repository
   - Click on "Settings"
   - Scroll down to the "Pages" section in the sidebar
   - Under "Build and deployment":
     - Source: Select "GitHub Actions"
     - This will automatically use the output of your GitHub Actions workflow

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

1. **Use the Debug Tool**
   
   - Access the debug tool at `https://[username].github.io/2dns/github-pages-debug.html`
   - This tool will show you information about your deployment and help diagnose issues
   - Run the navigation and resource tests to check if specific paths are accessible

2. **Check workflow runs**
   
   - Go to the "Actions" tab to see if the workflow completed successfully
   - If there are errors, fix them and push again

3. **Check base path configuration**
   
   - If links or assets are broken, ensure the `basePath` in `next.config.mjs` is set correctly
   - The environment variable `NEXT_PUBLIC_BASE_PATH` should be set to `/2dns` in the workflow

4. **Permission issues**
   
   - If you see errors like "Permission denied to github-actions[bot]", ensure the workflow has proper permissions
   - Check that the workflow file includes the following permissions section:
     ```yaml
     permissions:
       contents: write
       pages: write
       id-token: write
     ```
   - You may also need to check repository settings under Settings → Actions → General → Workflow permissions
     and ensure "Read and write permissions" is selected

5. **Check dependencies and Node.js version**

   The workflow uses:
   - Node.js version 22
   - pnpm version 10.2.0
   
   If you're encountering build issues, check that your application is compatible with these versions.

6. **Understanding the Redirection Logic**

   The project uses a multi-layered approach to handle redirections properly on GitHub Pages:
   
   - **404.html**: This file in the `web/public` directory handles all 404 errors and redirects to the appropriate page. It:
     - Detects if the site is running on GitHub Pages
     - Handles the base path (`/2dns`) correctly
     - Redirects to language-specific pages when needed
     - Processes query parameters to maintain the original requested path
   
   - **index.html**: This file in the `web/public` directory handles direct access to the root of your site. It:
     - Uses absolute URLs with the correct base path
     - Preserves search parameters and hash fragments
     - Redirects to the English version by default
   
   - **page.tsx**: The root page component handles client-side redirection within the Next.js app:
     - Uses `window.location.replace` for reliable redirects
     - Properly handles the base path from environment variables
     - Preserves search parameters and hash fragments
   
   - **not-found.tsx**: The 404 component within Next.js:
     - Detects GitHub Pages environment
     - Redirects to the custom 404.html with the original path as a parameter
     - Provides a fallback UI when JavaScript is disabled

   If you need to modify the redirection logic, ensure you maintain consistency across all these files.

7. **Check HTML files in public directory**
   
   - The `index.html` and `404.html` files in the `web/public` directory are important for GitHub Pages
   - They handle redirects and fallbacks when users access your site directly
   - Make sure they correctly handle the base path (`/2dns`) for GitHub Pages

8. **Custom domain (optional)**
   
   If you want to use a custom domain:
   
   - Add your domain in the GitHub Pages settings
   - Create a CNAME file in the `web/public` directory with your domain
   - Update the `basePath` in `next.config.mjs` to an empty string when using a custom domain

## Maintaining Your Site

- The site will automatically rebuild and deploy when you push changes to the `web/` directory on the `main` branch
- You can also manually trigger a rebuild from the "Actions" tab
- The workflow includes a caching system for faster builds (for both dependencies and Next.js build cache)
