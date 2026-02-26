import sqlite3, csv, os
db = r"C:\Users\otton\OneDrive\Área de Trabalho\Trabalho Educação Financeira\Backend\dev.db"
if not os.path.exists(db):
    print("Arquivo de DB não encontrado:", db)
else:
    conn = sqlite3.connect(db)
    c = conn.cursor()
    with open(r"C:\Users\otton\OneDrive\Área de Trabalho\Trabalho Educação Financeira\Backend\users_export.csv","w",newline='',encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id","email","name","created_at"])
        for row in c.execute("SELECT id,email,name,created_at FROM users"):
            w.writerow(row)
    with open(r"C:\Users\otton\OneDrive\Área de Trabalho\Trabalho Educação Financeira\Backend\progress_export.csv","w",newline='',encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(["id","user_id","content_id","status","timestamp"])
        for row in c.execute("SELECT id,user_id,content_id,status,timestamp FROM progress"):
            w.writerow(row)
    conn.close()
    print('Export completed: users_export.csv, progress_export.csv')
