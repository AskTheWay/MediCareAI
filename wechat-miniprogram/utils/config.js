/**
 * API base URL switch:
 * - local: Desktop simulator in WeChat DevTools
 * - lan:   Real phone debugging in same LAN (replace with your PC LAN IP)
 * - remote: Public server
 */
const API_ENV = 'local'; // 'local' | 'lan' | 'remote'

const API_BASE_URL_MAP = {
  local: 'http://127.0.0.1:8000/api/v1',
  lan: 'http://192.168.1.100:8000/api/v1', // TODO: replace with your computer LAN IP
  remote: 'https://8.137.177.147/api/v1',
};

const API_BASE_URL = API_BASE_URL_MAP[API_ENV];
const DEFAULT_TIMEOUT = 30000;

module.exports = {
  API_ENV,
  API_BASE_URL,
  DEFAULT_TIMEOUT,
};
