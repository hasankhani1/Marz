from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid
import shutil
import os
import json
import base64
from apscheduler.schedulers.background import BackgroundScheduler
from .schemas import UserCreate, UserResponse, Token, RenewRequest, ServerCreate, ServerResponse, NotificationCreate, NotificationResponse
from .models import User, Server, Log, Notification, SessionLocal
from .auth import get_db, authenticate_user, create_access_token, get_current_user, get_password_hash, get_current_admin, get_current_superadmin, generate_totp_secret, verify_totp_code
from .xray_manager import add_user_to_xray, remove_user_from_xray, get_active_users, load_xray_config, save_xray_config, restart_xray, check_server_status
from .traffic import update_traffic_usage

app = FastAPI()
scheduler = BackgroundScheduler()

def log_action(db: Session, user_id: int, action: str):
    log = Log(user_id=user_id, action=action)
    db.add(log)
    db.commit()

def create_notification(db: Session, user_id: int, message: str):
    notification = Notification(user_id=user_id, message=message)
    db.add(notification)
    db.commit()

def check_expiry_and_traffic():
    with SessionLocal() as db:
        users = db.query(User).filter(User.role == "user").all()
        for user in users:
            if (user.expiry_date and user.expiry_date <= datetime.utcnow()) or \
               (user.traffic_limit > 0 and user.traffic_used >= user.traffic_limit):
                if user.is_active:
                    user.is_active = False
                    if user.server_id:
                        remove_user_from_xray(user.uuid, user.server_id, db)
                    log_action(db, user.id, "auto_deactivated")
                    create_notification(db, user.id, "Your subscription has expired or traffic limit reached.")
            elif user.expiry_date and (user.expiry_date - datetime.utcnow()).days <= 3:
                create_notification(db, user.id, f"Your subscription expires in {(user.expiry_date - datetime.utcnow()).days} days.")

scheduler.add_job(check_expiry_and_traffic, 'interval', hours=1)
scheduler.add_job(update_traffic_usage, 'interval', hours=1, args=[SessionLocal()])
scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), code: str = Form(None), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Incorrect username/password or user disabled")
    if user.totp_secret and not verify_totp_code(user.totp_secret, code):
        raise HTTPException(status_code=401, detail="Invalid 2FA code")
    access_token = create_access_token(data={"sub": user.username}, expires_delta=timedelta(minutes=30))
    log_action(db, user.id, "login")
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    if current_user.role == "admin" and user.role != "user":
        raise HTTPException(status_code=403, detail="Admins can only create regular users")
    current_users_count = db.query(User).filter(User.admin_id == current_user.id).count()
    if current_user.user_limit > 0 and current_users_count >= current_user.user_limit:
        raise HTTPException(status_code=403, detail="User limit reached")
    if user.server_id and not db.query(Server).filter(Server.id == user.server_id).first():
        raise HTTPException(status_code=400, detail="Invalid server ID")

    new_uuid = str(uuid.uuid4())
    db_user = User(
        username=user.username,
        hashed_password=get_password_hash(user.password),
        uuid=new_uuid,
        traffic_limit=user.traffic_limit,
        role=user.role,
        admin_id=current_user.id if user.role != "superadmin" else None,
        user_limit=user.user_limit if user.role in ["admin", "superadmin"] else 0,
        expiry_date=datetime.utcnow() + timedelta(days=30) if user.role == "user" else None,
        server_id=user.server_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    log_action(db, current_user.id, f"create_user: {user.username}")
    create_notification(db, db_user.id, f"Welcome to My Marzban, {user.username}!")
    if user.role == "user" and db_user.server_id:
        add_user_to_xray(db_user.uuid, db_user.server_id, db)
    return db_user

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/users/", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "superadmin":
        return db.query(User).all()
    elif current_user.role == "admin":
        return db.query(User).filter(User.admin_id == current_user.id).all()
    else:
        return [current_user]

@app.delete("/users/{username}")
def delete_user(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.role == "admin" and user.admin_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if user.role == "user" and user.server_id:
        remove_user_from_xray(user.uuid, user.server_id, db)
    db.delete(user)
    db.commit()
    log_action(db, current_user.id, f"delete_user: {username}")
    return {"message": f"User {username} deleted"}

@app.put("/users/{username}/toggle-active")
def toggle_user_active(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.role == "admin" and user.admin_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    user.is_active = not user.is_active
    if user.role == "user" and user.server_id:
        if not user.is_active:
            remove_user_from_xray(user.uuid, user.server_id, db)
        else:
            add_user_to_xray(user.uuid, user.server_id, db)
    db.commit()
    log_action(db, current_user.id, f"toggle_active: {username} -> {user.is_active}")
    return {"message": f"User {username} {'activated' if user.is_active else 'deactivated'}"}

@app.post("/users/{username}/renew", response_model=UserResponse)
def renew_user(username: str, request: RenewRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    user = db.query(User).filter(User.username == username, User.role == "user").first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.role == "admin" and user.admin_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    user.traffic_limit = request.traffic_limit
    user.expiry_date = datetime.utcnow() + timedelta(days=request.days)
    db.commit()
    db.refresh(user)
    log_action(db, current_user.id, f"renew_user: {username}")
    return user

@app.get("/users/check-online")
def check_online_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    servers = db.query(Server).all()
    for server in servers:
        active_uuids = get_active_users(server.id, db)
        users = db.query(User).filter(User.server_id == server.id, User.role == "user").all()
        for user in users:
            user.is_online = user.uuid in active_uuids and user.is_active and (user.expiry_date is None or user.expiry_date > datetime.utcnow())
    db.commit()
    log_action(db, current_user.id, "check_online_users")
    return {"message": "Online status updated"}

@app.get("/subscription/{uuid}")
def get_subscription(uuid: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.uuid == uuid, User.role == "user").first()
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User not found or inactive")
    server = user.server or db.query(Server).first()
    traffic_remaining = user.traffic_limit - user.traffic_used if user.traffic_limit > 0 else "Unlimited"
    metadata = {
        "expiry": user.expiry_date.isoformat() if user.expiry_date else "Unlimited",
        "traffic_remaining_gb": traffic_remaining
    }
    metadata_str = base64.urlsafe_b64encode(json.dumps(metadata).encode()).decode().strip("=")
    vless_link = f"{server.protocol}://{user.uuid}@{server.ip_address}:{server.port}?security=none&metadata={metadata_str}#user-{user.username}"
    vmess_config = {
        "v": "2", "ps": f"user-{user.username}", "add": server.ip_address, "port": str(server.port),
        "id": user.uuid, "aid": "0", "net": "tcp", "type": "none", "host": "", "path": "", "tls": "",
        "metadata": metadata
    }
    vmess_link = "vmess://" + base64.urlsafe_b64encode(json.dumps(vmess_config).encode()).decode().strip("=")
    return {
        "username": user.username,
        "traffic_limit": user.traffic_limit,
        "traffic_used": user.traffic_used,
        "traffic_remaining": traffic_remaining,
        "expiry_date": user.expiry_date.isoformat() if user.expiry_date else None,
        "vless_link": vless_link,
        "vmess_link": vmess_link,
        "is_online": user.is_online,
        "is_active": user.is_active,
        "server": server.name if server else "Default"
    }

@app.get("/logs/", response_model=list[dict])
def get_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_superadmin)):
    logs = db.query(Log).all()
    return [{"user_id": log.user_id, "action": log.action, "timestamp": log.timestamp} for log in logs]

@app.put("/users/{username}/limit")
def update_user_limit(username: str, new_limit: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_superadmin)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role not in ["admin", "superadmin"]:
        raise HTTPException(status_code=400, detail="Can only update limit for admins or superadmins")
    user.user_limit = new_limit
    db.commit()
    log_action(db, current_user.id, f"update_limit: {username} -> {new_limit}")
    return {"message": f"User limit for {username} updated to {new_limit}"}

@app.get("/backup/")
def create_backup(db: Session = Depends(get_db), current_user: User = Depends(get_current_superadmin)):
    backup_file = f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.db"
    shutil.copy("users.db", backup_file)
    log_action(db, current_user.id, f"create_backup: {backup_file}")
    return {"message": f"Backup created: {backup_file}", "file": backup_file}

@app.post("/backup/restore/")
async def restore_backup(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_superadmin)):
    if not file.filename.endswith('.db'):
        raise HTTPException(status_code=400, detail="Invalid file format. Must be a .db file")
    with open("users.db", "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    log_action(db, current_user.id, f"restore_backup: {file.filename}")
    return {"message": "Backup restored successfully. Restart the server to apply changes."}

@app.post("/notifications/", response_model=NotificationResponse)
def create_notification_endpoint(notification: NotificationCreate, user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.role == "admin" and target_user.admin_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    create_notification(db, user_id, notification.message)
    log_action(db, current_user.id, f"create_notification: {user_id}")
    return NotificationResponse(id=target_user.notifications[-1].id, user_id=user_id, message=notification.message, is_read=False, timestamp=datetime.utcnow())

@app.get("/notifications/", response_model=list[NotificationResponse])
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Notification).filter(Notification.user_id == current_user.id).all()

@app.put("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@app.post("/2fa/setup/")
def setup_2fa(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA already set up")
    secret = generate_totp_secret()
    current_user.totp_secret = secret
    db.commit()
    qr_uri = pyotp.TOTP(secret).provisioning_uri(current_user.username, issuer_name="My Marzban")
    return {"secret": secret, "qr_uri": qr_uri}

@app.get("/reports/")
def get_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    users = db.query(User).filter(User.role == "user").all()
    total_traffic_used = sum(user.traffic_used for user in users)
    active_users = len([u for u in users if u.is_active])
    online_users = len([u for u in users if u.is_online])
    logs = db.query(Log).filter(Log.timestamp >= datetime.utcnow() - timedelta(days=7)).all()
    daily_traffic = {}
    for log in logs:
        if "traffic" in log.action:
            day = log.timestamp.strftime('%Y-%m-%d')
            daily_traffic[day] = daily_traffic.get(day, 0) + 1
    return {
        "total_traffic_used_gb": total_traffic_used,
        "active_users": active_users,
        "online_users": online_users,
        "daily_traffic": daily_traffic
    }

@app.put("/users/me/password")
def change_password(new_password: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.hashed_password = get_password_hash(new_password)
    db.commit()
    log_action(db, current_user.id, "change_password")
    return {"message": "Password changed successfully"}

@app.post("/servers/", response_model=ServerResponse)
def create_server(server: ServerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_superadmin)):
    db_server = Server(**server.dict())
    db.add(db_server)
    db.commit()
    db.refresh(db_server)
    load_xray_config(db_server.id, db)
    restart_xray(db_server.id, db)
    log_action(db, current_user.id, f"create_server: {server.name}")
    return db_server

@app.get("/servers/", response_model=list[ServerResponse])
def list_servers(db: Session = Depends(get_db), current_user: User = Depends(get_current_superadmin)):
    servers = db.query(Server).all()
    for server in servers:
        check_server_status(server.id, db)
    return servers

@app.put("/servers/{server_id}", response_model=ServerResponse)
def update_server(server_id: int, server: ServerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_superadmin)):
    db_server = db.query(Server).filter(Server.id == server_id).first()
    if not db_server:
        raise HTTPException(status_code=404, detail="Server not found")
    for key, value in server.dict().items():
        setattr(db_server, key, value)
    db.commit()
    db.refresh(db_server)
    restart_xray(server_id, db)
    log_action(db, current_user.id, f"update_server: {server_id}")
    return db_server