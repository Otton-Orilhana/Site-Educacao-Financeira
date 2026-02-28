import sqlite3, pathlib
db = pathlib.Path("dev.db")
conn = sqlite3.connect(db)
cur = conn.cursor()
for row in cur.execute("SELECT id, title, description FROM contents"):
    id_, title, desc = row
    print("ID:", id_)
    print(" title repr:", repr(title))
    print(" title bytes:", title.encode("utf-8", errors="replace"))
    print(" description repr:", repr(desc))
    print(" description bytes:", desc.encode("utf-8", errors="replace"))
    print("-"*40)
conn.close()
