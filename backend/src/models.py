from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    uuid = Column(String, unique=True)
    traffic_limit = Column(Integer, default=0)  # GB
    traffic_used = Column(Integer, default=0)   # GB
    role = Column(String, default="user")
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_limit = Column(Integer, default=0)
    expiry_date = Column(DateTime, nullable=True)
    is_online = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    totp_secret = Column(String, nullable=True)
    server_id = Column(Integer, ForeignKey("servers.id"), nullable=True)
    created_users = relationship("User", backref="creator", foreign_keys=[admin_id])
    logs = relationship("Log", backref="user")
    notifications = relationship("Notification", backref="user")
    server = relationship("Server")

class Server(Base):
    __tablename__ = "servers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    ip_address = Column(String)
    port = Column(Integer, default=12345)
    protocol = Column(String, default="vless")
    api_port = Column(Integer, default=54321)
    is_connected = Column(Boolean, default=False)
    last_checked = Column(DateTime, nullable=True)
    users = relationship("User", backref="server_ref")

class Log(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

engine = create_engine("sqlite:///users.db")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)