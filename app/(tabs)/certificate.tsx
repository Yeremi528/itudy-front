import { URL_BASE } from '@/constants/URL';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Award, Calendar, CheckCircle, ChevronDown, ChevronRight, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// --- MOCK DATA PARA LOS CURSOS ---
const AVAILABLE_COURSES = [
  { id: '1', courseID: 'golang', name: 'Golang Backend', progress: 85, level: 'Junior' },
  { id: '2', courseID: 'reactNative', name: 'React Native', progress: 40, level: 'Semi Senior' },
  { id: '3', courseID: 'mongoDB', name: 'MongoDB Database', progress: 92, level: 'Senior' },
  { id: '4', courseID: 'dockerKubernetes', name: 'Docker & Kubernetes', progress: 65, level: 'Junior' }
];

const CertificatesScreen: React.FC = () => {
  const { user } = useAuth();

  // Estados
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para Mis Asignaciones (NUEVO)
  const [myAssignments, setMyAssignments] = useState<any[]>([]);

  // Estados para el Modal y Datos
  const [modalVisible, setModalVisible] = useState(false);
  const [availableDates, setAvailableDates] = useState<any[]>([]);
  const [selectedDateId, setSelectedDateId] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const eligibleCourses = AVAILABLE_COURSES.filter(c => c.progress > 60);

  // --- EFECTO INICIAL: CARGAR MIS CITAS ---
  useEffect(() => {
    fetchMyAssignments();
  }, [user]);


  // --- 1. FUNCIÓN PARA OBTENER MIS ASIGNACIONES (NUEVO) ---
  const fetchMyAssignments = async () => {
    if (!user?.id) return;
    try {
        // Ajusta la IP según corresponda (localhost para iOS, 10.0.2.2 para Android)
        const URL = `${URL_BASE}/assignments?userID=${user.id}`;
        console.log("Fetching My Assignments:", URL);
        
        const { data } = await axios.get(URL);
        setMyAssignments(data);

    } catch (error) {
        console.error("Error fetching my assignments:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyAssignments();
    setRefreshing(false);
  };

  // --- 2. FUNCIÓN DE TRANSFORMACIÓN (API -> UI) ---
  const processApiData = (assignments: any[]): { id: string; day: string; date: string; fullDate: string; slots: string[] }[] => {
    const groups: any = {};

    assignments.forEach((item) => {
        const rawDate = item.fecha_asignacion || item.date; 
        const dateObj = new Date(rawDate);
        const dateKey = dateObj.toISOString().split('T')[0];

        if (!groups[dateKey]) {
            const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(dateObj).toUpperCase().replace('.', '');
            const dayNum = new Intl.DateTimeFormat('es-ES', { day: 'numeric' }).format(dateObj);
            const fullDateStr = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(dateObj);

            groups[dateKey] = {
                id: dateKey,
                day: dayName,
                date: dayNum,
                fullDate: fullDateStr.charAt(0).toUpperCase() + fullDateStr.slice(1),
                slots: []
            };
        }
        const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
        if (!groups[dateKey].slots.includes(timeStr)) {
            groups[dateKey].slots.push(timeStr);
        }
    });

    return Object.values(groups as { [key: string]: { id: string; day: string; date: string; fullDate: string; slots: string[] } }).sort((a, b) => new Date(a.id).getTime() - new Date(b.id).getTime());
  };

  // --- 3. LLAMADA A LA API (Disponibilidad) ---
  const handleSheduleEvaluation = async () => {
    if (!selectedCourse) return;
    
    setLoading(true);
    const tech = `${selectedCourse?.courseID}`.toLowerCase();
    const level = `${selectedCourse?.level}`.toLowerCase();

    const URL = `${URL_BASE}/assignments/availables?tech=${tech}&level=${level}`;
    
    try {
      const { data } = await axios.get(URL);
      const formattedData = processApiData(data);
      setAvailableDates(formattedData);
      
      if (formattedData.length > 0) {
        setSelectedDateId(formattedData[0].id);
        setModalVisible(true);
      } else {
        Alert.alert("Lo sentimos", "No hay horarios disponibles para esta tecnología por el momento.");
      }
    } catch (error) {
      console.error("Error fetching availables:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    setIsDropdownOpen(false);
  };

  const confirmBooking = async () => {
    const URL = `${URL_BASE}/assignments`;

    const data = {
      userID: user?.id,
      courseID: selectedCourse.courseID,
      date: selectedDateId,
      time: selectedTime,
      workerID: selectedWorkerId
    };

    console.log("Creating Assignment with data:", data);
    
    try{
        await axios.post(URL, data);
    }catch(error){
        console.error("Error creating assignment:", error);
        Alert.alert("Error", "No se pudo agendar la cita. Intenta más tarde.");
        return;
    }
    // Aquí iría tu lógica POST para crear la cita real
    setModalVisible(false);
    Alert.alert("¡Cita Solicitada! 🚀", "Tu solicitud ha sido enviada.");
    // Recargamos las asignaciones para ver la nueva (si hubieras hecho el POST)
    fetchMyAssignments(); 
  };

  // --- HELPER PARA FORMATEAR FECHA DE MIS ASIGNACIONES ---
  const formatAssignmentDate = (isoString: string) => {
    const date = new Date(isoString);
    const day = new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
    const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    return { day: day.toUpperCase(), time };
  };

  const currentSlots = availableDates.find(d => d.id === selectedDateId)?.slots || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Certificados</Text>
        <Award color="#FFD700" size={28} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        
        {/* --- NUEVA SECCIÓN: MIS EVALUACIONES AGENDADAS --- */}
        {myAssignments.length > 0 && (
            <View style={styles.section}>
                <Text style={styles.sectionLabel}>Mis Evaluaciones</Text>
                {myAssignments.map((assignment, index) => {
                    const { day, time } = formatAssignmentDate(assignment.date || assignment.fecha_asignacion);
                    return (
                        <View key={index} style={styles.assignmentCard}>
                            <View style={styles.assignmentLeft}>
                                <View style={styles.calendarIcon}>
                                    <Calendar color="#1CB0F6" size={20} />
                                </View>
                                <View>
                                    <Text style={styles.assignmentTitle}>Evaluación Técnica</Text>
                                    <Text style={styles.assignmentDate}>{day} • {time} hrs</Text>
                                </View>
                            </View>
                            <View style={styles.assignmentStatusBadge}>
                                <Text style={styles.assignmentStatusText}>{assignment.state || assignment.estado}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>
        )}

        <View style={styles.divider} />

        {/* --- SELECCIÓN DE CURSO (Booking) --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Agendar Nueva</Text>
          <Text style={styles.sectionSubLabel}>Selecciona especialidad (+60% progreso)</Text>

          <TouchableOpacity 
            style={styles.dropdownTrigger} 
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Text style={styles.dropdownText}>
              {selectedCourse?.name || "Selecciona un curso..."}
            </Text>
            <ChevronDown color="#AFBFC9" size={20} />
          </TouchableOpacity>

          {isDropdownOpen && (
            <View style={styles.dropdownList}>
              {eligibleCourses.length > 0 ? (
                eligibleCourses.map((course) => (
                  <TouchableOpacity 
                    key={course.id} 
                    style={styles.dropdownItem}
                    onPress={() => handleSelectCourse(course)}
                  >
                    <View>
                        <Text style={styles.itemTitle}>{course.name}</Text>
                        <Text style={styles.itemSubtitle}>Nivel: {course.level} • {course.progress}%</Text>
                    </View>
                    {selectedCourse?.id === course.id && <CheckCircle size={16} color="#58CC02" />}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Aún no tienes cursos listos.</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* --- BOTÓN AGENDAR --- */}
        {selectedCourse && !isDropdownOpen && (
            <View style={styles.actionCard}>
                <View style={styles.actionHeader}>
                    <Award color="#fff" size={32} />
                    <View style={{flex:1, marginLeft: 12}}>
                        <Text style={styles.actionTitle}>Certificación Profesional</Text>
                        <Text style={styles.actionSubtitle}>Valida tus conocimientos en {selectedCourse.name}.</Text>
                    </View>
                </View>
                
                <TouchableOpacity 
                    style={[styles.bookButton, loading && {opacity: 0.7}]} 
                    onPress={handleSheduleEvaluation}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Calendar color="#fff" size={20} style={{marginRight: 8}}/>
                            <Text style={styles.bookButtonText}>BUSCAR HORARIOS</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        )}

      </ScrollView>

      {/* --- MODAL (Sin cambios grandes) --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Horarios Disponibles</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <X color="#AFBFC9" size={24} />
                    </TouchableOpacity>
                </View>

                {/* Date Scroller */}
                <View style={styles.dateSection}>
                    <Text style={styles.label}>1. Fecha</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
                        {availableDates.map((item) => {
                            const isSelected = selectedDateId === item.id;
                            return (
                                <TouchableOpacity 
                                    key={item.id} 
                                    style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                                    onPress={() => {
                                        setSelectedDateId(item.id);
                                        setSelectedTime(null);
                                        setSelectedWorkerId(item.workerID || null);
                                    }}
                                >
                                    <Text style={[styles.dateDay, isSelected && styles.textSelected]}>{item.day}</Text>
                                    <Text style={[styles.dateNum, isSelected && styles.textSelected]}>{item.date}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                </View>

                {/* Time Grid */}
                <View style={styles.timeSection}>
                    <Text style={styles.label}>2. Hora</Text>
                    <View style={styles.timeGrid}>
                        {currentSlots.length > 0 ? (
                            currentSlots.map((time: string) => {
                                const isSelected = selectedTime === time;
                                return (
                                    <TouchableOpacity 
                                        key={time}
                                        style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                                        onPress={() => setSelectedTime(time)}
                                    >
                                        <Text style={[styles.timeText, isSelected && styles.textSelected]}>{time}</Text>
                                    </TouchableOpacity>
                                )
                            })
                        ) : (
                            <Text style={{color: '#AFBFC9', fontStyle: 'italic'}}>Sin horas disponibles.</Text>
                        )}
                    </View>
                </View>

                <View style={styles.modalFooter}>
                    <TouchableOpacity 
                        style={[styles.confirmButton, !selectedTime && styles.disabledButton]}
                        disabled={!selectedTime}
                        onPress={() => confirmBooking()}
                    >
                        <Text style={styles.confirmButtonText}>CONFIRMAR</Text>
                        <ChevronRight color="#fff" size={20} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#131F24' },
    scrollContent: { paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#37464F' },
    headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
    section: { padding: 20 },
    sectionLabel: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    sectionSubLabel: { color: '#AFBFC9', fontSize: 14, marginBottom: 15 },
    divider: { height: 1, backgroundColor: '#37464F', marginHorizontal: 20, marginVertical: 10 },
    
    // --- ESTILOS DE MIS ASIGNACIONES (NUEVO) ---
    assignmentCard: {
        backgroundColor: '#15262F',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#37464F',
    },
    assignmentLeft: { flexDirection: 'row', alignItems: 'center' },
    calendarIcon: { 
        width: 40, height: 40, borderRadius: 20, 
        backgroundColor: 'rgba(28, 176, 246, 0.15)', 
        justifyContent: 'center', alignItems: 'center', marginRight: 12 
    },
    assignmentTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    assignmentDate: { color: '#1CB0F6', fontSize: 14, marginTop: 2 },
    assignmentStatusBadge: { 
        backgroundColor: 'rgba(255, 150, 0, 0.15)', 
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 
    },
    assignmentStatusText: { color: '#FF9600', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },

    // ... (El resto de estilos DROPDOWN, ACTION CARD y MODAL se mantienen igual) ...
    dropdownTrigger: { backgroundColor: '#131F24', borderWidth: 2, borderColor: '#37464F', borderRadius: 12, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dropdownText: { color: '#fff', fontSize: 16, fontWeight: '500' },
    dropdownList: { marginTop: 10, backgroundColor: '#15262F', borderRadius: 12, borderWidth: 1, borderColor: '#37464F', overflow: 'hidden' },
    dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#37464F', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    itemSubtitle: { color: '#AFBFC9', fontSize: 12, marginTop: 2 },
    emptyState: { padding: 20, alignItems: 'center' },
    emptyText: { color: '#AFBFC9', fontStyle: 'italic' },
    actionCard: { marginHorizontal: 20, backgroundColor: '#202F36', borderRadius: 16, padding: 20, borderWidth: 2, borderColor: '#58CC02' },
    actionHeader: { flexDirection: 'row', marginBottom: 20 },
    actionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    actionSubtitle: { color: '#AFBFC9', fontSize: 14, lineHeight: 20 },
    bookButton: { backgroundColor: '#58CC02', paddingVertical: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderBottomWidth: 4, borderBottomColor: '#46A302' },
    bookButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#131F24', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, height: '65%', borderWidth: 1, borderColor: '#37464F' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#37464F' },
    modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    label: { color: '#AFBFC9', fontSize: 14, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
    dateSection: { marginBottom: 25 },
    datesScroll: { flexDirection: 'row' },
    dateCard: { width: 70, height: 80, backgroundColor: '#15262F', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 2, borderColor: '#37464F' },
    dateCardSelected: { backgroundColor: '#1CB0F6', borderColor: '#1CB0F6' },
    dateDay: { color: '#AFBFC9', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
    dateNum: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    textSelected: { color: '#fff' },
    timeSection: { flex: 1 },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    timeChip: { width: '30%', paddingVertical: 12, backgroundColor: '#15262F', borderRadius: 10, alignItems: 'center', borderWidth: 2, borderColor: '#37464F' },
    timeChipSelected: { backgroundColor: '#58CC02', borderColor: '#58CC02' },
    timeText: { color: '#fff', fontWeight: '600' },
    modalFooter: { marginTop: 20 },
    confirmButton: { backgroundColor: '#58CC02', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 15, borderRadius: 15, borderBottomWidth: 4, borderBottomColor: '#46A302' },
    disabledButton: { backgroundColor: '#37464F', borderBottomColor: '#25333B', opacity: 0.7 },
    confirmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginRight: 10 }
});

export default CertificatesScreen;