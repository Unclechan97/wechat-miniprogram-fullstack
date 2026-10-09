// 开放端点共享密钥守卫（公网直连通道防第三方蹭配额）
// 只拦截无用户数据的开放端点；账本数据仍走 callContainer（openid 网关注入，不可伪造）
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';

const OPEN_PATH_RE = /^\/api\/(asr|tts|parse)(\/|$)/; // ← 改成你的开放端点

export function openApiGuard(req: Request, res: Response, next: NextFunction) {
  if (!OPEN_PATH_RE.test(req.path)) return next();
  if (req.header('x-app-key') === config.appSharedKey) return next();
  return res.status(401).json({ error: '未授权的访问' });
}
