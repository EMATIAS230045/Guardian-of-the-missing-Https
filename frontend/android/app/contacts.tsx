import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DeviceContacts from 'expo-contacts';

type ContactoAgenda = {
    id?: string;
    name?: string;
    phoneNumbers?: { number?: string }[];
};

import BottomNavBar from './BottomNavBar';
import { UserService, ContactoEmergencia } from '../services/userService';

const RESULTADOS_POR_PAGINA = 10;

export default function Contacts() {
    const usuarioActual = UserService.getUsuarioActual();

    const [contactos, setContactos] = useState<ContactoEmergencia[]>([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [paginaActual, setPaginaActual] = useState(1);

    // --- Agregar contacto (agenda del teléfono) ---
    const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false);
    const [contactosTelefono, setContactosTelefono] = useState<ContactoAgenda[]>([]);
    const [cargandoContactos, setCargandoContactos] = useState(false);
    const [errorContactos, setErrorContactos] = useState('');
    const [busquedaTelefono, setBusquedaTelefono] = useState('');

    useEffect(() => {
        cargarContactos();
    }, []);

    const cargarContactos = async () => {
        try {
            setCargando(true);
            const data = await UserService.apiGetContactos();
            setContactos(data);
        } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudieron cargar los contactos');
        } finally {
            setCargando(false);
        }
    };

    const eliminarContacto = async (idContacto: number) => {
        Alert.alert(
            "Eliminar contacto",
            "¿Estás seguro de que deseas eliminar este contacto?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Eliminar", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await UserService.apiEliminarContacto(idContacto);
                            await cargarContactos();
                        } catch (e: any) {
                            Alert.alert('Error', e.message || 'No se pudo eliminar el contacto');
                        }
                    } 
                }
            ]
        );
    };

    // --- Filtrado por búsqueda ---
    const contactosFiltrados = contactos.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()) );

    // --- Paginación ---
    const totalPaginas = Math.max(1, Math.ceil(contactosFiltrados.length / RESULTADOS_POR_PAGINA));
    const inicio = (paginaActual - 1) * RESULTADOS_POR_PAGINA;
    const contactosPaginados = contactosFiltrados.slice(inicio, inicio + RESULTADOS_POR_PAGINA);

    const irAPagina = (pagina: number) => { if (pagina < 1 || pagina > totalPaginas) return; setPaginaActual(pagina); };

    // Deja solo dígitos, para comparar números sin importar formato (espacios, guiones, +52, etc.)
    const soloDigitos = (valor: string) => valor.replace(/\D/g, '');

    // --- Agregar contacto: pedir permiso SOLO para leer nombre + teléfono de la agenda ---
    const abrirModalAgregar = async () => {
        setErrorContactos('');
        setBusquedaTelefono('');
        setModalAgregarAbierto(true);
        setCargandoContactos(true);

        const { status } = await DeviceContacts.requestPermissionsAsync();
        if (status !== 'granted') { setErrorContactos('Se necesita permiso para acceder a tus contactos.'); setCargandoContactos(false); return; }
        // Solo se leen nombre y números de teléfono
        const { data } = await DeviceContacts.getContactsAsync({ fields: [DeviceContacts.Fields.PhoneNumbers], });

        setContactosTelefono(data.filter(c => c.name && c.phoneNumbers && c.phoneNumbers.length > 0));
        setCargandoContactos(false);
    };

    const cerrarModalAgregar = () => { setModalAgregarAbierto(false); setErrorContactos(''); };

    const seleccionarContactoTelefono = async (contactoTelefono: ContactoAgenda) => {
        if (!usuarioActual) return;
        const nombre = contactoTelefono.name ?? 'Sin nombre';
        const numeroAgenda = soloDigitos(contactoTelefono.phoneNumbers?.[0]?.number ?? '');
        
        if (!numeroAgenda) {
            Alert.alert('Aviso', 'Este contacto no tiene un número válido.');
            return;
        }

        const yaExiste = contactos.some(c => soloDigitos(c.telefono) === numeroAgenda);
        if (yaExiste) {
            Alert.alert('Aviso', 'Este número ya está en tus contactos de emergencia.');
            return;
        }

        try {
            await UserService.apiAgregarContacto(nombre, numeroAgenda);
            Alert.alert('Listo', `${nombre} fue agregado a tus contactos.`);
            cerrarModalAgregar();
            cargarContactos(); // recargar
        } catch (e: any) {
            Alert.alert('Error', e.message || 'No se pudo agregar el contacto');
        }
    };

    const contactosTelefonoFiltrados = contactosTelefono.filter(c => (c.name ?? '').toLowerCase().includes(busquedaTelefono.toLowerCase()) );

    return (
        <SafeAreaView className="flex-1 bg-mint-50">
            {/* Header */}
            <View className="px-5 pt-4 pb-3 bg-white">
                <Text className="text-xl font-bold text-slate-900 mb-3">Contactos de Emergencia</Text>
                
                <View className="flex-row items-center mt-2">
                    <TextInput className="flex-1 bg-mint-100 border border-mint-200 rounded-full h-11 px-4 text-sm text-slate-900"
                        placeholder="Buscar contacto..."
                        placeholderTextColor="#3a4a52" value={busqueda} onChangeText={(t) => { setBusqueda(t); setPaginaActual(1); }} autoCapitalize="none" />
                    
                    <TouchableOpacity onPress={abrirModalAgregar} className="w-11 h-11 rounded-full bg-mint-700 items-center justify-center ml-3">
                        <Text className="text-white text-xl font-bold">+</Text>
                    </TouchableOpacity>
                </View>
            </View>
            {/* Contenido */}
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
                {cargando ? (
                    <Text className="text-center text-slate-700 text-sm mt-6">Cargando...</Text>
                ) : (
                    <>
                        {contactosPaginados.length === 0 && (
                            <Text className="text-center text-slate-700 text-sm mt-6">
                                {contactos.length === 0 ? 'Aún no tienes contactos agregados.' : 'No se encontraron contactos con ese criterio.'}
                            </Text>
                        )}
                        {contactosPaginados.map((contacto) => (
                            <View key={contacto.id_contacto} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-row items-center">
                                        <View className="w-8 h-8 rounded-full bg-slate-900 mr-2" />
                                        <Text className="text-slate-900 font-semibold text-sm" numberOfLines={1}>{contacto.nombre}</Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Text className="text-slate-700 text-xs mr-1">Teléfono:</Text>
                                        <Text className="text-slate-900 font-bold text-xs mr-4">{contacto.telefono}</Text>
                                        <TouchableOpacity onPress={() => eliminarContacto(contacto.id_contacto)} className="bg-red-800 px-3 py-1.5 rounded-full">
                                            <Text className="text-white font-bold text-xs">Eliminar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </>
                )}
                
                {/* Controles de paginación */}
                {!cargando && contactosFiltrados.length > 0 && (
                    <View className="flex-row justify-center items-center mt-2">
                        <TouchableOpacity onPress={() => irAPagina(paginaActual - 1)} disabled={paginaActual === 1}
                            className={`w-9 h-9 rounded-full items-center justify-center mr-2 ${paginaActual === 1 ? 'bg-mint-300' : 'bg-mint-700' }`}>
                            <Text className="text-white font-bold">‹</Text>
                        </TouchableOpacity>
                        <Text className="text-slate-900 font-semibold text-sm mx-2">Página {paginaActual} de {totalPaginas}</Text>
                        <TouchableOpacity onPress={() => irAPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}
                            className={`w-9 h-9 rounded-full items-center justify-center ml-2 ${paginaActual === totalPaginas ? 'bg-mint-300' : 'bg-mint-700'}`}>
                            <Text className="text-white font-bold">›</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
            
            {/* Modal: agregar contacto desde el teléfono */}
            <Modal visible={modalAgregarAbierto} transparent animationType="fade" onRequestClose={cerrarModalAgregar}>
                <View className="flex-1 bg-black/40 items-center justify-center px-6">
                    <View className="bg-white rounded-2xl p-6 w-full max-h-[75%]">
                        <Text className="text-lg font-bold text-slate-900 mb-4">Agregar contacto</Text>
                        {!cargandoContactos && !errorContactos && (
                            <TextInput className="bg-mint-100 border border-mint-200 rounded-full h-11 px-4 text-sm text-slate-900 mb-4"
                                placeholder="Buscar en tu agenda..." placeholderTextColor="#3a4a52" value={busquedaTelefono} onChangeText={setBusquedaTelefono} autoCapitalize="none" />
                        )}
                        {cargandoContactos && ( <Text className="text-slate-700 text-sm font-semibold">Cargando contactos...</Text> )}
                        {!cargandoContactos && errorContactos !== '' && ( <Text className="text-red-800 text-sm font-semibold">{errorContactos}</Text> )}
                        {!cargandoContactos && !errorContactos && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {contactosTelefonoFiltrados.length === 0 && (
                                    <Text className="text-slate-700 text-sm font-semibold">No se encontraron contactos en tu agenda.</Text>
                                )}
                                {contactosTelefonoFiltrados.map((c, index) => (
                                    <TouchableOpacity key={c.id ?? `${c.name}-${index}`} onPress={() => seleccionarContactoTelefono(c)} className="bg-mint-100 rounded-xl px-4 py-3 mb-2">
                                        <Text className="text-slate-900 font-semibold text-sm">{c.name}</Text>
                                        {c.phoneNumbers?.[0]?.number && (
                                            <Text className="text-slate-700 text-xs mt-1">{c.phoneNumbers[0].number}</Text>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                        <TouchableOpacity onPress={cerrarModalAgregar} className="bg-mint-800 rounded-full py-2.5 items-center mt-4">
                            <Text className="text-white font-bold text-sm">Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <BottomNavBar />
        </SafeAreaView>
    );
}
