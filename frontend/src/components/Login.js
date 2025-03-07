import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import { login } from '../api';
import { useTranslation } from 'react-i18next';

const Login = ({ onLogin }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState(''); // برای کد 2FA
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // ریست کردن خطا قبل از تلاش جدید
    try {
      await login(username, password, code); // فراخوانی تابع login از api.js
      onLogin(); // اجرای تابع onLogin که از props میاد
    } catch (err) {
      setError(t('Login failed. Check your credentials or 2FA code.')); // پیام خطا به زبان انتخاب‌شده
    }
  };

  return (
    <Container maxWidth="sm" style={{ marginTop: '100px' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)' 
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          {t('Login')}
        </Typography>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <TextField
            label={t('Username')}
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
            required
          />
          <TextField
            label={t('Password')}
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            required
          />
          <TextField
            label={t('2FA Code')} // برچسب برای کد احراز هویت دو مرحله‌ای
            fullWidth
            margin="normal"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            variant="outlined"
            helperText={t('Enter your 2FA code if enabled')}
          />
          {error && (
            <Typography color="error" align="center" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ mt: 3, py: 1.5 }}
          >
            {t('Login')}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default Login;