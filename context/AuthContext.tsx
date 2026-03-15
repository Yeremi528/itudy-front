// context/AuthContext.tsx
import { URL_BASE } from '@/constants/URL';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Necesario para que el flujo web cierre correctamente la ventana de autenticación
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = '947017986235-hjvh14vf1mnh04drpnpvapav5bh2oqh7.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = '947017986235-okt104uig6sboi6330rqivb3ut67lnrb.apps.googleusercontent.com';
const IOS_CLINET_ID = '947017986235-q4l1k276dnidd7nqi2j0sd1cngd1jm3s.apps.googleusercontent.com'

type UserStats = {
  total_xp: number;
  streak_days: number;
  current_league: string;
  last_login_at?: string;
};

export type Achievement = {
  id: string;
  title: string;
  exam_name: string;
  earned_at: string;
};

export type EnrolledCourse = {
  id: string;
  name?: string;
  progress?: number;
  is_completed?: boolean;
  tech?: string;
  level?: string;
};

export type UserCoursesInfo = {
  active: string;
  list: EnrolledCourse[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  picture?: string;
  image_url?: string;
  token?: string;
  courses_info: UserCoursesInfo;
  country: string;
  native_language: string;
  created_at: string;
  stats: UserStats;
  achievements?: Achievement[];
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  setUser: (user:any) => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserData: (updates: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hook Web: Debe declararse en el nivel superior, sin importar la plataforma
  const redirectUri = makeRedirectUri({ scheme: 'itudy' });
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLINET_ID,
    redirectUri: redirectUri,
    scopes: ['openid', 'profile', 'email'],
    responseType: 'id_token',
  });

  useEffect(() => {
    // Configuración Nativa (Solo Android e iOS)
    if (Platform.OS !== 'web') {
      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID, // Siempre se usa el Web ID para obtener el idToken para el backend
        iosClientId: IOS_CLINET_ID, // Añadido soporte explícito para iOS
      });
    }
    loadStorageData();
  }, []);

  const updateUserData = async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    try {
      await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error("Error guardando actualización de usuario", e);
    }
  };

  // Efecto para procesar la respuesta de la Web
  useEffect(() => {
    if (Platform.OS === 'web' && response?.type === 'success') {
      console.log("Respuesta Web de Google Auth:", response);
      const idToken = response.params.id_token || response.authentication?.idToken || response.authentication?.accessToken;
      
      if (idToken) {
        handleBackendLogin(idToken);
      } else {
        console.error("Error Web: No se recibió ningún token de Google");
      }
    } else if (Platform.OS === 'web' && response?.type === 'error') {
      console.error("Error en Auth Session Web:", response.error);
      alert("Error al iniciar sesión con Google en la web.");
    }
    
    // Si la promesa web terminó, apagamos el loader
    if (response) {
      setIsLoading(false);
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
      setIsLoading(true);
      const apiUrl = Platform.OS === 'android' 
        ? `${URL_BASE}` 
        : `${URL_BASE}`;

      console.log(`Enviando token a: ${apiUrl}/oauth/google/login`);

      const { data } = await axios.post(
        `${apiUrl}/oauth/google/login`,
        {},
        {
          headers: {
            Authorization: `${token}` 
          }
        }
      );
      
      const userData = data.user || data;
      
      if (!userData) throw new Error("No se recibieron datos del usuario");

      setUser(userData);
      await AsyncStorage.setItem('@user', JSON.stringify(userData));

    } catch (error) {
      console.error("Error en login backend:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Detalle del error:", error.response.data);
      }
      alert("Error al conectar con el servidor. Revisa la consola.");
    } finally {
      setIsLoading(false);
    }
  }

  const signIn = async () => {
    setIsLoading(true);
    try {
      if (Platform.OS === 'web') {
        // FLUJO WEB
        await promptAsync();
        // El resto se maneja en el useEffect(..., [response])
      } else {
        // FLUJO NATIVO (Android / iOS)
        await GoogleSignin.hasPlayServices();
        await GoogleSignin.signIn();
        
        const tokens = await GoogleSignin.getTokens();
        
        if (tokens.idToken) {
          console.log("Token nativo obtenido, enviando a backend...");
          await handleBackendLogin(tokens.idToken);
        } else {
          throw new Error("No se recibió el idToken nativo de Google.");
        }
      }
    } catch (error) {
      console.error("Error en signIn:", error);
      setIsLoading(false); // Detenemos el loader en caso de error
      
      if (Platform.OS !== 'web' && isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            console.log("El usuario canceló el inicio de sesión");
            break;
          case statusCodes.IN_PROGRESS:
            console.log("El inicio de sesión ya está en progreso");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            alert("Los servicios de Google Play no están disponibles o están desactualizados.");
            break;
          default:
            alert("Error desconocido al iniciar sesión nativa con Google.");
        }
      }
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (Platform.OS !== 'web') {
        await GoogleSignin.signOut();
      }
      setUser(null);
      await AsyncStorage.removeItem('@user');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, updateUserData, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
