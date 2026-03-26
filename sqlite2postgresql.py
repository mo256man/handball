import sqlite3
import base64
from supabase import create_client, Client

# ===== 設定 =====
SUPABASE_URL = "https://cmvyhbywdofxaovhbxdg.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtdnloYnl3ZG9meGFvdmhieGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0Nzc4NzMsImV4cCI6MjA5MDA1Mzg3M30.fsa_Ew7nBj7p2-pugzx9ipU3fn4nX3J2-2md2b4x9Y0"
SQLITE_PATH = r".\server\handball.sqlite"
TABLE_NAME = "players"  # 対象テーブル名

# ===== Supabase接続 =====
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ===== SQLite接続 =====
conn = sqlite3.connect(SQLITE_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# ===== データ取得 =====
cur.execute(f"SELECT * FROM {TABLE_NAME}")
rows = cur.fetchall()

if not rows:
    print("no data")
    conn.close()
    exit()

# ===== 変換（id除外 + bytes→base64） =====
def convert_row(row):
    d = dict(row)

    # idは除外（identity列のため）
    if "id" in d:
        del d["id"]

    # BLOB対策
    if "image" in d and d["image"] is not None:
        d["image"] = base64.b64encode(d["image"]).decode("utf-8")

    return d

data = [convert_row(row) for row in rows]

# ===== Supabaseへinsert（分割） =====
BATCH_SIZE = 500

for i in range(0, len(data), BATCH_SIZE):
    batch = data[i:i+BATCH_SIZE]
    res = supabase.table(TABLE_NAME).insert(batch).execute()
    if hasattr(res, "error") and res.error:
        print("error:", res.error)
        break

print("done:", len(data))

conn.close()

print("done.")