import { URL_BASE } from '@/constants/URL';
import { EnrolledCourse, useAuth } from '@/context/AuthContext';
import axios from 'axios';
import {
  Award,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Lock,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

type TimeSlot = { time: string; workerID: string };

type DateGroup = {
  id: string;       // "2026-02-11"
  day: string;      // "MAR"
  date: string;     // "11"
  fullDate: string; // "Martes, 11 de febrero"
  slots: TimeSlot[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Transforma el array plano de slots del backend en grupos por día. */
const processApiData = (items: any[]): DateGroup[] => {
  const groups: Record<string, DateGroup> = {};

  items.forEach((item) => {
    const rawDate = item.fecha_asignacion || item.date;
    const dateObj = new Date(rawDate);
    const dateKey = dateObj.toISOString().split('T')[0];

    if (!groups[dateKey]) {
      const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'short' })
        .format(dateObj)
        .toUpperCase()
        .replace('.', '');
      const dayNum = new Intl.DateTimeFormat('es-ES', { day: 'numeric' }).format(dateObj);
      const fullDateStr = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(dateObj);

      groups[dateKey] = {
        id: dateKey,
        day: dayName,
        date: dayNum,
        fullDate: fullDateStr.charAt(0).toUpperCase() + fullDateStr.slice(1),
        slots: [],
      };
    }

    const timeStr = dateObj.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // Guardamos el workerID por cada slot individual
    if (!groups[dateKey].slots.find((s) => s.time === timeStr)) {
      groups[dateKey].slots.push({
        time: timeStr,
        workerID: item.workerID || item.worker_id || '',
      });
    }
  });

  return Object.values(groups).sort(
    (a, b) => new Date(a.id).getTime() - new Date(b.id).getTime()
  );
};

const formatAssignmentDate = (isoString: string) => {
  const date = new Date(isoString);
  const day = new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
    .format(date)
    .toUpperCase();
  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return { day, time };
};

const progressColor = (p: number) => {
  if (p >= 80) return '#58CC02';
  if (p >= 60) return '#1CB0F6';
  return '#37464F';
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const CertificatesScreen: React.FC = () => {
  const { user } = useAuth();

  const [selectedCourse, setSelectedCourse] = useState<EnrolledCourse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [availableDates, setAvailableDates] = useState<DateGroup[]>([]);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Cursos del usuario: con tech+level se habilita la certificación
  const allCourses: EnrolledCourse[] = user?.courses_info?.list ?? [];
  const eligibleCourses = allCourses.filter((c) => (c.progress ?? 0) > 60);
  const lockedCourses = allCourses.filter((c) => (c.progress ?? 0) <= 60);

  useEffect(() => {
    fetchMyAssignments();
  }, [user]);

  const fetchMyAssignments = async () => {
    if (!user?.id) return;
    try {
      const { data } = await axios.get(`${URL_BASE}/assignments?userID=${user.id}`);
      setMyAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyAssignments();
    setRefreshing(false);
  };

  const handleScheduleEvaluation = async () => {
    if (!selectedCourse) return;

    if (!selectedCourse.tech || !selectedCourse.level) {
      Alert.alert(
        'Datos incompletos',
        'Este curso no tiene tecnología o nivel asignado. Contacta soporte.'
      );
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(
        `${URL_BASE}/assignments/availables?tech=${selectedCourse.tech.toLowerCase()}&level=${selectedCourse.level.toLowerCase()}`
      );
      const formattedData = processApiData(data);
      setAvailableDates(formattedData);

      if (formattedData.length > 0) {
        setSelectedDateId(formattedData[0].id);
        setSelectedSlot(null);
        setModalVisible(true);
      } else {
        Alert.alert('Sin horarios', 'No hay horarios disponibles para esta tecnología.');
      }
    } catch (error) {
      console.error('Error fetching availables:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !selectedDateId || !selectedCourse) return;

    // Combinar fecha + hora en un ISO datetime completo
    const isoDate = `${selectedDateId}T${selectedSlot.time}:00Z`;

    try {
      await axios.post(`${URL_BASE}/assignments`, {
        userID: user?.id,
        tech: selectedCourse.tech,
        level: selectedCourse.level,
        date: isoDate,
        workerID: selectedSlot.workerID,
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo agendar. Intenta más tarde.');
      return;
    }

    setModalVisible(false);
    setSelectedSlot(null);
    Alert.alert('¡Solicitado! 🚀', 'Tu evaluación ha sido agendada.');
    fetchMyAssignments();
  };

  const currentSlots: TimeSlot[] =
    availableDates.find((d) => d.id === selectedDateId)?.slots ?? [];
  const selectedFullDate =
    availableDates.find((d) => d.id === selectedDateId)?.fullDate ?? '';

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Certificar</Text>
          <Text style={styles.headerSub}>Valida tus conocimientos</Text>
        </View>
        <View style={styles.headerBadge}>
          <Award size={18} color="#FFD700" fill="rgba(255,215,0,0.2)" />
          <Text style={styles.headerBadgeText}>{myAssignments.length}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#58CC02" />
        }
      >

        {/* ── Banner ───────────────────────────────────────────────── */}
        <View style={styles.heroBanner}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroTitle}>Evaluaciones Técnicas</Text>
            <Text style={styles.heroBody}>
              Agenda una sesión con un evaluador certificado y obtén tu certificado profesional Itudy.
            </Text>
            <View style={styles.heroRequirement}>
              <CheckCircle size={13} color="#58CC02" />
              <Text style={styles.heroRequirementText}>Requiere +60% de progreso en el curso</Text>
            </View>
          </View>
          <Award size={56} color="rgba(203,161,53,0.2)" style={styles.heroIcon} />
        </View>

        {/* ── Mis evaluaciones agendadas ────────────────────────────── */}
        {myAssignments.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionBar, { backgroundColor: '#1CB0F6' }]} />
              <Calendar size={16} color="#1CB0F6" />
              <Text style={styles.sectionTitle}>Mis Evaluaciones</Text>
              <View style={styles.sectionCount}>
                <Text style={styles.sectionCountText}>{myAssignments.length}</Text>
              </View>
            </View>

            {myAssignments.map((assignment, index) => {
              const rawDate = assignment.date || assignment.fecha_asignacion;
              const { day, time } = rawDate
                ? formatAssignmentDate(rawDate)
                : { day: '-', time: '-' };
              const status = assignment.state || assignment.estado || 'pendiente';
              const examName = assignment.exam_name || 'Evaluación Técnica';

              return (
                <View key={index} style={styles.assignCard}>
                  <View style={styles.assignCardStripe} />
                  <View style={styles.assignIconBox}>
                    <Calendar size={20} color="#1CB0F6" />
                  </View>
                  <View style={styles.assignInfo}>
                    <Text style={styles.assignTitle}>{examName}</Text>
                    <View style={styles.assignMeta}>
                      <Clock size={12} color="#4D6470" />
                      <Text style={styles.assignMetaText}>{day} · {time} hrs</Text>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{status.toUpperCase()}</Text>
                  </View>
                </View>
              );
            })}

            <View style={styles.divider} />
          </>
        )}

        {/* ── Seleccionar curso ─────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBar, { backgroundColor: '#58CC02' }]} />
          <Award size={16} color="#58CC02" />
          <Text style={styles.sectionTitle}>Agendar Evaluación</Text>
        </View>

        {allCourses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aún no tienes cursos inscritos.</Text>
            <Text style={styles.emptySub}>Ve a la pestaña Aprender para comenzar.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.pickLabel}>Cursos disponibles para certificar</Text>

            {/* Cursos elegibles */}
            {eligibleCourses.map((course) => {
              const isSelected = selectedCourse?.id === course.id;
              const pColor = progressColor(course.progress ?? 0);
              const hasTech = !!course.tech && !!course.level;

              return (
                <TouchableOpacity
                  key={course.id}
                  style={[styles.courseCard, isSelected && styles.courseCardSelected]}
                  onPress={() => setSelectedCourse(isSelected ? null : course)}
                  activeOpacity={0.8}
                >
                  <View style={styles.courseCardLeft}>
                    <View
                      style={[
                        styles.courseRadio,
                        isSelected && { backgroundColor: '#58CC02', borderColor: '#58CC02' },
                      ]}
                    >
                      {isSelected && <CheckCircle size={14} color="#fff" fill="#58CC02" />}
                    </View>
                  </View>

                  <View style={styles.courseCardBody}>
                    <View style={styles.courseCardTop}>
                      <Text style={styles.courseName}>{course.name || 'Curso'}</Text>
                      {course.level ? (
                        <View style={[styles.levelBadge, { borderColor: pColor + '55' }]}>
                          <Text style={[styles.levelText, { color: pColor }]}>{course.level}</Text>
                        </View>
                      ) : (
                        <View style={styles.levelBadgeMissing}>
                          <Text style={styles.levelTextMissing}>Sin nivel</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.progressRow}>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${course.progress ?? 0}%` as any,
                              backgroundColor: pColor,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.progressLabel, { color: pColor }]}>
                        {course.progress ?? 0}%
                      </Text>
                    </View>

                    {!hasTech && (
                      <Text style={styles.noTechWarning}>
                        ⚠ Tecnología no configurada aún
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Cursos bloqueados */}
            {lockedCourses.length > 0 && (
              <>
                <Text style={styles.lockedLabel}>Progreso insuficiente</Text>
                {lockedCourses.map((course) => (
                  <View key={course.id} style={styles.courseCardLocked}>
                    <View style={styles.courseCardLeft}>
                      <View style={styles.courseRadioLocked}>
                        <Lock size={12} color="#4D6470" />
                      </View>
                    </View>
                    <View style={styles.courseCardBody}>
                      <View style={styles.courseCardTop}>
                        <Text style={styles.courseNameLocked}>{course.name || 'Curso'}</Text>
                        <View style={styles.levelBadgeLocked}>
                          <Text style={styles.levelTextLocked}>{course.level || '-'}</Text>
                        </View>
                      </View>
                      <View style={styles.progressRow}>
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${course.progress ?? 0}%` as any,
                                backgroundColor: '#2A3D48',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressLabelLocked}>{course.progress ?? 0}%</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {/* ── Card de confirmación ──────────────────────────────────── */}
        {selectedCourse && (
          <View style={styles.confirmCard}>
            <View style={styles.confirmCardTopStripe} />
            <View style={styles.confirmCardInner}>
              <View style={styles.confirmCardHeader}>
                <View style={styles.confirmIconBox}>
                  <Award size={28} color="#CBA135" />
                </View>
                <View style={styles.confirmCardText}>
                  <Text style={styles.confirmTitle}>Certificación Profesional</Text>
                  <Text style={styles.confirmSub} numberOfLines={2}>
                    {selectedCourse.name}
                    {selectedCourse.level ? ` · ${selectedCourse.level}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.confirmInfoRow}>
                <View style={styles.confirmInfoItem}>
                  <Text style={styles.confirmInfoLabel}>Progreso</Text>
                  <Text style={styles.confirmInfoValue}>{selectedCourse.progress ?? 0}%</Text>
                </View>
                <View style={styles.confirmInfoDivider} />
                <View style={styles.confirmInfoItem}>
                  <Text style={styles.confirmInfoLabel}>Modalidad</Text>
                  <Text style={styles.confirmInfoValue}>En vivo</Text>
                </View>
                <View style={styles.confirmInfoDivider} />
                <View style={styles.confirmInfoItem}>
                  <Text style={styles.confirmInfoLabel}>Duración</Text>
                  <Text style={styles.confirmInfoValue}>90 min</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.bookBtn, (loading || !selectedCourse.tech) && { opacity: 0.7 }]}
                onPress={handleScheduleEvaluation}
                disabled={loading || !selectedCourse.tech}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Calendar size={18} color="#fff" />
                    <Text style={styles.bookBtnText}>BUSCAR HORARIOS</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modal de horarios ─────────────────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>

            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Horarios Disponibles</Text>
                <Text style={styles.modalSubtitle}>{selectedCourse?.name}</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                <X color="#7A9BAB" size={20} />
              </TouchableOpacity>
            </View>

            {/* Step 1: Fecha */}
            <View style={styles.modalSection}>
              <View style={styles.stepRow}>
                <View style={styles.stepCircle}>
                  <Text style={styles.stepNum}>1</Text>
                </View>
                <Text style={styles.stepLabel}>Selecciona una fecha</Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                {availableDates.map((item) => {
                  const isSel = selectedDateId === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.dateCard, isSel && styles.dateCardSel]}
                      onPress={() => {
                        setSelectedDateId(item.id);
                        setSelectedSlot(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dateDayText, isSel && styles.dateSel]}>{item.day}</Text>
                      <Text style={[styles.dateNumText, isSel && styles.dateSel]}>{item.date}</Text>
                      {isSel && <View style={styles.dateDot} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {selectedFullDate !== '' && (
                <Text style={styles.selectedFullDate}>{selectedFullDate}</Text>
              )}
            </View>

            {/* Step 2: Hora */}
            <View style={styles.modalSection}>
              <View style={styles.stepRow}>
                <View style={[styles.stepCircle, !selectedDateId && styles.stepCircleDisabled]}>
                  <Text style={styles.stepNum}>2</Text>
                </View>
                <Text style={styles.stepLabel}>Elige un horario</Text>
              </View>

              <View style={styles.timeGrid}>
                {currentSlots.length > 0 ? (
                  currentSlots.map((slot) => {
                    const isSel = selectedSlot?.time === slot.time;
                    return (
                      <TouchableOpacity
                        key={slot.time}
                        style={[styles.timeChip, isSel && styles.timeChipSel]}
                        onPress={() => setSelectedSlot(slot)}
                        activeOpacity={0.8}
                      >
                        <Clock size={13} color={isSel ? '#fff' : '#7A9BAB'} />
                        <Text style={[styles.timeText, isSel && styles.timeTextSel]}>
                          {slot.time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.noSlots}>Sin horarios para este día</Text>
                )}
              </View>
            </View>

            {/* Confirmar */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmBtn, !selectedSlot && styles.confirmBtnDisabled]}
                disabled={!selectedSlot}
                onPress={confirmBooking}
                activeOpacity={0.85}
              >
                <Text style={[styles.confirmBtnText, !selectedSlot && styles.confirmBtnTextDisabled]}>
                  CONFIRMAR RESERVA
                </Text>
                <ChevronRight size={20} color={selectedSlot ? '#fff' : '#4D6470'} />
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1B22' },
  scrollContent: { padding: 20, paddingTop: 16 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#1E2F38',
  },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: 0.3 },
  headerSub: { color: '#4D6470', fontSize: 13, marginTop: 1 },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  headerBadgeText: { color: '#FFD700', fontWeight: '800', fontSize: 15 },

  heroBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(203,161,53,0.07)', borderWidth: 1,
    borderColor: 'rgba(203,161,53,0.2)', borderRadius: 16, padding: 18, marginBottom: 24, overflow: 'hidden',
  },
  heroLeft: { flex: 1 },
  heroTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  heroBody: { color: '#7A9BAB', fontSize: 13, lineHeight: 19, marginBottom: 10 },
  heroRequirement: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroRequirementText: { color: '#58CC02', fontSize: 12, fontWeight: '600' },
  heroIcon: { marginLeft: 10 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionBar: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
  sectionCount: { backgroundColor: '#1E2F38', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  sectionCountText: { color: '#7A9BAB', fontSize: 12, fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#1E2F38', marginVertical: 22 },

  assignCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#141F26',
    borderRadius: 14, borderWidth: 1, borderColor: '#1E2F38',
    marginBottom: 10, overflow: 'hidden', gap: 12, paddingRight: 14, paddingVertical: 14,
  },
  assignCardStripe: { width: 4, alignSelf: 'stretch', backgroundColor: '#1CB0F6', borderRadius: 2 },
  assignIconBox: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(28,176,246,0.12)', borderWidth: 1, borderColor: 'rgba(28,176,246,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  assignInfo: { flex: 1 },
  assignTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  assignMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  assignMetaText: { color: '#7A9BAB', fontSize: 12 },
  statusBadge: {
    backgroundColor: 'rgba(255,150,0,0.15)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,150,0,0.3)',
  },
  statusText: { color: '#FF9600', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  pickLabel: { color: '#7A9BAB', fontSize: 13, fontWeight: '600', marginBottom: 12, letterSpacing: 0.3 },
  lockedLabel: { color: '#4D6470', fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 10, letterSpacing: 0.3, textTransform: 'uppercase' },

  emptyBox: {
    alignItems: 'center', paddingVertical: 28, backgroundColor: '#141F26',
    borderRadius: 14, borderWidth: 1, borderColor: '#1E2F38', borderStyle: 'dashed', marginBottom: 4,
  },
  emptyText: { color: '#7A9BAB', fontSize: 14, fontWeight: '600' },
  emptySub: { color: '#4D6470', fontSize: 12, marginTop: 4 },

  courseCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#141F26',
    borderRadius: 14, borderWidth: 1.5, borderColor: '#1E2F38', padding: 14, marginBottom: 10, gap: 12,
  },
  courseCardSelected: { borderColor: 'rgba(88,204,2,0.5)', backgroundColor: 'rgba(88,204,2,0.05)' },
  courseCardLocked: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F1B22',
    borderRadius: 14, borderWidth: 1, borderColor: '#1A2830', padding: 14, marginBottom: 10, gap: 12, opacity: 0.6,
  },
  courseCardLeft: { alignItems: 'center', justifyContent: 'center' },
  courseRadio: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#37464F',
    justifyContent: 'center', alignItems: 'center',
  },
  courseRadioLocked: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 1,
    borderColor: '#1E2F38', backgroundColor: '#1A2830', justifyContent: 'center', alignItems: 'center',
  },
  courseCardBody: { flex: 1, gap: 8 },
  courseCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courseName: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  courseNameLocked: { color: '#4D6470', fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  levelBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  levelText: { fontSize: 11, fontWeight: '700' },
  levelBadgeMissing: { borderWidth: 1, borderColor: '#2A3D48', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  levelTextMissing: { fontSize: 11, fontWeight: '600', color: '#4D6470' },
  levelBadgeLocked: { borderWidth: 1, borderColor: '#1E2F38', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  levelTextLocked: { color: '#4D6470', fontSize: 11, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { flex: 1, height: 5, backgroundColor: '#1E2F38', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 12, fontWeight: '700', minWidth: 34, textAlign: 'right' },
  progressLabelLocked: { color: '#37464F', fontSize: 12, fontWeight: '600', minWidth: 34, textAlign: 'right' },
  noTechWarning: { color: '#FF9600', fontSize: 11, fontWeight: '500' },

  confirmCard: { marginTop: 8, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(203,161,53,0.35)', overflow: 'hidden' },
  confirmCardTopStripe: { height: 4, backgroundColor: '#CBA135' },
  confirmCardInner: { backgroundColor: '#141F26', padding: 18 },
  confirmCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  confirmIconBox: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(203,161,53,0.12)', borderWidth: 1, borderColor: 'rgba(203,161,53,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  confirmCardText: { flex: 1 },
  confirmTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 3 },
  confirmSub: { color: '#7A9BAB', fontSize: 13 },
  confirmInfoRow: {
    flexDirection: 'row', backgroundColor: '#0F1B22', borderRadius: 12,
    padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#1E2F38',
  },
  confirmInfoItem: { flex: 1, alignItems: 'center', gap: 4 },
  confirmInfoLabel: { color: '#4D6470', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  confirmInfoValue: { color: '#fff', fontSize: 15, fontWeight: '700' },
  confirmInfoDivider: { width: 1, backgroundColor: '#1E2F38', marginHorizontal: 8 },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#58CC02', paddingVertical: 14, borderRadius: 12, borderBottomWidth: 4, borderBottomColor: '#46A302',
  },
  bookBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#141F26', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: '#1E2F38', height: '68%', paddingBottom: 30 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#37464F', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1E2F38' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  modalSubtitle: { color: '#4D6470', fontSize: 13, marginTop: 2 },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E2F38', justifyContent: 'center', alignItems: 'center' },
  modalSection: { paddingHorizontal: 20, paddingTop: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  stepCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1CB0F6', justifyContent: 'center', alignItems: 'center' },
  stepCircleDisabled: { backgroundColor: '#1E2F38' },
  stepNum: { color: '#fff', fontSize: 12, fontWeight: '800' },
  stepLabel: { color: '#7A9BAB', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateScroll: { flexDirection: 'row' },
  dateCard: { width: 64, height: 76, backgroundColor: '#0F1B22', borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1.5, borderColor: '#1E2F38', gap: 4 },
  dateCardSel: { backgroundColor: 'rgba(28,176,246,0.12)', borderColor: '#1CB0F6' },
  dateDayText: { color: '#4D6470', fontSize: 11, fontWeight: '700' },
  dateNumText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  dateSel: { color: '#1CB0F6' },
  dateDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1CB0F6' },
  selectedFullDate: { color: '#7A9BAB', fontSize: 13, marginTop: 10, fontWeight: '500' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 11, paddingHorizontal: 14, backgroundColor: '#0F1B22', borderRadius: 10, borderWidth: 1.5, borderColor: '#1E2F38' },
  timeChipSel: { backgroundColor: 'rgba(88,204,2,0.12)', borderColor: '#58CC02' },
  timeText: { color: '#7A9BAB', fontWeight: '600', fontSize: 14 },
  timeTextSel: { color: '#58CC02' },
  noSlots: { color: '#4D6470', fontStyle: 'italic', fontSize: 13 },
  modalFooter: { paddingHorizontal: 20, paddingTop: 16, marginTop: 'auto' },
  confirmBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#58CC02', paddingVertical: 15, borderRadius: 14, borderBottomWidth: 4, borderBottomColor: '#46A302' },
  confirmBtnDisabled: { backgroundColor: '#1A2830', borderBottomColor: '#141F26', borderWidth: 1, borderColor: '#1E2F38' },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
  confirmBtnTextDisabled: { color: '#4D6470' },
});

export default CertificatesScreen;
