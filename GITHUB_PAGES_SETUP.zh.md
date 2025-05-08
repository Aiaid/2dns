# 为 2DNS 设置 GitHub Pages

本指南将帮助您设置 GitHub Pages 来托管 2DNS 项目的 Web 前端。

## 前提条件

1. 您已经将 GitHub Pages 工作流程（`.github/workflows/deploy-github-pages.yml`）添加到您的仓库中。
2. 您拥有仓库的推送权限。

## 启用 GitHub Pages 的步骤

1. **将更改推送到 GitHub**
   
   确保您已将工作流程文件和更新后的 Next.js 配置推送到您的 GitHub 仓库。

   ```bash
   git add .github/workflows/deploy-github-pages.yml web/next.config.mjs GITHUB_PAGES_SETUP.md GITHUB_PAGES_SETUP.zh.md
   git commit -m "添加 GitHub Pages 工作流程和配置"
   git push origin main
   ```

2. **手动运行工作流程（可选）**
   
   您可以手动触发工作流程来构建和部署您的网站：
   
   - 转到您的 GitHub 仓库
   - 点击 "Actions" 选项卡
   - 选择 "Deploy to GitHub Pages" 工作流程
   - 点击 "Run workflow" 并选择分支（通常是 `main`）

3. **在仓库设置中配置 GitHub Pages**
   
   - 转到您的 GitHub 仓库
   - 点击 "Settings"
   - 在侧边栏中向下滚动到 "Pages" 部分
   - 在 "Build and deployment" 下：
     - Source：选择 "Deploy from a branch"
     - Branch：选择 "gh-pages" 和 "/ (root)"
     - 点击 "Save"

4. **等待部署**
   
   - 第一次部署可能需要几分钟
   - 您可以在 "Actions" 选项卡中查看状态
   - 部署完成后，GitHub 将显示一条消息，其中包含您网站的 URL（通常是 `https://[username].github.io/2dns/`）

5. **验证您的网站**
   
   - 访问 GitHub 提供的 URL
   - 确保所有页面和功能按预期工作
   - 检查图像和样式等资源是否正确加载

## 故障排除

如果您的网站没有出现或有问题：

1. **检查工作流程运行**
   
   - 转到 "Actions" 选项卡，查看工作流程是否成功完成
   - 如果有错误，修复它们并再次推送

2. **验证 gh-pages 分支**
   
   - 检查是否创建了 `gh-pages` 分支
   - 确保它包含构建的网站文件

3. **检查基本路径配置**
   
   - 如果链接或资源损坏，确保 `next.config.mjs` 中的 `basePath` 设置正确
   - 工作流程中的环境变量 `NEXT_PUBLIC_BASE_PATH` 应设置为 `/2dns`

4. **自定义域名（可选）**
   
   如果您想使用自定义域名：
   
   - 在 GitHub Pages 设置中添加您的域名
   - 在 `web/public` 目录中创建一个包含您域名的 CNAME 文件
   - 使用自定义域名时，将 `next.config.mjs` 中的 `basePath` 更新为空字符串

## 维护您的网站

- 当您向 `main` 分支上的 `web/` 目录推送更改时，网站将自动重建和部署
- 您也可以从 "Actions" 选项卡手动触发重建
