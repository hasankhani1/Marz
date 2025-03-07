import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const login = async (username, password, code) => {
  const response = await axios.post(`${API_URL}/token`, new URLSearchParams({
    username,
    password,
    code
  }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  localStorage.setItem('token', response.data.access_token);
  return response.data;
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getUsers = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/users/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createUser = async (username, password, trafficLimit, role, userLimit, serverId) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/users/`, {
    username,
    password,
    traffic_limit: trafficLimit,
    role,
    user_limit: userLimit,
    server_id: serverId
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteUser = async (username) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_URL}/users/${username}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const renewUser = async (username, trafficLimit, days) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/users/${username}/renew`, {
    traffic_limit: trafficLimit,
    days
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const checkOnlineUsers = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/users/check-online`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const toggleUserActive = async (username) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/users/${username}/toggle-active`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateUserLimit = async (username, newLimit) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/users/${username}/limit?new_limit=${newLimit}`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createBackup = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/backup/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const restoreBackup = async (file) => {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_URL}/backup/restore/`, formData, {
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    },
  });
  return response.data;
};

export const createNotification = async (userId, message) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/notifications/?user_id=${userId}`, { message }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getNotifications = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/notifications/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const markNotificationRead = async (notificationId) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const setup2FA = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/2fa/setup/`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getReports = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/reports/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const changePassword = async (newPassword) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/users/me/password`, { new_password: newPassword }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createServer = async (name, ipAddress, port, protocol, apiPort) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/servers/`, {
    name,
    ip_address: ipAddress,
    port,
    protocol,
    api_port: apiPort
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getServers = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/servers/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateServer = async (serverId, name, ipAddress, port, protocol, apiPort) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/servers/${serverId}`, {
    name,
    ip_address: ipAddress,
    port,
    protocol,
    api_port: apiPort
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};