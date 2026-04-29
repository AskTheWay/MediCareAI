const { API_BASE_URL, DEFAULT_TIMEOUT } = require('./config');
const storage = require('./storage');

let refreshingPromise = null;

function buildUrl(path) {
  if (!path) {
    return API_BASE_URL;
  }
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function normalizePayload(payload) {
  if (
    payload &&
    typeof payload === 'object' &&
    Object.prototype.hasOwnProperty.call(payload, 'data') &&
    (
      Object.prototype.hasOwnProperty.call(payload, 'message') ||
      Object.prototype.hasOwnProperty.call(payload, 'code') ||
      Object.prototype.hasOwnProperty.call(payload, 'success')
    )
  ) {
    return payload.data;
  }
  return payload;
}

function extractErrorMessage(payload) {
  if (!payload) {
    return '请求失败';
  }
  if (typeof payload === 'string') {
    return payload;
  }
  return payload.detail || payload.message || payload.error || '请求失败';
}

function extractNetworkErrorMessage(error) {
  const raw = (error && (error.errMsg || error.message)) || '';
  if (!raw) {
    return '网络异常，请检查连接';
  }

  const lower = raw.toLowerCase();
  if (lower.includes('request:fail')) {
    if (lower.includes('timeout')) {
      return '请求超时，请检查网络后重试';
    }
    if (lower.includes('refused') || lower.includes('econnrefused')) {
      return '无法连接后端服务，请确认服务已启动';
    }
    if (
      lower.includes('ssl') ||
      lower.includes('certificate') ||
      lower.includes('tls') ||
      lower.includes('handshake')
    ) {
      return '网络请求失败：HTTPS证书或协议异常，请检查后端地址与协议';
    }
    return '网络请求失败，请确认后端服务已启动且地址可访问';
  }

  return raw;
}

function redirectToLogin() {
  const pages = getCurrentPages();
  const currentRoute = pages.length ? pages[pages.length - 1].route : '';
  if (currentRoute !== 'pages/login/index') {
    wx.reLaunch({
      url: '/pages/login/index',
    });
  }
}

function doWxRequest({
  url,
  method = 'GET',
  data,
  header = {},
  timeout = DEFAULT_TIMEOUT,
}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      header,
      timeout,
      success: (res) => resolve(res),
      fail: (err) => reject(err),
    });
  });
}

async function refreshAccessToken() {
  if (refreshingPromise) {
    return refreshingPromise;
  }

  const refreshToken = storage.getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  refreshingPromise = (async () => {
    try {
      const response = await doWxRequest({
        url: buildUrl('/auth/refresh'),
        method: 'POST',
        data: {
          refresh_token: refreshToken,
        },
        header: {
          'Content-Type': 'application/json',
          'X-Platform': 'patient',
        },
      });

      if (response.statusCode < 200 || response.statusCode >= 300) {
        return false;
      }

      const payload = normalizePayload(response.data);
      const accessToken = payload && payload.access_token;
      const nextRefreshToken = (payload && payload.refresh_token) || refreshToken;

      if (!accessToken) {
        return false;
      }

      storage.setTokens(accessToken, nextRefreshToken);
      return true;
    } catch (error) {
      return false;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

async function request(options) {
  const {
    url,
    method = 'GET',
    data,
    header = {},
    needAuth = true,
    retry = true,
    timeout = DEFAULT_TIMEOUT,
  } = options || {};

  const requestHeader = {
    'Content-Type': 'application/json',
    'X-Platform': 'patient',
    ...header,
  };

  if (needAuth) {
    const token = storage.getAccessToken();
    if (token) {
      requestHeader.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await doWxRequest({
      url: buildUrl(url),
      method,
      data,
      header: requestHeader,
      timeout,
    });

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return normalizePayload(response.data);
    }

    if (response.statusCode === 401 && needAuth && retry) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return request({
          ...options,
          retry: false,
        });
      }
      storage.clearTokens();
      redirectToLogin();
    }

    throw {
      statusCode: response.statusCode,
      message: extractErrorMessage(response.data),
      raw: response.data,
    };
  } catch (error) {
    if (error && typeof error.statusCode === 'number') {
      throw error;
    }

    throw {
      statusCode: 0,
      message: extractNetworkErrorMessage(error),
      raw: error,
    };
  }
}

module.exports = {
  request,
  buildUrl,
  normalizePayload,
};
