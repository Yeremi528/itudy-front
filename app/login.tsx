import { useAuth } from '@/context/AuthContext'; // <--- Importamos el contexto
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, Stack } from 'expo-router';
import { Code2, Sparkles, Zap } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
    // Obtenemos la función y el estado del contexto global
    const { signIn, isLoading, user } = useAuth();

    // Redirección de seguridad: Si ya hay usuario, no mostrar esta pantalla
    if (user) return <Redirect href="/(tabs)" />;

    const handleGoogleLogin = async () => {
        try {
            await signIn(); // Toda la lógica pesada ahora ocurre en el Context
        } catch (error) {
            console.error("Error en vista login:", error);
            Alert.alert("Error", "No se pudo iniciar sesión. Verifica tu conexión.");
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f172a', '#1e293b', '#0f172a']}
                style={styles.background}
            />

            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.content}>
                
                {/* 1. HEADER / LOGO */}
                <View style={styles.headerContainer}>
                    <View style={styles.badgeContainer}>
                        <Sparkles size={16} color="#38bdf8" style={{marginRight: 6}} />
                        <Text style={styles.badgeText}>APRENDE JUGANDO</Text>
                    </View>
                    
                    <Text style={styles.title}>Itudy</Text>
                    <Text style={styles.subtitle}>Diferenciate del resto, profundizando tus conocimientos.</Text>
                </View>

                {/* 2. VISUAL CENTRAL */}
                <View style={styles.heroImageContainer}>
                    <View style={styles.iconCircle}>
                        <Code2 size={80} color="#FFF" />
                        <View style={styles.floatBadge}>
                            <Zap size={20} color="#FFF" fill="#FFF" />
                        </View>
                    </View>
                </View>

                {/* 3. BOTÓN DE ACCIÓN */}
                <View style={styles.bottomSection}>
                    <TouchableOpacity 
                        style={[styles.googleButton, isLoading && styles.buttonDisabled]} 
                        onPress={handleGoogleLogin}
                        activeOpacity={0.9}
                        disabled={isLoading} // Deshabilitar si está cargando
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#1e293b" />
                        ) : (
                            <>
                                <View style={styles.googleIconPlaceholder}>
                                    <Image 
                                        source={require('../assets/images/logo-google.png')} 
                                        style={{width: 24, height: 24, marginRight: 12}} 
                                    />
                                </View>
                                <Text style={styles.googleButtonText}>Continuar con Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.termsText}>
                        Al continuar, aceptas nuestros Términos y Política de Privacidad.
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    
    // Header Styles
    headerContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.3)',
    },
    badgeText: {
        color: '#38bdf8',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    title: {
        fontSize: 56,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        textShadowColor: 'rgba(56, 189, 248, 0.6)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    subtitle: {
        fontSize: 18,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 8,
    },

    // Hero Visual Styles
    heroImageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: '#F59E0B',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#F59E0B",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    floatBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: '#ef4444',
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#0f172a',
    },

    // Bottom / Button Styles
    bottomSection: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Centrado mejorado para cuando hay spinner
        backgroundColor: '#FFFFFF',
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        height: 56, // Altura fija para evitar saltos al cambiar a spinner
    },
    buttonDisabled: {
        opacity: 0.7, // Feedback visual de deshabilitado
    },
    googleIconPlaceholder: {
        width: 24,
        height: 24,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        // Quitamos el flex:1 para que el contenido se centre naturalmente con justifyContent: 'center'
    },
    termsText: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 18,
    },
});

export default LoginScreen;