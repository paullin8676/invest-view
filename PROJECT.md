# InvestView - 项目介绍文档

## 项目概述

InvestView 是一个基于 React 的 Markdown 文件查看与管理系统，专为投资分析文档管理而设计。

## 功能特性

### 1. 用户认证
- 简单的用户名/密码登录
- 登录状态自动持久化（刷新页面不丢失）
- 退出登录功能

### 2. 文件管理
- **选择文件夹**：选择包含 Markdown 文件的文件夹
- **文件扫描**：自动扫描并显示所有 .md 文件
- **视图切换**：支持列表视图和网格视图
- **文件预览**：点击文件名直接预览内容

### 3. 标签系统
- **创建标签**：支持自定义标签名称和颜色
- **编辑标签**：修改已有标签的名称和颜色
- **删除标签**：删除标签（不影响文件）
- **文件打标**：为每个文件分配多个标签
- **批量操作**：通过模态框批量管理文件标签

### 4. 导航浏览
- **按路径**：树形目录结构
- **按标签**：按标签分组显示文件
- **按文件**：完整的文件列表

### 5. Markdown 预览
- 支持 GFM（GitHub Flavored Markdown）
- 表格渲染
- 代码高亮
- 可调整字体大小

## 技术架构

### 依赖包
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-bootstrap": "^2.10.6",
  "react-markdown": "^9.0.1",
  "remark-gfm": "^4.0.0",
  "lucide-react": "^0.460.0",
  "bootstrap": "^5.3.3",
  "bootstrap-icons": "^1.11.3"
}
```

### 数据结构

```typescript
// 标签
interface Tag {
  id: string           // 唯一标识
  name: string          // 标签名称
  color: string         // 颜色值（如 #0d6efd）
}

// Markdown 文件
interface MarkdownFile {
  path: string          // 文件完整路径
  name: string          // 文件名
  tagIds: string[]      // 关联的标签 ID 数组
  content?: string      // 文件内容（预览时加载）
}

// 应用设置
interface AppSettings {
  sourcePath: string    // 源文件夹路径
  fontSize: number      // 字体大小
  tags: Tag[]           // 所有标签
  files: MarkdownFile[] // 所有文件
}
```

### 状态持久化

| 存储键 | 内容 | 用途 |
|--------|------|------|
| `investview-settings` | AppSettings JSON | 应用配置持久化 |
| `investview-auth` | User JSON | 登录状态持久化 |

## 文件结构

```
invest-view/
├── src/
│   ├── App.tsx           # 主应用组件（约800行）
│   ├── App.css           # 样式文件
│   ├── main.tsx          # 入口文件
│   └── types/
│       └── index.ts      # TypeScript 类型定义
├── public/               # 静态资源
├── index.html            # HTML 入口
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 构建配置
└── dist/                 # 构建输出目录
```

## 启动与构建

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 标签样式规范

### 颜色定义
预定义 8 种标签颜色：
```typescript
const TAG_COLORS = [
  '#0d6efd',  // 蓝色
  '#198754',  // 绿色
  '#ffc107',  // 黄色
  '#dc3545',  // 红色
  '#6f42c1',  // 紫色
  '#d63384',  // 粉色
  '#20c997',  // 青色
  '#fd7e14'   // 橙色
]
```

### 渲染状态（最终版 v1.0）

**文件列表 / 网格视图 标签 Badge：**

| 状态 | 背景色 | 文字颜色 | 指示器 |
|------|--------|----------|--------|
| 未选中 | `#f0f0f0`（浅灰） | `#999999`（灰色） | 无 |
| 选中 | `tag.color`（标签原色） | `#ffffff`（白色） | 白色小圆点（6px） |

**标签选择模态框：**

| 状态 | 圆形色块 | 文字 |
|------|----------|------|
| 未选中 | `#e9ecef`（灰色圆，16px） | 标签名 |
| 选中 | `tag.color`（标签原色圆 + ✓）| 标签名（加粗） |

### 左侧导航结构

1. 主导航（按路径 / 按标签 / 按文件）
2. 标签管理区（新建、编辑、删除标签）
3. 主数据入口（紧跟标签区，随内容自然下移）

## 后续迭代方向

1. **暗色主题**：支持亮/暗模式切换
2. **搜索功能**：全文搜索 Markdown 内容
3. **标签筛选**：在视图中按标签筛选文件
4. **文件排序**：按名称/时间/标签排序
5. **批量操作**：批量打标签、批量删除
6. **数据导出**：导出文件列表和标签关联
7. **云同步**：设置数据同步到云端

## 登录凭证

| 字段 | 值 |
|------|-----|
| 用户名 | paul |
| 密码 | M123 |
