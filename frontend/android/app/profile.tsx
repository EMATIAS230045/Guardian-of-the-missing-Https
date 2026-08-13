import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import BottomNavBar from './BottomNavBar';
import { UserService } from '../services/userService';

export default function Profile() {
    const usuarioActual = UserService.getUsuarioActual();

    const backToLogin = () => {
        router.replace('/');
    }

    if (!usuarioActual) {
        return (
            <SafeAreaView className="flex-1 bg-mint-50">
                <View className="px-5 pt-4 pb-3 bg-white">
                    <Text className="text-xl font-bold text-slate-900">Mi Perfil</Text>
                </View>
                <View className="flex-1 items-center justify-center px-5">
                    <Text className="text-sm text-slate-700 font-semibold text-center">
                        No hay ninguna sesión iniciada.
                    </Text>
                    <TouchableOpacity onPress={backToLogin} className="bg-red-800 rounded-full w-40 py-3 items-center mt-8">
                        <Text className="text-white font-bold text-sm">Regresar al login</Text>
                    </TouchableOpacity>
                </View>
                <BottomNavBar />
            </SafeAreaView>
        );
    }

    const rolLegible = usuarioActual.role === 'admin' ? 'Administrador' : 'Usuario';

    const cerrarSesion = () => {
        UserService.cerrarSesion();
        router.replace('/');
    };

    return (
        <SafeAreaView className="flex-1 bg-mint-50">
            <View className="px-5 pt-4 pb-3 bg-white">
                <Text className="text-xl font-bold text-slate-900">Mi Perfil</Text>
            </View>
            <View className="px-5 pt-8">
                <View className="items-center mb-4">
                    <View className="w-32 h-32 rounded-full bg-slate-900 shadow-lg shadow-mint-500" />
                </View>
                <View className="items-center mb-8">
                    <Text className="text-sm text-slate-700">{rolLegible}</Text>
                    <Text className="text-xl font-bold text-slate-900">{usuarioActual.username}</Text>
                </View>
                <View className="flex-row mb-2 ml-6">
                    <Text className="text-sm text-slate-700">Correo: </Text>
                    <Text className="text-sm font-semibold text-slate-900">{usuarioActual.email}</Text>
                </View>
                <View className="flex-row mb-2 ml-6">
                    <Text className="text-sm text-slate-700">Teléfono: </Text>
                    <Text className="text-sm font-semibold text-slate-900">{usuarioActual.phonenumber}</Text>
                </View>
                <View className="flex-row mb-2 ml-6">
                    <Text className="text-sm text-slate-700">Tipo de sangre: </Text>
                    <Text className="text-sm font-semibold text-slate-900">{usuarioActual.bloodType}</Text>
                </View>
                <TouchableOpacity onPress={() => Alert.alert('Próximamente', 'La función de cambiar contraseña estará disponible pronto.')}>
                    <Text className="text-sm font-semibold text-mint-800 ml-6 mt-2">Cambiar contraseña</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={cerrarSesion} className="bg-red-800 rounded-full py-3 items-center mt-8">
                    <Text className="text-white font-bold text-sm">Cerrar sesión</Text>
                </TouchableOpacity>
            </View>
            <BottomNavBar/>
        </SafeAreaView>
    );
}
