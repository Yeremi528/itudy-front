import { Award, Calendar, CheckCircle, ChevronDown, ChevronRight, Clock, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// --- MOCK DATA ---
const AVAILABLE_COURSES = [
  { id: '1', name: 'Golang Backend', progress: 85, level: 'Avanzado' },
  { id: '2', name: 'React Native', progress: 40, level: 'Intermedio' },
  { id: '3', name: 'MongoDB Database', progress: 92, level: 'Experto' },
  { id: '4', name: 'Docker & Kubernetes', progress: 65, level: 'Intermedio' }
];

// Mock de fechas disponibles (Próximos días)
const DATES_MOCK = [
    { id: 'd1', day: 'LUN', date: '12', fullDate: 'Lunes 12 de Enero', slots: ['10:00', '11:30', '15:00', '16:30'] },
    { id: 'd2', day: 'MAR', date: '13', fullDate: 'Martes 13 de Enero', slots: ['09:00', '10:30', '14:00'] },
    { id: 'd3', day: 'MIE', date: '14', fullDate: 'Miércoles 14 de Enero', slots: ['11:00', '15:30', '17:00'] },
    { id: 'd4', day: 'JUE', date: '15', fullDate: 'Jueves 15 de Enero', slots: ['09:30', '12:00'] },
];

const CertificatesScreen: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(14400); 

  // Estados para el Modal de Agendamiento
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDateId, setSelectedDateId] = useState<string>(DATES_MOCK[0].id); // Selecciona el primero por defecto
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const eligibleCourses = AVAILABLE_COURSES.filter(c => c.progress > 60);

  // Lógica del Timer (igual que antes)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    setIsDropdownOpen(false);
  };

  // Abrir Modal
  const openBookingModal = () => {
    setModalVisible(true);
    setSelectedTime(null); // Reiniciar hora seleccionada
  };

  // Confirmar Cita
  const confirmBooking = () => {
    const dateData = DATES_MOCK.find(d => d.id === selectedDateId);
    setModalVisible(false);
    
    Alert.alert(
        "¡Cita Confirmada! 🚀", 
        `Has agendado tu evaluación de ${selectedCourse?.name} para el ${dateData?.fullDate} a las ${selectedTime} hrs.`
    );
  };

  // Helper para obtener slots del día seleccionado
  const currentSlots = DATES_MOCK.find(d => d.id === selectedDateId)?.slots || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Certificados</Text>
        <Award color="#FFD700" size={28} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* --- DROPDOWN SELECTION --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Selecciona tu especialidad</Text>
          <Text style={styles.sectionSubLabel}>Solo cursos con +60% de progreso</Text>

          <TouchableOpacity 
            style={styles.dropdownTrigger} 
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {/* Uso ?. y || para evitar el error de null */}
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
                        <Text style={styles.itemSubtitle}>Nivel: {course.level} • {course.progress}% completado</Text>
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

        {/* --- ACTION CARD (Agendar) --- */}
        {selectedCourse && !isDropdownOpen && (
            <View style={styles.actionCard}>
                <View style={styles.actionHeader}>
                    <Award color="#fff" size={32} />
                    <View style={{flex:1, marginLeft: 12}}>
                        <Text style={styles.actionTitle}>Certificación Profesional</Text>
                        <Text style={styles.actionSubtitle}>Agenda una videollamada de 30 min con un experto para validar tus conocimientos en {selectedCourse.name}.</Text>
                    </View>
                </View>
                
                <TouchableOpacity style={styles.bookButton} onPress={openBookingModal}>
                    <Calendar color="#fff" size={20} style={{marginRight: 8}}/>
                    <Text style={styles.bookButtonText}>AGENDAR EVALUACIÓN</Text>
                </TouchableOpacity>
            </View>
        )}

        <View style={styles.divider} />

        {/* --- OFERTAS --- */}
        <Text style={styles.offerSectionTitle}>Ofertas Relámpago 🔥</Text>

        <View style={[styles.offerBanner, { borderColor: '#1CB0F6' }]}>
            <View style={styles.offerBadge}>
                <Text style={styles.offerBadgeText}>-70% OFF</Text>
            </View>
            <View style={styles.offerContent}>
                <Text style={styles.offerTitle}>Certificación Golang Backend</Text>
                <Text style={styles.offerDesc}>Obtén tu insignia verificada.</Text>
                <View style={styles.timerContainer}>
                    <Clock size={16} color="#FF9600" />
                    <Text style={styles.timerText}>Termina en: {formatTime(timeLeft)}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.offerButton}>
                <Text style={styles.offerButtonText}>RECLAMAR</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ================================================= */}
      {/* MODAL DE AGENDAMIENTO */}
      {/* ================================================= */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Agendar Evaluación</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <X color="#AFBFC9" size={24} />
                    </TouchableOpacity>
                </View>

                {/* Date Scroller */}
                <View style={styles.dateSection}>
                    <Text style={styles.label}>1. Elige una fecha</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
                        {DATES_MOCK.map((item) => {
                            const isSelected = selectedDateId === item.id;
                            return (
                                <TouchableOpacity 
                                    key={item.id} 
                                    style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                                    onPress={() => setSelectedDateId(item.id)}
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
                    <Text style={styles.label}>2. Elige una hora</Text>
                    <View style={styles.timeGrid}>
                        {currentSlots.map((time) => {
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
                        })}
                    </View>
                </View>

                {/* Confirm Button */}
                <View style={styles.modalFooter}>
                    <TouchableOpacity 
                        style={[styles.confirmButton, !selectedTime && styles.disabledButton]}
                        disabled={!selectedTime}
                        onPress={confirmBooking}
                    >
                        <Text style={styles.confirmButtonText}>CONFIRMAR CITA</Text>
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
  // ... ESTILOS ANTERIORES ...
  container: {
    flex: 1,
    backgroundColor: '#131F24',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#37464F',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  sectionSubLabel: {
    color: '#AFBFC9',
    fontSize: 14,
    marginBottom: 15,
  },
  dropdownTrigger: {
    backgroundColor: '#131F24',
    borderWidth: 2,
    borderColor: '#37464F',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownList: {
    marginTop: 10,
    backgroundColor: '#15262F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#37464F',
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#37464F',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    color: '#AFBFC9',
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#AFBFC9', fontStyle: 'italic' },
  
  // ACTION CARD
  actionCard: {
    marginHorizontal: 20,
    backgroundColor: '#202F36',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#58CC02',
  },
  actionHeader: { flexDirection: 'row', marginBottom: 20 },
  actionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  actionSubtitle: { color: '#AFBFC9', fontSize: 14, lineHeight: 20 },
  bookButton: {
    backgroundColor: '#58CC02',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderBottomWidth: 4,
    borderBottomColor: '#46A302',
  },
  bookButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  
  divider: { height: 2, backgroundColor: '#37464F', marginHorizontal: 20, marginVertical: 30 },
  
  // OFFERS
  offerSectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 20, marginBottom: 15 },
  offerBanner: {
    marginHorizontal: 20,
    backgroundColor: '#15262F',
    borderRadius: 16,
    padding: 15,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  offerBadge: {
    position: 'absolute', top: 0, right: 0, backgroundColor: '#FF4B4B',
    paddingHorizontal: 10, paddingVertical: 5, borderBottomLeftRadius: 10,
  },
  offerBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  offerContent: { marginBottom: 15 },
  offerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5, width: '80%' },
  offerDesc: { color: '#AFBFC9', fontSize: 14, marginBottom: 10 },
  timerContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 150, 0, 0.15)',
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  timerText: { color: '#FF9600', fontWeight: 'bold', marginLeft: 6, fontSize: 13 },
  offerButton: {
    backgroundColor: '#1CB0F6', paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    borderBottomWidth: 4, borderBottomColor: '#1899D6',
  },
  offerButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // ===================================
  // MODAL STYLES
  // ===================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#131F24',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    height: '65%', // Altura del modal
    borderWidth: 1,
    borderColor: '#37464F'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#37464F',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  label: {
    color: '#AFBFC9',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  dateSection: {
    marginBottom: 25,
  },
  datesScroll: {
    flexDirection: 'row',
  },
  dateCard: {
    width: 70,
    height: 80,
    backgroundColor: '#15262F',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#37464F',
  },
  dateCardSelected: {
    backgroundColor: '#1CB0F6', // Azul Duolingo
    borderColor: '#1CB0F6',
  },
  dateDay: {
    color: '#AFBFC9',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateNum: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  textSelected: {
    color: '#fff',
  },
  timeSection: {
    flex: 1,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    width: '30%',
    paddingVertical: 12,
    backgroundColor: '#15262F',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#37464F',
  },
  timeChipSelected: {
    backgroundColor: '#58CC02', // Verde Selección
    borderColor: '#58CC02',
  },
  timeText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalFooter: {
    marginTop: 20,
  },
  confirmButton: {
    backgroundColor: '#58CC02',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 15,
    borderBottomWidth: 4,
    borderBottomColor: '#46A302',
  },
  disabledButton: {
    backgroundColor: '#37464F',
    borderBottomColor: '#25333B',
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 10,
  }
});

export default CertificatesScreen;