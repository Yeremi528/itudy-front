import {
  Camera,
  CheckCircle,
  ExternalLink,
  Flame,
  LogOut,
  Settings,
  Shield,
  User as UserIcon,
  X,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { URL_BASE } from '../../constants/URL';
import { Achievement, useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

type Certificate = {
  id: string;
  exam_name: string;
  language: string;
  level: string;
  validated_by: string;
  exam_started_at: string;
  approved_at: string;
  certificate_url: string;
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// ─── Subcomponents ────────────────────────────────────────────────────────────

const AchievementItem: React.FC<{ item: Achievement }> = ({ item }) => (
  <View style={styles.achievementCard}>
    <View style={styles.achievementIcon}>
      <CheckCircle color="#58CC02" size={22} />
    </View>
    <View style={styles.achievementInfo}>
      <Text style={styles.achievementTitle}>{item.title}</Text>
      <Text style={styles.achievementSub}>{item.exam_name}</Text>
    </View>
    <Text style={styles.achievementDate}>{formatDate(item.earned_at)}</Text>
  </View>
);

const CertificateItem: React.FC<{ cert: Certificate }> = ({ cert }) => (
  <TouchableOpacity
    style={styles.certCard}
    onPress={() => Linking.openURL(cert.certificate_url)}
    activeOpacity={0.7}
  >
    <View style={styles.certInfo}>
      <Text style={styles.certName} numberOfLines={1}>
        {cert.exam_name}
      </Text>
      <Text style={styles.certMeta}>
        {cert.language} · {cert.level}
      </Text>
      <Text style={styles.certDate}>Aprobado {formatDate(cert.approved_at)}</Text>
    </View>
    <ExternalLink color="#AFBFC9" size={18} />
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const ProfileScreen: React.FC = () => {
  const { user, signOut, updateUserData } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchCertificates();
    }
  }, [user?.id]);

  const fetchCertificates = async () => {
    if (!user?.id) return;
    setLoadingCerts(true);
    try {
      const { data } = await axios.get<Certificate[]>(
        `${URL_BASE}/certificates?userID=${user.id}`
      );
      setCertificates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al obtener certificados:', err);
    } finally {
      setLoadingCerts(false);
    }
  };

  const handlePickImage = async () => {
    setModalVisible(false);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería para cambiar la foto de perfil.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        name: `profile_${user?.id}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const { data } = await axios.put(
        `${URL_BASE}/user/image?userID=${user?.id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (data?.image_url) {
        await updateUserData({ image_url: data.image_url });
      }
    } catch (err) {
      console.error('Error al subir imagen:', err);
      Alert.alert('Error', 'No se pudo actualizar la foto de perfil. Intenta de nuevo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const performLogout = () => {
    setModalVisible(false);
    signOut();
  };

  const avatarUri = user?.image_url || user?.picture;
  const achievements = user?.achievements ?? [];

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{user?.name || 'Usuario'}</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Settings color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Avatar ─────────────────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={handlePickImage}
            disabled={uploadingImage}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarCircle} />
            ) : (
              <View style={[styles.avatarCircle, styles.avatarPlaceholder]}>
                <UserIcon color="#AFBFC9" size={44} />
              </View>
            )}
            <View style={styles.cameraOverlay}>
              {uploadingImage ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Camera color="#fff" size={14} />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.memberText}>
            {user?.created_at
              ? `Miembro desde ${formatDate(user.created_at)}`
              : ''}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* ── Resumen ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESUMEN</Text>
          <View style={styles.gridContainer}>
            <View style={styles.summaryCard}>
              <Flame color="#FF9600" size={24} fill="#FF9600" />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryValue}>
                  {user?.stats?.streak_days ?? 0} días
                </Text>
                <Text style={styles.summaryLabel}>Racha</Text>
              </View>
            </View>
            <View style={styles.summaryCard}>
              <Zap color="#FFD700" size={24} fill="#FFD700" />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryValue}>
                  {user?.stats?.total_xp ?? 0} EXP
                </Text>
                <Text style={styles.summaryLabel}>Total EXP</Text>
              </View>
            </View>
            <View style={styles.summaryCard}>
              <Shield color="#1CB0F6" size={24} fill="#1CB0F6" />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryValue}>
                  {user?.stats?.current_league || '-'}
                </Text>
                <Text style={styles.summaryLabel}>Liga actual</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Logros ─────────────────────────────────────────────── */}
        {achievements.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>LOGROS</Text>
              {achievements.map((a) => (
                <AchievementItem key={a.id} item={a} />
              ))}
            </View>
          </>
        )}

        {/* ── Certificados ───────────────────────────────────────── */}
        <View style={styles.divider} />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CERTIFICADOS</Text>

          {loadingCerts ? (
            <ActivityIndicator color="#58CC02" style={{ marginTop: 16 }} />
          ) : certificates.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Aún no tienes certificados.
              </Text>
              <Text style={styles.emptySubText}>
                Aprueba un examen para obtener el tuyo.
              </Text>
            </View>
          ) : (
            certificates.map((cert) => (
              <CertificateItem key={cert.id} cert={cert} />
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modal de configuración ──────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configuración</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#AFBFC9" size={24} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalOption} onPress={handlePickImage}>
              <UserIcon color="#fff" size={20} />
              <Text style={styles.modalOptionText}>Cambiar foto de perfil</Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity style={styles.modalOption} onPress={performLogout}>
              <LogOut color="#EF4444" size={20} />
              <Text style={[styles.modalOptionText, { color: '#EF4444' }]}>
                Cerrar Sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131F24',
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
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

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  avatarWrapper: {
    position: 'relative',
    width: 110,
    height: 110,
  },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#37464F',
  },
  avatarPlaceholder: {
    backgroundColor: '#1E2D35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#58CC02',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#131F24',
  },
  memberText: {
    color: '#AFBFC9',
    fontSize: 12,
    marginTop: 12,
    fontWeight: '600',
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#37464F',
    marginHorizontal: 20,
    marginVertical: 4,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    color: '#AFBFC9',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 16,
  },

  // Stats grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    width: (width - 52) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#37464F',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#1A2830',
  },
  summaryTextContainer: {
    marginLeft: 10,
  },
  summaryValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  summaryLabel: {
    color: '#AFBFC9',
    fontSize: 11,
    marginTop: 2,
  },

  // Achievements
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2830',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#37464F',
    padding: 14,
    marginBottom: 10,
  },
  achievementIcon: {
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  achievementSub: {
    color: '#AFBFC9',
    fontSize: 12,
    marginTop: 2,
  },
  achievementDate: {
    color: '#58CC02',
    fontSize: 11,
    fontWeight: '600',
  },

  // Certificates
  certCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2830',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#37464F',
    padding: 14,
    marginBottom: 10,
  },
  certInfo: {
    flex: 1,
    marginRight: 10,
  },
  certName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  certMeta: {
    color: '#1CB0F6',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  certDate: {
    color: '#AFBFC9',
    fontSize: 11,
    marginTop: 3,
  },

  // Empty state
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#1A2830',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#37464F',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptySubText: {
    color: '#AFBFC9',
    fontSize: 12,
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A2830',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#37464F',
    padding: 24,
    minHeight: 220,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  modalOptionText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 14,
    fontWeight: '500',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#37464F',
  },
});

export default ProfileScreen;
