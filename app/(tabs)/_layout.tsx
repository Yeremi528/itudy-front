import { Tabs } from 'expo-router';
import { Award, ClipboardCheck, Terminal, User } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';



export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Ocultamos el header por defecto para usar el nuestro personalizado
        tabBarStyle: {
          backgroundColor: '#0f172a', // Slate 900
          borderTopColor: '#1e293b',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#22d3ee', // Cyan 400
        tabBarInactiveTintColor: '#64748b', // Slate 500
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Aprender',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
              <Terminal color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="certificate"
        options={{
          title: 'Certificar', // Sugiero este título corto
          tabBarIcon: ({ color, size }) => <Award color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="exam"
        options={{
          title: 'Mis Logros', // Diferenciar el título ayuda mucho a la UX
          tabBarIcon: ({ color, size }) => <ClipboardCheck color={color} size={size} />,
        }}
      />

      {/* <Tabs.Screen
        name="subscription" // Necesitarás crear profile.tsx
        options={{
          title: 'subscripción',
          tabBarIcon: ({ color, size }) => <Crown color={color} size={size} />,
        }}
      /> */}


      <Tabs.Screen
        name="profile" // Necesitarás crear profile.tsx
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      
    </Tabs>
  );
}