import React from 'react';
import { Container, Typography, Button, Box, Grid, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { LocalHospital, MedicalServices, AdminPanelSettings } from '@mui/icons-material';

const PlatformSelect: React.FC = () => {
  const navigate = useNavigate();

  const platforms = [
    {
      title: '患者端',
      description: '症状提交、AI诊断、诊疗记录',
      icon: <LocalHospital sx={{ fontSize: 60 }} />,
      path: '/patient',
      color: '#667eea',
    },
    {
      title: '医生端',
      description: '病例管理、患者咨询、专业评论',
      icon: <MedicalServices sx={{ fontSize: 60 }} />,
      path: '/doctor',
      color: '#764ba2',
    },
    {
      title: '管理端',
      description: '系统管理、医生认证、知识库',
      icon: <AdminPanelSettings sx={{ fontSize: 60 }} />,
      path: '/admin',
      color: '#f093fb',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Box textAlign="center" mb={6}>
          <Typography variant="h2" component="h1" color="white" gutterBottom>
            MediCare AI
          </Typography>
          <Typography variant="h5" color="white" sx={{ opacity: 0.9 }}>
            智能疾病管理系统
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {platforms.map((platform) => (
            <Grid item xs={12} md={4} key={platform.title}>
              <Paper
                elevation={8}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 16,
                  },
                }}
                onClick={() => navigate(platform.path)}
              >
                <Box sx={{ color: platform.color, mb: 2 }}>{platform.icon}</Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {platform.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {platform.description}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ mt: 3, backgroundColor: platform.color }}
                  onClick={() => navigate(platform.path)}
                >
                  进入
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box textAlign="center" mt={6}>
          <Button variant="outlined" color="inherit" onClick={() => navigate('/login')}>
            已有账号？立即登录
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default PlatformSelect;
