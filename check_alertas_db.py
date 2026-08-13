from sqlalchemy import create_engine, text
engine = create_engine("mysql+pymysql://root:060908@localhost:3306/guardian_of_the_missing")
with engine.connect() as connection:
    result = connection.execute(text("SELECT id_alerta, id_usuario, fecha_hora, estado, nivel_riesgo, comentario FROM Alertas ORDER BY fecha_hora DESC LIMIT 5"))
    rows = result.fetchall()
    if rows:
        print("Últimas 5 alertas en la base de datos:")
        for r in rows:
            print(f"- ID Alerta: {r[0]} | Usuario: {r[1]} | Fecha: {r[2]} | Estado: {r[3]} | Riesgo: {r[4]} | Comentario: {r[5]}")
    else:
        print("No hay alertas registradas aún.")
