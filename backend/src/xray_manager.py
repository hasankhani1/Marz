import json
import os
import subprocess
import grpc
import xray_api.stats_pb2 as stats_pb2
import xray_api.stats_pb2_grpc as stats_pb2_grpc
from sqlalchemy.orm import Session
from .models import Server
from datetime import datetime

def load_xray_config(server_id: int, db: Session):
    server = db.query(Server).filter(Server.id == server_id).first()
    config_path = f"/etc/xray/config_{server_id}.json"
    if not os.path.exists(config_path):
        default_config = {
            "log": {"loglevel": "info", "access": f"/var/log/xray/access_{server_id}.log"},
            "api": {"tag": "api", "services": ["HandlerService", "StatsService"]},
            "inbounds": [
                {"port": server.port, "protocol": server.protocol, "settings": {"clients": []}, "streamSettings": {"network": "tcp"}},
                {"port": server.api_port, "protocol": "dokodemo-door", "settings": {"address": "127.0.0.1"}, "tag": "api"}
            ],
            "outbounds": [{"protocol": "freedom"}],
            "routing": {"rules": [{"type": "field", "inboundTag": ["api"], "outboundTag": "api"}]},
            "stats": {}
        }
        with open(config_path, "w") as f:
            json.dump(default_config, f, indent=2)
    with open(config_path, "r") as f:
        return json.load(f)

def save_xray_config(server_id: int, config, db: Session):
    config_path = f"/etc/xray/config_{server_id}.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

def add_user_to_xray(uuid: str, server_id: int, db: Session):
    config = load_xray_config(server_id, db)
    clients = config["inbounds"][0]["settings"]["clients"]
    if not any(client["id"] == uuid for client in clients):
        clients.append({"id": uuid, "level": 0})
    save_xray_config(server_id, config, db)
    restart_xray(server_id, db)

def remove_user_from_xray(uuid: str, server_id: int, db: Session):
    config = load_xray_config(server_id, db)
    clients = config["inbounds"][0]["settings"]["clients"]
    config["inbounds"][0]["settings"]["clients"] = [c for c in clients if c["id"] != uuid]
    save_xray_config(server_id, config, db)
    restart_xray(server_id, db)

def restart_xray(server_id: int, db: Session):
    server = db.query(Server).filter(Server.id == server_id).first()
    subprocess.run(["pkill", "-f", f"xray -c /etc/xray/config_{server_id}.json"], check=False)
    subprocess.Popen(["xray", "-c", f"/etc/xray/config_{server_id}.json"])

def check_server_status(server_id: int, db: Session):
    server = db.query(Server).filter(Server.id == server_id).first()
    try:
        with grpc.insecure_channel(f'{server.ip_address}:{server.api_port}') as channel:
            grpc.channel_ready_future(channel).result(timeout=5)
            server.is_connected = True
    except Exception:
        server.is_connected = False
    server.last_checked = datetime.utcnow()
    db.commit()
    return server.is_connected

def get_active_users(server_id: int, db: Session):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server.is_connected:
        return set()
    try:
        with grpc.insecure_channel(f'{server.ip_address}:{server.api_port}') as channel:
            stub = stats_pb2_grpc.StatsServiceStub(channel)
            response = stub.GetStats(stats_pb2.GetStatsRequest(name="inbound>>>api>>>traffic>>>uplink", reset_=False))
            active_uuids = set()
            for stat in response.stat:
                if "user>>>" in stat.name:
                    uuid = stat.name.split(">>>")[1]
                    active_uuids.add(uuid)
            return active_uuids
    except Exception:
        return set()