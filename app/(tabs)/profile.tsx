import { Flame, LogOut, Settings, Shield, User as UserIcon, X, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();

  const [modalVisible, setModalVisible] = useState(false); // Estado para el menú de configuración

  // Lógica de Cerrar Sesión
  const performLogout = () => {
    // 1. Ocultamos el modal primero
    setModalVisible(false);
    signOut();
  
  };

 

  return (
    <SafeAreaView style={styles.container}>
      
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{user?.name || 'Usuario'}</Text>
        
        {/* Al presionar el engranaje, abrimos el Modal */}
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Settings color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image 
                source={{ uri: "https://nupec.com/wp-content/uploads/2020/07/Captura-de-pantalla-2020-07-24-a-las-17.33.44.png" }} 
                style={styles.avatarCircle} 
            />
          </View>
          <Text style={styles.joinedText}>{user?.created_at}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>RESUMEN</Text>
          <View style={styles.gridContainer}>
            <View style={styles.summaryCard}>
              <Flame color="#FF9600" size={24} fill="#FF9600" />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryValue}>{user?.stats?.streak_days || 0} días</Text>
                <Text style={styles.summaryLabel}>Racha</Text>
              </View>
            </View>
            <View style={styles.summaryCard}>
              <Zap color="#FFD700" size={24} fill="#FFD700" />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryValue}>{user?.stats?.total_xp || 0} EXP</Text>
                <Text style={styles.summaryLabel}>Total de EXP</Text>
              </View>
            </View>
            <View style={styles.summaryCard}>
              <Shield color="#1CB0F6" size={24} fill="#1CB0F6" />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryValue}>{user?.stats?.current_league || '-'}</Text>
                <Text style={styles.summaryLabel}>Liga actual</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* --- MODAL DE CONFIGURACIÓN --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Para cerrar con botón atrás de Android
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Cabecera del Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configuración</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#AFBFC9" size={24} />
              </TouchableOpacity>
            </View>

            {/* Opción 1: Editar Perfil (Ejemplo visual) */}
            <TouchableOpacity style={styles.modalOption}>
                <UserIcon color="#fff" size={20} />
                <Text style={styles.modalOptionText}>Editar Perfil</Text>
            </TouchableOpacity>

            {/* Separador sutil */}
            <View style={styles.modalDivider} />

            {/* Opción 2: Cerrar Sesión */}
            <TouchableOpacity style={styles.modalOption} onPress={performLogout}>
                <LogOut color="#EF4444" size={20} />
                <Text style={[styles.modalOptionText, { color: '#EF4444' }]}>Cerrar Sesión</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131F24',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#AFBFC9',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#37464F',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#37464F',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#58CC02',
  },
  joinedText: {
    color: '#AFBFC9',
    fontSize: 12,
    marginTop: 15,
    fontWeight: 'bold',
  },
  divider: {
    height: 2,
    backgroundColor: '#37464F',
    marginHorizontal: 20,
    marginVertical: 30, // Ajustado para dar aire arriba y abajo
  },
  summarySection: {
    padding: 20,
    paddingTop: 0, // Quitamos padding top porque el divider ya da espacio
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  summaryCard: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#37464F',
    borderRadius: 15,
    padding: 12,
  },
  summaryTextContainer: {
    marginLeft: 10,
  },
  summaryValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  summaryLabel: {
    color: '#AFBFC9',
    fontSize: 12,
  },
  // 5. NUEVOS ESTILOS PARA EL BOTÓN
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#37464F',
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Un fondo rojo muy sutil
    marginBottom: 40, // Espacio al final del scroll
  },
  logoutText: {
    color: '#EF4444', // Rojo alerta
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo semitransparente oscuro
    justifyContent: 'flex-end', // Alineado al fondo (tipo Bottom Sheet)
  },
  modalContent: {
    backgroundColor: '#131F24',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#37464F',
    padding: 20,
    minHeight: 250,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  modalOptionText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '600',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#37464F',
    marginVertical: 5,
  }
});

export default ProfileScreen;