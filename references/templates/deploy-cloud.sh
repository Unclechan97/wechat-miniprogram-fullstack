#!/usr/bin/env bash
# 微信云托管 · CLI 一键部署脚本模板
# 用法：bash server/scripts/deploy-cloud.sh "这次改了什么"
#
# 一次性准备：
#   1. 控制台 → 设置 → 全局设置 → CLI 密钥 → 生成/下载私钥
#   2. 私钥存到仓库外的任意路径（默认取 $HOME/wxcloud-key.txt，可用环境变量 WXCLOUD_KEY_FILE 覆盖；
#      不要写死 D 盘等固定盘符——不同机器盘符可能不存在）
#   3. npm i -g @wxcloud/cli@2.3.3 --registry=https://registry.npmmirror.com
#
# 安全设计：
#   - 部署包从「白名单暂存目录」打出：只有明确列出的文件进包，
#     .env / node_modules / data 物理不存在于暂存目录（.dockerignore 是第二道保险）
#   - 私钥通过 $(cat 文件) 注入，不回显、不进日志
set -euo pipefail

# ── 改成你的值 ──────────────────────────────
APP_ID="<你的AppID>"
ENV_ID="<你的云托管环境ID>"
SERVICE="<你的服务名>"
REGION="ap-shanghai"                       # ap-shanghai | ap-guangzhou | ap-beijing
KEY_FILE="${WXCLOUD_KEY_FILE:-$HOME/wxcloud-key.txt}"
STAGING="${WXCLOUD_STAGING:-$HOME/<你的项目>-deploy-src}"   # 跨盘符安全：$HOME 在任意机器都存在
# ────────────────────────────────────────────

[ "$STAGING" != "/" ] && [ -n "$STAGING" ] || { echo "❌ STAGING 路径非法"; exit 1; }
cd "$(dirname "$0")/.."   # server/

# 0) 前置检查
command -v wxcloud >/dev/null || { echo "❌ 未安装 wxcloud CLI（npm i -g @wxcloud/cli@2.3.3）"; exit 1; }
if [ ! -f "$KEY_FILE" ]; then
  echo "❌ 未找到 CLI 私钥：$KEY_FILE"
  echo "   控制台 → 设置 → 全局设置 → CLI 密钥 → 生成/下载，存为上述路径后重试"
  exit 1
fi

# 1) 登录（凭据存 ~/.wxcloudconfig，已登录则跳过；换密钥先 wxcloud logout）
if [ ! -f "$HOME/.wxcloudconfig" ]; then
  echo "→ 首次登录..."
  wxcloud login -a "$APP_ID" -k "$(tr -d '\r' < "$KEY_FILE")"
fi

# 2) 重建白名单暂存目录（★ 加新文件必须显式加到这一行）
#    注意：白名单里的目录会【整目录】拷进去——scripts/ 里的冒烟中间产物
#    （req.json 等）也会被打进部署包。要么保持 scripts/ 干净，要么把上面一行
#    改成逐文件列举（只列真正要部署的脚本）。
rm -rf "$STAGING"
mkdir -p "$STAGING"
cp -r package.json tsconfig.json src scripts Dockerfile .dockerignore "$STAGING/"
echo "→ 暂存目录已同步：$STAGING"

# 3) 打包上传 + 全量发布（环境变量在控制台维护，此处不动）
cd "$STAGING"
wxcloud run:deploy . \
  -e "$ENV_ID" \
  -s "$SERVICE" \
  --region "$REGION" \
  --targetDir . \
  --dockerfile Dockerfile \
  --containerPort 3000 \
  --releaseType FULL \
  --noConfirm \
  --remark "${1:-cli 部署 $(date +%m%d-%H%M)}"

echo "✅ 部署命令已提交，构建约 1-3 分钟；首次启动等数据库唤醒多等 ~1 分钟属正常"
echo "   输出里 ResourceNotFound.TopicNotExist 是无害噪音；成功标志= check_build_image : succ"
