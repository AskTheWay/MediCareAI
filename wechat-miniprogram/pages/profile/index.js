const { requireLogin } = require('../../utils/auth');
const { authApi, patientApi, diseaseApi } = require('../../utils/api');

const genderOptions = [
  { label: '请选择', value: '' },
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
];

const diseaseSeverityOptions = [
  { label: '不设置', value: '' },
  { label: '轻度', value: 'mild' },
  { label: '中度', value: 'moderate' },
  { label: '重度', value: 'severe' },
];

Page({
  data: {
    loading: false,
    saving: false,
    error: '',
    success: '',
    form: {
      email: '',
      full_name: '',
      date_of_birth: '',
      gender: '',
      phone: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
    },
    genderOptions,
    genderIndex: 0,
    chronicDiseases: [],
    diseaseOptions: [{ id: '', label: '请选择疾病' }],
    diseaseLabelOptions: ['请选择疾病'],
    diseaseIndex: 0,
    severityOptions: diseaseSeverityOptions,
    newDiseaseSeverityIndex: 0,
    newDiseaseDate: '',
    newDiseaseNotes: '',
  },

  async onShow() {
    const user = await requireLogin();
    if (!user) {
      return;
    }

    await Promise.all([
      this.loadProfile(),
      this.loadDiseaseOptions(),
      this.loadChronicDiseases(),
    ]);
  },

  async loadProfile() {
    try {
      const me = await authApi.me();
      const patient = await patientApi.getProfile();

      const form = {
        email: me.email || '',
        full_name: me.full_name || '',
        date_of_birth: patient.date_of_birth || me.date_of_birth || '',
        gender: patient.gender || me.gender || '',
        phone: patient.phone || me.phone || '',
        address: patient.address || me.address || '',
        emergency_contact_name: patient.emergency_contact_name || me.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || me.emergency_contact_phone || '',
      };

      const genderIndex = Math.max(
        genderOptions.findIndex((item) => item.value === form.gender),
        0
      );

      this.setData({
        form,
        genderIndex,
      });
    } catch (error) {
      this.setData({
        error: error.message ? `资料加载失败：${error.message}` : '资料加载失败，请稍后重试。',
      });
    }
  },

  async loadDiseaseOptions() {
    try {
      const response = await diseaseApi.list();
      const rawItems = (response && response.items) || [];
      const options = [{ id: '', label: '请选择疾病' }];

      rawItems.forEach((item) => {
        const commonName = item.common_names && item.common_names.length ? item.common_names[0] : item.icd10_name;
        options.push({
          id: item.id,
          label: `${commonName} (${item.icd10_code})`,
        });
      });

      this.setData({
        diseaseOptions: options,
        diseaseLabelOptions: options.map((item) => item.label),
      });
    } catch (error) {
      // Keep page functional even if disease dictionary fails.
    }
  },

  async loadChronicDiseases() {
    try {
      const response = await patientApi.getChronicDiseases();
      const list = (Array.isArray(response) ? response : ((response && response.items) || [])).map((item) => {
        const disease = item.disease || {};
        const commonName =
          disease.common_names && disease.common_names.length
            ? disease.common_names[0]
            : disease.icd10_name;
        const severityMap = {
          mild: '轻度',
          moderate: '中度',
          severe: '重度',
        };
        return {
          ...item,
          _name: commonName || item.disease_id || '未知疾病',
          _severityLabel: severityMap[item.severity] || '未知',
        };
      });
      this.setData({ chronicDiseases: list });
    } catch (error) {
      this.setData({ chronicDiseases: [] });
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
      success: '',
    });
  },

  onBirthDateChange(event) {
    this.setData({
      'form.date_of_birth': event.detail.value,
    });
  },

  onGenderChange(event) {
    const index = Number(event.detail.value || 0);
    const option = genderOptions[index] || genderOptions[0];

    this.setData({
      genderIndex: index,
      'form.gender': option.value,
    });
  },

  async saveProfile() {
    const { form } = this.data;

    if (!form.full_name || !form.full_name.trim()) {
      this.setData({ error: '姓名为必填项。' });
      return;
    }

    this.setData({
      saving: true,
      error: '',
      success: '',
    });

    try {
      await authApi.updateMe({
        full_name: form.full_name.trim(),
        phone: form.phone || undefined,
        address: form.address || undefined,
        emergency_contact_name: form.emergency_contact_name || undefined,
        emergency_contact_phone: form.emergency_contact_phone || undefined,
      });

      const emergencyContact = `${form.emergency_contact_name || ''} ${form.emergency_contact_phone || ''}`.trim();

      await patientApi.updateProfile({
        date_of_birth: form.date_of_birth || undefined,
        gender: form.gender || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        emergency_contact: emergencyContact || undefined,
      });

      this.setData({
        success: '资料保存成功。',
      });

      wx.showToast({
        title: '已保存',
        icon: 'success',
      });
    } catch (error) {
      this.setData({
        error: error.message ? `保存失败：${error.message}` : '保存资料失败，请稍后重试。',
      });
    } finally {
      this.setData({ saving: false });
    }
  },

  onDiseaseChange(event) {
    this.setData({
      diseaseIndex: Number(event.detail.value || 0),
    });
  },

  onDiseaseSeverityChange(event) {
    this.setData({
      newDiseaseSeverityIndex: Number(event.detail.value || 0),
    });
  },

  onDiseaseDateChange(event) {
    this.setData({
      newDiseaseDate: event.detail.value,
    });
  },

  onDiseaseNotesInput(event) {
    this.setData({
      newDiseaseNotes: event.detail.value,
    });
  },

  async addDisease() {
    const { diseaseOptions, diseaseIndex, severityOptions, newDiseaseSeverityIndex, newDiseaseDate, newDiseaseNotes } = this.data;
    const selected = diseaseOptions[diseaseIndex];

    if (!selected || !selected.id) {
      wx.showToast({ title: '请选择疾病', icon: 'none' });
      return;
    }

    const severity = severityOptions[newDiseaseSeverityIndex]?.value || '';

    try {
      await patientApi.addChronicDisease({
        disease_id: selected.id,
        diagnosis_date: newDiseaseDate || undefined,
        severity: severity || undefined,
        notes: newDiseaseNotes || undefined,
      });

      this.setData({
        diseaseIndex: 0,
        newDiseaseSeverityIndex: 0,
        newDiseaseDate: '',
        newDiseaseNotes: '',
      });

      await this.loadChronicDiseases();
      wx.showToast({ title: '添加成功', icon: 'success' });
    } catch (error) {
      wx.showToast({
        title: error.message || '添加失败',
        icon: 'none',
      });
    }
  },

  async removeDisease(event) {
    const conditionId = event.currentTarget.dataset.id;
    if (!conditionId) {
      return;
    }

    try {
      await patientApi.removeChronicDisease(conditionId);
      await this.loadChronicDiseases();
      wx.showToast({ title: '删除成功', icon: 'success' });
    } catch (error) {
      wx.showToast({
        title: error.message || '删除失败',
        icon: 'none',
      });
    }
  },
});
