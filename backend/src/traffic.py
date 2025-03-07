import os
import re
from sqlalchemy.orm import Session
from .models import User
from .xray_manager import remove_user_from_xray

XRAY_LOG_PATH_PATTERN = "/var/log/xray/access_{server_id}.log"

def parse_xray_logs(server_id: int):
    log_path = XRAY_LOG_PATH_PATTERN.format(server_id=server_id)
    traffic_data = {}
    if os.path.exists(log_path):
        with open(log_path, 'r') as f:
            for line in f:
                match = re.search(r'uuid:(\S+)\s+bytes:(\d+)', line)
                if match:
                    uuid, bytes_used = match.groups()
                    traffic_data[uuid] = traffic_data.get(uuid, 0) + int(bytes_used) // (1024 * 1024 * 1024)  # GB
    return traffic_data

def update_traffic_usage(db: Session):
    servers = db.query(Server).all()
    for server in servers:
        traffic_data = parse_xray_logs(server.id)
        users = db.query(User).filter(User.server_id == server.id).all()
        for user in users:
            user.traffic_used = traffic_data.get(user.uuid, user.traffic_used)
            if user.traffic_used >= user.traffic_limit and user.traffic_limit > 0:
                remove_user_from_xray(user.uuid, server.id, db)
    db.commit()