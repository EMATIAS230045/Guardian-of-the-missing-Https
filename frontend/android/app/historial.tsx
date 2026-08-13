import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavBar from './BottomNavBar';
import { AlertsService, Alert } from '../services/alertService';
import { UserService } from '../services/userService';

export default function Historial() {
    const [ordenReciente, setOrdenReciente] = useState(true);
    const [soloPendientes, setSoloPendientes] = useState(false);
    const [soloEmergencias, setSoloEmergencias] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);

    const resultadosPorPagina = 10;

    const usuarioActual = UserService.getUsuarioActual();
    const esAdmin = usuarioActual?.role === 'admin';

    // Alertas base: todas si es admin, solo las suyas si no
    const alertasBase: Alert[] = esAdmin
        ? AlertsService.getAlertas()
        : usuarioActual
            ? AlertsService.getAlertas().filter(a => a.username === usuarioActual.username)
            : [];

    // Aplicar filtros acumulables
    let alertasFiltradas = [...alertasBase];
    if (soloPendientes) {
        alertasFiltradas = alertasFiltradas.filter(a => a.state === 'Pendiente');
    }
    if (soloEmergencias) {
        alertasFiltradas = alertasFiltradas.filter(a => a.type === 'Emergencia');
    }

    // Ordenar
    alertasFiltradas = alertasFiltradas.sort((a, b) => {
        const diferencia = new Date(a.date).getTime() - new Date(b.date).getTime();
        return ordenReciente ? -diferencia : diferencia;
    });

    // Paginación
    const totalPaginas = Math.max(1, Math.ceil(alertasFiltradas.length / resultadosPorPagina));
    const inicio = (paginaActual - 1) * resultadosPorPagina;
    const alertasPaginadas = alertasFiltradas.slice(inicio, inicio + resultadosPorPagina);

    const irAPagina = (pagina: number) => {
        if (pagina < 1 || pagina > totalPaginas) return;
        setPaginaActual(pagina);
    };

    const toggleOrden = () => {
        setOrdenReciente(!ordenReciente);
        setPaginaActual(1);
    };

    const togglePendientes = () => {
        setSoloPendientes(!soloPendientes);
        setPaginaActual(1);
    };

    const toggleEmergencias = () => {
        setSoloEmergencias(!soloEmergencias);
        setPaginaActual(1);
    };

    const limpiarFiltros = () => {
        setOrdenReciente(true);
        setSoloPendientes(false);
        setSoloEmergencias(false);
        setPaginaActual(1);
    };

    return (
        <SafeAreaView className="flex-1 bg-mint-50">
            {/* Header */}
            <View className="px-5 pt-4 pb-3 bg-white">
                <Text className="text-xl font-bold text-slate-900 mb-3">Historial de Alertas</Text>

                <Text className="text-xs font-semibold text-slate-700 mb-2">Filtrar por:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        onPress={toggleOrden}
                        className={`px-4 py-2 rounded-full mr-2 ${ordenReciente ? 'bg-mint-700' : 'bg-mint-800'}`}
                    >
                        <Text className="text-xs font-semibold text-white">
                            {ordenReciente ? 'Más reciente primero' : 'Más antiguo primero'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={togglePendientes}
                        className={`px-4 py-2 rounded-full mr-2 ${soloPendientes ? 'bg-mint-800' : 'bg-mint-700'}`}
                    >
                        <Text className="text-xs font-semibold text-white">Pendientes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={toggleEmergencias}
                        className={`px-4 py-2 rounded-full mr-2 ${soloEmergencias ? 'bg-mint-800' : 'bg-mint-700'}`}
                    >
                        <Text className="text-xs font-semibold text-white">Emergencias</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={limpiarFiltros}
                        className="w-8 h-8 rounded-full bg-mint-700 items-center justify-center mr-2"
                    >
                        <Text className="text-white text-xs font-bold">✕</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Lista de alertas */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {alertasPaginadas.length === 0 && (
                    <View className="items-center justify-center py-10">
                        <Text className="text-slate-700 text-sm font-semibold text-center">
                            {alertasBase.length === 0
                                ? 'No tienes alertas registradas.'
                                : 'No hay alertas que coincidan con los filtros seleccionados.'}
                        </Text>
                    </View>
                )}

                {alertasPaginadas.map((alerta) => (
                    <View key={alerta.number} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                        {/* Fila superior: avatar + usuario + tipo */}
                        <View className="flex-row items-center mb-3">
                            <View className="w-8 h-8 rounded-full bg-slate-900 mr-2" />
                            <Text className="text-slate-900 font-semibold text-sm mr-4" numberOfLines={1}>
                                {alerta.username}
                            </Text>
                            <View className="px-3 py-1.5 rounded-full bg-mint-700">
                                <Text className="text-white text-xs font-bold">{alerta.type}</Text>
                            </View>
                        </View>

                        {/* Fecha */}
                        <View className="flex-row items-center mb-3">
                            <Text className="text-slate-700 text-xs mr-1">Fecha de alerta:</Text>
                            <Text className="text-slate-900 font-bold text-xs">
                                {new Date(alerta.date).toLocaleDateString()}
                            </Text>
                        </View>

                        {/* Fila inferior: Estado + Ubicación */}
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center bg-mint-700 rounded-full overflow-hidden">
                                <View className="px-3 py-1.5 z-10">
                                    <Text className="text-white text-xs font-bold">Estado</Text>
                                </View>
                                <View className="bg-mint-100 px-3 py-1.5 rounded-full -ml-1 z-0">
                                    <Text className="text-slate-900 text-xs font-semibold">{alerta.state}</Text>
                                </View>
                            </View>

                            <TouchableOpacity className="bg-mint-700 px-4 py-1.5 rounded-full">
                                <Text className="text-white text-xs font-bold">Ubicación</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                {/* Controles de paginación */}
                {alertasFiltradas.length > 0 && (
                    <View className="flex-row justify-center items-center mt-2">
                        <TouchableOpacity
                            onPress={() => irAPagina(paginaActual - 1)}
                            disabled={paginaActual === 1}
                            className={`w-9 h-9 rounded-full items-center justify-center mr-2 ${
                                paginaActual === 1 ? 'bg-mint-300' : 'bg-mint-700'
                            }`}
                        >
                            <Text className="text-white font-bold">‹</Text>
                        </TouchableOpacity>

                        <Text className="text-slate-900 font-semibold text-sm mx-2">
                            Página {paginaActual} de {totalPaginas}
                        </Text>

                        <TouchableOpacity
                            onPress={() => irAPagina(paginaActual + 1)}
                            disabled={paginaActual === totalPaginas}
                            className={`w-9 h-9 rounded-full items-center justify-center ml-2 ${
                                paginaActual === totalPaginas ? 'bg-mint-300' : 'bg-mint-700'
                            }`}
                        >
                            <Text className="text-white font-bold">›</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
            <BottomNavBar />
        </SafeAreaView>
    );
}