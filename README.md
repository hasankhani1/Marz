# My Marzban

A complete proxy management system with Xray integration, built with FastAPI (Backend) and React (Frontend).

## Features
- Multi-role system: User, Admin, Superadmin
- Subscription links (VLESS/VMess) with QR codes and metadata (traffic in GB, expiry)
- Traffic and expiry management (in GB)
- Online/offline status via Xray API
- User activation/deactivation
- Dark/Light mode with Persian/English support
- Backup/restore database
- Notifications system
- Detailed logs (Superadmin only)
- Automated expiry/traffic checking
- Two-factor authentication (2FA)
- Multi-server support with node management
- Reports and analytics
- User profile with password change

## Prerequisites
- Linux server (e.g., Ubuntu 20.04+)
- Root or sudo access
- Open ports: 3000 (Frontend), 8000 (Backend), 12345 & 54321 (Xray)

## Installation
Deploy the entire project with a single command:
```bash
curl -sL https://raw.githubusercontent.com/your-username/my_marzban/master/install.sh | bash