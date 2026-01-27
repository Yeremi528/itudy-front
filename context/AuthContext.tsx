// context/AuthContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { makeRedirectUri } from 'expo-auth-session'; // <--- IMPORTANTE
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// 1. Esto maneja el cierre de la ventana emergente en Web
WebBrowser.maybeCompleteAuthSession();

type UserStats = {
  total_xp: number;
  streak_days: number;
  current_league: string;
};

export type EnrolledCourse = {
  id: string;          
  name?: string;       
  progress?: number;   
  is_completed?: boolean;
};

export type UserCoursesInfo = {
  active: string;            
  list: EnrolledCourse[];    
};

// Define el usuario completo basándonos en tu captura de MongoDB
export type User = {
  id: string;           // MongoDB siempre devuelve un _id
  name: string;
  email: string;
  picture?: string;      // Opcional: Google la da, pero tu DB aún no la guarda en la captura
  token?: string;        // Opcional: Para tus peticiones al backend (si el backend lo devuelve aparte)
  
  courses_info: UserCoursesInfo;
  
  country: string;
  native_language: string;
  created_at: string;
  stats: UserStats;     
};
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  setUser: (user:any) => void;
  signIn: () => Promise<void>;
  signOut: () => void;
  updateUserData: (updates: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Configuración de la URL de redirección
  // Esto ayuda a que Google sepa exactamente a qué dirección de localhost volver
  const redirectUri = makeRedirectUri({
    scheme: 'itudy', // Asegúrate de que esto coincida con el "scheme" en tu app.json si tienes uno
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '947017986235-hjvh14vf1mnh04drpnpvapav5bh2oqh7.apps.googleusercontent.com',
    androidClientId: '947017986235-94u6n6mdkbsgvlg2kdkkqcphd4g46j6n.apps.googleusercontent.com',
    redirectUri: redirectUri, // <--- Añadimos esto explícitamente
    scopes: ['openid','profile', 'email'],
    responseType: 'id_token',
  });

  useEffect(() => {
    loadStorageData();
  }, []);

  const updateUserData = async (updates: Partial<User>) => {
    if (!user) return;

    // Creamos el nuevo objeto de usuario combinando el actual con los cambios
    const updatedUser = { ...user, ...updates };

    // A. Actualizamos el estado de React (para que la UI cambie ya)
    setUser(updatedUser);

    // B. Actualizamos la persistencia (para que al recargar se mantenga)
    try {
      await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error("Error guardando actualización de usuario", e);
    }
  };
  useEffect(() => {
    console.log("Respuesta de Google Auth:", response);
    if (response?.type === 'success') {
      // En el flujo moderno, a veces viene en authentication o params
      const { id_token } = response.params;
      const { authentication } = response;
      
      // Intentamos obtener el token de cualquiera de las dos formas
      const tokenToUse = id_token || authentication?.accessToken;
      console.log("entramos aqui con token:", tokenToUse);
      if (tokenToUse) {
        handleBackendLogin(tokenToUse);
      }
    } else if (response?.type === 'error') {
      console.error("Error Auth Session:", response.error);
      alert("Error al iniciar sesión con Google");
    }
  }, [response]);

  async function loadStorageData() {
    try {
      const jsonValue = await AsyncStorage.getItem('@user');
      if (jsonValue != null) setUser(JSON.parse(jsonValue));
    } catch (e) {
      console.error("Error cargando sesión", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBackendLogin(token: string) {
    try {
      // Ajuste de IP: localhost para Web, 10.0.2.2 para Android
      // NOTA: Asegúrate de que tu backend esté corriendo en el puerto 4518
      const apiUrl = Platform.OS === 'android' 
        ? 'http://10.0.2.2:4518' 
        : 'http://localhost:4518';

      console.log(`Enviando token a: ${apiUrl}/oauth/google/login`);

      const { data } = await axios.post(
        `${apiUrl}/oauth/google/login`, // 1. URL
        {},                             // 2. Body (lo dejamos vacío {} si ahora todo va en el header)
        {                               // 3. Configuración (Headers)
          headers: {
            Authorization: `${token}` 
          }
        }
      );
      
      // Adaptamos por si tu backend devuelve el usuario dentro de un objeto o directo
      const userData = data.user || data;
      
      if (!userData) throw new Error("No se recibieron datos del usuario");

      setUser(userData);
      await AsyncStorage.setItem('@user', JSON.stringify(userData));

    } catch (error) {
      console.error("Error en login backend:", error);
      // Mostramos el error específico si existe
      if (axios.isAxiosError(error) && error.response) {
        console.error("Detalle del error:", error.response.data);
      }
      alert("Error al conectar con el servidor. Revisa la consola.");
    }
  }

  const signIn = async () => {
    // Usamos opciones específicas para intentar evitar bloqueos
    await promptAsync({
      showInRecents: true,
      // En web, si esto sigue fallando, a veces ayuda no pasar windowFeatures
      // pero por ahora lo dejamos estándar.
    });
  };

  const signOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem('@user');
  };

  return (
    <AuthContext.Provider value={{ user,setUser,updateUserData, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};