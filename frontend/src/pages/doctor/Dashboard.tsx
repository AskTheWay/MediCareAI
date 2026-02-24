import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  MedicalServices as MedicalServicesIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { doctorsApi } from '../../services/api';
import type { Doctor, SharedMedicalCase } from '../../types';

interface DashboardStats {
  mentioned_cases: number;
  public_cases: number;
  today_cases: number;
  exported_count: number;
  growth: number;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<string>('');

  const {
    data: doctor,
    error: doctorError,
  } = useQuery<Doctor>({
    queryKey: ['doctor', 'profile'],
    queryFn: doctorsApi.getProfile,
  });

  const {
    data: stats,
    error: statsError,
    isLoading: statsLoading,
  } = useQuery<DashboardStats>({
    queryKey: ['doctor', 'dashboard-stats'],
    queryFn: async () => {
      const data = await doctorsApi.getDashboardStats();
      return data;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const {
    data: recentCases,
    isLoading: casesLoading,
  } = useQuery<SharedMedicalCase[]>({
    queryKey: ['doctor', 'recent-mentions'],
    queryFn: async () => {
      const data = await doctorsApi.getCases('mentioned', 5);
      return Array.isArray(data) ? data : (data.cases || []);
    },
    refetchOnMount: true,
  });

  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
    };
    setCurrentDate(date.toLocaleDateString('zh-CN', options));
  }, []);

  const handleViewCase = (caseId: string) => {
    navigate(`/doctor/cases/${caseId}`);
  };

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    subtitle: string;
    icon: React.ReactNode;
    color?: string;
    onClick?: () => void;
  }> = ({ title, value, subtitle, icon, color = theme.palette.success.main, onClick }) => (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s',
        '&:hover': onClick ? {
          transform: 'translateY(-5px)',
          boxShadow: theme.shadows[8],
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: alpha(color, 0.1),
              color: color,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box flex={1}>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              {value}
            </Typography>
          </Box>
        </Box>
        <Typography variant="h6" color="text.primary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );

  const CaseItem: React.FC<{ caseItem: SharedMedicalCase }> = ({ caseItem }) => {
    const profile = caseItem.anonymous_patient_profile || {};
    
    return (
      <Card
        sx={{
          cursor: 'pointer',
          transition: 'all 0.3s',
          '&:hover': {
            borderColor: theme.palette.success.main,
            boxShadow: theme.shadows[4],
          },
        }}
        onClick={() => handleViewCase(caseItem.id)}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" fontWeight="bold">
              病例 #{caseItem.id.toString().slice(0, 8)}
            </Typography>
            <Chip
              label={caseItem.original_case?.disease?.name || '未分类'}
              size="small"
              color="success"
              variant="outlined"
            />
          </Box>
          
          <Box display="flex" gap={2} mb={1} color="text.secondary" fontSize="0.875rem">
            <Typography variant="body2" component="span">
              👤 {profile.age_range || '未知年龄'} · {profile.gender || '未知性别'}
            </Typography>
            <Typography variant="body2" component="span">
              📍 {profile.city_tier || '未知地区'}
            </Typography>
            <Typography variant="body2" component="span">
              📅 {new Date(caseItem.created_at).toLocaleDateString('zh-CN')}
            </Typography>
          </Box>
          
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.5,
            }}
          >
            {caseItem.anonymized_symptoms || '暂无症状描述'}
          </Typography>
        </CardContent>
      </Card>
    );
  };



  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
          color: 'white',
          p: 4,
          borderRadius: 3,
          mb: 3,
        }}
      >
        <Typography variant="h4" fontWeight="bold" mb={1}>
          欢迎回来，{doctor?.full_name?.[0]}医生
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
          今天是 {currentDate}，祝您工作顺利
        </Typography>
        
        <Box
          sx={{
            display: 'flex',
            gap: 4,
            mt: 2,
            pt: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
              执业医院
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {doctor?.hospital || '未设置'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
              专业领域
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {doctor?.specialty || '未设置'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
              职称
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {doctor?.title || '未设置'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="@我的病例"
            value={stats?.mentioned_cases || 0}
            subtitle="等待查看"
            icon={<MedicalServicesIcon />}
            onClick={() => navigate('/doctor/mentions')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="可访问公开病例"
            value={stats?.public_cases || 0}
            subtitle="专业领域相关"
            icon={<DescriptionIcon />}
            onClick={() => navigate('/doctor/cases')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="今日新增病例"
            value={stats?.today_cases || 0}
            subtitle={`较昨日 +${stats?.growth || 0}`}
            icon={<TrendingUpIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="已导出科研数据"
            value={stats?.exported_count || 0}
            subtitle="累计导出"
            icon={<DownloadIcon />}
            onClick={() => navigate('/doctor/export')}
          />
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            快捷操作
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="outlined"
              color="success"
              startIcon={<VisibilityIcon />}
              onClick={() => navigate('/doctor/mentions')}
              sx={{ px: 3, py: 1.5 }}
            >
              查看@我的病例
            </Button>
            <Button
              variant="outlined"
              color="success"
              startIcon={<DescriptionIcon />}
              onClick={() => navigate('/doctor/cases')}
              sx={{ px: 3, py: 1.5 }}
            >
              浏览公开病例
            </Button>
            <Button
              variant="outlined"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={() => navigate('/doctor/export')}
              sx={{ px: 3, py: 1.5 }}
            >
              导出科研数据
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              📋 最近@我的病例
            </Typography>
            <Button
              variant="text"
              color="success"
              onClick={() => navigate('/doctor/mentions')}
              sx={{ textTransform: 'none' }}
            >
              查看全部 →
            </Button>
          </Box>

          {casesLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : recentCases && recentCases.length > 0 ? (
            <Box display="flex" flexDirection="column" gap={2}>
              {recentCases.map((caseItem) => (
                <CaseItem key={caseItem.id} caseItem={caseItem} />
              ))}
            </Box>
          ) : (
            <Box textAlign="center" py={6}>
              <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'grey.200' }}>
                <PersonIcon color="action" />
              </Avatar>
              <Typography variant="body1" color="text.secondary">
                暂无@您的病例
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
