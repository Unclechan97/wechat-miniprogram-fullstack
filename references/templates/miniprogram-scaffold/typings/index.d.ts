/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData?: {
    /** 当前 API 模式等运行时信息，可按需扩展 */
    envVersion?: string;
  };
}
