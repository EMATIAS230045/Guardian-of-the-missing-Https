from sqlalchemy import create_engine, inspect
engine = create_engine("mysql+pymysql://root:060908@localhost:3306/guardian_of_the_missing")
inspector = inspect(engine)
tables = inspector.get_table_names()
print("Tables in DB:", tables)
for table in tables:
    columns = inspector.get_columns(table)
    print(f"\nColumns in {table}:")
    for col in columns:
        print(f"  - {col['name']} ({col['type']})")
