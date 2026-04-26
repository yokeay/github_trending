# GitHub Trending Explorer 🔥

发现增长最快的开源项目 — AI、Rust、Python、Java、Vue、React、NestJS、C++、CI/CD 等。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置 GitHub Token（可选但推荐）
cp .env.example .env
# 编辑 .env，填入你的 GitHub Personal Access Token

# 3. 启动
npm start
```

然后打开浏览器访问 **http://localhost:3000**

## 功能

- **分类浏览** — 按 Trending / Fast Growing / AI / Rust / Python / Java / Vue / React / NestJS / C++ / CI/CD 分类
- **关键字搜索** — 在项目名和描述中搜索
- **时间范围** — 筛选最近 1 天到 90 天的活跃项目
- **排序** — 点击表头按 Stars / Forks / Issues / 语言 等排序
- **自动刷新** — 开启后每 2 分钟自动更新数据
- **项目详情** — 点击任意项目查看 Stars、Forks、License、README 等详细信息
- **API 限流显示** — 实时显示 GitHub API 剩余额度

## GitHub Token

不配置 Token 时限制为 10 次请求/分钟，配置后提升到 30 次/分钟。

创建 Token：https://github.com/settings/tokens  
不需要勾选任何 scope（只需公开读取权限）。

## 技术栈

- **后端**: Node.js + Express
- **前端**: 纯 HTML / CSS / JS（无框架依赖）
- **API**: GitHub REST API v3
- **缓存**: 内存缓存（5 分钟 TTL）

## 部署

项目可直接部署到任何支持 Node.js 的平台（Vercel、Railway、Render、Docker 等）。
