import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavBar from './BottomNavBar';
import { AlertaApi, UserService } from '../services/userService';
import * as Location from 'expo-location';

import MapView, { Marker, Circle, MapPressEvent } from 'react-native-maps';

interface Punto {
    latitude: number;
    longitude: number;
}

export default function Geofences() {
    const [modoDibujo, setModoDibujo] = useState(false);
    const [puntos, setPuntos] = useState<Punto[]>([]);
    const [pin, setPin] = useState<Punto | null>(null);
    const [regionActual, setRegionActual] = useState({ latitude: 20.393, longitude: -98.203, latitudeDelta: 0.05, longitudeDelta: 0.05 });

    const [geocercasGuardadas, setGeocercasGuardadas] = useState<any[]>([]);
    const [alertas, setAlertas] = useState<AlertaApi[]>([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const iniciarUbicacion = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let location = await Location.getCurrentPositionAsync({});
                setRegionActual({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            }
            await cargarGeocercas();
            await cargarAlertas();
        };
        iniciarUbicacion();
    }, []);

    const cargarGeocercas = async () => {
        try {
            setCargando(true);
            const data = await UserService.apiGetGeocercas();
            setGeocercasGuardadas(data || []);
            if (data && data.length === 0) {
                Alert.alert('Geocercas', 'Aún no tienes geocercas guardadas. Usa el botón "Nueva geocerca" para trazar una.');
            }
        } catch (e: any) {
            console.error('Error cargando geocercas:', e);
        } finally {
            setCargando(false);
        }
    };

    const cargarAlertas = async () => {
        try {
            const data = await UserService.apiGetAlertas();
            const usuarioActual = UserService.getUsuarioActual();
            const reportesVisibles = usuarioActual?.role === 'admin'
                ? data
                : data.filter(alerta => !usuarioActual || alerta.id_usuario === usuarioActual.id);
            setAlertas(reportesVisibles.filter(alerta =>
                Number.isFinite(alerta.latitud) && Number.isFinite(alerta.longitud) &&
                alerta.latitud >= -90 && alerta.latitud <= 90 &&
                alerta.longitud >= -180 && alerta.longitud <= 180
            ));
        } catch (e: any) {
            console.error('Error cargando reportes:', e);
        }
    };

    const manejarToqueMapa = (e: MapPressEvent) => {
        if (!modoDibujo) {
            setPin(e.nativeEvent.coordinate);
            return;
        }
        // Solo permitimos 1 punto central para la geocerca circular
        setPuntos([e.nativeEvent.coordinate]);
    };

    const limpiarGeocerca = () => {
        setPuntos([]);
    };

    const guardarGeocerca = async () => {
        if (puntos.length === 0) {
            Alert.alert('Aviso', 'Toca el mapa para establecer el centro de la geocerca');
            return;
        }

        try {
            await UserService.apiGuardarGeocerca(puntos[0], 150); // Radio fijo de 150m por ahora
            
            Alert.alert('Éxito', 'Geocerca circular guardada correctamente');
            
            setModoDibujo(false);
            setPuntos([]);
            cargarGeocercas(); // recargar
        } catch (e: any) {
            Alert.alert('Error', e.message || 'Error al guardar la geocerca');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-mint-50">
            <View className="px-5 pt-4 pb-3 bg-white">
                <Text className="text-xl font-bold text-slate-900">Geocercas</Text>
            </View>
            {/* Contenedor del mapa */}
            <View className="flex-1 mx-4 my-4 rounded-2xl overflow-hidden shadow-sm">
                {cargando && <Text className="absolute top-4 left-4 z-10 font-bold text-slate-900 bg-white/70 px-2 py-1 rounded">Cargando geocercas y reportes...</Text>}
                <MapView 
                    style={{ flex: 1 }} 
                    region={regionActual}
                    showsUserLocation={true}
                    onPress={manejarToqueMapa}
                >
                    {pin && <Marker coordinate={pin} title="Ubicación" />}

                    {alertas.map(alerta => {
                        const center = { latitude: alerta.latitud, longitude: alerta.longitud };
                        return (
                            <React.Fragment key={`alerta-${alerta.id_alerta}`}>
                                <Circle
                                    center={center}
                                    radius={500}
                                    fillColor="rgba(239, 68, 68, 0.22)"
                                    strokeColor="#dc2626"
                                    strokeWidth={3}
                                />
                                <Marker
                                    coordinate={center}
                                    pinColor="#dc2626"
                                    title={`Reporte #${alerta.id_alerta}`}
                                    description={`Usuario #${alerta.id_usuario} | Dispositivo #${alerta.id_dispositivo} | Geocerca: ${alerta.id_geocerca_mongo || 'sin geocerca'}`}
                                />
                            </React.Fragment>
                        );
                    })}
                    
                    {/* Renderizar circulo en dibujo actual */}
                    {puntos.length > 0 && ( <Circle center={puntos[0]} radius={150} fillColor="rgba(26, 143, 111, 0.25)" strokeColor="#1a8f6f" strokeWidth={2} /> )}
                    {puntos.map((punto, index) => (
                        <Marker key={`dibujo-${index}`} coordinate={punto} pinColor="#1a5c4a" />
                    ))}

                    {/* Renderizar geocercas guardadas desde MySQL/Mongo */}
                    {geocercasGuardadas.map((geo, index) => {
                        if (geo.ubicacion?.type === 'Point' && geo.ubicacion.coordinates) {
                            const center = {
                                latitude: geo.ubicacion.coordinates[1],
                                longitude: geo.ubicacion.coordinates[0]
                            };
                            const isRiesgo = geo.tipo_zona === 'riesgo';
                            const fillColor = isRiesgo ? "rgba(200, 50, 50, 0.25)" : "rgba(26, 143, 111, 0.25)";
                            const strokeColor = isRiesgo ? "#c83232" : "#1a8f6f";
                            
                            return (
                                <Circle key={geo.id || index} center={center} radius={geo.radio_metros || 150} fillColor={fillColor} strokeColor={strokeColor} strokeWidth={2} />
                            );
                        }
                        return null;
                    })}
                </MapView>
            </View>
            {/* Controles Flotantes */}
            <View className="absolute bottom-24 left-4 right-4 flex-row justify-between pointer-events-auto shadow-sm">
                <TouchableOpacity onPress={() => { setModoDibujo(!modoDibujo); setPuntos([]); }}
                    className={`px-5 py-3 rounded-full shadow-sm elevation-sm ${ modoDibujo ? 'bg-mint-800' : 'bg-mint-700' }`}>
                    <Text className="text-white font-bold text-[15px] shadow-sm">
                        {modoDibujo ? 'Cancelar dibujo' : '+ Nueva geocerca'}
                    </Text>
                </TouchableOpacity>
                {modoDibujo && (
                    <View className="flex-row">
                        <TouchableOpacity onPress={limpiarGeocerca} className="bg-white/90 border border-mint-600 px-5 py-3 rounded-full mr-2 shadow-sm">
                            <Text className="text-mint-700 font-bold text-[15px]">Limpiar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={guardarGeocerca} className="bg-mint-400 px-5 py-3 rounded-full shadow-sm" >
                            <Text className="text-mint-800 font-bold text-[15px]">Guardar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
            <BottomNavBar/>
        </SafeAreaView>
    );
}
