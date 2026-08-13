from sqlalchemy import create_engine, text

engine = create_engine("mysql+pymysql://root:060908@localhost:3306/guardian_of_the_missing")
with engine.connect() as connection:
    try:
        connection.execute(text("ALTER TABLE Usuarios ADD COLUMN pin_cancelacion VARCHAR(255) NULL;"))
        print("Added pin_cancelacion column.")
    except Exception as e:
        print(f"Error adding pin_cancelacion: {e}")
        
    try:
        connection.execute(text("ALTER TABLE Usuarios ADD COLUMN max_intentos_pin INT DEFAULT 3;"))
        print("Added max_intentos_pin column.")
    except Exception as e:
        print(f"Error adding max_intentos_pin: {e}")
        
    connection.commit()
print("Done.")
