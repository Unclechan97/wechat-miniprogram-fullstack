# 微信小程序全栈开发 · 全流程 Skill

> 一份可以直接交给 AI 编码代理（Claude Code 等）执行的**微信小程序从零到发布**全流程指南。全部内容来自一个真实小程序项目从注册、开发、上云到提审的完整实战（2026-09），所有踩坑均为真实发生并已解决。A full-lifecycle WeChat Mini Program development skill for AI coding agents (Chinese).

## 内容

```
SKILL.md                          ← 总纲，从这里开始读
references/01-启动与骨架.md
references/02-本地联调.md
references/03-上云与网关.md
references/04-发版流水线.md
references/05-真机验收与隐私.md
references/06-提审发布.md
references/07-踩坑大全.md         ← 52 条坑：现象 → 根因 → 解法
references/templates/             ← 8 个模板文件（脚本/配置）
references/templates/miniprogram-scaffold/   ← 15 文件 TypeScript 工程骨架
```

- **SKILL.md**：四个前置决策、7 阶段执行路线图（每阶段带验收标准）、高频翻车点 TOP 8、**必须人工环节总表**（去哪点、带什么材料、耗时多久）
- **`references/01-07`**：分阶段详解——启动与骨架、本地联调、云托管上云与 callContainer 网关（含 -606001 诊断方法论）、CLI 一键发版、真机验收与隐私声明、提审发布（命名/类目/审核）、52 条实战踩坑库
- **`references/templates/`**：Dockerfile、docker-compose、一键发版脚本（wxcloud CLI）、鉴权中间件、请求层骨架、压测脚本、`.env` 示例、`.dockerignore`——替换占位符即用
- **`references/templates/miniprogram-scaffold/`**：不用开发者工具 GUI 也能手写出可通过 `tsc --noEmit` 的原生 TypeScript 小程序工程（`project.config.json` 关键字段、tsconfig、typings、app 三件套、最小页面、双通道请求层）

## 已验证

- 内容经**两轮对抗性检验**：第一轮事实核验（逐条对照官方文档与实测输出），第二轮「零经验的人 + AI」影子建造实证——两个零上下文 AI 代理分别独立搭建完整小程序（真 `tsc`、真 MySQL、真容器冒烟、反向验证防假通过），暴露的 5 个 P0 缺陷已全部修复并复验通过
- 工程骨架与请求层骨架经 `tsc --noEmit` 正反双向验证（注入错误确认真报错，防"假绿灯"）

## 用法一：作为 Agent Skill 安装（多平台）

本仓库根目录就是标准 `SKILL.md`（遵循开放的 Agent Skills 规范，frontmatter 含 `name` + `description`），主流 AI 编码代理可直接安装：

### Claude Code

```bash
# 用户级（所有项目可用）
git clone https://github.com/Unclechan97/wechat-miniprogram-fullstack.git ~/.claude/skills/wechat-miniprogram-fullstack

# 或项目级
git clone https://github.com/Unclechan97/wechat-miniprogram-fullstack.git .claude/skills/wechat-miniprogram-fullstack
```

之后说"按这个 skill 帮我做一个 XX 小程序"即可被自动识别调用。

### Codex CLI

Codex 读取 `.agents/skills/`（用户级 `~/.agents/skills/`；旧路径 `~/.codex/skills/` 已废弃），要求 frontmatter 的 `name` 与目录同名——保持克隆出的目录名 `wechat-miniprogram-fullstack` 即可：

```bash
# 用户级（所有项目可用）
git clone https://github.com/Unclechan97/wechat-miniprogram-fullstack.git ~/.agents/skills/wechat-miniprogram-fullstack

# 或项目级
git clone https://github.com/Unclechan97/wechat-miniprogram-fullstack.git .agents/skills/wechat-miniprogram-fullstack
```

`/skills` 查看已加载项，`$wechat-miniprogram-fullstack` 显式调用（描述匹配时也会自动触发）。

### OpenClaw

```bash
# Git 直装（默认装到当前 workspace 的 skills/；要求仓库根有 SKILL.md——本仓库满足）
openclaw skills install git:Unclechan97/wechat-miniprogram-fullstack

# 装到全局共享目录（所有本地 agent 可用）
openclaw skills install git:Unclechan97/wechat-miniprogram-fullstack --global
```

装完开新会话（`/new`）或 `openclaw gateway restart` 使其加载；`openclaw skills list` 验证；`/skill wechat-miniprogram-fullstack` 调用。（OpenClaw 同样会读 `.agents/skills/`，可与 Codex 共用一份克隆。）

### 其他 agent（Gemini CLI / Cursor / Windsurf / Copilot 等）

它们均已支持 SKILL.md 标准（激活方式各异）：能识别 skills 目录的（如 Gemini CLI 的 `.gemini/skills/`）把仓库克隆进去即可；只支持指令文件的，在目标项目的指令文件里加一行指路——`AGENTS.md` 是跨工具通用的位置：

```markdown
微信小程序开发：遵循 .agents/skills/wechat-miniprogram-fullstack/SKILL.md，按其阶段与验收标准执行
```

各工具的 skills 目录名与规则文件位置以官方文档为准。

## 用法二：当文档读 / 交给任意 AI 代理

按 `SKILL.md` 阶段顺序执行，遇到报错按关键词查 `references/07-踩坑大全.md`。把仓库目录整个交给任意 AI 编码代理也可以。

## 适用范围与时效

- 技术路线：原生小程序（TypeScript）+ 微信云托管（callContainer 网关调优 / 免域名免备案）
- 平台规则（类目 / 命名 / 审核 / 价格）为 **2026-09/10 快照**，以 [mp.weixin.qq.com](https://mp.weixin.qq.com) 与 [developers.weixin.qq.com](https://developers.weixin.qq.com) 最新文档为准
- 受检验条件所限，开发者工具侧与云后台侧的部分行为为文档级核对（文中已逐一标注），请以官方为准

## License

[MIT](LICENSE)
