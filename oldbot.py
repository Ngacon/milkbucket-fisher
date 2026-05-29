import discord
from discord.ext import commands, tasks
from discord.ui import View, Select, Button
import random, json, os, asyncio, time, io
from threading import Thread
from flask import Flask

# ==========================================
# [1] CẤU HÌNH SERVER & FLASK (KEEP ALIVE)
# ==========================================
app = Flask('')

@app.route('/')
def home():
    return "Bot Fishing Master Ultimate V8 is Online!"

def run_flask():
    # Render sẽ cấp PORT qua biến môi trường
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)

def keep_alive():
    t = Thread(target=run_flask)
    t.start()

# ==========================================
# [2] CẤU HÌNH BOT & DANH SÁCH ADMIN
# ==========================================
TOKEN = os.getenv('DISCORD_TOKEN') 

# --- DANH SÁCH ADMIN (QUAN TRỌNG) ---
ADMIN_IDS = [
    1199996452999532565,  # Admin 1 (Bạn)
    1329789949372797001,
    1437696600918196256
]

TY_GIA_KC = 10000000 
ID_KENH_THONG_BAO = 1359853999976615978
ID_KENH_CA_HIEM = 1391406922674208820
ID_KENH_BACKUP = 1468827017393737901 

intents = discord.Intents.default()
intents.message_content = True 
bot = commands.Bot(command_prefix='!', intents=intents, help_command=None)

# ==========================================
# [3] DỮ LIỆU GAME (FULL UPDATE V8 - SIÊU KHÓ)
# ==========================================
GOLDEN_HOUR = {"active": False, "end_time": 0, "multiplier": 1}
DB_FILE = "fishing_v6_data.json"
CODE_FILE = "giftcodes.json"

data = {} 
codes = {}

# --- HỆ THỐNG CẦN CÂU (80 CẤP ĐỘ) ---
# Giá tăng lũy thừa, Rate tăng chậm hơn Diff của Map để tạo độ khó
RODS = {
    1: {"n": "🎋 Cần Tre", "price": 0, "rate": 30},
    2: {"n": "🪵 Cần Gỗ Sồi", "price": 150000, "rate": 45},
    3: {"n": "🎣 Cần Carbon", "price": 1500000, "rate": 60}, 
    4: {"n": "⚙️ Cần Máy Shimano", "price": 8000000, "rate": 75},
    5: {"n": "🔱 Cần Poseidon", "price": 30000000, "rate": 90},
    6: {"n": "🐉 Cần Long Thần", "price": 150000000, "rate": 105},
    7: {"n": "🌌 Cần Hư Vô", "price": 800000000, "rate": 120},
    8: {"n": "☄️ Cần Thiên Thạch", "price": 4000000000, "rate": 135},
    9: {"n": "🧬 Cần Lượng Tử", "price": 15000000000, "rate": 150},
    10: {"n": "⏳ Cần Thời Gian", "price": 80000000000, "rate": 165},
    11: {"n": "⚫ Cần Hố Đen", "price": 400000000000, "rate": 180},
    12: {"n": "👑 Cần Sáng Thế", "price": 1500000000000, "rate": 200},
    13: {"n": "🌌 Cần Tinh Vân", "price": 8000000000000, "rate": 220},
    14: {"n": "💠 Cần Đa Chiều", "price": 40000000000000, "rate": 240},
    15: {"n": "🌀 Cần Vòng Lặp", "price": 150000000000000, "rate": 260},
    16: {"n": "🎭 Cần Ảo Ảnh", "price": 600000000000000, "rate": 280},
    17: {"n": "☀️ Cần Thái Dương", "price": 2500000000000000, "rate": 300},
    18: {"n": "🛸 Cần Alien", "price": 8000000000000000, "rate": 325},
    19: {"n": "🧬 Cần Mã Nguồn", "price": 40000000000000000, "rate": 350},
    20: {"n": "🌠 Cần Vĩnh Hằng", "price": 150000000000000000, "rate": 380},
    21: {"n": "🌋 Cần Tâm Trái Đất", "price": 800000000000000000, "rate": 420},
    22: {"n": "🕉️ Cần Tối Thượng", "price": 4000000000000000000, "rate": 500},
    23: {"n": "👾 Cần Hacker", "price": 20000000000000000000, "rate": 600},
    24: {"n": "📜 Cần Lời Phán Quyết", "price": 100000000000000000000, "rate": 750},
    25: {"n": "♾️ Cần Vô Cực", "price": 999999999999999999999, "rate": 1000},
    26: {"n": "⚡ Cần Hủy Diệt", "price": 5000000000000000000000, "rate": 1150},
    27: {"n": "🛠️ Cần Đấng Sáng Tạo", "price": 20000000000000000000000, "rate": 1350},
    28: {"n": "🌌 Cần Đa Vũ Trụ", "price": 100000000000000000000000, "rate": 1600},
    29: {"n": "⚜️ Cần Omnipotent", "price": 500000000000000000000000, "rate": 1900},
    30: {"n": "🏁 Cần The End", "price": 9000000000000000000000000, "rate": 2300},
    # --- 50 CẦN MỚI (SIÊU CẤP) ---
    31: {"n": "⚛️ Cần Nguyên Tử", "price": 10**26, "rate": 2500},
    32: {"n": "🌪️ Cần Bão Tố", "price": 10**27, "rate": 2700},
    33: {"n": "🔋 Cần Năng Lượng Sạch", "price": 10**28, "rate": 2900},
    34: {"n": "🦠 Cần Virus", "price": 10**29, "rate": 3100},
    35: {"n": "💉 Cần Vắc Xin", "price": 10**30, "rate": 3300},
    36: {"n": "🔭 Cần Hubble", "price": 10**31, "rate": 3500},
    37: {"n": "🔬 Cần Nano", "price": 10**32, "rate": 3800},
    38: {"n": "📡 Cần 6G", "price": 10**33, "rate": 4100},
    39: {"n": "💾 Cần Big Data", "price": 10**34, "rate": 4400},
    40: {"n": "🤖 Cần AI God", "price": 10**35, "rate": 4700},
    41: {"n": "🔥 Cần Dung Nham Tinh Khiết", "price": 10**36, "rate": 5000},
    42: {"n": "❄️ Cần Băng Giá Vĩnh Cửu", "price": 10**37, "rate": 5300},
    43: {"n": "🌩️ Cần Sấm Sét Zeus", "price": 10**38, "rate": 5600},
    44: {"n": "🌊 Cần Thủy Triều Đỏ", "price": 10**39, "rate": 5900},
    45: {"n": "☘️ Cần Rừng Già", "price": 10**40, "rate": 6200},
    46: {"n": "💀 Cần Tử Thần", "price": 10**41, "rate": 6500},
    47: {"n": "😇 Cần Thánh Thần", "price": 10**42, "rate": 6800},
    48: {"n": "☯️ Cần Âm Dương", "price": 10**43, "rate": 7200},
    49: {"n": "🔮 Cần Tiên Tri", "price": 10**44, "rate": 7600},
    50: {"n": "🧿 Cần Mắt Thần", "price": 10**45, "rate": 8000},
    51: {"n": "📐 Cần Hình Học", "price": 10**46, "rate": 8500},
    52: {"n": "🧮 Cần Đại Số", "price": 10**47, "rate": 9000},
    53: {"n": "🔢 Cần Số Nguyên Tố", "price": 10**48, "rate": 9500},
    54: {"n": "♾️ Cần Giới Hạn Lim", "price": 10**49, "rate": 10000},
    55: {"n": "📈 Cần Đạo Hàm", "price": 10**50, "rate": 10500},
    56: {"n": "📉 Cần Tích Phân", "price": 10**51, "rate": 11000},
    57: {"n": "📊 Cần Xác Suất", "price": 10**52, "rate": 11500},
    58: {"n": "🧩 Cần Ma Trận", "price": 10**53, "rate": 12000},
    59: {"n": "🎻 Cần String Theory", "price": 10**54, "rate": 12500},
    60: {"n": "🎆 Cần Đa Vũ Trụ Cấp 2", "price": 10**55, "rate": 13000},
    61: {"n": "🧱 Cần Hạt Quark", "price": 10**56, "rate": 13600},
    62: {"n": "💡 Cần Photon", "price": 10**57, "rate": 14200},
    63: {"n": "🧼 Cần Bong Bóng Không/Thời Gian", "price": 10**58, "rate": 14800},
    64: {"n": "🕳️ Cần Wormhole", "price": 10**59, "rate": 15400},
    65: {"n": "🚧 Cần Chân Trời Sự Kiện", "price": 10**60, "rate": 16000},
    66: {"n": "🌑 Cần Vật Chất Tối", "price": 10**61, "rate": 16600},
    67: {"n": "⚡ Cần Năng Lượng Tối", "price": 10**62, "rate": 17200},
    68: {"n": "💥 Cần Siêu Tân Tinh", "price": 10**63, "rate": 17800},
    69: {"n": "🌌 Cần Quasar", "price": 10**64, "rate": 18500},
    70: {"n": "💫 Cần Pulsar", "price": 10**65, "rate": 19200},
    71: {"n": "👑 Cần Admin", "price": 10**70, "rate": 20000},
    72: {"n": "🛡️ Cần Moderator", "price": 10**75, "rate": 21000},
    73: {"n": "💻 Cần Developer", "price": 10**80, "rate": 22000},
    74: {"n": "🔨 Cần Ban Hammer", "price": 10**85, "rate": 23000},
    75: {"n": "🐛 Cần Debugger", "price": 10**90, "rate": 24000},
    76: {"n": "🌐 Cần Internet", "price": 10**95, "rate": 25000},
    77: {"n": "💾 Cần Blockchain", "price": 10**100, "rate": 26000}, # Googol Price
    78: {"n": "🪙 Cần Bitcoin", "price": 10**105, "rate": 27000},
    79: {"n": "🐕 Cần Doge", "price": 10**110, "rate": 28000},
    80: {"n": "🛐 Cần Đấng Tối Cao", "price": 10**120, "rate": 30000},
}

# --- HỆ THỐNG MAP (ĐỊA ĐIỂM) - THÊM 50 MAP MỚI ---
LOCATIONS = {
    # ... (Các map cũ giữ nguyên)
    "ho_lang": {"n": "🌿 Hồ Làng", "price": 0, "diff": 0},
    "song_amazon": {"n": "🐊 Sông Amazon", "price": 2000000, "diff": 15},
    "bien_sau": {"n": "⚓ Biển Sâu", "price": 20000000, "diff": 30},
    "dao_dau_lau": {"n": "☠️ Đảo Đầu Lâu", "price": 100000000, "diff": 45},
    "vuc_tham": {"n": "🌑 Vực Thẳm", "price": 500000000, "diff": 60},
    "thien_ha": {"n": "✨ Dải Ngân Hà", "price": 5000000000, "diff": 75},
    "chan_troi": {"n": "🌅 Chân Trời", "price": 20000000000, "diff": 90},
    "da_vu_tru": {"n": "🌀 Đa Vũ Trụ", "price": 100000000000, "diff": 105},
    "hu_khong": {"n": "🔮 Cõi Hư Không", "price": 500000000000, "diff": 120},
    "chieu_thu_5": {"n": "💠 Chiều Thứ 5", "price": 2000000000000, "diff": 135},
    "khoi_nguyen": {"n": "🕉️ Vùng Khởi Nguyên", "price": 10000000000000, "diff": 150},
    "vung_lo_den": {"n": "🕳️ Vùng Lỗ Đen", "price": 50000000000000, "diff": 165},
    "nghia_dia_sao": {"n": "☄️ Nghĩa Địa Sao", "price": 250000000000000, "diff": 180},
    "cong_vinh_cuu": {"n": "⛩️ Cổng Vĩnh Cửu", "price": 1000000000000000, "diff": 200},
    "dao_ngu_sac": {"n": "🌈 Đảo Ngũ Sắc", "price": 5000000000000000, "diff": 220},
    "vung_dat_chet": {"n": "💀 Vùng Đất Chết", "price": 20000000000000000, "diff": 250},
    "tinh_cau_pha_le": {"n": "💎 Tinh Cầu Pha Lê", "price": 100000000000000000, "diff": 280},
    "su_on_ao": {"n": "🎷 Sự Ồn Ào Vĩnh Hằng", "price": 500000000000000000, "diff": 310},
    "diem_khong": {"n": "📍 Điểm Không", "price": 2000000000000000000, "diff": 350},
    "vuon_dia_dang": {"n": "🍎 Vườn Địa Đàng", "price": 10000000000000000000, "diff": 400},
    "be_ngan_ha": {"n": "🌌 Bể Ngân Hà", "price": 50000000000000000000, "diff": 450},
    "ma_tran_so": {"n": "👾 Ma Trận Số", "price": 200000000000000000000, "diff": 500},
    "tang_dia_nguc": {"n": "🔥 Tầng Địa Ngục 18", "price": 800000000000000000000, "diff": 550},
    "cong_thien_duong": {"n": "☁️ Cổng Thiên Đường", "price": 3000000000000000000000, "diff": 600},
    "dong_thoi_gian": {"n": "⏳ Dòng Thời Gian", "price": 10000000000000000000000, "diff": 650},
    "the_gioi_song_song": {"n": "👯 Thế Giới Song Song", "price": 50000000000000000000000, "diff": 700},
    "vuc_sau_tam_tri": {"n": "🧠 Vực Sâu Tâm Trí", "price": 200000000000000000000000, "diff": 750},
    "tan_cung_vu_tru": {"n": "🚧 Tận Cùng Vũ Trụ", "price": 1000000000000000000000000, "diff": 800},
    "coi_huyen_bi": {"n": "🧙 Cõi Huyền Bí", "price": 5000000000000000000000000, "diff": 900},
    "vung_chan_khong": {"n": "🌑 Vùng Chân Không", "price": 20000000000000000000000000, "diff": 1050},
    "dai_duong_luong_tu": {"n": "⚛️ Đại Dương Lượng Tử", "price": 100000000000000000000000000, "diff": 1250},
    "the_gioi_gia_lap": {"n": "🧬 Thế Giới Giả Lập", "price": 800000000000000000000000000, "diff": 1500},
    "coi_niet_ban": {"n": "☸️ Cõi Niết Bàn", "price": 5000000000000000000000000000, "diff": 1800},
    "diem_ky_di": {"n": "⬛ Điểm Kỳ Dị Cuối Cùng", "price": 90000000000000000000000000000, "diff": 2200},
    # --- 50 MAP MỚI (SIÊU KHÓ) ---
    "khong_gian_hilbert": {"n": "📦 Không Gian Hilbert", "price": 10**29, "diff": 2500},
    "vung_entropy": {"n": "🔥 Vùng Entropy Cực Đại", "price": 10**30, "diff": 2800},
    "day_ngan_ha": {"n": "🌌 Dây Ngân Hà", "price": 10**31, "diff": 3200},
    "kho_du_lieu_akashic": {"n": "📚 Kho Akashic", "price": 10**32, "diff": 3600},
    "song_thoi_gian": {"n": "⌛ Sông Thời Gian Ngược", "price": 10**33, "diff": 4000},
    "vuc_hon_mang": {"n": "🌪️ Vực Hỗn Mang", "price": 10**34, "diff": 4500},
    "coi_mong": {"n": "💤 Cõi Mộng Mị", "price": 10**35, "diff": 5000},
    "vung_phan_vat_chat": {"n": "⚫ Vùng Phản Vật Chất", "price": 10**36, "diff": 5500},
    "thien_ha_andromeda": {"n": "🔭 Thiên Hà Andromeda", "price": 10**37, "diff": 6000},
    "cum_sao_hercules": {"n": "🏋️ Cụm Sao Hercules", "price": 10**38, "diff": 6500},
    "vung_buc_xa": {"n": "☢️ Vùng Bức Xạ Gamma", "price": 10**39, "diff": 7000},
    "hanh_tinh_kim_cuong": {"n": "💎 Hành Tinh Kim Cương", "price": 10**40, "diff": 7500},
    "sao_neutron": {"n": "🧲 Sao Neutron", "price": 10**41, "diff": 8000},
    "sao_lun_trang": {"n": "⚪ Sao Lùn Trắng", "price": 10**42, "diff": 8500},
    "sao_kholong": {"n": "🔴 Sao Khổng Lồ Đỏ", "price": 10**43, "diff": 9000},
    "vung_hu_vo_tuyet_doi": {"n": "⬛ Hư Vô Tuyệt Đối", "price": 10**44, "diff": 9500},
    "dai_duong_plasma": {"n": "⚡ Đại Dương Plasma", "price": 10**45, "diff": 10000},
    "the_gioi_fractal": {"n": "❄️ Thế Giới Fractal", "price": 10**46, "diff": 10500},
    "khong_gian_topone": {"n": "🗺️ Không Gian Topo", "price": 10**47, "diff": 11000},
    "mien_gia_tri_nan": {"n": "🚫 Miền Giá Trị NaN", "price": 10**48, "diff": 11500},
    "dia_nguc_tuyet": {"n": "🧊 Địa Ngục Tuyết", "price": 10**49, "diff": 12000},
    "vuon_dia_dang_den": {"n": "🥀 Vườn Địa Đàng Đen", "price": 10**50, "diff": 12500},
    "vung_cam_thuat": {"n": "🚫 Vùng Cấm Thuật", "price": 10**51, "diff": 13000},
    "coi_am_ty": {"n": "👻 Cõi Âm Ty", "price": 10**52, "diff": 13500},
    "vuc_tham_mariana_vu_tru": {"n": "⏬ Vực Mariana Vũ Trụ", "price": 10**53, "diff": 14000},
    "dinh_olympus": {"n": "🏛️ Đỉnh Olympus", "price": 10**54, "diff": 14500},
    "valhalla": {"n": "⚔️ Valhalla", "price": 10**55, "diff": 15000},
    "atlantis_vu_tru": {"n": "🔱 Atlantis Vũ Trụ", "price": 10**56, "diff": 15500},
    "thanh_pho_vang_el_dorado": {"n": "💰 El Dorado", "price": 10**57, "diff": 16000},
    "khu_vuc_51_vu_tru": {"n": "👽 Khu Vực 51-X", "price": 10**58, "diff": 16500},
    "server_google": {"n": "💻 Máy Chủ Google", "price": 10**59, "diff": 17000},
    "blockchain_genesis": {"n": "⛓️ Blockchain Genesis", "price": 10**60, "diff": 17500},
    "nft_gallery": {"n": "🖼️ NFT Gallery", "price": 10**61, "diff": 18000},
    "metaverse_trung_tam": {"n": "🥽 Metaverse Center", "price": 10**62, "diff": 18500},
    "code_backend": {"n": "⚙️ Backend Hệ Thống", "price": 10**63, "diff": 19000},
    "kernel_linux": {"n": "🐧 Linux Kernel", "price": 10**64, "diff": 19500},
    "windows_blue_screen": {"n": "💻 Màn Hình Xanh Chết Chóc", "price": 10**65, "diff": 20000},
    "vung_loi_stack_overflow": {"n": "🐛 Stack Overflow", "price": 10**66, "diff": 21000},
    "ddos_attack_zone": {"n": "🛡️ Vùng Tấn Công DDoS", "price": 10**67, "diff": 22000},
    "firewall_uy_luc": {"n": "🧱 Tường Lửa Vĩ Đại", "price": 10**68, "diff": 23000},
    "vong_lap_vo_tan": {"n": "🔄 Vòng Lặp While(True)", "price": 10**69, "diff": 24000},
    "bien_du_lieu_big_data": {"n": "📊 Biển Big Data", "price": 10**70, "diff": 25000},
    "tri_tue_nhan_tao_ai": {"n": "🤖 Trí Tuệ Nhân Tạo", "price": 10**71, "diff": 26000},
    "the_gioi_robot": {"n": "🦾 Thế Giới Robot", "price": 10**72, "diff": 27000},
    "cyborg_city": {"n": "🌃 Thành Phố Cyborg", "price": 10**73, "diff": 28000},
    "tram_khong_gian_quoc_te": {"n": "🛰️ Trạm ISS Galaxy", "price": 10**74, "diff": 29000},
    "mat_trang_mau": {"n": "🩸 Mặt Trăng Máu", "price": 10**75, "diff": 30000},
    "mat_troi_diet_vong": {"n": "☀️ Mặt Trời Diệt Vong", "price": 10**80, "diff": 32000},
    "cuc_lac_gioi": {"n": "🧘 Cực Lạc Giới", "price": 10**90, "diff": 35000},
    "hu_vo_cuoi_cung": {"n": "🔚 FINAL VOID", "price": 10**100, "diff": 40000}
}

# --- DATABASE CÁ CŨ ---
FISH_DB = [
    # (Giữ nguyên cá cũ để không lỗi file)
    {"n": "Cá Rô", "p": 3000, "loc": "ho_lang", "w": 120},
    {"n": "Cá Trê", "p": 4000, "loc": "ho_lang", "w": 90},
    {"n": "Cá Chép", "p": 5000, "loc": "ho_lang", "w": 100},
    {"n": "Tôm Càng Xanh", "p": 8000, "loc": "ho_lang", "w": 80},
    {"n": "🐢 Rùa Vàng", "p": 100000, "loc": "ho_lang", "w": 2},
    {"n": "Cá Piranha", "p": 50000, "loc": "song_amazon", "w": 60},
    {"n": "Lươn Điện", "p": 80000, "loc": "song_amazon", "w": 40},
    {"n": "Cá Sấu", "p": 120000, "loc": "song_amazon", "w": 30},
    {"n": "Cá Hải Tượng", "p": 150000, "loc": "song_amazon", "w": 20},
    {"n": "🐍 Trăn Anaconda", "p": 200000, "loc": "song_amazon", "w": 10},
    {"n": "Sứa Độc", "p": 300000, "loc": "bien_sau", "w": 50},
    {"n": "Cá Ngừ Đại Dương", "p": 500000, "loc": "bien_sau", "w": 40},
    {"n": "Cá Mập Trắng", "p": 1000000, "loc": "bien_sau", "w": 15},
    {"n": "Cá Voi Xanh", "p": 2000000, "loc": "bien_sau", "w": 10},
    {"n": "🦑 Mực Khổng Lồ", "p": 2500000, "loc": "bien_sau", "w": 5},
    {"n": "Cá Xương", "p": 5000000, "loc": "dao_dau_lau", "w": 40},
    {"n": "Rắn Biển Độc", "p": 8000000, "loc": "dao_dau_lau", "w": 30},
    {"n": "Bạch Tuộc Ma", "p": 10000000, "loc": "dao_dau_lau", "w": 20},
    {"n": "Thuyền Trưởng Ma", "p": 30000000, "loc": "dao_dau_lau", "w": 5},
    {"n": "🐙 Thủy Quái Kraken", "p": 50000000, "loc": "dao_dau_lau", "w": 2},
    {"n": "Cá Lồng Đèn", "p": 50000000, "loc": "vuc_tham", "w": 30},
    {"n": "Lươn Vực Sâu", "p": 80000000, "loc": "vuc_tham", "w": 20},
    {"n": "Cá Răng Kiếm", "p": 70000000, "loc": "vuc_tham", "w": 25},
    {"n": "Quái Vật Bóng Tối", "p": 100000000, "loc": "vuc_tham", "w": 10},
    {"n": "🐉 Rồng Bóng Đêm", "p": 200000000, "loc": "vuc_tham", "w": 1},
    {"n": "Cá Tinh Tú", "p": 500000000, "loc": "thien_ha", "w": 40},
    {"n": "Sao Biển Lấp Lánh", "p": 800000000, "loc": "thien_ha", "w": 30},
    {"n": "Cá Voi Vũ Trụ", "p": 1200000000, "loc": "thien_ha", "w": 20},
    {"n": "Phượng Hoàng Lửa", "p": 1500000000, "loc": "thien_ha", "w": 5},
    {"n": "🦄 Kỳ Lân Tinh Tú", "p": 2000000000, "loc": "thien_ha", "w": 2},
    {"n": "Cá Ánh Dương", "p": 2000000000, "loc": "chan_troi", "w": 40},
    {"n": "Mực Cầu Vồng", "p": 4000000000, "loc": "chan_troi", "w": 30},
    {"n": "Cá Bay Ánh Sáng", "p": 6000000000, "loc": "chan_troi", "w": 20},
    {"n": "Rồng Bình Minh", "p": 8000000000, "loc": "chan_troi", "w": 5},
    {"n": "👑 Phượng Hoàng Kim", "p": 10000000000, "loc": "chan_troi", "w": 1},
    {"n": "Cá Gương", "p": 10000000000, "loc": "da_vu_tru", "w": 40},
    {"n": "Cá Song Song", "p": 20000000000, "loc": "da_vu_tru", "w": 30},
    {"n": "Cá Phân Thân", "p": 35000000000, "loc": "da_vu_tru", "w": 20},
    {"n": "Quái Vật Đa Chiều", "p": 45000000000, "loc": "da_vu_tru", "w": 5},
    {"n": "📍 Chúa Tể Không Gian", "p": 50000000000, "loc": "da_vu_tru", "w": 1},
    {"n": "Cá Vô Hình", "p": 50000000000, "loc": "hu_khong", "w": 40},
    {"n": "Linh Hồn Biển", "p": 80000000000, "loc": "hu_khong", "w": 30},
    {"n": "Cá Mắt Ma", "p": 120000000000, "loc": "hu_khong", "w": 20},
    {"n": "Rồng Hư Không", "p": 200000000000, "loc": "hu_khong", "w": 5},
    {"n": "🔮 Thực Thể Hỗn Mang", "p": 250000000000, "loc": "hu_khong", "w": 1},
    {"n": "Cá Hình Khối", "p": 200000000000, "loc": "chieu_thu_5", "w": 40},
    {"n": "Cá Logic", "p": 400000000000, "loc": "chieu_thu_5", "w": 30},
    {"n": "Cá Trừu Tượng", "p": 600000000000, "loc": "chieu_thu_5", "w": 20},
    {"n": "Quái Vật 5 Chiều", "p": 800000000000, "loc": "chieu_thu_5", "w": 5},
    {"n": "📐 Thần Toán Học", "p": 1000000000000, "loc": "chieu_thu_5", "w": 1},
    {"n": "Cá Nguyên Thủy", "p": 1000000000000, "loc": "khoi_nguyen", "w": 40},
    {"n": "Cá Bụi Sao", "p": 2000000000000, "loc": "khoi_nguyen", "w": 30},
    {"n": "Rồng Khai Sinh", "p": 3500000000000, "loc": "khoi_nguyen", "w": 20},
    {"n": "Thần Biển Cả", "p": 4500000000000, "loc": "khoi_nguyen", "w": 5},
    {"n": "💥 Big Bang Fish", "p": 5000000000000, "loc": "khoi_nguyen", "w": 1},
    {"n": "Cá Trọng Lực", "p": 5000000000000, "loc": "vung_lo_den", "w": 40},
    {"n": "Cá Bị Nuốt Chửng", "p": 10000000000000, "loc": "vung_lo_den", "w": 30},
    {"n": "Hào Quang Sự Kiện", "p": 20000000000000, "loc": "vung_lo_den", "w": 20},
    {"n": "Hố Đen Mini", "p": 40000000000000, "loc": "vung_lo_den", "w": 5},
    {"n": "🕳️ Thực Thể Vô Tận", "p": 50000000000000, "loc": "vung_lo_den", "w": 1},
    {"n": "Mảnh Vỡ Sao Băng", "p": 25000000000000, "loc": "nghia_dia_sao", "w": 40},
    {"n": "Cá Hóa Thạch", "p": 50000000000000, "loc": "nghia_dia_sao", "w": 30},
    {"n": "Linh Hồn Tinh Cầu", "p": 100000000000000, "loc": "nghia_dia_sao", "w": 20},
    {"n": "Cá Cảnh Báo", "p": 200000000000000, "loc": "nghia_dia_sao", "w": 5},
    {"n": "💀 Tử Thần Sao", "p": 250000000000000, "loc": "nghia_dia_sao", "w": 1},
    {"n": "Cá Bất Tử", "p": 100000000000000, "loc": "cong_vinh_cuu", "w": 40},
    {"n": "Người Gác Cổng", "p": 250000000000000, "loc": "cong_vinh_cuu", "w": 30},
    {"n": "Cá Thời Gian", "p": 500000000000000, "loc": "cong_vinh_cuu", "w": 20},
    {"n": "Hồn Ma Vĩnh Cửu", "p": 800000000000000, "loc": "cong_vinh_cuu", "w": 5},
    {"n": "⛩️ Hộ Vệ Vĩnh Hằng", "p": 1000000000000000, "loc": "cong_vinh_cuu", "w": 1},
    {"n": "Cá Thất Sắc", "p": 500000000000000, "loc": "dao_ngu_sac", "w": 40},
    {"n": "Cá Lấp Lánh", "p": 1000000000000000, "loc": "dao_ngu_sac", "w": 30},
    {"n": "Mực Neon", "p": 2000000000000000, "loc": "dao_ngu_sac", "w": 20},
    {"n": "Long Ngư Cầu Vồng", "p": 4000000000000000, "loc": "dao_ngu_sac", "w": 5},
    {"n": "🌈 Thiên Long Bảy Màu", "p": 5000000000000000, "loc": "dao_ngu_sac", "w": 1},
    {"n": "Cá Khô Lâu", "p": 2000000000000000, "loc": "vung_dat_chet", "w": 40},
    {"n": "Cá Thối Rữa", "p": 4000000000000000, "loc": "vung_dat_chet", "w": 30},
    {"n": "Linh Hồn Oán Than", "p": 8000000000000000, "loc": "vung_dat_chet", "w": 20},
    {"n": "Cá Phán Xét", "p": 15000000000000000, "loc": "vung_dat_chet", "w": 5},
    {"n": "🐲 Hắc Long Vương", "p": 20000000000000000, "loc": "vung_dat_chet", "w": 1},
    {"n": "Cá Thạch Anh", "p": 10000000000000000, "loc": "tinh_cau_pha_le", "w": 40},
    {"n": "Cá Sapphire", "p": 25000000000000000, "loc": "tinh_cau_pha_le", "w": 30},
    {"n": "Cá Ruby", "p": 50000000000000000, "loc": "tinh_cau_pha_le", "w": 20},
    {"n": "Cá Kim Cương", "p": 80000000000000000, "loc": "tinh_cau_pha_le", "w": 5},
    {"n": "💎 Pha Lê Đế Vương", "p": 100000000000000000, "loc": "tinh_cau_pha_le", "w": 1},
    {"n": "Cá Tần Số", "p": 50000000000000000, "loc": "su_on_ao", "w": 40},
    {"n": "Sóng Âm Biển", "p": 100000000000000000, "loc": "su_on_ao", "w": 30},
    {"n": "Cá Bass Cực Đại", "p": 250000000000000000, "loc": "su_on_ao", "w": 20},
    {"n": "Tiếng Thét Đại Dương", "p": 400000000000000000, "loc": "su_on_ao", "w": 5},
    {"n": "🎷 Jazz Shark", "p": 500000000000000000, "loc": "su_on_ao", "w": 1},
    {"n": "Cá Số 0", "p": 200000000000000000, "loc": "diem_khong", "w": 40},
    {"n": "Hạt Cơ Bản", "p": 500000000000000000, "loc": "diem_khong", "w": 30},
    {"n": "Cá Đóng Băng", "p": 1000000000000000000, "loc": "diem_khong", "w": 20},
    {"n": "Vật Chất Tối", "p": 1500000000000000000, "loc": "diem_khong", "w": 5},
    {"n": "📍 Thực Thể Điểm Không", "p": 2000000000000000000, "loc": "diem_khong", "w": 1},
    {"n": "Cá Thiên Thần", "p": 1000000000000000000, "loc": "vuon_dia_dang", "w": 40},
    {"n": "Trái Cấm Biển", "p": 2500000000000000000, "loc": "vuon_dia_dang", "w": 30},
    {"n": "Cá Hòa Bình", "p": 5000000000000000000, "loc": "vuon_dia_dang", "w": 20},
    {"n": "Thần Rắn Eva", "p": 8000000000000000000, "loc": "vuon_dia_dang", "w": 5},
    {"n": "🍎 Adam's Fish", "p": 10000000000000000000, "loc": "vuon_dia_dang", "w": 1},
    {"n": "Cá Bơi Ngược Sao", "p": 5000000000000000000, "loc": "be_ngan_ha", "w": 40},
    {"n": "Cá Trăng Rằm", "p": 10000000000000000000, "loc": "be_ngan_ha", "w": 30},
    {"n": "Cá Nhật Thực", "p": 25000000000000000000, "loc": "be_ngan_ha", "w": 20},
    {"n": "Tinh Vân Biển", "p": 40000000000000000000, "loc": "be_ngan_ha", "w": 5},
    {"n": "🌌 Chúa Tể Ngân Hà", "p": 50000000000000000000, "loc": "be_ngan_ha", "w": 1},
    {"n": "Cá Binary (0101)", "p": 20000000000000000000, "loc": "ma_tran_so", "w": 40},
    {"n": "Cá Malware", "p": 50000000000000000000, "loc": "ma_tran_so", "w": 30},
    {"n": "Cá Thuật Toán", "p": 100000000000000000000, "loc": "ma_tran_so", "w": 20},
    {"n": "Hacker Fish", "p": 150000000000000000000, "loc": "ma_tran_so", "w": 5},
    {"n": "👾 Virus Hệ Thống", "p": 200000000000000000000, "loc": "ma_tran_so", "w": 1},
    {"n": "Cá Quỷ", "p": 80000000000000000000, "loc": "tang_dia_nguc", "w": 40},
    {"n": "Cá Lửa Ngục", "p": 200000000000000000000, "loc": "tang_dia_nguc", "w": 30},
    {"n": "Diêm Vương Cá", "p": 400000000000000000000, "loc": "tang_dia_nguc", "w": 20},
    {"n": "Rồng Lửa Ngục", "p": 600000000000000000000, "loc": "tang_dia_nguc", "w": 5},
    {"n": "🔥 Satan's Pet", "p": 800000000000000000000, "loc": "tang_dia_nguc", "w": 1},
    {"n": "Cá Mây Trắng", "p": 300000000000000000000, "loc": "cong_thien_duong", "w": 40},
    {"n": "Cá Thánh Ca", "p": 800000000000000000000, "loc": "cong_thien_duong", "w": 30},
    {"n": "Hộ Vệ Thiên Giới", "p": 1500000000000000000000, "loc": "cong_thien_duong", "w": 20},
    {"n": "Cá Cánh Bạc", "p": 250000000000000000000, "loc": "cong_thien_duong", "w": 5},
    {"n": "☁️ Tổng Lãnh Thiên Thần", "p": 3000000000000000000000, "loc": "cong_thien_duong", "w": 1},
    {"n": "Cá Quá Khứ", "p": 1000000000000000000000, "loc": "dong_thoi_gian", "w": 40},
    {"n": "Cá Hiện Tại", "p": 2500000000000000000000, "loc": "dong_thoi_gian", "w": 30},
    {"n": "Cá Tương Lai", "p": 5000000000000000000000, "loc": "dong_thoi_gian", "w": 20},
    {"n": "Đồng Hồ Cát Biển", "p": 8000000000000000000000, "loc": "dong_thoi_gian", "w": 5},
    {"n": "⏳ Chúa Tể Thời Gian", "p": 10000000000000000000000, "loc": "dong_thoi_gian", "w": 1},
    {"n": "Cá Đối Lập", "p": 5000000000000000000000, "loc": "the_gioi_song_song", "w": 40},
    {"n": "Cá Ngược Đời", "p": 12000000000000000000000, "loc": "the_gioi_song_song", "w": 30},
    {"n": "Bản Sao Của Bạn", "p": 25000000000000000000000, "loc": "the_gioi_song_song", "w": 20},
    {"n": "Thực Thể Song Sinh", "p": 40000000000000000000000, "loc": "the_gioi_song_song", "w": 5},
    {"n": "👯 Đa Nhân Cách Fish", "p": 50000000000000000000000, "loc": "the_gioi_song_song", "w": 1},
    {"n": "Cá Ý Nghĩ", "p": 20000000000000000000000, "loc": "vuc_sau_tam_tri", "w": 40},
    {"n": "Cá Ký Ức", "p": 50000000000000000000000, "loc": "vuc_sau_tam_tri", "w": 30},
    {"n": "Cá Ám Ảnh", "p": 100000000000000000000000, "loc": "vuc_sau_tam_tri", "w": 20},
    {"n": "Cơn Ác Mộng", "p": 150000000000000000000000, "loc": "vuc_sau_tam_tri", "w": 5},
    {"n": "🧠 Thần Thấu Thị", "p": 200000000000000000000000, "loc": "vuc_sau_tam_tri", "w": 1},
    {"n": "Mảnh Vỡ Không Gian", "p": 100000000000000000000000, "loc": "tan_cung_vu_tru", "w": 40},
    {"n": "Cá Ranh Giới", "p": 250000000000000000000000, "loc": "tan_cung_vu_tru", "w": 30},
    {"n": "Hư Vô Thể", "p": 500000000000000000000000, "loc": "tan_cung_vu_tru", "w": 20},
    {"n": "Cá Bức Tường Trắng", "p": 800000000000000000000000, "loc": "tan_cung_vu_tru", "w": 5},
    {"n": "🚧 Bức Tường Planck", "p": 1000000000000000000000000, "loc": "tan_cung_vu_tru", "w": 1},
    {"n": "Cá Phù Thủy", "p": 500000000000000000000000, "loc": "coi_huyen_bi", "w": 40},
    {"n": "Long Ngư Thượng Cổ", "p": 1200000000000000000000000, "loc": "coi_huyen_bi", "w": 30},
    {"n": "Cá Voi Cổ Đại", "p": 2500000000000000000000000, "loc": "coi_huyen_bi", "w": 20},
    {"n": "System Error 404", "p": 4000000000000000000000000, "loc": "coi_huyen_bi", "w": 5},
    {"n": "🧙 Phù Thủy Tối Thượng", "p": 5000000000000000000000000, "loc": "coi_huyen_bi", "w": 1},
    {"n": "Bụi Vũ Trụ", "p": 10000000000000000000000000, "loc": "vung_chan_khong", "w": 50},
    {"n": "Cá Áp Suất", "p": 20000000000000000000000000, "loc": "vung_chan_khong", "w": 35},
    {"n": "Cá Chân Không", "p": 50000000000000000000000000, "loc": "vung_chan_khong", "w": 10},
    {"n": "Lỗ Hổng Không Gian", "p": 100000000000000000000000000, "loc": "vung_chan_khong", "w": 4},
    {"n": "🌑 Thực Thể Trống Rỗng", "p": 200000000000000000000000000, "loc": "vung_chan_khong", "w": 1},
    {"n": "Hạt Quark", "p": 50000000000000000000000000, "loc": "dai_duong_luong_tu", "w": 50},
    {"n": "Cá Chồng Chập", "p": 100000000000000000000000000, "loc": "dai_duong_luong_tu", "w": 35},
    {"n": "Sóng Lượng Tử", "p": 200000000000000000000000000, "loc": "dai_duong_luong_tu", "w": 10},
    {"n": "Cá Schrödinger", "p": 500000000000000000000000000, "loc": "dai_duong_luong_tu", "w": 4},
    {"n": "⚛️ Quan Sát Viên", "p": 1000000000000000000000000000, "loc": "dai_duong_luong_tu", "w": 1},
    {"n": "Pixel Fish", "p": 500000000000000000000000000, "loc": "the_gioi_gia_lap", "w": 50},
    {"n": "Cá NPC", "p": 1000000000000000000000000000, "loc": "the_gioi_gia_lap", "w": 35},
    {"n": "Code Bug", "p": 2000000000000000000000000000, "loc": "the_gioi_gia_lap", "w": 10},
    {"n": "Glitch Fish", "p": 5000000000000000000000000000, "loc": "the_gioi_gia_lap", "w": 4},
    {"n": "🧬 The Developer", "p": 10000000000000000000000000000, "loc": "the_gioi_gia_lap", "w": 1},
    {"n": "Cá Sen Trắng", "p": 2000000000000000000000000000, "loc": "coi_niet_ban", "w": 50},
    {"n": "Cá Thanh Tịnh", "p": 5000000000000000000000000000, "loc": "coi_niet_ban", "w": 35},
    {"n": "Linh Hồn Giác Ngộ", "p": 10000000000000000000000000000, "loc": "coi_niet_ban", "w": 10},
    {"n": "Cá Bát Nhã", "p": 20000000000000000000000000000, "loc": "coi_niet_ban", "w": 4},
    {"n": "☸️ Đức Phật Biển", "p": 50000000000000000000000000000, "loc": "coi_niet_ban", "w": 1},
    {"n": "Cá Alpha", "p": 50000000000000000000000000000, "loc": "diem_ky_di", "w": 50},
    {"n": "Cá Omega", "p": 100000000000000000000000000000, "loc": "diem_ky_di", "w": 35},
    {"n": "Sự Kết Thúc", "p": 200000000000000000000000000000, "loc": "diem_ky_di", "w": 10},
    {"n": "Thực Tại Cuối Cùng", "p": 500000000000000000000000000000, "loc": "diem_ky_di", "w": 4},
    {"n": "⬛ THE SINGULARITY", "p": 999999999999999999999999999999, "loc": "diem_ky_di", "w": 1},
]

# --- HÀM TẠO 250 CÁ MỚI CHO 50 MAP MỚI (5 CÁ/MAP) ---
# Tự động thêm vào danh sách FISH_DB
NEW_MAP_KEYS = [
    "khong_gian_hilbert", "vung_entropy", "day_ngan_ha", "kho_du_lieu_akashic", "song_thoi_gian",
    "vuc_hon_mang", "coi_mong", "vung_phan_vat_chat", "thien_ha_andromeda", "cum_sao_hercules",
    "vung_buc_xa", "hanh_tinh_kim_cuong", "sao_neutron", "sao_lun_trang", "sao_kholong",
    "vung_hu_vo_tuyet_doi", "dai_duong_plasma", "the_gioi_fractal", "khong_gian_topone", "mien_gia_tri_nan",
    "dia_nguc_tuyet", "vuon_dia_dang_den", "vung_cam_thuat", "coi_am_ty", "vuc_tham_mariana_vu_tru",
    "dinh_olympus", "valhalla", "atlantis_vu_tru", "thanh_pho_vang_el_dorado", "khu_vuc_51_vu_tru",
    "server_google", "blockchain_genesis", "nft_gallery", "metaverse_trung_tam", "code_backend",
    "kernel_linux", "windows_blue_screen", "vung_loi_stack_overflow", "ddos_attack_zone", "firewall_uy_luc",
    "vong_lap_vo_tan", "bien_du_lieu_big_data", "tri_tue_nhan_tao_ai", "the_gioi_robot", "cyborg_city",
    "tram_khong_gian_quoc_te", "mat_trang_mau", "mat_troi_diet_vong", "cuc_lac_gioi", "hu_vo_cuoi_cung"
]

# Tự động sinh dữ liệu cá để code không quá dài nhưng vẫn đầy đủ
base_price = 10**29
for idx, map_key in enumerate(NEW_MAP_KEYS):
    multiplier = 10 ** (idx + 1) # Giá tăng lũy thừa theo từng map
    FISH_DB.append({"n": "Cá Phổ Thông", "p": 1 * base_price * multiplier, "loc": map_key, "w": 60})
    FISH_DB.append({"n": "Cá Hiếm", "p": 5 * base_price * multiplier, "loc": map_key, "w": 30})
    FISH_DB.append({"n": "Quái Vật Vùng", "p": 20 * base_price * multiplier, "loc": map_key, "w": 15})
    FISH_DB.append({"n": "Lãnh Chúa Map", "p": 100 * base_price * multiplier, "loc": map_key, "w": 5})
    FISH_DB.append({"n": "👑 THỰC THỂ TỐI CAO", "p": 1000 * base_price * multiplier, "loc": map_key, "w": 1})

# Cập nhật tên cá cho độc lạ (Thay đè lên tên mặc định ở trên)
# Đây là danh sách tên custom cho 250 con cá mới (Rất dài, nhưng đầy đủ theo yêu cầu)
CUSTOM_NAMES = {
    "khong_gian_hilbert": ["Vector Cá", "Cá Vô Hạn Chiều", "Không Gian Con", "Toán Tử Cá", "👑 Hilbert Space Master"],
    "vung_entropy": ["Hạt Nhiệt", "Cá Hỗn Loạn", "Mũi Tên Thời Gian", "Sự Suy Tàn", "👑 Maximum Entropy"],
    "day_ngan_ha": ["Sợi Vật Chất", "Cá Thiên Hà", "Cá Đám Mây", "Siêu Cấu Trúc", "👑 The Great Attractor"],
    "kho_du_lieu_akashic": ["Cá Ký Ức", "Sách Sự Sống", "Tri Thức Toàn Thư", "Người Ghi Chép", "👑 Akashic Record"],
    "song_thoi_gian": ["Cá Đi Ngược", "Nghịch Lý Ông Nội", "Vòng Lặp Thời Gian", "Cỗ Máy Thời Gian", "👑 Chronos"],
    "vuc_hon_mang": ["Cá Rối Loạn", "Hư Cấu Thể", "Bóng Tối Nguyên Thủy", "Sự Hủy Diệt", "👑 Chaos King"],
    "coi_mong": ["Cừu Đếm", "Ác Mộng", "Giấc Mơ Tỉnh", "Kẻ Thao Túng Giấc Mơ", "👑 Dream Catcher"],
    "vung_phan_vat_chat": ["Positron Fish", "Anti-Proton", "Sự Hủy Cặp", "Bom Phản Vật Chất", "👑 Anti-Universe God"],
    "thien_ha_andromeda": ["Cá Tiên Nữ", "Tinh Vân Xoắn", "Hố Đen M31", "Người Ngoài Hành Tinh", "👑 Andromeda Queen"],
    "cum_sao_hercules": ["Cá Lực Sĩ", "Sao Già Cỗi", "Cụm Cầu", "Trọng Lực Cao", "👑 Hercules"],
    "vung_buc_xa": ["Cá Đột Biến", "Tia Gamma", "Hạt Phóng Xạ", "Sự Phân Rã", "👑 Hulk Fish"],
    "hanh_tinh_kim_cuong": ["Cá Carbon", "Cá Lấp Lánh", "Đá Quý Sống", "Kho Báu Vũ Trụ", "👑 The Diamond Planet"],
    "sao_neutron": ["Cá Siêu Trọng", "Vỏ Neutron", "Sao Xoay", "Từ Trường Cực Đại", "👑 Magnetar"],
    "sao_lun_trang": ["Cá Thoái Hóa", "Sao Chết", "Cá Nguội Lạnh", "Tinh Thể Vũ Trụ", "👑 White Dwarf Star"],
    "sao_kholong": ["Cá Phồng Tôm", "Cá Nóng Chảy", "Vỏ Khí Quyển", "Sự Nuốt Chửng", "👑 Red Giant"],
    "vung_hu_vo_tuyet_doi": ["Không Có Gì", "Sự Trống Rỗng", "Cá Tàng Hình", "Hư Vô", "👑 THE VOID"],
    "dai_duong_plasma": ["Ion Fish", "Cá Điện Tích", "Sét Cầu", "Nhiệt Độ Planck", "👑 Plasma Being"],
    "the_gioi_fractal": ["Cá Mandelbrot", "Hoa Văn Lặp", "Cá Tự Đồng Dạng", "Vẻ Đẹp Toán Học", "👑 Fractal God"],
    "khong_gian_topone": ["Cá Biến Hình", "Cốc Cà Phê", "Bánh Donut", "Mặt Mobius", "👑 Topology Master"],
    "mien_gia_tri_nan": ["Lỗi Phép Tính", "Chia Cho 0", "Cá Bất Định", "Số Ảo", "👑 Not A Number"],
    "dia_nguc_tuyet": ["Cá Băng Vĩnh Cửu", "Hơi Thở Rồng Băng", "Quỷ Tuyết", "Sự Đóng Băng Tuyệt Đối", "👑 Absolute Zero"],
    "vuon_dia_dang_den": ["Táo Độc", "Rắn Satan", "Cá Sa Ngã", "Vườn Cấm", "👑 Lucifer"],
    "vung_cam_thuat": ["Phép Cấm", "Lời Nguyền", "Phù Thủy Đen", "Cuốn Sách Ma", "👑 Forbidden One"],
    "coi_am_ty": ["Vong Hồn", "Đầu Trâu", "Mặt Ngựa", "Sông Luân Hồi", "👑 Hades"],
    "vuc_tham_mariana_vu_tru": ["Cá Áp Suất Siêu Cao", "Quái Vật Đáy", "Bóng Tối Vĩnh Cửu", "Cá Mù", "👑 Leviathan"],
    "dinh_olympus": ["Cá Sấm Sét", "Đại Bàng Zeus", "Thần Rượu Vang", "Bán Thần", "👑 Zeus"],
    "valhalla": ["Chiến Binh Cá", "Valkyrie", "Cá Hồi Thần", "Rượu Mật Ong", "👑 Odin"],
    "atlantis_vu_tru": ["Người Cá", "Công Nghệ Cổ Đại", "Thành Phố Chìm", "Năng Lượng Tinh Thể", "👑 Poseidon 2.0"],
    "thanh_pho_vang_el_dorado": ["Cá Dát Vàng", "Tượng Vàng", "Bụi Vàng", "Lòng Tham", "👑 Golden King"],
    "khu_vuc_51_vu_tru": ["UFO", "Người Xám", "Đĩa Bay", "Công Nghệ Ngoài Hành Tinh", "👑 The Alien"],
    "server_google": ["Bot Tìm Kiếm", "Crawler", "Cá Index", "Thuật Toán Rank", "👑 Google CEO"],
    "blockchain_genesis": ["Block 0", "Satoshi Fish", "Mã Hóa SHA256", "Sổ Cái", "👑 Satoshi Nakamoto"],
    "nft_gallery": ["Cá JPEG", "Cá Độc Quyền", "Gas Fee", "Bộ Sưu Tập Bored Ape", "👑 ETH Whale"],
    "metaverse_trung_tam": ["Avatar Fish", "Thực Tế Ảo", "Kính VR", "Đất Ảo", "👑 Mark Zuckerberg"],
    "code_backend": ["API Fish", "JSON Object", "Database Query", "Microservice", "👑 System Architect"],
    "kernel_linux": ["Chim Cánh Cụt", "Sudo Command", "Root User", "Open Source", "👑 Linus Torvalds"],
    "windows_blue_screen": ["Mã Lỗi 0x00", "Dump Memory", "Driver Crash", "Force Restart", "👑 Bill Gates"],
    "vung_loi_stack_overflow": ["Copy Paste Fish", "Duplicate Question", "Out of Memory", "Recursion Error", "👑 Full Stack Dev"],
    "ddos_attack_zone": ["Botnet Fish", "Ping Flood", "Packet Loss", "Server Down", "👑 Hacker 404"],
    "firewall_uy_luc": ["Gói Tin Bị Chặn", "Rule Deny", "Port Close", "Bảo Mật Cao", "👑 Network Admin"],
    "vong_lap_vo_tan": ["i++", "Loop Fish", "Cá Treo Máy", "Chạy Mãi Mãi", "👑 Infinite Loop"],
    "bien_du_lieu_big_data": ["Hadoop", "Spark", "Data Lake", "Machine Learning", "👑 AI Trainer"],
    "tri_tue_nhan_tao_ai": ["Neural Network", "Deep Learning", "Chatbot", "Singularity", "👑 Skynet"],
    "the_gioi_robot": ["Cá Sắt", "Bánh Răng", "Dầu Nhớt", "Cánh Tay Robot", "👑 Optimus Prime"],
    "cyborg_city": ["Nửa Người Nửa Cá", "Mắt Laser", "Chip Cấy Ghép", "Siêu Chiến Binh", "👑 Cyborg 009"],
    "tram_khong_gian_quoc_te": ["Phi Hành Gia", "Cá Không Trọng Lực", "Tấm Pin Mặt Trời", "Module Kết Nối", "👑 ISS Commander"],
    "mat_trang_mau": ["Người Sói", "Thủy Triều Đỏ", "Nguyệt Thực", "Bóng Tối Bao Trùm", "👑 Blood Moon"],
    "mat_troi_diet_vong": ["Bão Lửa", "Vệt Đen Mặt Trời", "Cá Nóng Chảy", "Ngày Tận Thế", "👑 Supernova"],
    "cuc_lac_gioi": ["Hoa Sen Vàng", "Cá Bồ Tát", "Nước Cam Lồ", "Xá Lợi", "👑 Buddha"],
    "hu_vo_cuoi_cung": ["...", "Nothing", "Null", "Void", "👑 THE END"]
}

# Gán tên custom vào DB
for fish in FISH_DB:
    loc = fish["loc"]
    if loc in CUSTOM_NAMES:
        # Xác định độ hiếm dựa trên weight để gán tên tương ứng
        idx = 0
        if fish["w"] == 60: idx = 0
        elif fish["w"] == 30: idx = 1
        elif fish["w"] == 15: idx = 2
        elif fish["w"] == 5: idx = 3
        elif fish["w"] == 1: idx = 4
        
        fish["n"] = CUSTOM_NAMES[loc][idx]

TITLES = [
    (0, "Ngư Dân Tập Sự"), 
    (1000000, "Người Câu Cá"), 
    (10000000, "Thợ Câu Lành Nghề"),
    (50000000, "Sát Thủ Đại Dương"), 
    (100000000, "Bá Chủ Vùng Nước"),
    (500000000, "Vua Biển Cả"), 
    (2000000000, "Huyền Thoại Biển Xanh"),
    (10000000000, "Poseidon Tái Thế"), 
    (50000000000, "Thần Câu Cá"),
    (100000000000, "Độc Cô Cầu Bại"), 
    (500000000000, "Thống Lĩnh Ngân Hà"),
    (2000000000000, "Kẻ Chinh Phục Vũ Trụ"),
    (10000000000000, "Thực Thể Vũ Trụ"),
    (50000000000000, "Chúa Tể Hố Đen"),
    (200000000000000, "Người Nắm Giữ Sao"),
    (1000000000000000, "Vĩnh Cửu Chân Nhân"),
    (10000000000000000, "Đấng Sáng Tạo"),
    (500000000000000000, "Thần Hủy Diệt"),
    (2000000000000000000, "Chúa Tể Không Gian"),
    (10000000000000000000, "Chúa Tể Thời Gian"),
    (50000000000000000000, "Đa Vũ Trụ Chí Tôn"),
    (500000000000000000000, "Bất Tử"),
    (1000000000000000000000, "Toàn Năng"),
    (100000000000000000000000, "System Admin"), 
    (10000000000000000000000000000, "The One Above All"), 
    (10**35, "Vượt Qua Tất Cả"),
    (10**50, "Đấng Toàn Tri"),
    (10**100, "Thực Thể Googol"),
]

# ==========================================
# [4] HỆ THỐNG QUẢN LÝ DỮ LIỆU & BACKUP
# ==========================================

def load_local_db():
    """Load dữ liệu từ file local trên máy/render"""
    global data, codes
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, "w") as f: json.dump({}, f)
    if not os.path.exists(CODE_FILE):
        with open(CODE_FILE, "w") as f: json.dump({}, f)

    try:
        with open(DB_FILE, "r") as f: data = json.load(f)
    except: data = {}
    
    try:
        with open(CODE_FILE, "r") as f: codes = json.load(f)
    except: codes = {}
    print("📂 Đã load dữ liệu Local.")

async def load_data_from_discord():
    """Load dữ liệu backup từ kênh Discord khi khởi động"""
    global data
    await bot.wait_until_ready()
    channel = bot.get_channel(ID_KENH_BACKUP)
    if not channel:
        print("❌ Không tìm thấy kênh Backup! Dùng dữ liệu Local.")
        return

    print("☁️ Đang tìm bản backup trên Discord...")
    try:
        async for message in channel.history(limit=10):
            if message.attachments:
                for att in message.attachments:
                    if att.filename == "fishing_v6_data.json":
                        content = await att.read()
                        data = json.loads(content.decode('utf-8'))
                        print(f"✅ Đã khôi phục dữ liệu thành công từ Discord! (Users: {len(data)})")
                        return
    except Exception as e:
        print(f"⚠️ Lỗi load data Discord: {e}. Sử dụng dữ liệu hiện tại.")

async def save_system():
    """Lưu dữ liệu xuống local VÀ gửi lên Discord"""
    channel = bot.get_channel(ID_KENH_BACKUP)
    
    # 1. Lưu Local
    try:
        with open(DB_FILE, "w") as f: json.dump(data, f, indent=4)
        with open(CODE_FILE, "w") as f: json.dump(codes, f, indent=4)
    except Exception as e:
        print(f"Lỗi save local: {e}")

    # 2. Backup Discord
    if channel:
        try:
            json_data = json.dumps(data, indent=4, ensure_ascii=False)
            file_bytes = io.BytesIO(json_data.encode('utf-8'))
            file_discord = discord.File(file_bytes, filename="fishing_v6_data.json")
            await channel.send(f"🔄 **Auto Backup:** {time.ctime()} | Users: {len(data)}", file=file_discord)
        except Exception as e:
            print(f"Lỗi backup Discord: {e}")

@tasks.loop(minutes=10)
async def auto_backup():
    await save_system()

def get_user(uid):
    uid = str(uid)
    if uid not in data:
        data[uid] = {
            "name": "Unknown", "money": 0, "kc": 0, "rod": 1,
            "bag": [], "maps": ["ho_lang"], "used_codes": [],
            "luck_end": 0 
        }
    
    if "maps" not in data[uid] or not isinstance(data[uid]["maps"], list): 
        data[uid]["maps"] = ["ho_lang"]
    if "kc" not in data[uid]: data[uid]["kc"] = 0
    if "luck_end" not in data[uid]: data[uid]["luck_end"] = 0
    if "rod" not in data[uid]: data[uid]["rod"] = 1
    
    try:
        data[uid]["rod"] = int(data[uid]["rod"])
    except:
        data[uid]["rod"] = 1

    return data[uid]

def get_title(money):
    current_title = "Vô Danh"
    for m, t in TITLES:
        if money >= m: current_title = t
    return current_title

# ==========================================
# [5] GIAO DIỆN (UI) - BUTTONS & SELECT
# ==========================================
class HelpSelect(Select):
    def __init__(self):
        options = [
            discord.SelectOption(label="🔰 Người Mới", description="Hướng dẫn cơ bản để bắt đầu", emoji="👶", value="newbie"),
            discord.SelectOption(label="📜 Danh Sách Lệnh", description="Tất cả các lệnh trong bot", emoji="💻", value="commands"),
            discord.SelectOption(label="🎣 Cần Câu & Cá", description="Thông số cần câu và cơ chế", emoji="🐠", value="rods"),
            discord.SelectOption(label="🗺️ Bản Đồ & Map", description="Danh sách vùng đất và giá", emoji="🌍", value="maps"),
            discord.SelectOption(label="🎲 Casino & Game", description="Tỷ lệ cược và cách chơi", emoji="🎰", value="casino"),
            discord.SelectOption(label="💎 Shop & Kinh Tế", description="Mua bán, giao dịch", emoji="💰", value="eco"),
        ]
        super().__init__(placeholder="🔻 Chọn chủ đề bạn cần giúp đỡ...", min_values=1, max_values=1, options=options)

    async def callback(self, interaction: discord.Interaction):
        val = self.values[0]
        embed = discord.Embed(color=0x2f3136)
        
        if val == "newbie":
            embed.title = "🔰 HƯỚNG DẪN TÂN THỦ"
            embed.description = (
                "Chào mừng bạn đến với **Fishing Master Ultimate**! Hãy làm theo các bước sau để trở thành tỷ phú:\n\n"
                "**Bước 1: Khởi đầu**\n"
                "• Gõ lệnh `!cau` để câu cá tại **Hồ Làng** (Miễn phí).\n"
                "• Gõ `!bag` để xem túi cá bạn vừa câu được.\n\n"
                "**Bước 2: Kiếm tiền**\n"
                "• Gõ `!banca` để bán hết cá trong túi lấy tiền.\n"
                "• Dùng tiền đó để nâng cấp cần câu `!muacan`.\n\n"
                "**Bước 3: Mở rộng**\n"
                "• Khi đủ tiền, mua map mới bằng lệnh `!mua [mã_map]`.\n"
                "• Map càng đắt, cá càng giá trị nhưng khó câu hơn (Cần phải xịn!).\n\n"
                "**Mẹo:** Canh **Giờ Vàng** để bán cá giá cao gấp đôi!"
            )
            embed.set_thumbnail(url="https://cdn-icons-png.flaticon.com/512/3063/3063822.png")

        elif val == "commands":
            embed.title = "📜 DANH SÁCH LỆNH ĐẦY ĐỦ"
            embed.add_field(name="🎮 Gameplay", value=(
                "`!menu` - Xem thông tin cá nhân & Menu chính\n"
                "`!cau [map]` - Câu cá (Mặc định: ho_lang)\n"
                "`!banca` - Bán tất cả cá trong túi\n"
                "`!bag` - Xem túi đồ\n"
                "`!maps [trang]` - Xem danh sách bản đồ (Ví dụ: !maps 2)\n"
                "`!muacan` - Nâng cấp cần câu tiếp theo\n"
                "`!mua [mã]` - Mua bản đồ mới\n"
                "`!top` - Xem bảng xếp hạng đại gia\n"
                "`!pay @user [tiền]` - Chuyển tiền cho người khác"
            ), inline=False)
            embed.add_field(name="🎲 Giải Trí", value=(
                "`!taixiu [tiền] [tai/xiu]` - Chơi Tài Xỉu\n"
                "`!baucua [tiền] [bầu/cua/...]` - Chơi Bầu Cua\n"
                "`!slot [tiền]` - Quay số Slot Machine\n"
                "`!xoso [tiền] [00-99]` - Đánh lô trúng x70"
            ), inline=False)
            embed.add_field(name="🔧 Hệ Thống", value=(
                "`!help` - Mở menu hướng dẫn này\n"
                "`!code [mã]` - Nhập Giftcode\n"
                "`!muakc [số_lượng]` - Mua Kim Cương\n"
                "`!muabua [số_luợng]` - Mua bùa may mắn"
            ), inline=False)

        elif val == "rods":
            embed.title = "🎣 THÔNG SỐ CẦN CÂU"
            embed.description = "Cần câu quyết định tỷ lệ dính cá. **Rate** càng cao, câu càng dễ trúng ở Map khó."
            # Hiển thị 10 cần đầu tiên tượng trưng để đỡ dài, hoặc list dạng rút gọn
            txt = ""
            for i in range(1, 12): # Show 11 cần đầu
                r = RODS[i]
                txt += f"**Lv{i}. {r['n']}**\n└ 💰 {r['price']:,}$ | 🎯 Rate: {r['rate']}\n"
            txt += "...(Và còn gần 70 cần siêu cấp phía sau)"
            embed.add_field(name="📋 Danh sách Cần (Cơ bản)", value=txt, inline=False)

        elif val == "maps":
            embed.title = "🗺️ HỆ THỐNG BẢN ĐỒ"
            embed.description = "Mỗi map có độ khó (**Diff**) riêng. Nếu `Rate Cần < Diff Map` thì tỷ lệ câu trúng chỉ là **2%**."
            txt = ""
            count = 0
            for k, v in LOCATIONS.items():
                if count < 10: # Show 10 map đầu
                    txt += f"**{v['n']}** (`{k}`)\n└ 💰 {v['price']:,}$ | 💀 Diff: {v['diff']}\n"
                    count += 1
            txt += f"...(Tổng cộng {len(LOCATIONS)} bản đồ đa vũ trụ)"
            embed.add_field(name="🌍 Các vùng đất khởi đầu", value=txt, inline=False)

        elif val == "casino":
            embed.title = "🎲 SÒNG BẠC HOÀNG GIA"
            embed.add_field(name="🔴 Tài Xỉu", value="• Tỷ lệ 1:1\n• Tổng 3 xúc xắc: 3-10 (Xỉu), 11-18 (Tai)", inline=True)
            embed.add_field(name="🎰 Slot Machine", value="• 3 hình giống nhau: x10\n• 2 hình giống nhau: x2", inline=True)
            embed.add_field(name="🦐 Bầu Cua", value="• Đoán trúng 1 con: x1\n• Trúng 2 con: x2...", inline=True)
            embed.add_field(name="🎟️ Xổ Số", value="• Chọn số 00-99\n• Trúng nhận **x70** lần cược", inline=True)

        elif val == "eco":
            embed.title = "💎 KINH TẾ & SHOP"
            embed.add_field(name="💵 Tiền (Money)", value="Dùng để mua Cần, Map và chơi Casino. Kiếm bằng cách bán cá.", inline=False)
            embed.add_field(name="💎 Kim Cương (KC)", value=f"Tiền tệ cao cấp. Giá quy đổi: **1 KC = {TY_GIA_KC:,}$**.", inline=False)
            embed.add_field(name="🔮 Bùa May Mắn", value="Tăng tỷ lệ gặp cá hiếm (x2 weight) trong 5 phút. Giá mua bằng Kim Cương.", inline=False)

        await interaction.response.edit_message(embed=embed, view=self.view)

class HelpView(View):
    def __init__(self):
        super().__init__(timeout=120)
        self.add_item(HelpSelect())

class MainView(View):
    def __init__(self, ctx):
        super().__init__(timeout=None)
        self.ctx = ctx

    @discord.ui.button(label="Cửa Hàng", emoji="🛒", style=discord.ButtonStyle.primary, row=0)
    async def shop_btn(self, interaction: discord.Interaction, button: discord.ui.Button):
        user_id = str(interaction.user.id)
        u = get_user(user_id)
        embed = discord.Embed(title="🛒 CỬA HÀNG NHANH", color=0xf1c40f)
        
        # Cần câu (Logic tự động lấy ID tiếp theo, bao gồm cả 5 cần mới)
        current_rod_id = int(u.get('rod', 1)) 
        next_rod_id = current_rod_id + 1
        if next_rod_id in RODS:
            rod_info = RODS[next_rod_id]
            rod_text = f"🪝 **{rod_info['n']}**\n💰 Giá: {rod_info['price']:,}$ | 🎯 Rate: +{rod_info['rate']}"
        else:
            rod_text = "✨ Bạn đã Max Cấp! (Đỉnh cao vũ trụ)"
        embed.add_field(name="🎣 Nâng Cấp Cần", value=rod_text, inline=False)

        # Map thông minh
        map_text = ""
        count = 0
        user_maps = u.get('maps', ["ho_lang"])
        for k, v in LOCATIONS.items():
            if k not in user_maps:
                map_text += f"• `{k}`: {v['n']} - 💰 {v['price']:,}$\n"
                count += 1
                if count >= 3: 
                    map_text += "...(Gõ `!maps` để xem thêm)"
                    break
        if not map_text: map_text = "✅ Đã sở hữu tất cả!"
        
        embed.add_field(name="🗺️ Map Gợi Ý", value=map_text, inline=False)
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @discord.ui.button(label="Top BXH", emoji="🏆", style=discord.ButtonStyle.primary, row=0)
    async def top_btn(self, interaction, button):
        sorted_users = sorted(data.items(), key=lambda x: x[1]['money'], reverse=True)[:10]
        desc = ""
        for i, (uid, info) in enumerate(sorted_users, 1):
            icon = "🥇" if i==1 else "🥈" if i==2 else "🥉" if i==3 else f"#{i}"
            desc += f"{icon} **{info['name']}**: {info['money']:,}$ - *{get_title(info['money'])}*\n"
        embed = discord.Embed(title="🏆 BẢNG XẾP HẠNG ĐẠI GIA", description=desc, color=0xffd700)
        await interaction.response.send_message(embed=embed, ephemeral=True)

    @discord.ui.button(label="Túi Đồ", emoji="🎒", style=discord.ButtonStyle.secondary, row=1)
    async def bag_btn(self, interaction, button):
        u = get_user(interaction.user.id)
        if not u['bag']: return await interaction.response.send_message("Túi trống!", ephemeral=True)
        count = {}
        total_val = 0
        for f in u['bag']: 
            count[f['n']] = count.get(f['n'], 0) + 1
            total_val += f['p']
        
        msg = f"💰 **Tổng giá trị:** {total_val:,}$\n\n"
        msg += "\n".join([f"🐟 {k} x{v}" for k,v in count.items()])
        if len(msg) > 1900: msg = msg[:1900] + "\n... (Hãy bán bớt)"
        await interaction.response.send_message(embed=discord.Embed(title="🎒 TÚI CÁ CỦA BẠN", description=msg, color=0xe67e22), ephemeral=True)

    @discord.ui.button(label="Giải Trí", emoji="🎲", style=discord.ButtonStyle.success, row=1)
    async def game_btn(self, interaction, button):
        msg = "**🎲 GAME CASINO**\n`!taixiu [tiền] [tai/xiu]`\n`!baucua [tiền] [con]`\n`!xoso [tiền] [số]`\n`!slot [tiền]`"
        await interaction.response.send_message(embed=discord.Embed(title="🎲 MENU GIẢI TRÍ", description=msg, color=0xe91e63), ephemeral=True)

    @discord.ui.button(label="Admin", emoji="🛠️", style=discord.ButtonStyle.danger, row=1)
    async def admin_btn(self, interaction, button):
        if int(interaction.user.id) not in ADMIN_IDS:
            return await interaction.response.send_message("⛔ Bạn không phải Admin!", ephemeral=True)
        msg = "**🛠️ ADMIN MENU**\n`!giovang`, `!taocode`, `!thongbao`, `!congtien`, `!trutien`, `!setrod`"
        await interaction.response.send_message(msg, ephemeral=True)

# ==========================================
# [6] LỆNH ADMIN (QUẢN TRỊ - HỖ TRỢ ĐA ADMIN)
# ==========================================
@bot.command()
async def giovang(ctx, phut: int, he_so: int):
    if int(ctx.author.id) not in ADMIN_IDS: return
    GOLDEN_HOUR["active"] = True
    GOLDEN_HOUR["end_time"] = time.time() + (phut * 60)
    GOLDEN_HOUR["multiplier"] = he_so
    msg = f"🌟 **SỰ KIỆN GIỜ VÀNG!**\n⏳ Trong {phut} phút - Nhân {he_so} tiền bán cá!"
    
    channel = bot.get_channel(ID_KENH_THONG_BAO)
    if channel: await channel.send(msg)
    else: await ctx.send(msg)

    await asyncio.sleep(phut * 60)
    if time.time() >= GOLDEN_HOUR["end_time"]:
        GOLDEN_HOUR["active"] = False
        if channel: await channel.send("🛑 **HẾT GIỜ VÀNG!**")

@bot.command()
async def taocode(ctx, ma: str, tien: int, luot: int = 999):
    if int(ctx.author.id) not in ADMIN_IDS: return
    codes[ma.upper()] = {"val": tien, "left": luot}
    await save_system()
    await ctx.send(f"✅ Code `{ma.upper()}`: {tien:,}$ ({luot} lượt)")

@bot.command()
async def thongbao(ctx, *, noidung: str):
    if int(ctx.author.id) not in ADMIN_IDS: return
    channel = bot.get_channel(ID_KENH_THONG_BAO)
    if channel:
        embed = discord.Embed(title="📢 THÔNG BÁO", description=noidung, color=0xe74c3c)
        embed.set_footer(text=f"Admin: {ctx.author.name}")
        # Chặn ping everyone tuyệt đối
        await channel.send(embed=embed, allowed_mentions=discord.AllowedMentions.none()) 
        await ctx.send("✅ Đã gửi (Không ping everyone).")
    else: await ctx.send("❌ Không tìm thấy kênh thông báo.")

@bot.command()
async def congtien(ctx, member: discord.Member, amount: int):
    if int(ctx.author.id) not in ADMIN_IDS: return
    u = get_user(member.id)
    u['money'] += amount
    await save_system()
    await ctx.send(f"✅ Đã cộng **{amount:,}$** cho {member.name}")

@bot.command()
async def trutien(ctx, member: discord.Member, amount: int):
    if int(ctx.author.id) not in ADMIN_IDS: return
    u = get_user(member.id)
    u['money'] -= amount
    if u['money'] < 0: u['money'] = 0
    await save_system()
    await ctx.send(f"✅ Đã trừ **{amount:,}$** của {member.name}")

@bot.command()
async def setrod(ctx, member: discord.Member, rod_lvl: int):
    if int(ctx.author.id) not in ADMIN_IDS: return
    u = get_user(member.id)
    u['rod'] = rod_lvl
    await save_system()
    await ctx.send(f"✅ Đã set cần cấp {rod_lvl} cho {member.name}")

@bot.command()
async def check(ctx, member: discord.Member):
    if int(ctx.author.id) not in ADMIN_IDS: return
    u = get_user(member.id)
    msg = f"👤 **{member.name}**\n💰 Tiền: {u['money']:,}\n🎣 Cần: {u['rod']}\n🗺️ Maps: {len(u['maps'])}"
    await ctx.send(msg)

@bot.command()
async def reset(ctx, member: discord.Member):
    if int(ctx.author.id) not in ADMIN_IDS: return
    if str(member.id) in data:
        del data[str(member.id)]
        await save_system()
        await ctx.send(f"✅ Đã reset tài khoản {member.name}")

# ==========================================
# [7] LỆNH NGƯỜI CHƠI (GAMEPLAY)
# ==========================================
@bot.command()
async def menu(ctx):
    u = get_user(ctx.author.id) 
    u['name'] = ctx.author.name 
    
    # Lấy thông tin cần
    rod_id = int(u.get('rod', 1)) 
    rod_info = RODS.get(rod_id, {"n": f"Cần Cấp {rod_id}", "rate": 0})
    
    # Tính toán tiến độ map
    total_maps = len(LOCATIONS)
    user_maps_count = len(u.get('maps', []))
    map_progress = int((user_maps_count / total_maps) * 100)
    progress_bar = "▓" * (map_progress // 10) + "░" * (10 - (map_progress // 10))

    embed = discord.Embed(title=f"🎣 DASHBOARD CÁ NHÂN", description=f"Chào mừng **{ctx.author.name}** trở lại đại dương!", color=0x2ecc71)
    
    if ctx.author.display_avatar:
        embed.set_thumbnail(url=ctx.author.display_avatar.url)

    # Cột 1: Tài chính
    embed.add_field(name="💳 Tài Chính", value=f"💵 **{u['money']:,}$**\n💎 **{u['kc']:,} KC**", inline=True)
    
    # Cột 2: Cần câu
    embed.add_field(name="🎣 Trang Bị", value=f"**{rod_info['n']}**\n🎯 Rate: {rod_info['rate']}", inline=True)
    
    # Cột 3: Túi
    embed.add_field(name="🎒 Hành Trang", value=f"{len(u['bag'])} con cá", inline=True)

    # Hàng 2: Map & Danh hiệu
    embed.add_field(name="🗺️ Khám Phá Thế Giới", value=f"{progress_bar} {map_progress}%\n(Sở hữu {user_maps_count}/{total_maps} bản đồ)", inline=False)
    
    embed.add_field(name="🏆 Danh Hiệu Cao Quý", value=f"👑 **{get_title(u['money'])}**", inline=False)

    # Hàng 3: Sự kiện
    event_status = "Đang diễn ra! (x{} tiền)".format(GOLDEN_HOUR['multiplier']) if GOLDEN_HOUR["active"] else "Không có sự kiện."
    embed.add_field(name="🕒 Trạng Thái Server", value=f"🔥 Giờ Vàng: {event_status}", inline=False)

    embed.set_footer(text="Fishing Master Ultimate • Sử dụng các nút bên dưới để thao tác nhanh 👇")
    await ctx.send(embed=embed, view=MainView(ctx))

@bot.command()
async def help(ctx):
    embed = discord.Embed(title="📖 CẨM NANG NGƯ DÂN TOÀN THƯ", description="Hãy chọn một chủ đề bên dưới để xem hướng dẫn chi tiết:", color=0x00a8ff)
    embed.set_image(url="https://media.discordapp.net/attachments/1199996452999532565/1329789949372797001/banner_fishing.png?ex=67c5e200&is=67c49080&hm=80a0a0a0") # Ví dụ placeholder banner
    await ctx.send(embed=embed, view=HelpView())

@bot.command()
@commands.cooldown(1, 6, commands.BucketType.user) # 1 lần sử dụng mỗi 10 giây trên mỗi user
async def cau(ctx, noi: str = "ho_lang"):
    u = get_user(ctx.author.id)
    loc = noi.lower()
    if loc not in LOCATIONS: return await ctx.send("❌ Sai tên map! Gõ `!maps` để xem list.")
    if loc not in u['maps']: return await ctx.send(f"🔒 Bạn chưa mua map `{loc}`!")

    rod_power = RODS.get(int(u['rod']), {"rate": 0})['rate']
    map_diff = LOCATIONS[loc]['diff']

    # Logic: Nếu cần yếu hơn map -> Tỷ lệ cực thấp
    if rod_power < map_diff:
        chance = 2 
    else:
        chance = rod_power - map_diff

    # Giới hạn tỷ lệ max 90%
    if chance > 90: chance = 90
    if chance < 1: chance = 1

    pool = [f for f in FISH_DB if f['loc'] == loc]
    if not pool: pool = [{"n": "Cá Bí Ẩn", "p": 1000, "loc": loc, "w": 100}]

    roll = random.randint(1, 100)
    if roll <= chance:
        weights = [f['w'] for f in pool]
        is_lucky = False
        if time.time() < u['luck_end']:
            is_lucky = True
            weights = [w * 2 if w <= 5 else w for w in weights] 

        ca = random.choices(pool, weights=weights, k=1)[0]
        u['bag'].append({"n": ca['n'], "p": ca['p']})
        await save_system() # Lưu ngay khi câu được
        
        msg = f"🎣 Dính! Bạn câu được **{ca['n']}** tại {LOCATIONS[loc]['n']}"
        if is_lucky: msg += " | 🔮 Lucky"
        
        # Thông báo cá hiếm (tỷ lệ <= 2)
        if ca.get('w', 100) <= 2: 
             channel = bot.get_channel(ID_KENH_CA_HIEM)
             if channel:
                 await channel.send(embed=discord.Embed(title="🌟 HÀNG KHỦNG!", description=f"{ctx.author.name} câu được **{ca['n']}** ({ca['p']:,}$)", color=0x9b59b6))
        await ctx.send(msg)
    else:
        await ctx.send(f"💨 Hụt rồi! (Tỷ lệ: {chance}%) - Cần nâng cấp cần!")

@bot.command()
async def banca(ctx):
    u = get_user(ctx.author.id)
    if not u['bag']: return await ctx.send("🎒 Túi trống!")
    total = sum(item['p'] for item in u['bag'])
    if GOLDEN_HOUR["active"]: total *= GOLDEN_HOUR["multiplier"]
    u['money'] += int(total)
    count = len(u['bag'])
    u['bag'] = []
    await save_system()
    await ctx.send(f"💰 Bán {count} cá nhận **{total:,}$**")

@bot.command()
async def maps(ctx, page: int = 1):
    u = get_user(ctx.author.id)
    user_maps = u.get('maps', [])
    
    # Chia trang: Mỗi trang 15 map (Tổng ~100 map nên cần khoảng 6-7 trang)
    items_per_page = 15
    map_keys = list(LOCATIONS.keys())
    total_pages = (len(map_keys) + items_per_page - 1) // items_per_page

    if page < 1 or page > total_pages:
        return await ctx.send(f"⚠️ Trang không hợp lệ! Vui lòng chọn từ 1 đến {total_pages}.")

    start_idx = (page - 1) * items_per_page
    end_idx = start_idx + items_per_page
    current_maps = map_keys[start_idx:end_idx]

    description = ""
    for k in current_maps:
        v = LOCATIONS[k]
        status = "✅" if k in user_maps else f"💰 {v['price']:,}$"
        description += f"`{k}` : **{v['n']}**\n   💀 Diff: {v['diff']} | {status}\n"

    embed = discord.Embed(title=f"🗺️ DANH SÁCH BẢN ĐỒ (Trang {page}/{total_pages})", description=description, color=0x3498db)
    embed.set_footer(text=f"Gõ !maps {page + 1} để xem trang tiếp theo")
    await ctx.send(embed=embed)

@bot.command()
async def mua(ctx, item: str = None):
    if not item: return await ctx.send("Gõ `!mua [mã_map]` (Xem mã trong `!maps`)")
    u = get_user(ctx.author.id)
    item = item.lower()
    if item in LOCATIONS:
        info = LOCATIONS[item]
        if item in u['maps']: return await ctx.send("✅ Đã có map này!")
        if u['money'] < info['price']: return await ctx.send("❌ Không đủ tiền!")
        u['money'] -= info['price']
        u['maps'].append(item)
        await save_system()
        await ctx.send(f"🗺️ Mua thành công **{info['n']}**!")
    else: await ctx.send("❌ Không tìm thấy map.")

@bot.command()
async def muacan(ctx):
    u = get_user(ctx.author.id)
    next_lvl = int(u['rod']) + 1
    if next_lvl not in RODS: return await ctx.send("🔥 Max cấp!")
    info = RODS[next_lvl]
    if u['money'] < info['price']: return await ctx.send(f"❌ Cần **{info['price']:,}$**")
    u['money'] -= info['price']
    u['rod'] = next_lvl
    await save_system()
    await ctx.send(f"🆙 Lên cấp **{info['n']}**!")

@bot.command()
async def muakc(ctx, soluong: int):
    if soluong <= 0: return
    u = get_user(ctx.author.id)
    chi_phi = soluong * TY_GIA_KC
    if u['money'] < chi_phi: return await ctx.send(f"❌ Cần {chi_phi:,}$")
    u['money'] -= chi_phi
    u['kc'] += soluong
    await save_system()
    await ctx.send(f"💎 Đã mua {soluong} KC.")

@bot.command()
async def muabua(ctx, soluong: int = 1):
    u = get_user(ctx.author.id)
    chi_phi = soluong
    add_time = soluong * 300
    if u['luck_end'] > time.time(): u['luck_end'] += add_time
    else: u['luck_end'] = time.time() + add_time
    await save_system()
    await ctx.send(f"🔮 Đã mua bùa may mắn {soluong * 5} phút.")

@bot.command()
async def code(ctx, ma: str):
    u = get_user(ctx.author.id)
    ma = ma.upper()
    if ma in codes and codes[ma]['left'] > 0 and ma not in u['used_codes']:
        val = codes[ma]['val']
        u['money'] += val
        u['used_codes'].append(ma)
        codes[ma]['left'] -= 1
        await save_system()
        await ctx.send(f"🎉 Nhận **{val:,}$**")
    else: await ctx.send("❌ Code lỗi hoặc đã dùng.")

@bot.command()
async def pay(ctx, member: discord.Member, amount: int):
    if amount <= 0: return await ctx.send("❌ Số tiền phải lớn hơn 0!")
    sender = get_user(ctx.author.id)      
    receiver = get_user(member.id)        
    
    if sender['money'] < amount:
        return await ctx.send(f"❌ Bạn không đủ tiền! Bạn chỉ có **{sender['money']:,}$**.")
    
    sender['money'] -= amount
    receiver['money'] += amount
    await save_system()
    await ctx.send(f"💸 Đã chuyển **{amount:,}$** cho {member.mention}")

@pay.error
async def pay_error(ctx, error):
    if isinstance(error, commands.MissingRequiredArgument):
        await ctx.send("⚠️ Cú pháp: `!pay @user [số tiền]`")
    elif isinstance(error, commands.BadArgument):
        await ctx.send("⚠️ Không tìm thấy người dùng hoặc số tiền không hợp lệ!")

# ==========================================
# [8] GAME CỜ BẠC (MINI GAMES)
# ==========================================
@bot.command()
async def taixiu(ctx, cuoc: int, chon: str):
    u = get_user(ctx.author.id)
    if cuoc <= 0 or u['money'] < cuoc: return await ctx.send("❌ Tiền không hợp lệ.")
    chon = chon.lower()
    if chon not in ["tai", "xiu"]: return await ctx.send("❌ Chọn tai/xiu")
    d1, d2, d3 = random.randint(1,6), random.randint(1,6), random.randint(1,6)
    tong = d1+d2+d3
    kq = "tai" if tong >= 11 else "xiu"
    u['money'] -= cuoc
    embed = discord.Embed(title=f"🎲 {tong} ĐIỂM ({d1},{d2},{d3})", description=f"Kết quả: **{kq.upper()}**")
    if chon == kq:
        u['money'] += cuoc * 2
        embed.color = 0x2ecc71
        embed.add_field(name="WIN", value=f"+{cuoc:,}$")
    else:
        embed.color = 0xe74c3c
        embed.add_field(name="LOSE", value=f"-{cuoc:,}$")
    await save_system()
    await ctx.send(embed=embed)

@bot.command()
async def slot(ctx, cuoc: int):
    u = get_user(ctx.author.id)
    if cuoc <= 0 or u['money'] < cuoc: return await ctx.send("❌ Tiền không hợp lệ.")
    u['money'] -= cuoc
    icons = ["🍒", "🔔", "💎", "7️⃣", "🍇"]
    a, b, c = random.choice(icons), random.choice(icons), random.choice(icons)
    embed = discord.Embed(title="🎰 SLOT", description=f"| {a} | {b} | {c} |")
    win = 0
    if a==b==c: win = cuoc * 10 
    elif a==b or b==c or a==c: win = cuoc * 2
    if win > 0:
        u['money'] += win
        embed.color = 0xf1c40f
        embed.add_field(name="WIN", value=f"+{win:,}$")
    else:
        embed.color = 0x95a5a6
        embed.add_field(name="LOSE", value="Chúc may mắn")
    await save_system()
    await ctx.send(embed=embed)

@bot.command()
async def baucua(ctx, cuoc: int, chon: str):
    u = get_user(ctx.author.id)
    valid = ["nai", "bau", "ga", "ca", "cua", "tom"]
    map_emoji = {"nai":"🦌", "bau":"🎃", "ga":"🐓", "ca":"🐟", "cua":"🦀", "tom":"🦐"}
    chon = chon.lower()
    if cuoc <= 0 or u['money'] < cuoc: return await ctx.send("❌ Tiền không hợp lệ.")
    if chon not in valid: return await ctx.send(f"❌ Chọn: {', '.join(valid)}")
    u['money'] -= cuoc
    dice = [random.choice(valid) for _ in range(3)]
    hits = dice.count(chon)
    embed = discord.Embed(title="🎍 BẦU CUA", description=f"Ra: {' '.join([map_emoji[x] for x in dice])}")
    if hits > 0:
        win = cuoc + (cuoc * hits)
        u['money'] += win
        embed.color = 0x2ecc71
        embed.add_field(name="THẮNG", value=f"Về {hits} con {map_emoji[chon]} (+{win:,}$)")
    else:
        embed.color = 0xe74c3c
        embed.add_field(name="THUA", value=f"Mất {cuoc:,}$")
    await save_system()
    await ctx.send(embed=embed)

@bot.command()
async def xoso(ctx, cuoc: int, so: int):
    u = get_user(ctx.author.id)
    if cuoc <= 0 or u['money'] < cuoc: return await ctx.send("❌ Tiền không hợp lệ.")
    if not (0 <= so <= 99): return await ctx.send("❌ Chọn số 00-99")
    u['money'] -= cuoc
    kq = random.randint(0, 99)
    embed = discord.Embed(title="🎰 XỔ SỐ", description=f"Bạn chọn: {so} | Kết quả: {kq}")
    if so == kq:
        win = cuoc * 70
        u['money'] += win
        embed.color = 0xf1c40f
        embed.add_field(name="TRÚNG ĐỘC ĐẮC!", value=f"+{win:,}$")
        c = bot.get_channel(ID_KENH_THONG_BAO)
        if c: await c.send(f"📢 **{ctx.author.name}** vừa trúng xổ số **{win:,}$**!")
    else:
        embed.color = 0x34495e
        embed.add_field(name="Tạch lô", value="Chúc may mắn lần sau")
    await save_system()
    await ctx.send(embed=embed)

# ==========================================
# [9] SỰ KIỆN BOT & CHẠY BOT
# ==========================================
@bot.event
async def on_message(message):
    if message.author == bot.user:
        return

    # Tính năng Chào (Không ping everyone)
    if message.content.lower() == "chào":
        await message.channel.send(f"Xin chào {message.author.name}! Chúc bạn một ngày tốt lành 🎣")

    # Xử lý lệnh như bình thường
    await bot.process_commands(message)

@bot.event
async def on_command_error(ctx, error):
    # Kiểm tra nếu lỗi là do đang trong thời gian chờ (Cooldown)
    if isinstance(error, commands.CommandOnCooldown):
        seconds = round(error.retry_after, 1)
        embed = discord.Embed(
            title="⏳ Bình tĩnh nào!",
            description=f"Bạn đang câu quá nhanh! Hãy nghỉ ngơi một chút.\nBạn có thể tiếp tục sau **{seconds} giây** nữa.",
            color=0xffcc00
        )
        embed.set_footer(text=f"Người thực hiện: {ctx.author.name}")
        await ctx.send(embed=embed, delete_after=5) 
        return
    print(f"Lỗi không xác định: {error}")
    
# --- ĐOẠN CODE SỬA LỖI (DÁN ĐÈ VÀO CUỐI FILE main.py) ---

@bot.event
async def on_ready():
    print(f'✅ Bot đã đăng nhập: {bot.user}')
    
    # --- LOAD EXTENSION (FILE PHỤ) ---
    # Đoạn này sẽ kích hoạt file fun_commands.py
    try:
        await bot.load_extension("fun_commands")
        print("✅ Đã kích hoạt module: fun_commands.py (Chat Botbeo)")
    except Exception as e:
        print(f"⚠️ Lỗi khi load fun_commands: {e}")
        # In chi tiết lỗi để debug nếu cần
        import traceback
        traceback.print_exc()

    # 1. Load dữ liệu từ Local
    load_local_db()
    
    # 2. Thử đè bằng dữ liệu Discord (Nếu có bản mới hơn)
    await load_data_from_discord()
    
    # 3. Bắt đầu vòng lặp backup
    if not auto_backup.is_running():
        auto_backup.start()
        print("✅ Đã bật Auto Backup")
        
    try:
        await bot.change_presence(activity=discord.Game(name="!menu or !help | Fishing Ultimate V8"))
    except: pass

if __name__ == "__main__":
    if not TOKEN:
        print("❌ Lỗi: Chưa có DISCORD_TOKEN trong Environment Variable (Biến môi trường)!")
        print("👉 Nếu chạy trên máy cá nhân, hãy thêm dòng: os.environ['DISCORD_TOKEN'] = 'TOKEN_CUA_BAN' vào đầu file.")
    else:
        keep_alive() # Chạy Flask để treo trên Render/Replit
        try:
            bot.run(TOKEN)
        except Exception as e:
            print(f"Lỗi khởi động: {e}")