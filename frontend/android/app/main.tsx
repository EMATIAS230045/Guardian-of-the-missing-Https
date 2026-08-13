import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavBar from './BottomNavBar';
import { AlertsService } from '../services/alertService';
import { activarBotonPanico, enviarAlertaSeguridad, useShakeParaPanico } from '../services/panicService';
import { LineChart, BarChart, PieChart } from 'react-native-gifted-charts';

export default function Main() {
    const [showGraphs, setShowGraphs] = useState(true);
    const [showAlerts, setShowAlerts] = useState(true);
    const [showDevices, setShowDevices] = useState(true);

    useShakeParaPanico();

    const ultimasAlertas = AlertsService.getUltimasAlertas(5);

    // Hardcode para las gráficas
    const usuariosPorSemana = [
        { value: 40, label: 'Lun' },
        { value: 55, label: 'Mar' },
        { value: 48, label: 'Mié' },
        { value: 70, label: 'Jue' },
        { value: 65, label: 'Vie' },
        { value: 80, label: 'Sáb' },
        { value: 60, label: 'Dom' },
    ];

    const tiposDeAlerta = [
        { value: 62, color: '#1f594f', text: '62%' },
        { value: 38, color: '#e63946', text: '38%' },
    ];

    const alertasPorEstado = [
        { value: 47, color: '#1f594f' },
        { value: 33, color: '#e63946' },
        { value: 20, color: '#2c8273' },
    ];

    const actividadUltimos7Dias = [
        { value: 20 }, { value: 45 }, { value: 28 },
        { value: 80 }, { value: 55 }, { value: 90 }, { value: 60 },
    ];

    const alertasMesActual = [
        { value: 20 }, { value: 45 }, { value: 28 }, { value: 80 },
    ];

    const alertasMesAnterior = [
        { value: 15 }, { value: 30 }, { value: 45 }, { value: 60 },
    ];

    const porcentajeConContactos = [
        { value: 78, color: '#1f594f' },
        { value: 22, color: '#e0fff9' },
    ];

    // hardcode de graficas genéricas
    const lineaSimple = [
        { value: 20 }, { value: 45 }, { value: 28 },
        { value: 80 }, { value: 55 }, { value: 90 },
    ];

    const lineaAreaRellena = [
        { value: 10 }, { value: 30 }, { value: 15 },
        { value: 60 }, { value: 40 }, { value: 75 },
    ];

    const barrasHorizontales = [
        { value: 30, label: 'Familia' },
        { value: 55, label: 'Amigos' },
        { value: 20, label: 'Trabajo' },
    ];

    const barrasAgrupadas = [
        { value: 40, label: 'Ene', spacing: 2, frontColor: '#1f594f' },
        { value: 25, frontColor: '#e63946' },
        { value: 60, label: 'Feb', spacing: 2, frontColor: '#1f594f' },
        { value: 45, frontColor: '#e63946' },
    ];

    const barrasCurvas = [
        { value: 20 }, { value: 45 }, { value: 28 }, { value: 80 }, { value: 55 },
    ];

    const lineaCurvaConPuntos = [
        { value: 25 }, { value: 60 }, { value: 40 },
        { value: 90 }, { value: 70 },
    ];

    const dispositivos: any[] = [];

    return (
        <SafeAreaView className="flex-1 bg-mint-50">
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                <View className="px-5 pt-4 pb-3 flex-row justify-between items-center bg-white">
                    <Text className="text-xl font-bold text-slate-900">GuardianOfTheMising</Text>
                    <View className="flex-row">
                        <TouchableOpacity onPress={() => setShowGraphs(!showGraphs)} className="bg-mint-100 p-2 rounded-full mr-2">
                            <Text className="text-mint-700 text-xs font-bold">Gráficas {showGraphs ? '▲' : '▼'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowAlerts(!showAlerts)} className="bg-red-100 p-2 rounded-full">
                            <Text className="text-red-700 text-xs font-bold">Alertas {showAlerts ? '▲' : '▼'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Contenedor de Botón de Pánico (Alertas principales) */}
                <View className="mx-4 mt-6 p-4 bg-white rounded-2xl overflow-hidden shadow-sm">
                    <TouchableOpacity onPress={activarBotonPanico}
                        className="bg-red-800 w-full h-80 px-10 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center"
                    >
                        <Text className="text-4xl font-bold text-white mb-4">Boton de panico</Text>
                        <Text className="text-white text-justify">Al presionar el boton de panico, estas enviando un reporte de emergencia que nuestro equipo y usuarios veran en tiempo real.</Text>
                    </TouchableOpacity>
                </View>
                <View className="mx-4 mt-4 p-4 bg-white rounded-2xl overflow-hidden shadow-sm">
                    <TouchableOpacity onPress={enviarAlertaSeguridad}
                        className="bg-mint-700 w-full h-40 px-10 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center" >
                        <Text className="text-xl font-bold text-white mb-4">Enviar alerta de reporte de seguridad</Text>
                        <Text className="text-white text-justify">Al presionar este boton, estas enviando un reporte de aviso de seguridad en la zona.</Text>
                    </TouchableOpacity>
                </View>

                {/* Contenedor de mis dispositivos */}
                <View className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden shadow-sm">
                    <TouchableOpacity onPress={() => setShowDevices(!showDevices)} className="flex-row items-center justify-between px-4 py-4">
                        <Text className="text-base font-bold text-slate-900">Mis dispositivos</Text>
                        <Text className="text-mint-800 text-base">{showDevices ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {showDevices && (
                        <View className="px-4 pb-4">
                            {dispositivos.length === 0 && (
                                <Text className="text-slate-700 text-sm mb-4">No hay dispositivos vinculados.</Text>
                            )}
                            {dispositivos.map((dispositivo) => (
                                <View key={dispositivo.id} className="flex-row items-center bg-mint-700 rounded-xl px-4 py-3 mb-3">
                                    <Text className="text-2xl mr-3">{dispositivo.icono}</Text>
                                    <Text className="text-white font-semibold text-sm">{dispositivo.nombre}</Text>
                                </View>
                            ))}
                            <TouchableOpacity className="bg-mint-100 border border-mint-300 rounded-xl py-3 items-center" onPress={() => Alert.alert('Próximamente', 'Búsqueda de dispositivos Bluetooth en desarrollo.')}>
                                <Text className="text-mint-800 font-bold text-sm">+ Vincular nuevo dispositivo</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Contenedor de gráficas */}
                <View className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden shadow-sm">
                    <TouchableOpacity onPress={() => setShowGraphs(!showGraphs)} className="flex-row items-center justify-between px-4 py-4">
                        <Text className="text-base font-bold text-slate-900">Gráficas</Text>
                        <Text className="text-mint-800 text-base">{showGraphs ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {showGraphs && (
                        <View className="px-4 pb-4">
                            {/* 1. Usuarios activos por semana (barras) */}
                            <View className="bg-white rounded-xl mb-4 px-2 py-4 items-center">
                                <Text className="text-slate-900 font-semibold text-sm mb-3 self-start ml-2">Usuarios activos por semana</Text>
                                <BarChart data={usuariosPorSemana} frontColor="#1f594f" barWidth={20} spacing={14} />
                            </View>

                            {/* 2. Distribución de tipos de alerta (dona) */}
                            <View className="bg-white rounded-xl mb-4 px-2 py-4 items-center">
                                <Text className="text-slate-900 font-semibold text-sm mb-3 self-start ml-2">Distribución de tipos de alerta</Text>
                                <PieChart
                                    donut
                                    radius={80}
                                    innerRadius={55}
                                    data={tiposDeAlerta}
                                    centerLabelComponent={() => <Text className="font-bold text-slate-900">Total</Text>}
                                />
                            </View>

                            {/* 3. Alertas por estado (pastel) */}
                            <View className="bg-white rounded-xl mb-4 px-2 py-4 items-center">
                                <Text className="text-slate-900 font-semibold text-sm mb-3 self-start ml-2">Alertas por estado</Text>
                                <PieChart data={alertasPorEstado} radius={80} />
                            </View>

                            {/* 4. Actividad de alertas últimos 7 días (barras curvas) */}
                            <View className="bg-white rounded-xl mb-4 px-2 py-4 items-center">
                                <Text className="text-slate-900 font-semibold text-sm mb-3 self-start ml-2">Actividad últimos 7 días</Text>
                                <BarChart data={actividadUltimos7Dias} frontColor="#1f594f" barBorderRadius={8} isAnimated />
                            </View>

                            {/* 5. Comparativa alertas: mes actual vs mes anterior (dos líneas) */}
                            <View className="bg-white rounded-xl mb-4 px-2 py-4 items-center">
                                <Text className="text-slate-900 font-semibold text-sm mb-3 self-start ml-2">Alertas: mes actual vs anterior</Text>
                                <LineChart data={alertasMesActual} data2={alertasMesAnterior} color1="#1f594f" color2="#e63946" />
                            </View>

                            {/* 6. % de usuarios con contactos configurados (progreso circular) */}
                            <View className="bg-white rounded-xl mb-4 px-2 py-4 items-center">
                                <Text className="text-slate-900 font-semibold text-sm mb-3 self-start ml-2">Usuarios con contactos configurados</Text>
                                <PieChart
                                    donut
                                    radius={70}
                                    innerRadius={55}
                                    data={porcentajeConContactos}
                                    centerLabelComponent={() => <Text className="text-lg font-bold text-slate-900">78%</Text>}
                                />
                            </View>

                            {/* --- Ejemplos genéricos adicionales --- */}

                            {/* 7. Línea simple */}
                            <View className="bg-white rounded-xl mb-4 px-2 py-4 items-center">
                                <Text className="text-slate-900 font-semibold text-sm mb-3 self-start ml-2">Línea simple</Text>
                                <LineChart data={lineaSimple} color="#1f594f" thickness={3} />
                            </View>

                            {/* 8. Línea con área rellena */}
                            <View className="bg-white rounded-xl mb-4 px-2 py-4 items-center">
                                <Text className="text-slate-900 font-semibold text-sm mb-3 self-start ml-2">Línea con área rellena</Text>
                                <LineChart
                                    data={lineaAreaRellena}
                                    areaChart
                                    color="#2c8273"
                                    startFillColor="#2c8273"
                                    endFillColor="#e0fff9"
                                    startOpacity={0.8}
                                    endOpacity={0.2}
                                />
                            </View>

                            {/* 9. Barras horizontales */}
                            <View className="bg-white rounded-xl mb-4 px-2 py-4 items-center">
                                <Text className="text-slate-900 font-semibold text-sm mb-3 self-start ml-2">Barras horizontales</Text>
                                <BarChart horizontal data={barrasHorizontales} frontColor="#2c8273" barWidth={20} />
                            </View>

                            {/* 10. Barras agrupadas */}
                            <View className="bg-white rounded-xl mb-4 px-2 py-4 items-center">
                                <Text className="text-slate-900 font-semibold text-sm mb-3 self-start ml-2">Barras agrupadas</Text>
                                <BarChart data={barrasAgrupadas} barWidth={16} />
                            </View>

                            {/* 11. Barras curvas (rounded top) */}
                            <View className="bg-white rounded-xl mb-4 px-2 py-4 items-center">
                                <Text className="text-slate-900 font-semibold text-sm mb-3 self-start ml-2">Barras curvas</Text>
                                <BarChart data={barrasCurvas} frontColor="#1f594f" barBorderRadius={8} isAnimated />
                            </View>

                            {/* 12. Línea curva con puntos destacados */}
                            <View className="bg-white rounded-xl px-2 py-4 items-center">
                                <Text className="text-slate-900 font-semibold text-sm mb-3 self-start ml-2">Línea curva con puntos</Text>
                                <LineChart
                                    data={lineaCurvaConPuntos}
                                    curved
                                    color="#1f594f"
                                    dataPointsColor="#e63946"
                                    dataPointsRadius={5}
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* Contenedor de últimas alertas */}
                <View className="mx-4 mt-4 bg-white rounded-2xl overflow-hidden shadow-sm">
                    <TouchableOpacity onPress={() => setShowAlerts(!showAlerts)} className="flex-row items-center justify-between px-4 py-4">
                        <Text className="text-base font-bold text-slate-900">Ultimas Alertas</Text>
                        <Text className="text-mint-800 text-base">{showAlerts ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    {showAlerts && (
                        <View className="px-4 pb-4">
                            {ultimasAlertas.length === 0 && ( <Text className="text-slate-700 text-sm">No hay alertas registradas.</Text> )}
                            {ultimasAlertas.map((alerta) => (
                                <View key={alerta.number} className="flex-row items-center bg-mint-600 rounded-xl px-3 py-3 mb-2">
                                    <View className="w-10 h-10 rounded-full bg-mint-700 mr-3" />
                                    <View>
                                        <Text className="text-slate-900 font-semibold text-sm">{alerta.username}</Text>
                                        <Text className="text-slate-700 text-xs">{alerta.type} · {new Date(alerta.date).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
            <BottomNavBar />
        </SafeAreaView>
    );
}
