import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { apiFetch } from './api';

import { UserService } from './userService';
import * as Location from 'expo-location';

export const activarBotonPanico = async () => {
    try {
        const usuarioActual = UserService.getUsuarioActual();
        if (!usuarioActual) {
            Alert.alert('Error', 'Debes iniciar sesión para usar el botón de pánico.');
            return;
        }

        // Solicitar permisos y obtener ubicación real
        let lat = 20.2741; // Fallback (Xicotepec de Juárez)
        let lon = -97.9547;
        
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            try {
                let location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Highest
                });
                lat = location.coords.latitude;
                lon = location.coords.longitude;
            } catch (err) {
                console.log("No se pudo obtener la ubicación fina, usando fallback.");
            }
        } else {
            console.log("Permiso denegado para acceder a la ubicación.");
        }

        await apiFetch('/alertas/panico', {
            method: 'POST',
            body: JSON.stringify({
                id_usuario: usuarioActual.id, 
                id_dispositivo: null, 
                latitud: lat,
                longitud: lon,
                id_geocerca_mongo: 'zona-segura'
            })
        });
        Alert.alert('Reporte de emergencia enviado', 'Tu equipo y tus contactos han sido notificados en tiempo real.');
    } catch (e: any) { 
        Alert.alert('Error', e.message || 'No se pudo enviar la alerta de pánico');
        console.error('Error enviando panico', e); 
    }
};

export const enviarAlertaSeguridad = async () => {
    try {
        const usuarioActual = UserService.getUsuarioActual();
        if (!usuarioActual) {
            Alert.alert('Error', 'Debes iniciar sesión para enviar un reporte.');
            return;
        }

        await apiFetch('/alertas/', {
            method: 'POST',
            body: JSON.stringify({
                id_usuario: usuarioActual.id, 
                id_dispositivo: null,
                latitud: 10,
                longitud: 9,
                id_geocerca_mongo: 'zona-segura',
                nivel_riesgo: 'media',
                estado: 'activa',
                comentario: 'Reporte de seguridad manual'
            })
        });
        Alert.alert('Reporte de seguridad enviado', 'Has notificado un aviso de seguridad en tu zona a otros usuarios cercanos.');
    } catch (e: any) {
        Alert.alert('Error', e.message || 'No se pudo enviar el reporte de seguridad');
        console.error('Error enviando reporte de seguridad', e);
    }
};

// --- Detección de shake ---

const UMBRAL_ACELERACION = 1.8; // fuerza mínima (en g) para considerarlo un "agitón"
const INTERVALO_LECTURA_MS = 100;
const COOLDOWN_MS = 3000; // evita disparos repetidos por un solo shake sostenido

export function useShakeParaPanico(activo: boolean = true) {
    const ultimoDisparo = useRef(0);

    useEffect(() => {
        if (!activo) return;

        Accelerometer.setUpdateInterval(INTERVALO_LECTURA_MS);

        const suscripcion = Accelerometer.addListener(({ x, y, z }) => {
            const fuerza = Math.sqrt(x * x + y * y + z * z);

            if (fuerza > UMBRAL_ACELERACION) {
                const ahora = Date.now();
                if (ahora - ultimoDisparo.current > COOLDOWN_MS) {
                    ultimoDisparo.current = ahora;
                    activarBotonPanico();
                }
            }
        });

        return () => {
            suscripcion.remove();
        };
    }, [activo]);
}
