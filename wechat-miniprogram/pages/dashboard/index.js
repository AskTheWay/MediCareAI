const { requireLogin, clearSession } = require('../../utils/auth');
const { authApi, casesApi } = require('../../utils/api');

Page({
  data: {
    loading: false,
    error: '',
    user: {},
    roleText: '-',
    caseCount: 0,
    recentCases: [],
  },

  async onShow() {
    await this.loadDashboard();
  },

  async loadDashboard() {
    this.setData({ loading: true, error: '' });

    try {
      const user = await requireLogin();
      if (!user) {
        return;
      }

      const roleMap = {
        patient: '患者',
        doctor: '医生',
        admin: '管理员',
      };

      this.setData({
        user,
        roleText: roleMap[user.role] || '未知',
      });

      const cases = await casesApi.list();
      const list = Array.isArray(cases) ? cases : [];
      const sorted = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      this.setData({
        caseCount: list.length,
        recentCases: sorted.slice(0, 3),
      });
    } catch (error) {
      const message = error && error.message
        ? `统计加载失败：${error.message}`
        : '统计加载失败，请稍后下拉刷新。';
      this.setData({
        error: message,
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  goSymptom() {
    wx.switchTab({
      url: '/pages/symptom-submit/index',
    });
  },

  goRecords() {
    wx.switchTab({
      url: '/pages/medical-records/index',
    });
  },

  goProfile() {
    wx.switchTab({
      url: '/pages/profile/index',
    });
  },

  async onLogout() {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore backend logout errors and clear local session anyway.
    }

    clearSession();
    wx.reLaunch({
      url: '/pages/login/index',
    });
  },
});
