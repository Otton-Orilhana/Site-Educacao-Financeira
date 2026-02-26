import sqlite3, os
db = r"C:\Users\otton\OneDrive\Área de Trabalho\Trabalho Educação Financeira\Backend\dev.db"
if not os.path.exists(db):
    print("Arquivo de DB não encontrado:", db)
else:
    conn = sqlite3.connect(db)
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM progress")
    before = c.fetchone()[0]
    c.execute("""
DELETE FROM progress
WHERE id NOT IN (
  SELECT MAX(id) FROM progress GROUP BY user_id, content_id
)
""")
    conn.commit()
    c.execute("SELECT COUNT(*) FROM progress")
    after = c.fetchone()[0]
    conn.close()
    print(f"Progress rows before: {before}; after: {after}")
