# 迭代维护记录 / Maintenance Log

> 版本格式: `X.Y.Z` — 大版本(X) / 中版本(Y) / 小版本(Z)

---

## v0.1.0 — 基础框架搭建

**日期**: 2026-04-27
**类型**: 中版本
**负责人**: Claude

### 变更内容

#### 新增

- 全新 Next.js 16 + TypeScript 项目，从 Express + 纯 HTML 重构而来
- Tailwind CSS v4 + shadcn/ui 组件体系
- next-themes 日/夜间主题切换，支持系统跟随
- next-intl i18n 国际化，初始支持中文(zh)和英文(en)
- SQLite 数据库 + Drizzle ORM
- 三套环境配置（.env.development / .env.staging / .env.production）
- Vitest 测试框架配置
- Docker 多阶段构建 + docker-compose.yml
- ESLint + Prettier + lint-staged + husky pre-commit hooks
- commitlint Conventional Commits 规范
- plan.md 迭代计划 + maintain.md 维护记录
- 环境变量模板（.env.example），包含所有配置字段说明
- Drizzle 数据库迁移方案
- 项目 Git 仓库初始化

#### 项目结构

```
src/
├── app/
│   ├── [locale]/           # i18n 路由分组
│   │   ├── layout.tsx      # locale 布局 + NextIntlClientProvider
│   │   └── page.tsx        # 首页（占位）
│   ├── globals.css         # Tailwind v4 + shadcn 主题变量
│   └── layout.tsx          # 根布局
├── components/
│   ├── ui/                 # shadcn 基础组件
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── badge.tsx
│   │   ├── table.tsx
│   │   ├── skeleton.tsx
│   │   └── card.tsx
│   ├── theme-provider.tsx  # next-themes provider
│   └── theme-toggle.tsx      # 日/夜切换按钮
├── lib/
│   ├── utils.ts            # cn() 工具函数
│   └── db/
│       ├── index.ts        # Drizzle 连接
│       └── schema.ts      # 数据表定义（gth_cache / gth_bookmark / gth_audit_log / gth_user_pref）
├── i18n/
│   ├── routing.ts
│   ├── request.ts
│   └── messages/
│       ├── zh.json
│       └── en.json
├── middleware.ts           # next-intl 中间件
```

#### 数据库表（业务前缀: gth_）

| 表名 | 用途 |
|------|------|
| `gth_cache` | API 缓存（key / data / expires_at） |
| `gth_bookmark` | 用户收藏项目 |
| `gth_audit_log` | 操作审计日志 |
| `gth_user_pref` | 用户偏好设置 |

### 修复问题

- 无

### 迁移说明

- 从 `/myproject/javascript/nextjs/github_trending/` 下的 Express 旧项目迁移
- 旧文件已备份至 `_backup/` 目录
- GitHub API 逻辑待迁移至 API Routes（v0.2.0）
- 前端 UI 待迁移至 shadcn/ui 组件（v0.3.0）

### 操作步骤

1. 停止旧 Express 服务（port 3000）
2. 备份旧文件至 `_backup/`
3. 使用 `create-next-app` 初始化新项目
4. 安装 `next-themes class-variance-authority clsx tailwind-merge lucide-react next-intl better-sqlite3 drizzle-orm`
5. 安装 dev 依赖：`drizzle-kit vitest @testing-library/* lint-staged husky @commitlint/* prettier eslint-config-prettier @vitejs/plugin-react vite-tsconfig-paths`
6. 手动创建 shadcn/ui 组件（Button / Dialog / Input / Select / Badge / Table / Skeleton / Card）
7. 配置 next-intl（routing / request / messages / middleware / [locale] layout）
8. 配置 next-themes（ThemeProvider / ThemeToggle）
9. 创建 SQLite 数据库 schema（Drizzle）
10. 配置 Docker + docker-compose
11. 配置 husky + lint-staged + commitlint
12. 初始化 Git 仓库并提交

### 依赖更新

- 旧依赖：express dotenv https
- 新依赖：next-intl next-themes better-sqlite3 drizzle-orm lucide-react 等（见 package.json）
