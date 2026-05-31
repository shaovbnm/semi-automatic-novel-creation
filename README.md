# semi-automatic-novel-creation
A semi-automatic novel creation tool for assisting with story ideas, character design, chapter planning, and draft generation.

# 小说 skills

这是面向 Claude Code 的本地小说写作 skills 项目，主要服务番茄小说写作。

## 初始化

初次解压或更新后执行：

```bash
node .agents/scripts/sync-claude-skills.js
node .agents/scripts/doctor.js
```

`.claude/skills/` 和 `.claude/shared/` 由同步脚本生成。压缩包里如果它们是空目录或链接丢失，重新运行同步脚本即可。

## 常用命令

- `/long-write`：番茄长篇开书、大纲、卷纲、细纲、正文续写和文风检查
- `/long-scan`：长篇扫榜，默认番茄
- `/long-analyze`：长篇拆文
- `/short-write`：短篇选题、设定、小节大纲、正文和去 AI 精修
- `/short-scan`：短篇扫榜和番茄短篇活动材料分析
- `/deslop`：正文去 AI 味和真人化润色

## 目录说明

- `.agents/skills/`：skill 本体
- `.agents/shared/`：skill 运行时公共依赖、公共 reference 和模板
- `.agents/scripts/`：项目维护脚本，如同步、doctor、项目规范化、文风提取
- `.claude/commands/`：Claude Code slash command 入口
- `.claude/skills/`：由 `sync-claude-skills.js` 生成的 skill 链接
- `.claude/shared/`：由 `sync-claude-skills.js` 生成的 shared 链接

## 维护脚本

```bash
node .agents/scripts/sync-claude-skills.js
node .agents/scripts/doctor.js
node .agents/scripts/build-style-profile.js --project ./作品名
node .agents/scripts/normalize-long-project.js --project ./作品名
node .agents/scripts/normalize-long-project.js --project ./作品名 --check
```

## 注意

- 不要直接编辑 `.claude/skills/`，应编辑 `.agents/skills/` 后重新同步。
- `.claude/skills/` 不应保存 skill 副本，避免 shared 引用路径失效。
- 黑岩等需要登录态的脚本不得打印 Cookie、token 或 Authorization header。
