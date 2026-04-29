import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AttachFile,
  AutoAwesome,
  CloudUpload,
  Delete,
  GraphicEq,
  Mic,
  Person,
  Send,
  SmartToy,
  Stop,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiApi } from '../../services/api';
import type {
  SymptomChatMessage,
  SymptomChatResponse,
  SymptomChatFileResult,
} from '../../types';

interface BrowserSpeechRecognitionEvent extends Event {
  resultIndex?: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface BrowserSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

const WELCOME_MESSAGE =
  '你好，我是症状问诊助手。你可以直接描述不舒服的地方，也可以一次上传多张检查报告、图片、PDF 或 Word 文档，我会结合系统知识库帮你梳理。';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.bmp',
  '.tiff',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.md',
  '.markdown',
];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const getFileExtension = (filename: string) => {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : '';
};

const SymptomChat: React.FC = () => {
  const [messages, setMessages] = useState<SymptomChatMessage[]>([
    { role: 'assistant', content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [lastResponse, setLastResponse] = useState<SymptomChatResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const appendFiles = (incomingFiles: File[]) => {
    const validFiles: File[] = [];
    const rejectedFiles: string[] = [];

    incomingFiles.forEach((file) => {
      const extension = getFileExtension(file.name);
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        rejectedFiles.push(`${file.name}（类型不支持）`);
      } else if (file.size > MAX_FILE_SIZE) {
        rejectedFiles.push(`${file.name}（超过 ${formatFileSize(MAX_FILE_SIZE)}）`);
      } else {
        validFiles.push(file);
      }
    });

    if (rejectedFiles.length > 0) {
      setError(`以下文件未加入：${rejectedFiles.join('、')}`);
    }

    if (validFiles.length > 0) {
      setSelectedFiles((previousFiles) => {
        const mergedFiles = [...previousFiles, ...validFiles];
        if (mergedFiles.length > MAX_FILES) {
          setError(`单次最多上传 ${MAX_FILES} 个文件，已保留前 ${MAX_FILES} 个。`);
        }
        return mergedFiles.slice(0, MAX_FILES);
      });
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    appendFiles(Array.from(event.target.files || []));
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    appendFiles(Array.from(event.dataTransfer.files || []));
  };

  const removeFile = (index: number) => {
    setSelectedFiles((previousFiles) =>
      previousFiles.filter((_, fileIndex) => fileIndex !== index)
    );
  };

  const startVoiceInput = () => {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('当前浏览器不支持语音转文字，请使用 Chrome 或 Edge。');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setError('语音识别失败，请确认浏览器麦克风权限。');
    };
    recognition.onresult = (event) => {
      const fragments: string[] = [];
      const startIndex = event.resultIndex || 0;
      for (let resultIndex = startIndex; resultIndex < event.results.length; resultIndex += 1) {
        const transcript = event.results[resultIndex][0]?.transcript;
        if (transcript) {
          fragments.push(transcript);
        }
      }
      const transcriptText = fragments.join('');
      if (transcriptText) {
        setInput((previousInput) =>
          previousInput ? `${previousInput}${transcriptText}` : transcriptText
        );
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput && selectedFiles.length === 0) {
      setError('请输入症状描述，或至少上传一个检查资料。');
      return;
    }

    const filesToSend = [...selectedFiles];
    const userContent = [
      trimmedInput || '请结合我上传的资料进行症状问诊。',
      filesToSend.length > 0
        ? `已上传附件：${filesToSend.map((file) => file.name).join('、')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const history = messages.filter((message) => message.content !== WELCOME_MESSAGE);
    setMessages((previousMessages) => [
      ...previousMessages,
      { role: 'user', content: userContent },
    ]);
    setInput('');
    setSelectedFiles([]);
    setError(null);
    setSending(true);

    try {
      const response = await aiApi.symptomChat({
        message: trimmedInput,
        history,
        files: filesToSend,
        language: 'zh',
      });
      setLastResponse(response);
      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: 'assistant',
          content: response.reply || '模型没有返回可展示内容，请稍后重试。',
        },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '症状问诊失败');
      setMessages((previousMessages) => [
        ...previousMessages,
        {
          role: 'assistant',
          content: '这次问诊请求失败了。请检查模型配置、网络或附件解析配置后再试。',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const renderFileResult = (fileResult: SymptomChatFileResult) => (
    <Chip
      key={`${fileResult.filename}-${fileResult.status}`}
      size="small"
      color={fileResult.status === 'processed' ? 'success' : 'warning'}
      label={`${fileResult.filename}: ${fileResult.status === 'processed' ? '已解析' : '解析失败'}`}
      sx={{ maxWidth: '100%' }}
    />
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 2,
          color: 'white',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            <AutoAwesome />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              症状问诊
            </Typography>
            <Typography sx={{ opacity: 0.9 }}>
              直接连接管理员配置的后端 LLM，并结合 RAG 知识库、上传资料和语音输入进行多轮咨询。
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="warning" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 340px' },
          gap: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            minHeight: 620,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <SmartToy color="primary" />
              <Box>
                <Typography fontWeight={700}>肥胖症问诊助手</Typography>
                <Typography variant="body2" color="text.secondary">
                  支持多轮对话，回复仅供健康咨询参考。
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, p: 2, bgcolor: '#f8fafc', overflowY: 'auto' }}>
            <Stack spacing={2}>
              {messages.map((message, index) => {
                const isUser = message.role === 'user';
                return (
                  <Stack
                    key={`${message.role}-${index}`}
                    direction="row"
                    spacing={1.5}
                    justifyContent={isUser ? 'flex-end' : 'flex-start'}
                    alignItems="flex-start"
                  >
                    {!isUser && (
                      <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34 }}>
                        <SmartToy fontSize="small" />
                      </Avatar>
                    )}
                    <Paper
                      elevation={0}
                      sx={{
                        px: 2,
                        py: 1.5,
                        maxWidth: '78%',
                        borderRadius: 3,
                        bgcolor: isUser ? 'primary.main' : 'white',
                        color: isUser ? 'white' : 'text.primary',
                        border: isUser ? 'none' : '1px solid',
                        borderColor: 'divider',
                        '& p': { my: 0.6 },
                        '& ul, & ol': { pl: 2.5 },
                        '& table': { width: '100%', borderCollapse: 'collapse' },
                        '& th, & td': {
                          border: '1px solid #e5e7eb',
                          p: 0.75,
                        },
                      }}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </Paper>
                    {isUser && (
                      <Avatar sx={{ bgcolor: 'secondary.main', width: 34, height: 34 }}>
                        <Person fontSize="small" />
                      </Avatar>
                    )}
                  </Stack>
                );
              })}
              {sending && (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main', width: 34, height: 34 }}>
                    <SmartToy fontSize="small" />
                  </Avatar>
                  <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={18} />
                      <Typography variant="body2">正在解析资料、检索知识库并调用模型...</Typography>
                    </Stack>
                  </Paper>
                </Stack>
              )}
              <div ref={messagesEndRef} />
            </Stack>
          </Box>

          {selectedFiles.length > 0 && (
            <Box sx={{ px: 2, pt: 1 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {selectedFiles.map((file, index) => (
                  <Chip
                    key={`${file.name}-${index}`}
                    icon={<AttachFile />}
                    label={`${file.name} (${formatFileSize(file.size)})`}
                    onDelete={() => removeFile(index)}
                    deleteIcon={<Delete />}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {sending && <LinearProgress />}

          <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={5}
                value={input}
                disabled={sending}
                placeholder="描述症状，例如：最近三天咳嗽、胸闷，晚上更明显..."
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
              />
              <Stack direction="row" spacing={1} alignItems="flex-end">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  accept={ALLOWED_EXTENSIONS.join(',')}
                  onChange={handleFileInputChange}
                />
                <Tooltip title="上传附件">
                  <span>
                    <IconButton
                      disabled={sending}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <AttachFile />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={listening ? '停止语音输入' : '语音转文字'}>
                  <span>
                    <IconButton
                      color={listening ? 'error' : 'default'}
                      disabled={sending}
                      onClick={listening ? stopVoiceInput : startVoiceInput}
                    >
                      {listening ? <Stop /> : <Mic />}
                    </IconButton>
                  </span>
                </Tooltip>
                <Button
                  variant="contained"
                  endIcon={<Send />}
                  disabled={sending}
                  onClick={() => void handleSend()}
                  sx={{ minWidth: 112, height: 56 }}
                >
                  发送
                </Button>
              </Stack>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              提示：Ctrl/⌘ + Enter 发送。语音识别需要麦克风权限。
            </Typography>
          </Box>
        </Paper>

        <Stack spacing={2}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              borderStyle: dragActive ? 'solid' : 'dashed',
              borderColor: dragActive ? 'primary.main' : 'divider',
              bgcolor: dragActive ? '#eef2ff' : 'background.paper',
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <CardContent>
              <Stack spacing={1.5} alignItems="center" textAlign="center">
                <CloudUpload color="primary" sx={{ fontSize: 44 }} />
                <Typography fontWeight={700}>上传检查资料</Typography>
                <Typography variant="body2" color="text.secondary">
                  支持多张图片、PDF、DOC/DOCX、TXT、MD，最多 {MAX_FILES} 个。
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AttachFile />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                >
                  选择文件
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <GraphicEq color={listening ? 'error' : 'disabled'} />
                  <Typography fontWeight={700}>语音转文字</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  点击麦克风后说出症状，识别结果会自动填入输入框。
                </Typography>
                <Button
                  variant={listening ? 'contained' : 'outlined'}
                  color={listening ? 'error' : 'primary'}
                  startIcon={listening ? <Stop /> : <Mic />}
                  onClick={listening ? stopVoiceInput : startVoiceInput}
                  disabled={sending}
                >
                  {listening ? '停止识别' : '开始语音输入'}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography fontWeight={700}>本次调用信息</Typography>
                <Divider />
                <Typography variant="body2" color="text.secondary">
                  模型：{lastResponse?.model_used || '等待首次问诊'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Token：{lastResponse?.tokens_used ?? '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  RAG：{lastResponse?.knowledge_base?.queried ? '已检索' : '未检索'}
                </Typography>
                {lastResponse?.files && lastResponse.files.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {lastResponse.files.map(renderFileResult)}
                  </Stack>
                )}
                {lastResponse?.knowledge_base?.selection_reasoning && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    {lastResponse.knowledge_base.selection_reasoning}
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Container>
  );
};

export default SymptomChat;
