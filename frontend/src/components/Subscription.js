import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Paper } from '@mui/material';
import QRCode from 'qrcode.react';

const Subscription = () => {
  const { uuid } = useParams();
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      const response = await fetch(`http://localhost:8000/subscription/${uuid}`);
      const data = await response.json();
      setSubscription(data);
    };
    fetchSubscription();
  }, [uuid]);

  if (!subscription) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="md" style={{ marginTop: '50px' }}>
      <Paper style={{ padding: '20px' }}>
        <Typography variant="h4" align="center">Subscription Details</Typography>
        <Box mt={4}>
          <Typography><strong>Username:</strong> {subscription.username}</Typography>
          <Typography><strong>Traffic Limit:</strong> {subscription.traffic_limit} GB</Typography>
          <Typography><strong>Traffic Used:</strong> {subscription.traffic_used} GB</Typography>
          <Typography><strong>Traffic Remaining:</strong> {subscription.traffic_remaining} GB</Typography>
          <Typography><strong>Expiry Date:</strong> {subscription.expiry_date || 'N/A'}</Typography>
          <Typography><strong>Status:</strong> {subscription.is_online ? 'Online' : 'Offline'}</Typography>
          <Typography><strong>Server:</strong> {subscription.server}</Typography>
          <Box mt={2}>
            <Typography><strong>VLESS Link:</strong> {subscription.vless_link}</Typography>
            <QRCode value={subscription.vless_link} />
          </Box>
          <Box mt={2}>
            <Typography><strong>VMess Link:</strong> {subscription.vmess_link}</Typography>
            <QRCode value={subscription.vmess_link} />
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Subscription;