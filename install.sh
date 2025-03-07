#!/bin/bash

# پیام شروع نصب
echo "Installing My Marzban..."

# به‌روزرسانی سیستم و نصب پیش‌نیازها
echo "Installing prerequisites..."
sudo apt-get update -y
sudo apt-get install -y curl git docker.io docker-compose nodejs npm

# فعال کردن و شروع سرویس Docker
echo "Configuring Docker..."
sudo systemctl enable docker
sudo systemctl start docker

# کلون کردن پروژه از GitHub
echo "Cloning repository..."
git clone https://github.com/hasankhani1/my_marzban.git
cd my_marzban || { echo "Failed to enter directory"; exit 1; }

# تنظیم و اجرای Backend
echo "Setting up Backend..."
cd backend || { echo "Failed to enter backend directory"; exit 1; }
docker-compose up -d --build

# تنظیم و اجرای Frontend
echo "Setting up Frontend..."
cd ../frontend || { echo "Failed to enter frontend directory"; exit 1; }
npm install
npm run build
npm install -g serve
serve -s build -l 3000 &

# بررسی موفقیت نصب
if [ $? -eq 0 ]; then
    echo "Installation complete!"
    echo "Access the panel at http://<your-server-ip>:3000"
    echo "Backend API at http://<your-server-ip>:8000"
    echo "Default Superadmin: username=superadmin1, password=super123"
else
    echo "Installation failed. Please check the logs above for errors."
    exit 1
fi