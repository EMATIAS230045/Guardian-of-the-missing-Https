import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavItem = 'main' | 'geofences' | 'historial' | 'contacts' | 'profile';

const navButtons: { route: NavItem; label: string; }[] = [
    { route: 'main', label: 'Inicio' },
    { route: 'geofences', label: 'Geocercas' },
    { route: 'historial', label: 'Historial' },
    { route: 'contacts', label: 'Contactos' },
    { route: 'profile', label: 'Perfil' },
];

const iconMap = {
    main: require('../assets/home.png'),
    geofences: require('../assets/location.png'),
    historial: require('../assets/historial.png'),
    contacts: require('../assets/users.png'),
    profile: require('../assets/profile.png'),
};

export default function BottomNavBar() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const pathname = usePathname();

    return (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-mint-200 flex-row justify-around items-center py-2 px-1" 
            style={{ paddingTop: 8, paddingBottom: insets.bottom + 8 }} >
        {navButtons.map((item) => {
            const isActive = pathname === '/' + item.route || (item.route === 'main' && pathname === '/');
            return (
                <TouchableOpacity key={item.route} onPress={() => router.push('/' + item.route)} 
                    className={`items-center justify-center px-2 py-1.5 rounded-xl ${ isActive ? 'bg-mint-100' : '' }`} >
                    <Image className="w-7 h-7" source={iconMap[item.route]} />
                    <Text className={`text-[11px] mt-1.5 ${ isActive ? 'text-mint-800 font-semibold' : 'text-slate-700' }`}>{item.label}</Text>
                </TouchableOpacity>
            );
        })}
        </View>
    );
}