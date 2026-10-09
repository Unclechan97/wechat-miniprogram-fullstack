import { CLOUD_ENV } from './utils/config';

App<IAppOption>({
  onLaunch() {
    // ★ callContainer 前置条件：必须先 wx.cloud.init（全项目一次）
    //   漏了会报"云能力未初始化/环境不存在"类错误——别误判成 -606001（见 03 §3.2）
    if (CLOUD_ENV) {
      if (wx.cloud) {
        wx.cloud.init({ env: CLOUD_ENV, traceUser: true });
      } else {
        console.error('[app] 当前基础库不支持 wx.cloud，请把基础库最低版本设为 ≥2.23.0');
      }
    } else {
      console.warn('[app] CLOUD_ENV 为空：cloud 模式将不可用（本地 local 模式不受影响）');
    }
  },
});
