// app/_layout.tsx
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router'; // Quitamos Slot porque lo reemplazaremos condicionalmente
import { ActivityIndicator, useColorScheme, View } from 'react-native';

// IMPORTA TU PANTALLA DE LOGIN AQUÍ
import LoginScreen from './login';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();

  // 1. Cargando...
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0e1121' }}>
        <ActivityIndicator size="large" color="#ff9f43" />
      </View>
    );
  }

  // 2. CORRECCIÓN: Si NO hay usuario, renderizamos LoginScreen directamente.
  // Así protegemos toda la app. Nada más puede cargarse si esto es false.
  if (!user) {
    return <LoginScreen />;
  }

  // 3. Si HAY usuario, mostramos el Stack normal (Tabs, etc)
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}