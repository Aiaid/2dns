# GitHub 和 DockerHub 自动构建设置指南

本文档提供了如何设置 GitHub Actions 与 DockerHub 集成以实现自动构建的详细步骤。

## 已完成的设置

以下文件已经被创建或修改，以支持自动构建：

1. `.github/workflows/docker-build.yml` - GitHub Actions 工作流配置
2. `README.md` 和 `README.zh.md` - 更新了安装说明，包括 Docker 选项

## 设置 GitHub 仓库密钥

为了使自动构建工作流能够将镜像推送到 DockerHub，您需要在 GitHub 仓库中添加 DockerHub 凭据作为密钥：

1. 访问您的 GitHub 仓库：https://github.com/Aiaid/2dns
2. 点击 "Settings"（设置）选项卡
3. 在左侧边栏中，点击 "Secrets and variables"（密钥和变量）> "Actions"（操作）
4. 点击 "New repository secret"（新建仓库密钥）
5. 添加以下密钥：

   - 名称：`DOCKERHUB_USERNAME`
   - 值：您的 DockerHub 用户名

   点击 "Add secret"（添加密钥）

6. 再次点击 "New repository secret"（新建仓库密钥）
   - 名称：`DOCKERHUB_TOKEN`
   - 值：您的 DockerHub 访问令牌（请勿在文档中保存实际令牌值）

   点击 "Add secret"（添加密钥）

## 工作流程说明

GitHub Actions 工作流（`.github/workflows/docker-build.yml`）配置为：

- 在以下情况下触发：
  - 推送到 `main` 分支
  - 创建以 `v` 开头的标签（例如 `v1.0.0`）
  - 针对 `main` 分支的拉取请求

- 构建流程：
  - 检出代码
  - 设置 Docker Buildx
  - 使用您的凭据登录到 DockerHub
  - 提取 Docker 元数据（用于标签和标签）
  - 构建并推送 Docker 镜像

## 自动标签策略

当您推送代码或创建标签时，工作流会自动为 Docker 镜像应用以下标签：

- 推送到 `main` 分支：`用户名/2dns:latest`
- 创建标签（例如 `v1.0.0`）：
  - `用户名/2dns:1.0.0`
  - `用户名/2dns:1.0`
  - `用户名/2dns:1`
- 所有构建：还会使用 Git 提交 SHA 作为标签

## 测试自动构建

设置完成后，您可以通过以下方式测试自动构建：

1. 推送更改到 `main` 分支：
   ```bash
   git add .
   git commit -m "设置 GitHub Actions 自动构建"
   git push origin main
   ```

2. 创建并推送一个新标签：
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. 在 GitHub 仓库的 "Actions" 选项卡中监控工作流运行情况
4. 在 DockerHub 仓库中验证新镜像是否已成功推送：https://hub.docker.com/repository/docker/用户名/2dns

## 故障排除

如果自动构建失败，请检查：

1. GitHub 仓库密钥是否正确设置
2. DockerHub 访问令牌是否有效
3. GitHub Actions 日志中的错误信息

如果需要更新 DockerHub 访问令牌：
1. 在 DockerHub 中生成新的访问令牌
2. 更新 GitHub 仓库中的 `DOCKERHUB_TOKEN` 密钥
