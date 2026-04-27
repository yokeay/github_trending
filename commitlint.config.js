export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-case": [2, "always", "lower-case"],
    "type-enum": [
      2,
      "always",
      [
        "feat",     // 新功能
        "fix",      // 修复 bug
        "docs",     // 文档变更
        "style",    // 代码格式（不影响功能）
        "refactor", // 重构（不影响功能）
        "perf",     // 性能优化
        "test",     // 测试
        "build",    // 构建或依赖变更
        "ci",       // CI 配置
        "chore",    // 其他杂项
        "revert",   // 回退
      ],
    ],
  },
};
