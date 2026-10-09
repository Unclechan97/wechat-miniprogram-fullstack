// 最小页面骨架：替换成你的业务逻辑（请求层见 services/api.ts）
import { request } from '../../services/api';

interface TodayResp {
  cups: number;
}

Page({
  data: {
    cups: 0,
    ready: false,
  },

  onLoad() {
    this.refresh();
  },

  async refresh() {
    try {
      const r = await request<TodayResp>('GET', '/api/records/today');
      this.setData({ cups: r.cups, ready: true });
    } catch (e) {
      wx.showToast({ title: String((e as Error).message).slice(0, 20), icon: 'none' });
    }
  },
});
