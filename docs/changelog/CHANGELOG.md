# Changelog

## [Latest] - 2024-12-19

### Removed
- 删除了CTA (Call-to-Action) 组件
  - 移除了 `web/components/cta.tsx` 文件
  - 从 `web/components/landing-page.tsx` 中移除了CTA组件的导入和使用

### Added
- 恢复了Base32编码解释页面 (EncodingExplained)
  - 将 `EncodingExplained` 组件重新添加到主页面中
  - 组件包含完整的Base32编码解释，包括：
    - IPv4和IPv6的Base32编码说明
    - 双栈编码解释
    - 多种编程语言的实现示例 (Python, JavaScript, TypeScript, Go, Java)
  - 支持中英文双语显示

### Updated
- 更新了 `web/components/landing-page.tsx`
  - 添加了 `EncodingExplained` 组件的导入
  - 将编码解释页面插入到 "How It Works" 和 "Interactive Demo" 之间

### Testing
- 新增了 `web/components/__tests__/encoding-explained.test.tsx` 测试文件
- 更新了 `web/components/__tests__/landing-page.test.tsx` 以反映新的组件结构

### Technical Details
- `EncodingExplained` 组件使用现有的字典系统支持国际化
- 组件包含代码高亮功能，支持5种编程语言的语法高亮
- 维持了现有的导航链接 (`#encoding-explained`) 的功能性

### Notes
- 所有现有的Base32编码功能保持不变，这次修改只是恢复了用户界面中的解释页面
- 项目使用的是Base32编码而非Base64编码，这是为了更好地适应DNS域名规范 