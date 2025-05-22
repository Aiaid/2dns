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
   - 选择 "Deploy Next.js site to Pages" 工作流程
   - 点击 "Run workflow" 并选择分支（通常是 `main`）

3. **在仓库设置中配置 GitHub Pages**
   
   - 转到您的 GitHub 仓库
   - 点击 "Settings"
   - 在侧边栏中向下滚动到 "Pages" 部分
   - 在 "Build and deployment" 下：
     - Source：选择 "GitHub Actions"
     - 这将自动使用 GitHub Actions 工作流程的输出

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

1. **使用调试工具**
   
   - 访问调试工具：`https://[username].github.io/2dns/github-pages-debug.html`
   - 此工具将显示有关您的部署的信息，并帮助诊断问题
   - 运行导航和资源测试，检查特定路径是否可访问

2. **检查工作流程运行**
   
   - 转到 "Actions" 选项卡，查看工作流程是否成功完成
   - 如果有错误，修复它们并再次推送

3. **检查基本路径配置**
   
   - 如果链接或资源损坏，确保 `next.config.mjs` 中的 `basePath` 设置正确
   - 工作流程中的环境变量 `NEXT_PUBLIC_BASE_PATH` 应设置为 `/2dns`

4. **权限问题**
   
   - 如果您看到类似 "Permission denied to github-actions[bot]" 的错误，请确保工作流程具有适当的权限
   - 检查工作流程文件是否包含以下权限部分：
     ```yaml
     permissions:
       contents: write
       pages: write
       id-token: write
     ```
   - 您可能还需要检查仓库设置中的 Settings → Actions → General → Workflow permissions，
     并确保选择了 "Read and write permissions"

5. **检查依赖项和 Node.js 版本**

   工作流程使用：
   - Node.js 版本 22
   - pnpm 版本 10.2.0
   
   如果您遇到构建问题，请检查您的应用程序是否与这些版本兼容。

6. **了解重定向逻辑**

   该项目使用多层方法在 GitHub Pages 上正确处理重定向：
   
   - **404.html**：`web/public` 目录中的此文件处理所有 404 错误并重定向到适当的页面。它：
     - 检测网站是否在 GitHub Pages 上运行
     - 正确处理基本路径（`/2dns`）
     - 在需要时重定向到特定语言的页面
     - 处理查询参数以保持原始请求的路径
   
   - **index.html**：`web/public` 目录中的此文件处理对网站根目录的直接访问。它：
     - 使用带有正确基本路径的绝对 URL
     - 保留搜索参数和哈希片段
     - 默认重定向到英文版本
   
   - **page.tsx**：根页面组件处理 Next.js 应用程序内的客户端重定向：
     - 使用 `window.location.replace` 进行可靠的重定向
     - 正确处理来自环境变量的基本路径
     - 保留搜索参数和哈希片段
   
   - **not-found.tsx**：Next.js 内的 404 组件：
     - 检测 GitHub Pages 环境
     - 将原始路径作为参数重定向到自定义 404.html
     - 当 JavaScript 被禁用时提供备用 UI

   如果您需要修改重定向逻辑，请确保在所有这些文件中保持一致性。

7. **检查 public 目录中的 HTML 文件**
   
   - `web/public` 目录中的 `index.html` 和 `404.html` 文件对 GitHub Pages 很重要
   - 它们处理用户直接访问您的网站时的重定向和回退
   - 确保它们正确处理 GitHub Pages 的基本路径 (`/2dns`)

8. **自定义域名（可选）**
   
   如果您想使用自定义域名：
   
   - 在 GitHub Pages 设置中添加您的域名
   - 在 `web/public` 目录中创建一个包含您域名的 CNAME 文件
   - 使用自定义域名时，将 `next.config.mjs` 中的 `basePath` 更新为空字符串

## 维护您的网站

- 当您向 `main` 分支上的 `web/` 目录推送更改时，网站将自动重建和部署
- 您也可以从 "Actions" 选项卡手动触发重建
- 工作流程包含缓存系统，可加快构建速度（对于依赖项和 Next.js 构建缓存）
