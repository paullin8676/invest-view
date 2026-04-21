# InvestView

> 一个轻量的 Markdown 文件查看与标签管理工具，专为投资分析文档而设计。

## 功能一览

| 功能 | 说明 |
|------|------|
| 📂 文件夹扫描 | 选择本地文件夹，自动识别并加载所有 `.md` 文件 |
| 🔍 文件搜索 | 支持按文件名实时搜索过滤 |
| 🗑️ 文件管理 | 删除文件记录，同时清除标签关联 |
| 🔄 刷新保留 | 重新扫描文件夹，保留已有文件的标签关联 |
| 🏷️ 标签管理 | 自定义标签颜色，为文件批量打标、筛选 |
| 📄 Markdown 预览 | 支持 GFM 语法、表格、代码块，字体大小可调 |
| 🔲 列表 / 网格视图 | 随时切换文件展示方式 |
| 💾 IndexedDB 持久化 | 所有数据存储在浏览器本地，重启不丢失 |
| 🔒 登录保护 | 简单的用户名密码认证，状态持久化 |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置登录凭证
cp .env.example .env
# 然后编辑 .env，填入你的用户名和密码

# 3. 开发模式
npm run dev

# 4. 构建生产版本
npm run build

# 5. 预览构建结果
npm run preview
```

## 登录凭证配置

凭证通过环境变量管理，**不会提交到 Git**。

```bash
# .env（复制 .env.example 后修改）
VITE_AUTH_USERNAME=your_username
VITE_AUTH_PASSWORD=your_password
```

> `.env` 已加入 `.gitignore`，安全地存储在本地。仓库中只包含 `.env.example` 模板文件。

## 使用说明

1. 配置 `.env` 并启动应用
2. 点击「选择文件夹」，选择存放 Markdown 文件的目录
3. 在左侧导航栏中创建标签，为文件打标
4. 通过「按标签」导航快速筛选分类文件
5. 点击文件名即可预览 Markdown 内容
6. 使用搜索框快速找到目标文件
7. 删除不需要的文件记录

## 技术栈

- **React 18** + **TypeScript**
- **Vite 5** 构建
- **React Bootstrap 2** + **Bootstrap 5** UI
- **react-markdown** + **remark-gfm** Markdown 渲染
- **Lucide React** 图标
- **IndexedDB** 数据持久化

## 数据说明

所有数据均存储在浏览器 IndexedDB 中，无后端依赖：

| 数据 | 说明 |
|------|------|
| `app-settings` | 标签、文件列表（含内容和标签关联）、字体大小 |
| `preview-file` | 当前预览的 Markdown 文件 |
| `user-auth` | 登录状态 |

## 项目结构

```
invest-view/
├── src/
│   ├── App.tsx          # 主应用组件
│   ├── App.css          # 自定义样式
│   ├── db.ts            # IndexedDB 操作封装
│   ├── main.tsx         # 入口文件
│   └── types/
│       └── index.ts     # TypeScript 类型定义
├── public/
├── .env.example         # 环境变量模板（提交到 Git）
├── .env                 # 本地凭证配置（不提交，需自行创建）
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 后续计划 (v1.1+)

- [ ] 暗色主题切换
- [ ] 全文搜索（Markdown 内容）
- [ ] 文件排序（名称 / 时间 / 标签）
- [ ] 数据导出（CSV / JSON）
- [ ] 标签批量操作

## License

MIT
