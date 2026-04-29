const { request, buildUrl, normalizePayload } = require('./request');
const storage = require('./storage');

const authApi = {
  login(payload) {
    return request({
      url: '/auth/login',
      method: 'POST',
      data: payload,
      needAuth: false,
    });
  },

  register(payload) {
    return request({
      url: '/auth/register',
      method: 'POST',
      data: payload,
      needAuth: false,
    });
  },

  me() {
    return request({
      url: '/auth/me',
      method: 'GET',
    });
  },

  updateMe(payload) {
    return request({
      url: '/auth/me',
      method: 'PUT',
      data: payload,
    });
  },

  logout() {
    return request({
      url: '/auth/logout',
      method: 'POST',
    });
  },
};

const patientApi = {
  getProfile() {
    return request({
      url: '/patients/me',
      method: 'GET',
    });
  },

  updateProfile(payload) {
    return request({
      url: '/patients/me',
      method: 'PUT',
      data: payload,
    });
  },

  getChronicDiseases() {
    return request({
      url: '/patients/me/chronic-diseases',
      method: 'GET',
    });
  },

  addChronicDisease(payload) {
    return request({
      url: '/patients/me/chronic-diseases',
      method: 'POST',
      data: payload,
    });
  },

  removeChronicDisease(conditionId) {
    return request({
      url: `/patients/me/chronic-diseases/${conditionId}`,
      method: 'DELETE',
    });
  },
};

const casesApi = {
  list() {
    return request({
      url: '/medical-cases/',
      method: 'GET',
    });
  },

  create(payload) {
    return request({
      url: '/medical-cases/',
      method: 'POST',
      data: payload,
    });
  },

  detail(caseId) {
    return request({
      url: `/medical-cases/${caseId}`,
      method: 'GET',
    });
  },

  comments(caseId) {
    return request({
      url: `/medical-cases/${caseId}/doctor-comments`,
      method: 'GET',
    });
  },

  reply(caseId, commentId, content) {
    return request({
      url: `/medical-cases/${caseId}/doctor-comments/${commentId}/reply`,
      method: 'POST',
      data: { content },
    });
  },
};

const aiApi = {
  diagnose(payload) {
    return request({
      url: '/ai/comprehensive-diagnosis',
      method: 'POST',
      data: payload,
      timeout: 120000,
    });
  },
};

const sharingApi = {
  doctors() {
    return request({
      url: '/sharing/doctors',
      method: 'GET',
    });
  },
};

const diseaseApi = {
  list(page = 1, pageSize = 100) {
    return request({
      url: `/chronic-diseases?page=${page}&page_size=${pageSize}`,
      method: 'GET',
    });
  },
};

const documentsApi = {
  upload(filePath, medicalCaseId) {
    return new Promise((resolve, reject) => {
      const token = storage.getAccessToken();
      wx.uploadFile({
        url: buildUrl('/documents/upload'),
        filePath,
        name: 'file',
        formData: {
          medical_case_id: medicalCaseId,
        },
        header: {
          Authorization: token ? `Bearer ${token}` : '',
          'X-Platform': 'patient',
        },
        success: (res) => {
          let payload = res.data;
          if (typeof payload === 'string') {
            try {
              payload = JSON.parse(payload);
            } catch (error) {
              reject({
                statusCode: res.statusCode,
                message: '上传响应格式无效',
                raw: res.data,
              });
              return;
            }
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(normalizePayload(payload));
            return;
          }

          reject({
            statusCode: res.statusCode,
            message: payload.detail || payload.message || '上传失败',
            raw: payload,
          });
        },
        fail: (err) => {
          reject({
            statusCode: 0,
            message: err.errMsg || '上传失败',
            raw: err,
          });
        },
      });
    });
  },

  extract(documentId) {
    return request({
      url: `/documents/${documentId}/extract`,
      method: 'POST',
    });
  },

  getContent(documentId) {
    return request({
      url: `/documents/${documentId}/content`,
      method: 'GET',
    });
  },
};

module.exports = {
  authApi,
  patientApi,
  casesApi,
  aiApi,
  documentsApi,
  sharingApi,
  diseaseApi,
};
