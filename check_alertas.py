from sqlalchemy import create_engine, inspect
engine = create_engine("mysql+pymysql://root:060908@localhost:3306/guardian_of_the_missing")
inspector = inspect(engine)
columns = inspector.get_columns("alertas")
for col in columns:
    print(f"{col['name']} ({col['type']}): nullable={col['nullable']}")
