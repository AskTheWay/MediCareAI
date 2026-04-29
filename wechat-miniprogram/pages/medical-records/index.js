const { requireLogin } = require('../../utils/auth');
const { casesApi } = require('../../utils/api');

function toTextDate(dateString) {
  if (!dateString) {
    return '-';
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  const h = `${date.getHours()}`.padStart(2, '0');
  const min = `${date.getMinutes()}`.padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

function mapSeverityText(severity) {
  const severityMap = {
    mild: '轻度',
    moderate: '中度',
    severe: '重度',
    low: '轻度',
    medium: '中度',
    high: '重度',
  };
  return severityMap[severity] || '未知';
}

function mapStatusText(status) {
  const statusMap = {
    active: '进行中',
    completed: '已完成',
    archived: '已归档',
  };
  return statusMap[status] || '未知';
}

Page({
  data: {
    loading: false,
    error: '',
    keyword: '',
    records: [],
    filteredRecords: [],
    selectedRecord: null,
    comments: [],
    replyInputs: {},
  },

  async onShow() {
    const user = await requireLogin();
    if (!user) {
      return;
    }
    this.loadRecords();
  },

  async loadRecords() {
    this.setData({ loading: true, error: '' });
    try {
      const response = await casesApi.list();
      const records = (Array.isArray(response) ? response : []).map((item) => ({
        ...item,
        _createdText: toTextDate(item.created_at),
        _severityText: mapSeverityText(item.severity),
        _statusText: mapStatusText(item.status),
      }));

      records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      this.setData({
        records,
      });
      this.applyFilter(this.data.keyword, records);
    } catch (error) {
      this.setData({
        error: error.message ? `病历加载失败：${error.message}` : '病历加载失败，请稍后重试。',
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  onKeywordInput(event) {
    const keyword = event.detail.value || '';
    this.setData({ keyword });
    this.applyFilter(keyword, this.data.records);
  },

  applyFilter(keyword, source) {
    const text = (keyword || '').trim().toLowerCase();
    if (!text) {
      this.setData({ filteredRecords: source });
      return;
    }

    const filtered = source.filter((item) => {
      const title = (item.title || '').toLowerCase();
      const symptoms = (item.symptoms || '').toLowerCase();
      const diagnosis = (item.diagnosis || '').toLowerCase();
      return title.includes(text) || symptoms.includes(text) || diagnosis.includes(text);
    });

    this.setData({ filteredRecords: filtered });
  },

  async openRecord(event) {
    const caseId = event.currentTarget.dataset.id;
    const selectedRecord = this.data.records.find((item) => item.id === caseId);
    if (!selectedRecord) {
      return;
    }

    this.setData({
      selectedRecord,
      comments: [],
      replyInputs: {},
      error: '',
    });

    try {
      const comments = await casesApi.comments(caseId);
      const commentList = Array.isArray(comments) ? comments : [];
      this.setData({ comments: commentList });
    } catch (error) {
      this.setData({
        error: error.message ? `评论加载失败：${error.message}` : '评论加载失败，请稍后重试。',
      });
    }
  },

  closeRecord() {
    this.setData({
      selectedRecord: null,
      comments: [],
      replyInputs: {},
    });
  },

  onReplyInput(event) {
    const commentId = event.currentTarget.dataset.commentId;
    if (!commentId) {
      return;
    }

    this.setData({
      [`replyInputs.${commentId}`]: event.detail.value,
    });
  },

  async submitReply(event) {
    const commentId = event.currentTarget.dataset.commentId;
    const { selectedRecord, replyInputs } = this.data;

    if (!selectedRecord || !commentId) {
      return;
    }

    const content = (replyInputs[commentId] || '').trim();
    if (!content) {
      wx.showToast({ title: '回复内容不能为空', icon: 'none' });
      return;
    }

    try {
      await casesApi.reply(selectedRecord.id, commentId, content);
      wx.showToast({ title: '回复已发送', icon: 'success' });
      this.setData({ [`replyInputs.${commentId}`]: '' });

      const comments = await casesApi.comments(selectedRecord.id);
      this.setData({ comments: Array.isArray(comments) ? comments : [] });
    } catch (error) {
      wx.showToast({
        title: error.message || '回复失败',
        icon: 'none',
      });
    }
  },

  noop() {},
});
