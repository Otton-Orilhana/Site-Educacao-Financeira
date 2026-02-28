from passlib.hash import pbkdf2_sha256
try:
    h = pbkdf2_sha256.hash("1234")
    print("hash ok:", h[:60])
    print("verify ok:", pbkdf2_sha256.verify("1234", h))
except Exception as e:
    print("erro:", type(e).__name__, e)
