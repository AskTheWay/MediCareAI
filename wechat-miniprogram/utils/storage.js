const ACCESS_TOKEN_KEY = 'medicare_access_token';
const REFRESH_TOKEN_KEY = 'medicare_refresh_token';

function getAccessToken() {
  return wx.getStorageSync(ACCESS_TOKEN_KEY) || '';
}

function getRefreshToken() {
  return wx.getStorageSync(REFRESH_TOKEN_KEY) || '';
}

function setTokens(accessToken, refreshToken) {
  if (accessToken) {
    wx.setStorageSync(ACCESS_TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    wx.setStorageSync(REFRESH_TOKEN_KEY, refreshToken);
  }
}

function clearTokens() {
  wx.removeStorageSync(ACCESS_TOKEN_KEY);
  wx.removeStorageSync(REFRESH_TOKEN_KEY);
}

module.exports = {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
};
