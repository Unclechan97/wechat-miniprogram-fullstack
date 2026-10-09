// 直连压测脚本模板：绕开 callContainer，直接打容器公网域名，判定 -606001 归属
//
// 用法（全部走环境变量，无内置文件依赖，克隆即跑）：
//   DIRECT_BASE=https://xxx.sh.run.tcloudbase.com node direct-stress.mjs 10
//   带请求体： STRESS_PATH=/api/asr STRESS_BODY_FILE=./body.json ...（body.json 为 UTF-8 JSON）
//   不传 STRESS_BODY_FILE 则发 GET（默认打 /health）
//   开放端点配了 guard 时：APP_SHARED_KEY=<密钥>
//
// 排查动线：直连全过 → 网关问题（加规格/减请求/加重试/走直连通道）
//           直连也挂 → 容器问题（看内存/CPU、代码崩溃、冷启动）
import { readFileSync } from 'node:fs';

const BASE = process.env.DIRECT_BASE || '';
const APP_KEY = process.env.APP_SHARED_KEY || '';
const PATH_ = process.env.STRESS_PATH || '/health';
const BODY_FILE = process.env.STRESS_BODY_FILE || '';
const N = Number(process.argv[2] || 10);

if (!BASE) {
  console.error('缺少 DIRECT_BASE（如 https://<服务>-<hash>.sh.run.tcloudbase.com）');
  process.exit(2);
}
const body = BODY_FILE ? readFileSync(BODY_FILE) : undefined; // 原样交给 fetch，避免编码坑

let ok = 0, fail = 0;
const latencies = [];

for (let i = 1; i <= N; i++) {
  const t0 = Date.now();
  try {
    const r = await fetch(`${BASE}${PATH_}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(APP_KEY ? { 'x-app-key': APP_KEY } : {}),
      },
      body,
      signal: AbortSignal.timeout(60000),
    });
    const ms = Date.now() - t0;
    if (r.ok) { ok++; latencies.push(ms); console.log(`#${i} ✅ ${ms}ms`); }
    else { fail++; console.log(`#${i} ❌ HTTP ${r.status} ${ms}ms  ${(await r.text()).slice(0, 120)}`); }
  } catch (e) {
    fail++;
    console.log(`#${i} ❌ ${Date.now() - t0}ms  ${String(e?.message || e).slice(0, 120)}`);
  }
  await new Promise((r) => setTimeout(r, 500));
}

latencies.sort((a, b) => a - b);
console.log(`\n结果: ${ok}/${N} 成功, 失败 ${fail}`);
if (latencies.length) console.log(`延迟: 中位 ${latencies[Math.floor(latencies.length / 2)]}ms  最大 ${latencies[latencies.length - 1]}ms`);
process.exit(fail > 0 ? 1 : 0);
