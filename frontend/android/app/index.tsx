import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { UserService } from '../services/userService';

type Pantalla = 'login' | 'register' | 'completeProfile' | 'registerSuccess' | 'recovery' | 'recoverySuccess';

export default function Login() {
    const router = useRouter();
    const [pantalla, setPantalla] = useState<Pantalla>('login');

    // --- Login ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorEmail, setErrorEmail] = useState('');
    const [errorPassword, setErrorPassword] = useState('');

    // --- Registro ---
    const [rEmail, setREmail] = useState('');
    const [rPassword, setRPassword] = useState('');
    const [rPasswordConfirm, setRPasswordConfirm] = useState('');
    const [errorREmail, setErrorREmail] = useState('');
    const [errorRPassword, setErrorRPassword] = useState('');
    const [errorRPasswordConfirm, setErrorRPasswordConfirm] = useState('');

    // --- Completar perfil (teléfono + tipo de sangre) ---
    const [rPhone, setRPhone] = useState('');
    const [rBloodType, setRBloodType] = useState('');
    const [errorRPhone, setErrorRPhone] = useState('');
    const [errorRBloodType, setErrorRBloodType] = useState('');

    // --- Recuperación ---
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [errorRecoveryEmail, setErrorRecoveryEmail] = useState('');

    const formatoEmailValido = (valor: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(valor.trim());
    };

    const limpiarCamposLogin = () => {
        setEmail('');
        setPassword('');
        setErrorEmail('');
        setErrorPassword('');
    };

    const limpiarCamposRegistro = () => {
        setREmail('');
        setRPassword('');
        setRPasswordConfirm('');
        setErrorREmail('');
        setErrorRPassword('');
        setErrorRPasswordConfirm('');
    };

    const limpiarCamposCompleteProfile = () => {
        setRPhone('');
        setRBloodType('');
        setErrorRPhone('');
        setErrorRBloodType('');
    };

    const limpiarCamposRecovery = () => {
        setRecoveryEmail('');
        setErrorRecoveryEmail('');
    };

    const irALogin = () => {
        limpiarCamposLogin();
        limpiarCamposRegistro();
        limpiarCamposCompleteProfile();
        limpiarCamposRecovery();
        setPantalla('login');
    };

    const irARegistro = () => {
        limpiarCamposLogin();
        limpiarCamposRegistro();
        setPantalla('register');
    };

    const irARecovery = () => {
        limpiarCamposRecovery();
        setPantalla('recovery');
    };

    // --- Lógica de login ---
    const validarLogin = (): boolean => {
        return true;
    };

    const onLoginSuccess = async () => {
        if (!validarLogin()) { return; }
        try {
            await UserService.apiLogin(email.trim(), password);
            router.push('/main');
        } catch (e: any) {
            setErrorPassword(e.message || 'Credenciales incorrectas');
        }
    };

    const validarRegistro = (): boolean => {
        return true;
    };

    const onRegisterSuccess = () => {
        if (!validarRegistro()) {
            return;
        }
        // Aquí se enviaría el registro real a backend (paso 1: correo + contraseña)
        limpiarCamposCompleteProfile();
        setPantalla('completeProfile');
    };

    const validarCompleteProfile = (): boolean => {
        return true;
    };

    const onCompleteProfileSuccess = async () => {
        if (!validarCompleteProfile()) { return; }
        try {
            const dataPayload: any = {
                nombre: rEmail.split('@')[0] || 'Usuario',
                apellido_paterno: 'Usuario',
                correo: rEmail.trim(),
                contrasena: rPassword
            };
            if (rPhone.trim()) dataPayload.telefono = rPhone.trim();
            if (rBloodType.trim()) dataPayload.tipo_sangre = rBloodType.trim().toUpperCase();
            dataPayload.fecha_nacimiento = '2000-01-01';

            await UserService.apiRegister(dataPayload);
            setPantalla('registerSuccess');
        } catch (e: any) {
            setErrorRPhone(e.message || 'Error al registrar usuario');
        }
    };

    // --- Lógica de recuperación ---
    const validarRecoveryEmail = (): boolean => {
        setErrorRecoveryEmail('');
        if (!recoveryEmail.trim()) { setErrorRecoveryEmail('El correo es obligatorio.'); return false; }
        if (!formatoEmailValido(recoveryEmail)) { setErrorRecoveryEmail('El formato del correo no es válido.'); return false; }
        // El backend verificará si el correo existe al enviar el código
        return true;
    };

    const onEnviarRecovery = () => {
        if (!validarRecoveryEmail()) { return; }
        // Aquí se enviaría el correo real de recuperación
        setPantalla('recoverySuccess');
    };

    return (
        <View className="flex-1 bg-mint-50 justify-center items-center px-5">
            <View className="w-full max-w-[380px] bg-white rounded-[20px] p-7 shadow-lg shadow-mint-500">
                {/* --- Formulario de Login --- */}
                {pantalla === 'login' && (
                    <>
                        <Text className="text-[26px] font-bold text-slate-900 mb-6">Iniciar sesión</Text>
                        <Text className="text-sm font-semibold text-slate-900 mb-1.5">Correo electronico</Text>
                        {!!errorEmail && <Text className="text-red-600 text-xs mb-2">{errorEmail}</Text>}
                        <TextInput className="bg-mint-100 border border-mint-200 rounded-lg h-11 px-3 mb-1"
                            value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                        <Text className="text-sm font-semibold text-slate-900 mb-1.5 mt-2">Contraseña</Text>
                        {!!errorPassword && <Text className="text-red-600 text-xs mb-2">{errorPassword}</Text>}
                        <TextInput className="bg-mint-100 border border-mint-200 rounded-lg h-11 px-3 mb-1"
                            value={password} onChangeText={setPassword} secureTextEntry />
                        <TouchableOpacity onPress={irARecovery} className="mt-1 mb-4">
                            <Text className="text-mint-800 font-semibold text-[13px]">¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-mint-400 rounded-lg h-[46px] justify-center items-center mb-[18px]" onPress={onLoginSuccess}>
                            <Text className="text-mint-700 font-bold text-[15px]">Iniciar sesión</Text>
                        </TouchableOpacity>
                        <Text className="text-center text-slate-700 mb-4 text-sm">O inicia sesion con</Text>
                        <TouchableOpacity className="bg-mint-600 rounded-lg h-[46px] justify-center items-center mb-3">
                            <Text className="text-mint-700 font-semibold text-sm">Iniciar sesion con Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-mint-600 rounded-lg h-[46px] justify-center items-center mb-3">
                            <Text className="text-mint-700 font-semibold text-sm">Iniciar sesion con Facebook</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-mint-600 rounded-lg h-[46px] justify-center items-center mb-3">
                            <Text className="text-mint-700 font-semibold text-sm">Iniciar sesion con Apple</Text>
                        </TouchableOpacity>
                        <View className="flex-row justify-center mt-2">
                            <Text className="text-slate-900 text-[13px]">¿Aun no tienes una cuenta? </Text>
                            <TouchableOpacity onPress={irARegistro}>
                                <Text className="text-mint-800 font-semibold text-[13px]">¡Registrate!</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {/* --- Formulario de Registro (paso 1: cuenta) --- */}
                {pantalla === 'register' && (
                    <>
                        <Text className="text-[26px] font-bold text-slate-900 mb-6">Registrate</Text>
                        <Text className="text-sm font-semibold text-slate-900 mb-1.5">Correo electronico</Text>
                        {!!errorREmail && <Text className="text-red-600 text-xs mb-2">{errorREmail}</Text>}
                        <TextInput className="bg-mint-100 border border-mint-200 rounded-lg h-11 px-3 mb-1"
                            value={rEmail} onChangeText={setREmail} autoCapitalize="none" keyboardType="email-address" />
                        <Text className="text-sm font-semibold text-slate-900 mb-1.5 mt-2">Contraseña</Text>
                        {!!errorRPassword && <Text className="text-red-600 text-xs mb-2">{errorRPassword}</Text>}
                        <TextInput className="bg-mint-100 border border-mint-200 rounded-lg h-11 px-3 mb-1"
                            value={rPassword} onChangeText={setRPassword} secureTextEntry />
                        <Text className="text-sm font-semibold text-slate-900 mb-1.5 mt-2">Confirmar contraseña</Text>
                        {!!errorRPasswordConfirm && <Text className="text-red-600 text-xs mb-2">{errorRPasswordConfirm}</Text>}
                        <TextInput className="bg-mint-100 border border-mint-200 rounded-lg h-11 px-3 mb-1"
                            value={rPasswordConfirm} onChangeText={setRPasswordConfirm} secureTextEntry />
                        <TouchableOpacity className="bg-mint-400 rounded-lg h-[46px] justify-center items-center mt-4 mb-[18px]" onPress={onRegisterSuccess}>
                            <Text className="text-mint-700 font-bold text-[15px]">Registrarse</Text>
                        </TouchableOpacity>
                        <Text className="text-center text-slate-700 mb-4 text-sm">O registrate con</Text>
                        <TouchableOpacity className="bg-mint-600 rounded-lg h-[46px] justify-center items-center mb-3">
                            <Text className="text-mint-700 font-semibold text-sm">Registrarme con Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-mint-600 rounded-lg h-[46px] justify-center items-center mb-3">
                            <Text className="text-mint-700 font-semibold text-sm">Registrarme con Facebook</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-mint-600 rounded-lg h-[46px] justify-center items-center mb-3">
                            <Text className="text-mint-700 font-semibold text-sm">Registrarme con Apple</Text>
                        </TouchableOpacity>
                        <View className="flex-row justify-center mt-2">
                            <Text className="text-slate-900 text-[13px]">¿Ya tienes una cuenta? </Text>
                            <TouchableOpacity onPress={irALogin}>
                                <Text className="text-mint-800 font-semibold text-[13px]">¡Inicia sesión!</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
                {/* --- Formulario de Registro (paso 2: teléfono + tipo de sangre) --- */}
                {pantalla === 'completeProfile' && (
                    <>
                        <Text className="text-[26px] font-bold text-slate-900 mb-2">Completa tu perfil</Text>
                        <Text className="text-slate-700 text-[13px] mb-6">Estos datos nos ayudan a identificarte en caso de emergencia.</Text>
                        <Text className="text-sm font-semibold text-slate-900 mb-1.5">Número de teléfono</Text>
                        {!!errorRPhone && <Text className="text-red-600 text-xs mb-2">{errorRPhone}</Text>}
                        <TextInput className="bg-mint-100 border border-mint-200 rounded-lg h-11 px-3 mb-1"
                            value={rPhone} onChangeText={setRPhone} keyboardType="phone-pad" maxLength={10} />
                        <Text className="text-sm font-semibold text-slate-900 mb-1.5 mt-2">Tipo de sangre (Opcional)</Text>
                        {!!errorRBloodType && <Text className="text-red-600 text-xs mb-2">{errorRBloodType}</Text>}
                        <View className="flex-row flex-wrap justify-between mt-1 mb-2">
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((tipo) => (
                                <TouchableOpacity 
                                    key={tipo} 
                                    onPress={() => setRBloodType(rBloodType === tipo ? '' : tipo)}
                                    className={`w-[23%] aspect-[2/1] rounded-lg justify-center items-center mb-2 border ${rBloodType === tipo ? 'bg-mint-700 border-mint-700' : 'bg-mint-100 border-mint-200'}`}
                                >
                                    <Text className={`font-bold ${rBloodType === tipo ? 'text-white' : 'text-slate-900'}`}>{tipo}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity className="bg-mint-400 rounded-lg h-[46px] justify-center items-center mt-4" onPress={onCompleteProfileSuccess}>
                            <Text className="text-mint-700 font-bold text-[15px]">Finalizar registro</Text>
                        </TouchableOpacity>
                    </>
                )}
                {/* --- Confirmación de registro completado --- */}
                {pantalla === 'registerSuccess' && (
                    <View className="items-center">
                        <Text className="text-[22px] font-bold text-slate-900 mb-4 text-center">Registro completado</Text>
                        <Text className="text-slate-700 text-center mb-8">Ahora puedes iniciar sesión.</Text>
                        <TouchableOpacity className="bg-mint-400 rounded-lg h-[46px] w-full justify-center items-center" onPress={irALogin}>
                            <Text className="text-mint-700 font-bold text-[15px]">Iniciar sesión</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {/* --- Formulario de recuperación (paso 1: correo) --- */}
                {pantalla === 'recovery' && (
                    <>
                        <Text className="text-[26px] font-bold text-slate-900 mb-6">Recuperar contraseña</Text>
                        <Text className="text-sm font-semibold text-slate-900 mb-1.5">Correo electronico</Text>
                        <TextInput
                            className="bg-mint-100 border border-mint-200 rounded-lg h-11 px-3 mb-1"
                            value={recoveryEmail}
                            onChangeText={setRecoveryEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        {!!errorRecoveryEmail && <Text className="text-red-600 text-xs mb-2">{errorRecoveryEmail}</Text>}
                        <TouchableOpacity className="bg-mint-400 rounded-lg h-[46px] justify-center items-center mt-4 mb-[18px]" onPress={onEnviarRecovery}>
                            <Text className="text-mint-700 font-bold text-[15px]">Enviar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={irALogin} className="items-center">
                            <Text className="text-mint-800 font-semibold text-[13px]">Regresar</Text>
                        </TouchableOpacity>
                    </>
                )}
                {/* --- Confirmación de recuperación enviada --- */}
                {pantalla === 'recoverySuccess' && (
                    <View className="items-center">
                        <Text className="text-[22px] font-bold text-slate-900 mb-4 text-center">Correo enviado</Text>
                        <Text className="text-slate-700 text-center mb-8">Te hemos enviado un correo electronico para que puedas cambiar tu contraseña.</Text>
                        <TouchableOpacity className="bg-mint-400 rounded-lg h-[46px] w-full justify-center items-center" onPress={irALogin}>
                            <Text className="text-mint-700 font-bold text-[15px]">Regresar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}


