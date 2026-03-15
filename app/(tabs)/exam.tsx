import { URL_BASE } from '@/constants/URL';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import {
  Award,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Flame,
  Share2,
  Star,
  Trophy,
  Video,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

type Assignment = {
  id?: string;
  date?: string;
  fecha_asignacion?: string;
  state?: string;
  estado?: string;
  exam_name?: string;
  meeting_link?: string;
};

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatAssignmentDate = (isoString: string) => {
  const date = new Date(isoString);
  const day = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(date);
  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return { day: day.charAt(0).toUpperCase() + day.slice(1), time };
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isToday = (isoString?: string) => {
  if (!isoString) return false;
  const d = new Date(isoString);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
};

const capitalize = (str: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : str;

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionLabel: React.FC<{
  color: string;
  icon: React.ReactNode;
  title: string;
  count?: number;
}> = ({ color, icon, title, count }) => (
  <View style={styles.sectionLabel}>
    <View style={[styles.sectionLabelBar, { backgroundColor: color }]} />
    <View style={styles.sectionLabelInner}>
      {icon}
      <Text style={styles.sectionLabelText}>{title}</Text>
    </View>
    {count !== undefined && (
      <View style={[styles.sectionCount, { borderColor: color + '44' }]}>
        <Text style={[styles.sectionCountText, { color }]}>{count}</Text>
      </View>
    )}
  </View>
);

const EmptyState: React.FC<{ icon: React.ReactNode; message: string; sub: string }> = ({
  icon,
  message,
  sub,
}) => (
  <View style={styles.emptyBox}>
    <View style={styles.emptyIcon}>{icon}</View>
    <Text style={styles.emptyText}>{message}</Text>
    <Text style={styles.emptySub}>{sub}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const MyAchievementsScreen: React.FC = () => {
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const achievements = user?.achievements ?? [];
  const totalCount = achievements.length + certificates.length;

  useEffect(() => {
    if (user?.id) fetchAll();
  }, [user?.id]);

  const fetchAll = async () => {
    await Promise.all([fetchAssignments(), fetchCertificates()]);
  };

  const fetchAssignments = async () => {
    if (!user?.id) return;
    setLoadingAssignments(true);
    try {
      const { data } = await axios.get<Assignment[]>(`${URL_BASE}/assignments?userID=${user.id}`);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error asignaciones:', err);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchCertificates = async () => {
    if (!user?.id) return;
    setLoadingCerts(true);
    try {
      const { data } = await axios.get<Certificate[]>(
        `${URL_BASE}/certificates?userID=${user.id}`
      );
      setCertificates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error certificados:', err);
    } finally {
      setLoadingCerts(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const handleJoinCall = (session: Assignment) => {
    if (session.meeting_link) {
      Linking.openURL(session.meeting_link).catch(() =>
        Alert.alert('Error', 'No se pudo abrir el enlace.')
      );
    } else {
      Alert.alert('Próximamente', 'El enlace estará disponible antes de la sesión.');
    }
  };

  const handleOpenCertificate = (cert: Certificate) => {
    Linking.openURL(cert.certificate_url).catch(() =>
      Alert.alert('Error', 'No se pudo abrir el certificado.')
    );
  };

  const handleShareCertificate = async (cert: Certificate) => {
    try {
      await Share.share({
        message: `¡Obtuve mi certificado en ${cert.exam_name} con Itudy! 🚀\n${cert.certificate_url}`,
        url: cert.certificate_url,
      });
    } catch (err) {
      console.error('Error compartir:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mis Logros</Text>
          <Text style={styles.headerSub}>Tu progreso en Itudy</Text>
        </View>
        <View style={styles.headerBadge}>
          <Award size={18} color="#FFD700" fill="rgba(255,215,0,0.2)" />
          <Text style={styles.headerBadgeText}>{totalCount}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#58CC02" />
        }
      >

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          {/* Racha */}
          <View style={[styles.statCard, styles.statCardOrange]}>
            <View style={[styles.statIconRing, { borderColor: 'rgba(255,150,0,0.35)' }]}>
              <Flame color="#FF9600" size={22} fill="#FF9600" />
            </View>
            <Text style={styles.statNumber}>{user?.stats?.streak_days ?? 0}</Text>
            <Text style={styles.statName}>Racha</Text>
            <Text style={styles.statUnit}>días</Text>
          </View>

          {/* EXP */}
          <View style={[styles.statCard, styles.statCardYellow]}>
            <View style={[styles.statIconRing, { borderColor: 'rgba(255,215,0,0.35)' }]}>
              <Zap color="#FFD700" size={22} fill="#FFD700" />
            </View>
            <Text style={styles.statNumber}>{user?.stats?.total_xp ?? 0}</Text>
            <Text style={styles.statName}>Experiencia</Text>
            <Text style={styles.statUnit}>EXP</Text>
          </View>

          {/* Certs */}
          <View style={[styles.statCard, styles.statCardBlue]}>
            <View style={[styles.statIconRing, { borderColor: 'rgba(28,176,246,0.35)' }]}>
              <Trophy color="#1CB0F6" size={20} />
            </View>
            <Text style={styles.statNumber}>{certificates.length}</Text>
            <Text style={styles.statName}>Certificados</Text>
          </View>

          {/* Logros */}
          <View style={[styles.statCard, styles.statCardGreen]}>
            <View style={[styles.statIconRing, { borderColor: 'rgba(88,204,2,0.35)' }]}>
              <Star color="#58CC02" size={20} fill="rgba(88,204,2,0.3)" />
            </View>
            <Text style={styles.statNumber}>{achievements.length}</Text>
            <Text style={styles.statName}>Logros</Text>
          </View>
        </View>

        {/* ── Evaluaciones ──────────────────────────────────────────── */}
        <SectionLabel
          color="#1CB0F6"
          icon={<Calendar color="#1CB0F6" size={18} />}
          title="Próximas Evaluaciones"
          count={assignments.length}
        />

        {loadingAssignments ? (
          <ActivityIndicator color="#1CB0F6" style={styles.loader} />
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={<Calendar color="#37464F" size={28} />}
            message="Sin evaluaciones agendadas"
            sub="Agenda una en la pestaña Certificar"
          />
        ) : (
          assignments.map((session, index) => {
            const rawDate = session.date || session.fecha_asignacion || '';
            const { day, time } = rawDate
              ? formatAssignmentDate(rawDate)
              : { day: '-', time: '-' };
            const soon = isToday(rawDate);
            const examName = session.exam_name || 'Evaluación Técnica';
            const status = session.state || session.estado || 'Pendiente';

            return (
              <View
                key={session.id ?? index}
                style={[styles.ticketCard, soon && styles.ticketCardSoon]}
              >
                {/* Borde izquierdo de color */}
                <View style={[styles.ticketStripe, { backgroundColor: soon ? '#FF9600' : '#1CB0F6' }]} />

                <View style={styles.ticketBody}>
                  {/* Fila superior */}
                  <View style={styles.ticketRow}>
                    <Text style={styles.ticketTitle} numberOfLines={1}>{examName}</Text>
                    {soon ? (
                      <View style={styles.tagHoy}>
                        <View style={styles.tagHoyDot} />
                        <Text style={styles.tagHoyText}>HOY</Text>
                      </View>
                    ) : (
                      <View style={styles.tagPending}>
                        <Text style={styles.tagPendingText}>{capitalize(status)}</Text>
                      </View>
                    )}
                  </View>

                  {/* Fecha y hora */}
                  <View style={styles.ticketMeta}>
                    <View style={styles.ticketMetaItem}>
                      <Calendar size={13} color="#1CB0F6" />
                      <Text style={styles.ticketMetaText}>{day}</Text>
                    </View>
                    <View style={styles.ticketMetaDot} />
                    <View style={styles.ticketMetaItem}>
                      <Clock size={13} color="#1CB0F6" />
                      <Text style={styles.ticketMetaText}>{time} hrs</Text>
                    </View>
                  </View>

                  {/* Botón */}
                  <TouchableOpacity
                    style={[styles.joinBtn, !soon && styles.joinBtnDisabled]}
                    onPress={() => handleJoinCall(session)}
                    disabled={!soon}
                    activeOpacity={0.8}
                  >
                    <Video size={15} color={soon ? '#fff' : '#64748B'} />
                    <Text style={[styles.joinBtnText, !soon && styles.joinBtnTextDisabled]}>
                      {soon ? 'UNIRSE AHORA' : 'ESPERANDO ENLACE'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={styles.divider} />

        {/* ── Logros ────────────────────────────────────────────────── */}
        <SectionLabel
          color="#58CC02"
          icon={<Star color="#58CC02" size={18} fill="rgba(88,204,2,0.2)" />}
          title="Logros"
          count={achievements.length}
        />

        {achievements.length === 0 ? (
          <EmptyState
            icon={<Star color="#37464F" size={28} />}
            message="Aún no tienes logros"
            sub="Completa exámenes para desbloquearlos"
          />
        ) : (
          achievements.map((a, index) => (
            <View key={a.id} style={styles.achieveCard}>
              {/* Número del logro */}
              <View style={styles.achieveRank}>
                <Text style={styles.achieveRankText}>#{index + 1}</Text>
              </View>

              {/* Ícono principal */}
              <View style={styles.achieveIconWrap}>
                <View style={styles.achieveIconRing}>
                  <CheckCircle color="#58CC02" size={26} fill="rgba(88,204,2,0.15)" />
                </View>
              </View>

              {/* Contenido */}
              <View style={styles.achieveContent}>
                <Text style={styles.achieveTitle}>{a.title}</Text>
                <Text style={styles.achieveExam} numberOfLines={1}>{a.exam_name}</Text>
                <View style={styles.achieveFooter}>
                  <View style={styles.achieveCompletedBadge}>
                    <Text style={styles.achieveCompletedText}>COMPLETADO</Text>
                  </View>
                  <Text style={styles.achieveDate}>{formatDate(a.earned_at)}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={styles.divider} />

        {/* ── Certificados ──────────────────────────────────────────── */}
        <SectionLabel
          color="#CBA135"
          icon={<Award color="#FFD700" size={18} />}
          title="Certificados"
          count={certificates.length}
        />

        {loadingCerts ? (
          <ActivityIndicator color="#FFD700" style={styles.loader} />
        ) : certificates.length === 0 ? (
          <EmptyState
            icon={<Award color="#37464F" size={28} />}
            message="Aún no tienes certificados"
            sub="Aprueba una evaluación para obtener el tuyo"
          />
        ) : (
          certificates.map((cert) => (
            <View key={cert.id} style={styles.certCard}>

              {/* Franja dorada superior */}
              <View style={styles.certTopStripe} />

              {/* Marca de agua */}
              <Award
                size={120}
                color="rgba(203,161,53,0.06)"
                style={styles.certWatermark}
              />

              {/* Cabecera de la card */}
              <View style={styles.certCardHeader}>
                <View style={styles.certBadge}>
                  <Award size={14} color="#CBA135" />
                  <Text style={styles.certBadgeText}>CERTIFICADO</Text>
                </View>
                <View style={styles.certApprovedRow}>
                  <CheckCircle size={13} color="#58CC02" />
                  <Text style={styles.certApprovedText}>{formatDate(cert.approved_at)}</Text>
                </View>
              </View>

              {/* Nombre del examen */}
              <Text style={styles.certTitle} numberOfLines={2}>{cert.exam_name}</Text>

              {/* Chips de metadata */}
              <View style={styles.certChips}>
                <View style={[styles.chip, styles.chipBlue]}>
                  <Text style={[styles.chipText, styles.chipTextBlue]}>
                    {capitalize(cert.language)}
                  </Text>
                </View>
                <View style={[styles.chip, styles.chipGreen]}>
                  <Text style={[styles.chipText, styles.chipTextGreen]}>
                    {capitalize(cert.level)}
                  </Text>
                </View>
              </View>

              {/* Validador */}
              <View style={styles.certValidatorRow}>
                <View style={styles.certValidatorLine} />
                <Text style={styles.certValidatorText}>
                  Validado por <Text style={styles.certValidatorName}>{cert.validated_by}</Text>
                </Text>
                <View style={styles.certValidatorLine} />
              </View>

              {/* Footer con acciones */}
              <View style={styles.certActions}>
                <TouchableOpacity
                  style={styles.certBtnPrimary}
                  onPress={() => handleOpenCertificate(cert)}
                  activeOpacity={0.8}
                >
                  <ExternalLink size={15} color="#fff" />
                  <Text style={styles.certBtnPrimaryText}>Ver Certificado</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.certBtnSecondary}
                  onPress={() => handleShareCertificate(cert)}
                  activeOpacity={0.8}
                >
                  <Share2 size={15} color="#CBA135" />
                </TouchableOpacity>
              </View>

            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1B22',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
  },

  // ── Header ──────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2F38',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSub: {
    color: '#4D6470',
    fontSize: 13,
    marginTop: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBadgeText: {
    color: '#FFD700',
    fontWeight: '800',
    fontSize: 15,
  },

  // ── Stats ────────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  statCardOrange: {
    backgroundColor: 'rgba(255,150,0,0.07)',
    borderColor: 'rgba(255,150,0,0.2)',
  },
  statCardYellow: {
    backgroundColor: 'rgba(255,215,0,0.07)',
    borderColor: 'rgba(255,215,0,0.2)',
  },
  statCardBlue: {
    backgroundColor: 'rgba(28,176,246,0.07)',
    borderColor: 'rgba(28,176,246,0.2)',
  },
  statCardGreen: {
    backgroundColor: 'rgba(88,204,2,0.07)',
    borderColor: 'rgba(88,204,2,0.2)',
  },
  statIconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  statNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  statName: {
    color: '#7A9BAB',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  statUnit: {
    color: '#4D6470',
    fontSize: 9,
    fontWeight: '500',
  },

  // ── Section label ────────────────────────────────────────────────
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  sectionLabelBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sectionLabelInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  sectionLabelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Divider ──────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: '#1E2F38',
    marginVertical: 24,
  },

  // ── Loader ───────────────────────────────────────────────────────
  loader: {
    marginVertical: 20,
  },

  // ── Empty state ──────────────────────────────────────────────────
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: '#141F26',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E2F38',
    borderStyle: 'dashed',
    marginBottom: 4,
  },
  emptyIcon: {
    opacity: 0.5,
    marginBottom: 10,
  },
  emptyText: {
    color: '#7A9BAB',
    fontSize: 14,
    fontWeight: '600',
  },
  emptySub: {
    color: '#4D6470',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },

  // ── Ticket (evaluaciones) ────────────────────────────────────────
  ticketCard: {
    flexDirection: 'row',
    backgroundColor: '#141F26',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E2F38',
  },
  ticketCardSoon: {
    borderColor: 'rgba(255,150,0,0.35)',
    backgroundColor: 'rgba(255,150,0,0.04)',
  },
  ticketStripe: {
    width: 4,
  },
  ticketBody: {
    flex: 1,
    padding: 14,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  tagHoy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,150,0,0.2)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,150,0,0.4)',
  },
  tagHoyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF9600',
  },
  tagHoyText: {
    color: '#FF9600',
    fontSize: 10,
    fontWeight: '800',
  },
  tagPending: {
    backgroundColor: '#1E2F38',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagPendingText: {
    color: '#7A9BAB',
    fontSize: 10,
    fontWeight: '700',
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  ticketMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ticketMetaText: {
    color: '#7A9BAB',
    fontSize: 12,
  },
  ticketMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#37464F',
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1CB0F6',
    paddingVertical: 10,
    borderRadius: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#1399D5',
  },
  joinBtnDisabled: {
    backgroundColor: '#1A2830',
    borderBottomColor: '#141F26',
    borderWidth: 1,
    borderColor: '#1E2F38',
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  joinBtnTextDisabled: {
    color: '#4D6470',
  },

  // ── Achievements ─────────────────────────────────────────────────
  achieveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(88,204,2,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(88,204,2,0.18)',
    borderLeftWidth: 3,
    borderLeftColor: '#58CC02',
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  achieveRank: {
    width: 28,
    alignItems: 'center',
  },
  achieveRankText: {
    color: '#4D6470',
    fontSize: 11,
    fontWeight: '700',
  },
  achieveIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  achieveIconRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(88,204,2,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(88,204,2,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achieveContent: {
    flex: 1,
  },
  achieveTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  achieveExam: {
    color: '#7A9BAB',
    fontSize: 12,
    marginBottom: 8,
  },
  achieveFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  achieveCompletedBadge: {
    backgroundColor: 'rgba(88,204,2,0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  achieveCompletedText: {
    color: '#58CC02',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  achieveDate: {
    color: '#4D6470',
    fontSize: 11,
  },

  // ── Certificate card ──────────────────────────────────────────────
  certCard: {
    backgroundColor: '#141F26',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(203,161,53,0.35)',
    overflow: 'hidden',
    position: 'relative',
  },
  certTopStripe: {
    height: 4,
    backgroundColor: '#CBA135',
  },
  certWatermark: {
    position: 'absolute',
    right: -20,
    bottom: -10,
  },
  certCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(203,161,53,0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(203,161,53,0.25)',
  },
  certBadgeText: {
    color: '#CBA135',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  certApprovedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  certApprovedText: {
    color: '#58CC02',
    fontSize: 11,
    fontWeight: '600',
  },
  certTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    paddingHorizontal: 18,
    marginBottom: 12,
    lineHeight: 26,
    width: '80%',
  },
  certChips: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipBlue: {
    backgroundColor: 'rgba(28,176,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(28,176,246,0.25)',
  },
  chipGreen: {
    backgroundColor: 'rgba(88,204,2,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(88,204,2,0.25)',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextBlue: {
    color: '#1CB0F6',
  },
  chipTextGreen: {
    color: '#58CC02',
  },
  certValidatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  certValidatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#1E2F38',
  },
  certValidatorText: {
    color: '#4D6470',
    fontSize: 11,
    textAlign: 'center',
  },
  certValidatorName: {
    color: '#7A9BAB',
    fontWeight: '600',
  },
  certActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  certBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#CBA135',
    paddingVertical: 11,
    borderRadius: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#9A7A28',
  },
  certBtnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  certBtnSecondary: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(203,161,53,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(203,161,53,0.3)',
  },
});

export default MyAchievementsScreen;
