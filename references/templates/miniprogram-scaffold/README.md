# miniprogram-scaffold · 手写工程骨架（无 GUI / AI 场景用）

**用途**：不用微信开发者工具的「新建项目」向导，也能得到一份完整的、能通过 `tsc --noEmit`
、能被工具正常编译的原生 TypeScript 小程序骨架。AI 编码代理、CI、或不想点 GUI 的人直接用。

## 怎么用

1. 建目录结构，把本目录文件按下表就位（`pages/` 与 `utils/` 需自己建一级目录）：

| 本目录文件 | 放到 |
|---|---|
| `project.config.json` / `tsconfig.json` / `app.ts` / `app.json` / `app.wxss` / `sitemap.json` | 小程序工程根（如 `miniprogram/`） |
| `typings/index.d.ts` | `<根>/typings/index.d.ts` |
| `typings/types/index.d.ts` | `<根>/typings/types/index.d.ts` |
| `utils/config.ts` | `<根>/utils/config.ts` |
| `utils/identity.ts` | `<根>/utils/identity.ts` |
| `pages/index/index.{ts,wxml,wxss,json}` | `<根>/pages/index/` |
| （另拷）`templates/request-layer-skeleton.ts` | `<根>/services/api.ts` |

> 也可以直接整目录拷：`cp -r miniprogram-scaffold/. miniprogram/`（会把本 README 一起带进去，
> 无害，可留可删）。**注意：漏拷 `services/api.ts` 会报 TS2307（页面 import 了它）——它不是可选项。**

2. 装依赖并类型检查（**必须在工程目录内**跑，防假 tsc）：

```bash
cd miniprogram
npm i -D typescript miniprogram-api-typings --registry=https://registry.npmmirror.com
npx tsc --noEmit        # 应 exit 0
```

3. 替换占位符：
   - `project.config.json`：`appid`（正式开发要真实 AppID）、`projectname`
   - `utils/config.ts`：本地开发保持 `API_MODE='local'` + `BASE_URL`；上云改 `'cloud'` 并填 `CLOUD_ENV`/`CLOUD_SERVICE`

## 关键字段说明（这些是"模板会自动生成所以文档常省略"的部分）

- **`setting.useCompilerPlugins: ["typescript"]`**：工具把 `.ts` 当源文件编译的开关。**缺了它，.ts 文件形同虚设**（找不到 app.js）。工具 1.05.2109101+ 支持。
- **`setting.urlCheck: false`**：= 工具里「详情 → 本地设置 → 不校验合法域名」的文件等价物，本地联调必需（仅工具内生效，真机规则见 05 §5.3）。
- **`libVersion`**：工具调试用基础库版本；**callContainer 要求基础库 ≥ 2.23.0**，且要到 mp 后台「设置 → 基本设置 → 基础库最低版本设置」把线上最低版本也调到 ≥2.23.0。
- 若之后要「构建 npm」第三方包：构建前临时移除 `useCompilerPlugins` 的 typescript 项、构建后再加回（以官方文档为准）。
- 把 `project.config.json` 放在**仓库根**（`miniprogram/` 之外）也可以：加一行 `"miniprogramRoot": "miniprogram/"` 即可。

## 服务端配对（本地身份模拟）

骨架的 `utils/identity.ts` 在 `local` 模式下发 `X-User-Id` 头。服务端**必须**只在开发环境信任它：

```ts
// server/src/utils/identity.ts
const openid = req.header('x-wx-openid');            // callContainer 网关注入（不可伪造）
if (openid) return openid;
if (config.allowMockIdentity) {                       // = process.env.ALLOW_MOCK_IDENTITY === 'true'
  const mock = req.header('x-user-id');               // 仅本地开发
  if (mock) return mock;
}
return null;                                          // 生产没身份头 = 401
```

> ★ 上线时环境变量 `ALLOW_MOCK_IDENTITY` 必须不存在或为 `false`——否则任何人伪造
> `X-User-Id` 就能冒充他人（详见 03 §3.4 安全说明）。
