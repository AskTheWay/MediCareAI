const {
  casesApi,
  documentsApi,
  aiApi,
  sharingApi,
} = require('../../utils/api');
const { requireLogin } = require('../../utils/auth');

const severityOptions = [
  { label: '轻度', value: 'mild' },
  { label: '中度', value: 'moderate' },
  { label: '重度', value: 'severe' },
];

function formatSize(size) {
  if (!size) {
    return '0 字节';
  }
  if (size < 1024) {
    return `${size} 字节`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} 千字节`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} 兆字节`;
}

Page({
  data: {
    severityOptions,
    severityIndex: 1,
    form: {
      symptoms: '',
      severity: 'moderate',
      duration: '',
      onset_time: '',
      triggers: '',
      previous_diseases: '',
      share_with_doctors: false,
    },
    files: [],
    doctors: [],
    selectedDoctorIds: [],
    selectedDoctorIdSet: {},
    submitting: false,
    progressText: '',
    error: '',
    diagnosisResult: null,
  },

  async onShow() {
    const user = await requireLogin();
    if (!user) {
      return;
    }
    this.loadDoctors();
  },

  async loadDoctors() {
    try {
      const doctors = await sharingApi.doctors();
      this.setData({
        doctors: Array.isArray(doctors) ? doctors : [],
      });
    } catch (error) {
      // Doctor list is optional for diagnosis flow.
    }
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    if (!field) {
      return;
    }

    this.setData({
      [`form.${field}`]: event.detail.value,
      error: '',
    });
  },

  onSeverityChange(event) {
    const index = Number(event.detail.value || 0);
    const option = severityOptions[index] || severityOptions[0];

    this.setData({
      severityIndex: index,
      'form.severity': option.value,
    });
  },

  onOnsetDateChange(event) {
    this.setData({
      'form.onset_time': event.detail.value,
    });
  },

  onShareSwitch(event) {
    this.setData({
      'form.share_with_doctors': !!event.detail.value,
    });
  },

  onDoctorSelectionChange(event) {
    const ids = event.detail.value || [];
    const idSet = {};
    ids.forEach((id) => {
      idSet[id] = true;
    });

    this.setData({
      selectedDoctorIds: ids,
      selectedDoctorIdSet: idSet,
    });
  },

  chooseFiles() {
    wx.chooseMessageFile({
      count: 5,
      type: 'file',
      success: (res) => {
        const picked = (res.tempFiles || []).map((item) => ({
          name: item.name || '文件',
          path: item.path,
          size: item.size || 0,
          sizeText: formatSize(item.size || 0),
        }));

        this.setData({
          files: [...this.data.files, ...picked],
        });
      },
      fail: () => {
        wx.showToast({
          title: '未选择文件',
          icon: 'none',
        });
      },
    });
  },

  removeFile(event) {
    const index = Number(event.currentTarget.dataset.index);
    if (Number.isNaN(index)) {
      return;
    }

    const nextFiles = this.data.files.filter((_, i) => i !== index);
    this.setData({ files: nextFiles });
  },

  async submitDiagnosis() {
    const { form, files, selectedDoctorIds } = this.data;

    const symptomText = (form.symptoms || '').trim();
    if (!symptomText) {
      this.setData({ error: '请先填写症状描述。' });
      return;
    }

    if (symptomText.length < 5) {
      this.setData({ error: '症状描述过短，请补充至少 5 个字。' });
      return;
    }

    this.setData({
      submitting: true,
      error: '',
      diagnosisResult: null,
      progressText: '正在创建病历...',
    });

    try {
      const detailParts = [];
      if (form.triggers) {
        detailParts.push(`诱因: ${form.triggers}`);
      }
      if (form.previous_diseases) {
        detailParts.push(`病史: ${form.previous_diseases}`);
      }

      const severityLabel = severityOptions.find((item) => item.value === form.severity)?.label || '未分级';

      const createdCase = await casesApi.create({
        title: `智能诊断 - ${severityLabel}`,
        symptoms: form.symptoms,
        severity: form.severity,
        description: detailParts.join(' | '),
      });

      const caseId = createdCase.id;
      const documentIds = [];
      let failedUploads = 0;

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        this.setData({
          progressText: `正在上传文件 ${i + 1}/${files.length}: ${file.name}`,
        });

        try {
          const uploaded = await documentsApi.upload(file.path, caseId);
          if (uploaded && uploaded.id) {
            documentIds.push(uploaded.id);
            documentsApi.extract(uploaded.id).catch(() => {});
          }
        } catch (uploadError) {
          // Keep diagnosing even if some file uploads fail.
          failedUploads += 1;
        }
      }

      if (failedUploads > 0) {
        this.setData({
          progressText: `${failedUploads} 个文件上传失败，正在继续诊断...`,
        });
      }

      this.setData({ progressText: '正在进行智能诊断...' });

      const diagnosis = await aiApi.diagnose({
        symptoms: form.symptoms,
        severity: form.severity,
        duration: form.duration || undefined,
        onset_time: form.onset_time || undefined,
        triggers: form.triggers || undefined,
        previous_diseases: form.previous_diseases || undefined,
        document_ids: documentIds,
        language: 'zh',
        case_id: caseId,
        share_with_doctors: !!form.share_with_doctors,
        doctor_ids: selectedDoctorIds,
      });

      this.setData({
        diagnosisResult: diagnosis,
        progressText: '诊断完成。',
      });

      wx.showToast({
        title: '诊断完成',
        icon: 'success',
      });
    } catch (error) {
      this.setData({
        error: error.message || '诊断失败。',
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  resetForm() {
    this.setData({
      severityIndex: 1,
      form: {
        symptoms: '',
        severity: 'moderate',
        duration: '',
        onset_time: '',
        triggers: '',
        previous_diseases: '',
        share_with_doctors: false,
      },
      files: [],
      selectedDoctorIds: [],
      selectedDoctorIdSet: {},
      diagnosisResult: null,
      progressText: '',
      error: '',
    });
  },
});
