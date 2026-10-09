# Node 服务端镜像模板（tsx 直接跑 TS，无需编译步骤）
FROM node:20-slim

# 需要处理音视频/图片时装 ffmpeg；不需要可整段删掉。
# apt 必须换清华源：deb.debian.org 国内直连极慢（实测卡 10 分钟+）
RUN sed -i 's|deb.debian.org|mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
# 走 npmmirror（国内网络）
ENV npm_config_registry=https://registry.npmmirror.com
RUN npm install
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
# 时区固定东八区：日期边界（今天/本月）按国内算
ENV TZ=Asia/Shanghai
EXPOSE 3000
CMD ["npx", "tsx", "src/app.ts"]
