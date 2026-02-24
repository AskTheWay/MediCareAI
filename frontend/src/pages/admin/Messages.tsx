import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Paper,
  Avatar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Email as EmailIcon,
  Person as PersonIcon,
  Send as SendIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { buildApiUrl } from '../../config/api';
import { CONFIG } from '../../lib/config';

interface InternalMessage {
  id: string;
  subject: string;
  content: string;
  sender: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  replies?: {
    id: string;
    subject: string;
    content: string;
    created_at: string;
  }[];
}

const AdminMessages: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<InternalMessage | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  // Fetch messages
  const {
    data: messagesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'messages'],
    queryFn: async () => {
      const response = await fetch(buildApiUrl('admin/messages'), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(CONFIG.TOKEN_KEY)}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch message detail with retry logic
  const { data: messageDetail } = useQuery({
    queryKey: ['admin', 'message', selectedMessage?.id],
    queryFn: async () => {
      if (!selectedMessage) return null;
      
      // Retry logic for handling transient 500 errors
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await fetch(buildApiUrl(`admin/messages/${selectedMessage.id}`), {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(CONFIG.TOKEN_KEY)}`,
            },
          });
          if (response.ok) {
            return response.json();
          }
          // If it's a 500 error, retry
          if (response.status === 500) {
            lastError = new Error(`Server error (attempt ${attempt + 1}/3)`);
            if (attempt < 2) {
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
              continue;
            }
          }
          throw new Error('Failed to fetch message detail');
        } catch (error) {
          lastError = error as Error;
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
          }
        }
      }
      throw lastError || new Error('Failed to fetch message detail after retries');
    },
    enabled: !!selectedMessage,
    retry: 1, // React Query will also retry on error
    retryDelay: 1000,
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const response = await fetch(buildApiUrl(`admin/messages/${messageId}/reply`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem(CONFIG.TOKEN_KEY)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        throw new Error('Failed to send reply');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'message', selectedMessage?.id] });
      setReplyDialogOpen(false);
      setReplyContent('');
    },
  });

  const handleReply = () => {
    if (selectedMessage && replyContent.trim()) {
      replyMutation.mutate({ messageId: selectedMessage.id, content: replyContent });
    }
  };

  const messages: InternalMessage[] = messagesData?.messages || [];
  const unreadCount = messagesData?.unread_count || 0;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        加载消息失败: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        站内信管理
        {unreadCount > 0 && (
          <Chip
            label={`${unreadCount} 条未读`}
            color="error"
            size="small"
            sx={{ ml: 2 }}
          />
        )}
      </Typography>

      <Box display="flex" gap={2} mt={3}>
        {/* Message List */}
        <Paper sx={{ width: '40%', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
          <List>
            {messages.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="暂无消息"
                  secondary="医生发送的消息将显示在这里"
                />
              </ListItem>
            ) : (
              messages.map((message) => (
                <React.Fragment key={message.id}>
                  <ListItemButton
                    selected={selectedMessage?.id === message.id}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: message.is_read ? 'grey.300' : 'primary.main' }}>
                        <PersonIcon />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="subtitle2"
                            fontWeight={message.is_read ? 'normal' : 'bold'}
                          >
                            {message.sender?.full_name || '未知用户'}
                          </Typography>
                          {!message.is_read && (
                            <Chip label="未读" color="error" size="small" />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography component="span"
                            variant="body2"
                            noWrap
                            fontWeight={message.is_read ? 'normal' : 'bold'}
                          >
                            {message.subject}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" component="span">
                            {format(new Date(message.created_at), 'yyyy-MM-dd HH:mm', {
                              locale: zhCN,
                            })}
                          </Typography>
                        </>
                      }
                    />
                  </ListItemButton>
                  <Divider />
                </React.Fragment>
              ))
            )}
          </List>
        </Paper>

        {/* Message Detail */}
        <Card sx={{ flex: 1, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
          {selectedMessage ? (
            <CardContent>
              <Box mb={2}>
                <Typography variant="h6" gutterBottom>
                  {selectedMessage.subject}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PersonIcon fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    来自: {selectedMessage.sender?.full_name} ({selectedMessage.sender?.email})
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  时间:{' '}
                  {format(new Date(selectedMessage.created_at), 'yyyy-MM-dd HH:mm:ss', {
                    locale: zhCN,
                  })}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
                {selectedMessage.content}
              </Typography>

              {/* Replies */}
              {messageDetail?.replies && messageDetail.replies.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    回复历史
                  </Typography>
                  {messageDetail.replies.map((reply: any) => (
                    <Paper key={reply.id} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {reply.subject}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {reply.content}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {format(new Date(reply.created_at), 'yyyy-MM-dd HH:mm:ss', {
                          locale: zhCN,
                        })}
                      </Typography>
                    </Paper>
                  ))}
                </>
              )}

              <Box mt={3}>
                <Button
                  variant="contained"
                  startIcon={<ReplyIcon />}
                  onClick={() => setReplyDialogOpen(true)}
                  disabled={replyMutation.isPending}
                >
                  回复消息
                </Button>
              </Box>
            </CardContent>
          ) : (
            <CardContent>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="300px"
              >
                <EmailIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  选择一条消息查看详情
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  医生发送的消息将显示在这里
                </Typography>
              </Box>
            </CardContent>
          )}
        </Card>
      </Box>

      {/* Reply Dialog */}
      <Dialog
        open={replyDialogOpen}
        onClose={() => setReplyDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>回复消息</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            回复给: {selectedMessage?.sender?.full_name}
          </Typography>
          <TextField
            label="回复内容"
            multiline
            rows={6}
            fullWidth
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="请输入回复内容..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)}>取消</Button>
          <Button
            onClick={handleReply}
            variant="contained"
            startIcon={<SendIcon />}
            disabled={!replyContent.trim() || replyMutation.isPending}
          >
            {replyMutation.isPending ? '发送中...' : '发送回复'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminMessages;
