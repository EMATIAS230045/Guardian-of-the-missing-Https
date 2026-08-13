from sqlalchemy import create_engine, text

engine = create_engine("mysql+pymysql://root:060908@localhost:3306/guardian_of_the_missing")
with engine.connect() as connection:
    try:
        connection.execute(text("""
        CREATE TABLE IF NOT EXISTS TokensBloqueados (
            id_token INT AUTO_INCREMENT PRIMARY KEY,
            token VARCHAR(500) NOT NULL UNIQUE,
            fecha_bloqueo DATETIME NOT NULL,
            INDEX idx_token (token)
        ) ENGINE=InnoDB;
        """))
        print("Created TokensBloqueados table.")
    except Exception as e:
        print(f"Error creating table: {e}")
        
    connection.commit()
print("Done.")
