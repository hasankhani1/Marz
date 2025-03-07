from pydantic import BaseModel
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str
    traffic_limit: float = 0.0
    role: str = "user"
    user_limit: int = 0
    server_id: int | None = None

class UserResponse(BaseModel):
    id: int
    username: str
    uuid: str
    traffic_limit: float
    traffic_used: float
    role: str
    admin_id: int | None
    user_limit: int
    expiry_date: datetime | None
    is_online: bool
    is_active: bool
    server_id: int | None
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class RenewRequest(BaseModel):
    traffic_limit: float
    days: int

class ServerCreate(BaseModel):
    name: str
    ip_address: str
    port: int = 12345
    protocol: str = "vless"
    api_port: int = 54321

class ServerResponse(BaseModel):
    id: int
    name: str
    ip_address: str
    port: int
    protocol: str
    api_port: int
    is_connected: bool
    last_checked: datetime | None
    class Config:
        orm_mode = True

class NotificationCreate(BaseModel):
    message: str

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    is_read: bool
    timestamp: datetime
    class Config:
        orm_mode = True