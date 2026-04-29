const { authApi } = require('../../utils/api');
const { setSessionFromLogin } = require('../../utils/auth');
const storage = require('../../utils/storage');

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

Page({
  data: {
    email: '',
    password: '',
    loading: false,
    error: '',
  },

  onLoad(options) {
    if (options && options.email) {
      this.setData({ email: decodeURIComponent(options.email) });
    }
  },

  onShow() {
    if (storage.getAccessToken()) {
      wx.switchTab({ url: '/pages/dashboard/index' });
    }
  },

  onEmailInput(event) {
    this.setData({
      email: event.detail.value,
      error: '',
    });
  },

  onPasswordInput(event) {
    this.setData({
      password: event.detail.value,
      error: '',
    });
  },

  async onLogin() {
    const { email, password } = this.data;
    const normalizedEmail = (email || '').trim();

    if (!normalizedEmail || !password) {
      this.setData({ error: '请输入邮箱和密码后再登录。' });
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      this.setData({ error: '邮箱格式不正确，请检查后重试。' });
      return;
    }

    this.setData({ loading: true, error: '' });

    try {
      const response = await authApi.login({
        email: normalizedEmail,
        password,
        platform: 'patient',
      });

      setSessionFromLogin(response);
      wx.switchTab({ url: '/pages/dashboard/index' });
    } catch (error) {
      this.setData({
        error: error.message || '登录失败。',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  goRegister() {
    wx.navigateTo({
      url: '/pages/register/index',
    });
  },
});
