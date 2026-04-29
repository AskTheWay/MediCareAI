const { authApi } = require('../../utils/api');

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  return /^1\d{10}$/.test(value) || /^[0-9+\-\s()]{6,20}$/.test(value);
}

const defaultForm = {
  full_name: '',
  email: '',
  password: '',
  confirm_password: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  address: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
};

Page({
  data: {
    loading: false,
    error: '',
    form: {
      ...defaultForm,
    },
    genderOptions: [
      { label: '请选择', value: '' },
      { label: '男', value: 'male' },
      { label: '女', value: 'female' },
    ],
    genderIndex: 0,
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

  onDateChange(event) {
    this.setData({
      'form.date_of_birth': event.detail.value,
    });
  },

  onGenderChange(event) {
    const index = Number(event.detail.value || 0);
    const option = this.data.genderOptions[index] || this.data.genderOptions[0];

    this.setData({
      genderIndex: index,
      'form.gender': option.value,
    });
  },

  async onSubmit() {
    const { form } = this.data;
    const normalizedEmail = (form.email || '').trim();
    const normalizedPhone = (form.phone || '').trim();

    if (!form.full_name || !form.email || !form.password) {
      this.setData({ error: '请先填写姓名、邮箱和密码。' });
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      this.setData({ error: '邮箱格式不正确，请检查后重试。' });
      return;
    }

    if (form.password.length < 6) {
      this.setData({ error: '密码长度至少为 6 位。' });
      return;
    }

    if (form.password !== form.confirm_password) {
      this.setData({ error: '两次输入的密码不一致，请重新确认。' });
      return;
    }

    if (normalizedPhone && !isValidPhone(normalizedPhone)) {
      this.setData({ error: '手机号格式不正确，请检查后重试。' });
      return;
    }

    this.setData({ loading: true, error: '' });

    try {
      const payload = {
        email: normalizedEmail,
        password: form.password,
        full_name: form.full_name.trim(),
        date_of_birth: form.date_of_birth || undefined,
        gender: form.gender || undefined,
        phone: normalizedPhone || undefined,
        address: form.address || undefined,
        emergency_contact_name: form.emergency_contact_name || undefined,
        emergency_contact_phone: form.emergency_contact_phone || undefined,
      };

      await authApi.register(payload);

      wx.showModal({
        title: '注册成功',
        content: '注册完成，请使用新账号登录。',
        showCancel: false,
        success: () => {
          wx.redirectTo({
            url: `/pages/login/index?email=${encodeURIComponent(form.email.trim())}`,
          });
        },
      });
    } catch (error) {
      this.setData({
        error: error.message || '注册失败。',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  goLogin() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.redirectTo({ url: '/pages/login/index' });
      },
    });
  },
});
