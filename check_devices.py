from sqlalchemy import create_engine, text
engine = create_engine("mysql+pymysql://root:060908@localhost:3306/guardian_of_the_missing")
with engine.connect() as connection:
    result = connection.execute(text("SELECT id_dispositivo FROM dispositivos;"))
    rows = result.fetchall()
    print("Dispositivos:", rows)
