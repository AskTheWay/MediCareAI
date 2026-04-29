const storage = require('./storage');
const { authApi } = require('./api');

function setSessionFromLogin(loginResponse) {
  const tokens = loginResponse && loginResponse.tokens;
  const user = loginResponse && loginResponse.user;

  if (!tokens || !tokens.access_token) {
    throw new Error('登录响应缺少令牌');
  }

  storage.setTokens(tokens.access_token, tokens.refresh_token);
  getApp().globalData.user = user || null;
}

function clearSession() {
  storage.clearTokens();
  getApp().globalData.user = null;
}

async function refreshCurrentUser() {
  const user = await authApi.me();
  getApp().globalData.user = user;
  return user;
}

async function requireLogin() {
  const token = storage.getAccessToken();
  if (!token) {
    wx.reLaunch({ url: '/pages/login/index' });
    return null;
  }

  try {
    const user = await refreshCurrentUser();
    return user;
  } catch (error) {
    clearSession();
    wx.reLaunch({ url: '/pages/login/index' });
    return null;
  }
}

module.exports = {
  setSessionFromLogin,
  clearSession,
  refreshCurrentUser,
  requireLogin,
};
