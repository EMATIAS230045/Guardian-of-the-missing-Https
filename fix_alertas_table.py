from sqlalchemy import create_engine, text
engine = create_engine("mysql+pymysql://root:060908@localhost:3306/guardian_of_the_missing")
with engine.connect() as connection:
    connection.execute(text("ALTER TABLE Alertas ADD COLUMN intentos_fallidos INT NOT NULL DEFAULT 0;"))
    connection.execute(text("ALTER TABLE Alertas ADD COLUMN ultimo_intento_fallido DATETIME NULL;"))
    connection.commit()
    print("Columnas agregadas con éxito.")
