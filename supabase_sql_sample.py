from supabase import create_client, Client
from io import BytesIO
from PIL import Image
import base64

SUPABASE_URL = "https://cmvyhbywdofxaovhbxdg.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtdnloYnl3ZG9meGFvdmhieGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0Nzc4NzMsImV4cCI6MjA5MDA1Mzg3M30.fsa_Ew7nBj7p2-pugzx9ipU3fn4nX3J2-2md2b4x9Y0"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

sql = """
select image
from teams
where teamname = 'ブレイヴキングス刈谷'
limit 1
"""

res = supabase.rpc("execute_sql", {"query": sql}).execute()

data = res.data
if not data:
    print("not found")
    exit()

img_field = data[0]["image"]

# ===== 分岐 =====
if isinstance(img_field, str) and img_field.startswith("\\x"):
    # PostgreSQL bytea (hex形式)
    img_bytes = bytes.fromhex(img_field[2:])
elif isinstance(img_field, (bytes, bytearray)):
    # そのままbytes
    img_bytes = img_field
else:
    # 想定外
    raise ValueError("unknown format")

img = Image.open(BytesIO(img_bytes))
img.show()