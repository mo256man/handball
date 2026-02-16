import sqlite3
import glob

db_path = "./server/handball.sqlite"

files = glob.glob("./client/public/*.png")

if len(files) == 0:
    print("No PNG files found in ./client/public/")
    raise KeyboardInterrupt

for file in files:
    filename = file.split("\\")[-1]
    print(filename)


    # 画像をバイナリで読み込み
    with open(file, "rb") as f:
        binary_data = f.read()

    # SQLiteに接続
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # filename が一致するレコードの image カラムを更新
    cursor.execute(
        "UPDATE teams SET image = ? WHERE filename = ?",
        (binary_data, filename)
    )

    conn.commit()
    conn.close()

print("done.")