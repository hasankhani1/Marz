import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Button, TextField, Box, Switch } from '@mui/material';
import { updateUserLimit } from '../api';
import { useTranslation } from 'react-i18next';

const UserList = ({ users, onDelete, onRenew, onToggleActive, isSuperadmin }) => {
  const { t } = useTranslation();
  const [limits, setLimits] = useState({});
  const [renewData, setRenewData] = useState({});

  const handleLimitChange = (username, value) => {
    setLimits((prev) => ({ ...prev, [username]: value }));
  };

  const handleUpdateLimit = async (username) => {
    const newLimit = limits[username] || 0;
    await updateUserLimit(username, newLimit);
    setLimits((prev) => ({ ...prev, [username]: undefined }));
  };

  const handleRenewChange = (username, field, value) => {
    setRenewData((prev) => ({
      ...prev,
      [username]: { ...prev[username], [field]: value },
    }));
  };

  const handleRenew = (username) => {
    const { traffic = 0, days = 0 } = renewData[username] || {};
    onRenew(username, traffic, days);
    setRenewData((prev) => ({ ...prev, [username]: undefined }));
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>{t('Username')}</TableCell>
          <TableCell>UUID</TableCell>
          <TableCell>{t('Role')}</TableCell>
          <TableCell>{t('Traffic Limit (GB)')}</TableCell>
          <TableCell>{t('Traffic Used')}</TableCell>
          <TableCell>{t('Expiry Date')}</TableCell>
          <TableCell>{t('Online')}</TableCell>
          <TableCell>{t('Active')}</TableCell>
          <TableCell>Server</TableCell>
          <TableCell>{t('Renew')}</TableCell>
          {isSuperadmin && <TableCell>{t('User Limit')}</TableCell>}
          <TableCell>{t('Actions')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.username}</TableCell>
            <TableCell>{user.uuid}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>{user.traffic_limit}</TableCell>
            <TableCell>{user.traffic_used}</TableCell>
            <TableCell>{user.expiry_date ? new Date(user.expiry_date).toLocaleDateString() : 'N/A'}</TableCell>
            <TableCell>{user.is_online ? t('Yes') : t('No')}</TableCell>
            <TableCell>
              <Switch
                checked={user.is_active}
                onChange={() => onToggleActive(user.username)}
                disabled={user.role === 'superadmin' && !isSuperadmin}
              />
            </TableCell>
            <TableCell>{user.server_id ? user.server_ref?.name : 'Default'}</TableCell>
            <TableCell>
              {user.role === 'user' && (
                <Box display="flex" flexDirection="column" gap={1}>
                  <TextField
                    label={t('New Traffic (GB)')}
                    type="number"
                    size="small"
                    value={renewData[user.username]?.traffic || ''}
                    onChange={(e) => handleRenewChange(user.username, 'traffic', parseFloat(e.target.value))}
                  />
                  <TextField
                    label={t('Days')}
                    type="number"
                    size="small"
                    value={renewData[user.username]?.days || ''}
                    onChange={(e) => handleRenewChange(user.username, 'days', parseInt(e.target.value))}
                  />
                  <Button size="small" onClick={() => handleRenew(user.username)}>{t('Apply')}</Button>
                </Box>
              )}
            </TableCell>
            {isSuperadmin && (
              <TableCell>
                <TextField
                  type="number"
                  value={limits[user.username] || user.user_limit || ''}
                  onChange={(e) => handleLimitChange(user.username, parseInt(e.target.value))}
                  size="small"
                />
                <Button onClick={() => handleUpdateLimit(user.username)}>Update</Button>
              </TableCell>
            )}
            <TableCell>
              <Button variant="contained" color="error" onClick={() => onDelete(user.username)}>
                {t('Delete')}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UserList;