import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Box, FormControl, InputLabel, Select, MenuItem, Switch, Tabs, Tab, Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import UserList from './UserList';
import { getUsers, createUser, deleteUser, renewUser, getCurrentUser, checkOnlineUsers, toggleUserActive, createBackup, restoreBackup, createNotification, getNotifications, markNotificationRead, setup2FA, getReports, createServer, getServers, updateServer } from '../api';
import { useTranslation } from 'react-i18next';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const lightTheme = createTheme({ palette: { mode: 'light' } });
const darkTheme = createTheme({ palette: { mode: 'dark' } });

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reports, setReports] = useState(null);
  const [servers, setServers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [trafficLimit, setTrafficLimit] = useState(0);
  const [role, setRole] = useState('user');
  const [userLimit, setUserLimit] = useState(0);
  const [serverId, setServerId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [notificationUserId, setNotificationUserId] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [newServerName, setNewServerName] = useState('');
  const [newServerIp, setNewServerIp] = useState('');
  const [newServerPort, setNewServerPort] = useState(12345);
  const [newServerProtocol, setNewServerProtocol] = useState('vless');
  const [newServerApiPort, setNewServerApiPort] = useState(54321);

  const fetchUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  const fetchCurrentUser = async () => {
    const data = await getCurrentUser();
    setCurrentUser(data);
  };

  const fetchLogs = async () => {
    if (currentUser?.role === 'superadmin') {
      const response = await fetch('http://localhost:8000/logs/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setLogs(data);
    }
  };

  const fetchNotifications = async () => {
    const data = await getNotifications();
    setNotifications(data);
  };

  const fetchReports = async () => {
    const data = await getReports();
    setReports(data);
  };

  const fetchServers = async () => {
    if (currentUser?.role === 'superadmin') {
      const data = await getServers();
      setServers(data);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
    fetchLogs();
    fetchNotifications();
    fetchReports();
    fetchServers();
  }, []);

  const handleCreateUser = async () => {
    try {
      await createUser(newUsername, newPassword, trafficLimit, role, userLimit, serverId);
      setNewUsername('');
      setNewPassword('');
      setTrafficLimit(0);
      setRole('user');
      setUserLimit(0);
      setServerId(null);
      setError('');
      fetchUsers();
      fetchLogs();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (username) => {
    await deleteUser(username);
    fetchUsers();
    fetchLogs();
  };

  const handleRenewUser = async (username, trafficLimit, days) => {
    await renewUser(username, trafficLimit, days);
    fetchUsers();
    fetchLogs();
  };

  const handleCheckOnline = async () => {
    await checkOnlineUsers();
    fetchUsers();
  };

  const handleToggleActive = async (username) => {
    await toggleUserActive(username);
    fetchUsers();
    fetchLogs();
  };

  const handleCreateBackup = async () => {
    const response = await createBackup();
    const link = document.createElement('a');
    link.href = `/backup/${response.file}`;
    link.download = response.file;
    link.click();
    fetchLogs();
  };

  const handleRestoreBackup = async (event) => {
    if (event.target.files && event.target.files[0]) {
      await restoreBackup(event.target.files[0]);
      fetchUsers();
      fetchLogs();
    }
  };

  const handleCreateNotification = async () => {
    await createNotification(parseInt(notificationUserId), notificationMessage);
    setNotificationUserId('');
    setNotificationMessage('');
    fetchNotifications();
    fetchLogs();
  };

  const handleMarkNotificationRead = async (notificationId) => {
    await markNotificationRead(notificationId);
    fetchNotifications();
  };

  const handleSetup2FA = async () => {
    const { qr_uri } = await setup2FA();
    window.open(qr_uri, '_blank');
  };

  const handleCreateServer = async () => {
    await createServer(newServerName, newServerIp, newServerPort, newServerProtocol, newServerApiPort);
    setNewServerName('');
    setNewServerIp('');
    setNewServerPort(12345);
    setNewServerProtocol('vless');
    setNewServerApiPort(54321);
    fetchServers();
  };

  const handleUpdateServer = async (serverId) => {
    await updateServer(serverId, newServerName, newServerIp, newServerPort, newServerProtocol, newServerApiPort);
    fetchServers();
  };

  const chartData = reports ? {
    labels: Object.keys(reports.daily_traffic),
    datasets: [{
      label: 'Daily Traffic Updates',
      data: Object.values(reports.daily_traffic),
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
    }]
  } : null;

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <Paper style={{ minHeight: '100vh', padding: '20px' }}>
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Typography variant="h4">{t('Dashboard')}</Typography>
            <Box display="flex" gap={2}>
              <Select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)}>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="fa">فارسی</MenuItem>
              </Select>
              <Typography component="span">{t('Dark Mode')}</Typography>
              <Switch checked={isDarkMode} onChange={() => setIsDarkMode(!isDarkMode)} />
            </Box>
          </Box>
          {currentUser && (
            <Typography variant="h6">
              {t('Welcome')}, {currentUser.username} ({currentUser.role}) - {t('User Limit')}: {currentUser.user_limit}
            </Typography>
          )}
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mt: 2 }}>
            <Tab label={t('Users')} />
            {currentUser?.role === 'superadmin' && <Tab label={t('Logs')} />}
            <Tab label={t('Notifications')} />
            {currentUser?.role !== 'user' && <Tab label="Reports" />}
            {currentUser?.role === 'superadmin' && <Tab label="Servers" />}
            <Tab label="Settings" />
          </Tabs>
          {tabValue === 0 && (
            <>
              {currentUser?.role !== 'user' && (
                <Box mt={4}>
                  <Typography variant="h5">{t('Create New User')}</Typography>
                  <TextField label={t('Username')} value={newUsername} onChange={(e) => setNewUsername(e.target.value)} margin="normal" />
                  <TextField label={t('Password')} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} margin="normal" />
                  <TextField label={t('Traffic Limit (GB)')} type="number" value={trafficLimit} onChange={(e) => setTrafficLimit(parseFloat(e.target.value))} margin="normal" />
                  <FormControl margin="normal">
                    <InputLabel>{t('Role')}</InputLabel>
                    <Select value={role} onChange={(e) => setRole(e.target.value)}>
                      <MenuItem value="user">{t('User')}</MenuItem>
                      <MenuItem value="admin" disabled={currentUser?.role !== 'superadmin'}>{t('Admin')}</MenuItem>
                      {currentUser?.role === 'superadmin' && <MenuItem value="superadmin">{t('Superadmin')}</MenuItem>}
                    </Select>
                  </FormControl>
                  {role !== 'user' && (
                    <TextField label={t('User Limit')} type="number" value={userLimit} onChange={(e) => setUserLimit(parseInt(e.target.value))} margin="normal" />
                  )}
                  {role === 'user' && servers.length > 0 && (
                    <FormControl margin="normal">
                      <InputLabel>Server</InputLabel>
                      <Select value={serverId || ''} onChange={(e) => setServerId(parseInt(e.target.value))}>
                        {servers.map((server) => (
                          <MenuItem key={server.id} value={server.id}>{server.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  {error && <Typography color="error">{error}</Typography>}
                  <Button variant="contained" color="primary" onClick={handleCreateUser} sx={{ mt: 2 }}>{t('Create User')}</Button>
                </Box>
              )}
              <Box mt={4} display="flex" gap={2}>
                {currentUser?.role !== 'user' && (
                  <>
                    <Button variant="contained" color="info" onClick={handleCheckOnline}>{t('Check Online Status')}</Button>
                  </>
                )}
                {currentUser?.role === 'superadmin' && (
                  <>
                    <Button variant="contained" onClick={handleCreateBackup}>Create Backup</Button>
                    <Button variant="contained" component="label">
                      Restore Backup
                      <input type="file" hidden onChange={handleRestoreBackup} accept=".db" />
                    </Button>
                  </>
                )}
              </Box>
              <Box mt={4}>
                <Typography variant="h5">{t('Users')}</Typography>
                <UserList 
                  users={users} 
                  onDelete={handleDeleteUser} 
                  onRenew={handleRenewUser}
                  onToggleActive={handleToggleActive}
                  isSuperadmin={currentUser?.role === 'superadmin'} 
                />
              </Box>
            </>
          )}
          {tabValue === 1 && currentUser?.role === 'superadmin' && (
            <Box mt={4}>
              <Typography variant="h5">{t('Logs')}</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User ID</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.timestamp}>
                      <TableCell>{log.user_id}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
          {tabValue === 2 && (
            <Box mt={4}>
              <Typography variant="h5">{t('Notifications')}</Typography>
              {currentUser?.role !== 'user' && (
                <Box mt={2}>
                  <Typography variant="h6">Send Notification</Typography>
                  <TextField
                    label="User ID"
                    type="number"
                    value={notificationUserId}
                    onChange={(e) => setNotificationUserId(e.target.value)}
                    margin="normal"
                  />
                  <TextField
                    label="Message"
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    margin="normal"
                    fullWidth
                  />
                  <Button variant="contained" color="primary" onClick={handleCreateNotification} sx={{ mt: 2 }}>
                    Send
                  </Button>
                </Box>
              )}
              <Box mt={4}>
                <Typography variant="h6">Your Notifications</Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Message</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {notifications.map((notif) => (
                      <TableRow key={notif.id}>
                        <TableCell>{notif.message}</TableCell>
                        <TableCell>{new Date(notif.timestamp).toLocaleString()}</TableCell>
                        <TableCell>{notif.is_read ? 'Read' : 'Unread'}</TableCell>
                        <TableCell>
                          {!notif.is_read && (
                            <Button onClick={() => handleMarkNotificationRead(notif.id)}>{t('Mark as Read')}</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
          {tabValue === 3 && currentUser?.role !== 'user' && (
            <Box mt={4}>
              <Typography variant="h5">Reports</Typography>
              {reports && (
                <>
                  <Typography>Total Traffic Used: {reports.total_traffic_used_gb} GB</Typography>
                  <Typography>Active Users: {reports.active_users}</Typography>
                  <Typography>Online Users: {reports.online_users}</Typography>
                  <Box mt={2}>
                    <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Daily Traffic Updates (Last 7 Days)' } } }} />
                  </Box>
                </>
              )}
            </Box>
          )}
          {tabValue === 4 && currentUser?.role === 'superadmin' && (
            <Box mt={4}>
              <Typography variant="h5">{t('Servers')}</Typography>
              <Box mt={2}>
                <TextField label="Server Name" value={newServerName} onChange={(e) => setNewServerName(e.target.value)} margin="normal" />
                <TextField label="IP Address" value={newServerIp} onChange={(e) => setNewServerIp(e.target.value)} margin="normal" />
                <TextField label="Port" type="number" value={newServerPort} onChange={(e) => setNewServerPort(parseInt(e.target.value))} margin="normal" />
                <TextField label="API Port" type="number" value={newServerApiPort} onChange={(e) => setNewServerApiPort(parseInt(e.target.value))} margin="normal" />
                <FormControl margin="normal">
                  <InputLabel>Protocol</InputLabel>
                  <Select value={newServerProtocol} onChange={(e) => setNewServerProtocol(e.target.value)}>
                    <MenuItem value="vless">VLESS</MenuItem>
                    <MenuItem value="vmess">VMess</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" color="primary" onClick={handleCreateServer} sx={{ mt: 2 }}>Add Server</Button>
              </Box>
              <Box mt={4}>
                <Typography variant="h6">Current Servers</Typography>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Port</TableCell>
                      <TableCell>API Port</TableCell>
                      <TableCell>Protocol</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {servers.map((server) => (
                      <TableRow key={server.id}>
                        <TableCell>{server.name}</TableCell>
                        <TableCell>{server.ip_address}</TableCell>
                        <TableCell>{server.port}</TableCell>
                        <TableCell>{server.api_port}</TableCell>
                        <TableCell>{server.protocol}</TableCell>
                        <TableCell>{server.is_connected ? 'Connected' : 'Disconnected'}</TableCell>
                        <TableCell>
                          <Button onClick={() => handleUpdateServer(server.id)}>Update</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
          {tabValue === 5 && (
            <Box mt={4}>
              <Typography variant="h5">Settings</Typography>
              <Button variant="contained" onClick={handleSetup2FA} sx={{ mt: 2 }}>Setup 2FA</Button>
            </Box>
          )}
        </Container>
      </Paper>
    </ThemeProvider>
  );
};

export default Dashboard;