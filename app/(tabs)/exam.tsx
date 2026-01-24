import {
    Award,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    Share2,
    Video
} from 'lucide-react-native';
import React from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// --- MOCK DATA: Próximas sesiones ---
const UPCOMING_SESSIONS = [
  {
    id: '1',
    course: 'Golang Backend',
    date: 'Hoy, 12 Ene',
    time: '15:30',
    status: 'soon', // soon, future
    meeting_link: 'https://zoom.us/...'
  },
  {
    id: '2',
    course: 'Docker & Kubernetes',
    date: 'Jue, 15 Ene',
    time: '10:00',
    status: 'future',
    meeting_link: 'https://zoom.us/...'
  }
];

// --- MOCK DATA: Certificados ya ganados ---
const MY_CERTIFICATES = [
  {
    id: 'cert_001',
    course: 'Fundamentos de React',
    issueDate: '20 Dic 2025',
    grade: '98%',
    level: 'Intermedio'
  },
  {
    id: 'cert_002',
    course: 'Diseño UI/UX Móvil',
    issueDate: '15 Nov 2025',
    grade: '100%',
    level: 'Avanzado'
  }
];

const MyAchievementsScreen: React.FC = () => {

  const handleJoinCall = (session: any) => {
    Alert.alert("Abriendo Zoom...", `Conectando a la sesión de ${session.course}`);
    // Aquí usarías Linking.openURL(session.meeting_link)
  };

  const handleDownload = (certName: string) => {
    Alert.alert("Descargando PDF", `Tu certificado de ${certName} se está guardando.`);
  };

  const handleShare = async (certName: string) => {
    try {
      await Share.share({
        message: `¡Acabo de certificarme en ${certName} con una nota perfecta! 🚀`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Logros</Text>
        {/* Un pequeño contador de certificados */}
        <View style={styles.badgeCount}>
           <Award size={16} color="#FFD700" />
           <Text style={styles.badgeCountText}>{MY_CERTIFICATES.length}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* --- SECCIÓN 1: AGENDA (Evaluaciones) --- */}
        <View style={styles.sectionHeader}>
            <Calendar color="#1CB0F6" size={20} />
            <Text style={styles.sectionTitle}>Próximas Evaluaciones</Text>
        </View>

        {UPCOMING_SESSIONS.length > 0 ? (
          UPCOMING_SESSIONS.map((session) => (
            <View key={session.id} style={styles.ticketCard}>
                {/* Banda lateral de color según estado */}
                <View style={[
                    styles.ticketStripe, 
                    session.status === 'soon' ? { backgroundColor: '#FF9600' } : { backgroundColor: '#37464F' }
                ]} />
                
                <View style={styles.ticketContent}>
                    <View style={styles.ticketTop}>
                        <Text style={styles.courseName}>{session.course}</Text>
                        {session.status === 'soon' && (
                            <View style={styles.liveTag}>
                                <Text style={styles.liveText}>HOY</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.ticketDetails}>
                        <View style={styles.detailRow}>
                            <Calendar size={14} color="#AFBFC9" />
                            <Text style={styles.detailText}>{session.date}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Clock size={14} color="#AFBFC9" />
                            <Text style={styles.detailText}>{session.time} hrs</Text>
                        </View>
                    </View>

                    {/* Botón de Acción */}
                    <TouchableOpacity 
                        style={[
                            styles.joinButton, 
                            session.status === 'future' && styles.disabledButton
                        ]}
                        onPress={() => handleJoinCall(session)}
                        disabled={session.status === 'future'}
                    >
                        <Video size={18} color="#fff" style={{marginRight:8}} />
                        <Text style={styles.joinButtonText}>
                            {session.status === 'soon' ? 'UNIRSE AHORA' : 'PENDIENTE'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
          ))
        ) : (
             <Text style={styles.emptyText}>No tienes evaluaciones agendadas.</Text>
        )}

        <View style={styles.divider} />

        {/* --- SECCIÓN 2: PORTAFOLIO (Certificados) --- */}
        <View style={styles.sectionHeader}>
            <Award color="#FFD700" size={20} />
            <Text style={styles.sectionTitle}>Certificados Obtenidos</Text>
        </View>

        <View style={styles.certificatesGrid}>
            {MY_CERTIFICATES.map((cert) => (
                <View key={cert.id} style={styles.certCard}>
                    {/* Icono decorativo de fondo */}
                    <Award size={80} color="rgba(255, 215, 0, 0.05)" style={styles.bgIcon} />

                    <View style={styles.certHeader}>
                        <CheckCircle size={18} color="#58CC02" />
                        <Text style={styles.certDate}>{cert.issueDate}</Text>
                    </View>

                    <Text style={styles.certTitle}>{cert.course}</Text>
                    
                    <View style={styles.certStats}>
                        <View style={styles.gradeBadge}>
                            <Text style={styles.gradeText}>NOTA: {cert.grade}</Text>
                        </View>
                        <Text style={styles.levelText}>{cert.level}</Text>
                    </View>

                    <View style={styles.certFooter}>
                         <TouchableOpacity 
                            style={styles.iconBtn}
                            onPress={() => handleDownload(cert.course)}
                         >
                             <Download size={20} color="#AFBFC9" />
                         </TouchableOpacity>
                         
                         <View style={styles.verticalLine} />

                         <TouchableOpacity 
                            style={styles.iconBtn}
                            onPress={() => handleShare(cert.course)}
                         >
                             <Share2 size={20} color="#1CB0F6" />
                             <Text style={styles.shareText}>Compartir</Text>
                         </TouchableOpacity>
                    </View>
                </View>
            ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131F24',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#37464F',
    marginHorizontal: 20,
    marginTop: 10
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  badgeCount: {
    flexDirection: 'row',
    backgroundColor: '#202F36',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#37464F'
  },
  badgeCountText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  divider: {
    height: 2,
    backgroundColor: '#37464F',
    marginVertical: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#AFBFC9',
    fontStyle: 'italic',
    marginLeft: 10
  },

  // --- TICKET STYLES (Agenda) ---
  ticketCard: {
    flexDirection: 'row',
    backgroundColor: '#15262F',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#37464F',
  },
  ticketStripe: {
    width: 6,
    height: '100%',
  },
  ticketContent: {
    flex: 1,
    padding: 15,
  },
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  courseName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  liveTag: {
    backgroundColor: '#FF9600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ticketDetails: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    color: '#AFBFC9',
    fontSize: 13,
  },
  joinButton: {
    backgroundColor: '#1CB0F6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderBottomWidth: 4,
    borderBottomColor: '#1899D6',
  },
  disabledButton: {
    backgroundColor: '#202F36',
    borderBottomColor: '#15262F',
    borderWidth: 1,
    borderColor: '#37464F'
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // --- CERTIFICATE STYLES (Portafolio) ---
  certificatesGrid: {
    gap: 15,
  },
  certCard: {
    backgroundColor: '#15262F',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFD700', // Borde Dorado
    position: 'relative',
    overflow: 'hidden',
  },
  bgIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.5
  },
  certHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  certDate: {
    color: '#AFBFC9',
    fontSize: 12,
  },
  certTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    width: '90%'
  },
  certStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  gradeBadge: {
    backgroundColor: 'rgba(88, 204, 2, 0.2)', // Verde transparente
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeText: {
    color: '#58CC02',
    fontWeight: 'bold',
    fontSize: 12,
  },
  levelText: {
    color: '#AFBFC9',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: 'bold'
  },
  certFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#37464F',
    paddingTop: 15,
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  shareText: {
    color: '#1CB0F6',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  verticalLine: {
    width: 1,
    height: 20,
    backgroundColor: '#37464F',
    marginHorizontal: 15,
  }
});

export default MyAchievementsScreen;