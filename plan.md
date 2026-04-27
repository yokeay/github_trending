# 迭代计划 / Iteration Plan

> 业务前缀 (Business Prefix): `gth_`

## 概述

GitHub Trending Explorer — 发现增长最快的开源项目，支持多分类浏览、关键字搜索、时间范围过滤、客户端排序、项目详情、API 限流显示。

---

## v0.1.0 — 基础框架搭建 ✅

- [x] Next.js 16 + TypeScript 初始化
- [x] Tailwind CSS v4 + shadcn/ui 组件体系
- [x] next-themes 日/夜间主题切换
- [x] next-intl i18n 国际化（zh / en）
- [x] SQLite + Drizzle ORM 数据库层
- [x] 三套环境配置 (dev / staging / prod)
- [x] Vitest 测试配置
- [x] Docker + docker-compose
- [x] ESLint + Prettier + lint-staged + husky
- [x] commitlint Conventional Commits 规范
- [x] plan.md + maintain.md 文档初始化
- [x] 环境变量配置（.env.example）
- [x] 数据库迁移方案（Drizzle）
- [x] 项目 Git 初始化 + 初始 commit

---

## v0.2.0 — API 层迁移 ✅

- [x] 迁移 GitHub API 封装 (`src/lib/github.ts`)
- [x] 迁移 API Routes:
  - [x] `GET /api/categories`
  - [x] `GET /api/repos`
  - [x] `GET /api/repo/[owner]/[repo]`
  - [x] `GET /api/bookmarks`
  - [x] `GET/PUT /api/user-pref`
- [x] 统一错误码规范 (`{code, message, data}`)
- [x] 迁移 SQLite 缓存层（替代内存 Map）
- [x] 前端 API 请求封装 (`src/lib/api-client.ts`)
- [x] 审计日志写入

---

## v0.3.0 — 前端组件重构 ✅

- [x] Header（Logo + 限流徽章）
- [x] CategoryPills 分类标签组
- [x] SearchToolbar 搜索工具栏
- [x] RepoTable 仓库表格
- [x] Pagination 分页组件
- [x] RepoExplorer 页面组件
- [x] ThemeToggle 主题切换按钮
- [x] Loading / Empty / Error 状态
- [x] 日/夜间主题配色（黑白灰为主色）
- [x] i18n 国际化支持

---

## v0.4.0 — 测试 + 文档

- [ ] Vitest 单元测试覆盖（lib/utils, lib/github, lib/cache）
- [ ] 组件测试（RepoTable, CategoryPills, SearchToolbar）
- [ ] GitHub API Mock 测试
- [ ] 测试覆盖率报告
- [ ] 完善 README.md（含业务前缀说明）
- [ ] 完善 maintain.md 迭代记录

---

## v0.5.0 — 工程化完善

- [ ] CI/CD 脚本（lint → audit → test → build → commit → push）
- [ ] 依赖安全扫描（npm audit，高危阻断）
- [ ] 灾难备份与恢复方案（含加密备份）
- [ ] 数据目录初始化脚本
- [ ] README 补充环境配置说明

---

## v1.0.0 — 正式发布

- [ ] 中版本合并到 main 分支
- [ ] 打 tag `v1.0.0`
- [ ] 发布前最终审计
