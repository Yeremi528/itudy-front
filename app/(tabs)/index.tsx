import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Check,
  ChevronDown,
  Cpu,
  Flame,
  Lock,
  X,
  Zap
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Path, Pattern, Rect, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

import { useAuth } from '../../context/AuthContext';

interface Language {
  _id: string;
  code: string;
  name: string;
  flag: string;
  isActive: boolean;
}

const { width } = Dimensions.get('window');
const NODE_SIZE = 80; 
const NODE_HEIGHT = 160; 

// Componente de Fondo Tech (Grid)
const TechBackground = () => (
  <View style={StyleSheet.absoluteFill}>
    <LinearGradient
      colors={['#020617', '#0f172a', '#172554']}
      style={StyleSheet.absoluteFill}
    />
    <Svg height="100%" width="100%" style={{ opacity: 0.3 }}>
      <Defs>
        <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="0.5" opacity="0.5"/>
        </Pattern>
        <SvgLinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#020617" stopOpacity="1" />
          <Stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#grid)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
    </Svg>
  </View>
);

export default function HomeScreen() {

  const { user, signOut } = useAuth();
  
  const router = useRouter();
  const [progress, setProgress] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  const [languages, setLanguages] = useState<Language[]>([]); // Aquí cargas el array de tu API
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [data, setData] = useState<any[]>([]);
  const [nextID, setNextID] = useState("");

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Animación mascota flotando
  const floatAnim = useRef(new Animated.Value(0)).current;
  // Animación de pulso para el botón activo
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Animación de rotación para el anillo del botón activo
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const goToLesson = (ID: string, nextID: string) => {
   

    const idAsString = String(ID);
    setSelectedCourse(null)
    router.navigate({
      pathname: "/lesson",
      params: { 
          id: idAsString,
          courseId: "golang_junior",       // ID del curso (ajusta si lo tienes en una variable)
          userId: "6935a4e723d8a99e2c9d3c32", // ID de usuario "en duro"
          nextLessonId: nextID

      }
  });
};
const fetchLanguage = async () => {
  try {
    const response  = await axios.get("http://0.0.0.0:4518/courses/languages");
    if (response.data){
        setLanguages(response.data);
    }
  }catch(err){
    console.error("Error fetching language", err);
  }
}
useEffect(() => {
  fetchLanguage();
}, []);
const fetchProgress = async () => {
    try {
      // OJO: NO pongas setIsInitialLoading(true) aquí. 
      // Queremos que el usuario siga viendo el mapa mientras esto se actualiza en "segundo plano".
      
      const PROGRESS_URL = `http://0.0.0.0:4518/lessons?userID=${user?._id}&courseID=golang_junior`;
      
      // Axios no bloquea la UI, así que las animaciones seguirán corriendo
      const response = await axios.get(PROGRESS_URL); 
      
      if (response.data) {
        // Al actualizar el estado, React solo re-renderizará los componentes que cambiaron (los candados/colores)
        // Sin desmontar todo el árbol, por lo que la animación de la mascota NO se reinicia.
        setProgress(response.data);
      }
    } catch (error) {
      console.error("Error updating progress", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Llamamos a la función sin bloquear la UI
      fetchProgress();
    }, [])
  );


  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: Platform.OS !== 'web' })
      ])
    ).start();
  
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' })
      ])
    ).start();
    
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web'
      })
    ).start();
    const fetchCourses = async () => {
      try {
        const API_URL = "http://0.0.0.0:4518/courses/byID?lv=junior&lang=es&tech=Golang"; 
        const response = await axios.get(API_URL); 
        if (response.data && response.data.courses) {
            setData(response.data.courses);
        }
      } catch (error) {
        console.error("Error loading courses", error);
      } finally {
        // SOLO AQUÍ quitamos la pantalla de carga inicial
        setIsInitialLoading(false);
      }
    };

    fetchCourses();

  }, [languages]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const getPosition = (index: number) => {
    const pattern = ['center', 'left', 'center', 'right'];
    return pattern[index % 4];
  };

  if (isInitialLoading) {
    return (
       <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22d3ee" />
       </View>
    );
 }

  return (
    <View style={styles.container}>
      {/* Nuevo Fondo Tecnológico */}
      <TechBackground />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* HEADER */}
        <View style={styles.header}>
    {/* Botón de Idioma Dinámico */}
    <TouchableOpacity 
        style={styles.langButton}
        onPress={() => setIsModalVisible(true)}
    >
        {/* Mostramos la bandera y el código del idioma seleccionado */}
        <Text style={{ fontSize: 16 }}>{selectedLang?.flag || '🌐'}</Text>
        <Text style={styles.langText}>{selectedLang?.code || '...'}</Text>
        <ChevronDown color="#38bdf8" size={12} />
    </TouchableOpacity>
    
    <View style={styles.statsContainer}>
        <View style={styles.statItem}>
            <Flame color="#f97316" fill="#f97316" size={16} />
            <Text style={[styles.statText, { color: '#f97316' }]}>12</Text>
        </View>
    </View>

    {/* Modal de Selección (Duolingo Style) */}
    <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
    >
        <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setIsModalVisible(false)}
        >
            <View style={styles.modalContent}>
                <View style={styles.modalHandlel} />
                <Text style={styles.modalTitle}>Selecciona un idioma</Text>
                
                {languages.map((item) => (
                    <TouchableOpacity
                        key={item._id}
                        style={[
                            styles.langOption,
                            selectedLang?.code === item.code && styles.langOptionSelected
                        ]}
                        onPress={() => {
                            setSelectedLang(item);
                            setIsModalVisible(false);
                            // Aquí llamarías a tu API de cursos filtrando por item.code
                        }}
                    >
                        <Text style={styles.optionFlag}>{item.flag}</Text>
                        <Text style={styles.optionText}>{item.name}</Text>
                        {selectedLang?.code === item.code && (
                            <View style={styles.checkDot} />
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </TouchableOpacity>
    </Modal>
</View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleContainer}>
            <View style={styles.chipContainer}>
                <Cpu size={12} color="#22d3ee" />
                <Text style={styles.subTitle}>RUTA BACKEND</Text>
            </View>
            <Text style={styles.mainTitle}>Golang Mastery</Text>
          </View>

          <View style={styles.mapContainer}>
            {/* SIN LÍNEAS SVG - Solo Nodos Flotantes */}

            {data.length > 0 ? (
                data.map((course, index) => {
                  const currentID = course.course_id; 

                  // CORRECCIÓN 2: Calculamos el siguiente ID usando el índice actual (sin recorrer todo el array de nuevo)
                  // Si existe un elemento en index + 1, tomamos su ID.
                  // Si no existe (es el último del array), repetimos el ID actual.
                  const nextCourse = data[index + 1];
                  const nextID = nextCourse ? nextCourse.course_id : currentID;
                  // Recuperamos el progreso usando el ID correcto
                  const userLessonData = progress?.lessons_progress?.[currentID];

                  // Lógica de estado
                  const currentStatus = userLessonData ? userLessonData.status : 'locked';
                  
                  const isActive = currentStatus === 'active' || progress?.last_lesson_id === currentID;
                  const isCompleted = currentStatus === 'completed';
                  const isLocked = !isActive && !isCompleted;

                  const pos = getPosition(index);
                  
               
                  
                  let alignSelf: 'center' | 'flex-start' | 'flex-end' = 'center';
                  if (pos === 'left') alignSelf = 'flex-start';
                  if (pos === 'right') alignSelf = 'flex-end';

                  const paddingLeft = pos === 'left' ? width * 0.2 : 0;
                  const paddingRight = pos === 'right' ? width * 0.2 : 0;
                  return (
                    <View key={course.course_id}>
                        
                      

                      <View style={[styles.nodeRow, { justifyContent: alignSelf }]}>
                         <View style={{ 
                             marginLeft: pos === 'left' ? paddingLeft : 0, 
                             marginRight: pos === 'right' ? paddingRight : 0, 
                             alignItems: 'center',
                             width: NODE_SIZE + 40, 
                         }}>
                            
                            {/* Wrapper del Botón con Animaciones si es Activo */}
                            <Animated.View 
                                style={{ 
                                    transform: isActive ? [{ scale: pulseAnim }] : [] 
                                }}
                            >
                                {/* Anillo Giratorio para el Activo */}
                                {isActive && (
                                    <Animated.View style={[styles.activeRing, { transform: [{ rotate: spin }] }]} />
                                )}

                                <TouchableOpacity
                                  activeOpacity={0.8}
                                  onPress={() =>{
                                    if (!isLocked) {
                                      setSelectedCourse(course);
                                      setNextID(nextID); 
                                  }
                              }
                                  } 
                                  disabled={isLocked}
                                  style={[
                                    styles.nodeButton,
                                    isLocked ? styles.nodeLocked : isActive ? styles.nodeActive : styles.nodeCompleted
                                  ]}
                                >
                                   {isCompleted ? (
                                     <Check color="#3f2305" size={32} strokeWidth={4} />
                                   ) : isLocked ? (
                                     <Lock color="#334155" size={28} />
                                   ) : (
                                     <Text style={{fontSize: 32}}>{course.icon}</Text>
                                   )}
                                </TouchableOpacity>
                            </Animated.View>

                            {/* Etiqueta del Nivel */}
                            <View style={[
                                styles.labelContainer, 
                                isActive && styles.labelContainerActive,
                                isLocked && styles.labelContainerLocked
                            ]}>
                                <Text style={[styles.nodeLabel, isLocked && styles.nodeLabelLocked]}>
                                    {course.title}
                                </Text>
                            </View>
                            
                         </View>
                      </View>
                    </View>
                  );
                })
            ) : (
                <Text style={styles.loadingText}>Cargando datos del servidor o usando Mock...</Text>
            )}
          </View>
          
          <View style={{height: 100}} /> 
        </ScrollView>

        {/* MODAL */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!selectedCourse}
          onRequestClose={() => setSelectedCourse(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient 
                colors={['#0891b2', '#0f172a']} 
                style={styles.modalHeader}
              >
                <Text style={{fontSize: 60}}>{selectedCourse?.icon}</Text>
                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={() => setSelectedCourse(null)}
                >
                  <X color="white" size={24} />
                </TouchableOpacity>
              </LinearGradient>
              <View style={styles.modalBody}>
                <Text style={styles.modalTitle}>{selectedCourse?.title}</Text>
                <Text style={styles.modalDesc}>Módulo de aprendizaje interactivo.</Text>
                <TouchableOpacity style={styles.startButton} onPress={() => goToLesson(selectedCourse.course_id,nextID)}>
                   <Text style={styles.startButtonText}>INICIAR SISTEMA</Text>
                   <Zap size={20} color="#0f172a" fill="#0f172a"/>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937', // Un tono más claro que el fondo
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#374151',
},
langText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
},
modalOverlayl: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
},
modalContentl: {
    backgroundColor: '#131F24',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 350,
},
modalHandlel: {
    width: 40,
    height: 4,
    backgroundColor: '#37464F',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
},
modalTitlel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
},
langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 8,
},
langOptionSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: '#38bdf8',
},
optionFlag: { fontSize: 24, marginRight: 15 },
optionText: { color: '#fff', fontSize: 16, flex: 1 },
checkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38bdf8',
},
  container: {
    flex: 1,
    backgroundColor: '#020617', // Fallback
  },
  loadingText: {
      color: '#94a3b8',
      textAlign: 'center',
      marginTop: 50,
      fontSize: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(2, 6, 23, 0.5)', // Semi transparente
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.1)',
  },
  langButtonl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)'
  },
  langTextl: {
    color: '#38bdf8', // Sky Blue
    marginLeft: 6,
    fontWeight: 'bold',
    fontSize: 12
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center'
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  titleContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  chipContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(34, 211, 238, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 100,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: 'rgba(34, 211, 238, 0.2)',
  },
  subTitle: {
    color: '#22d3ee', // Cyan
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mainTitle: {
    color: 'white',
    fontSize: 32,
    fontWeight: '800',
    textShadowColor: 'rgba(34, 211, 238, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  mapContainer: {
    marginTop: 10,
  },
  nodeRow: {
    height: NODE_HEIGHT, 
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  // ESTILOS DE BOTONES ACTUALIZADOS
  nodeButton: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: 20, // Más cuadrado (Squircle tech)
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0,
    elevation: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  nodeCompleted: {
    backgroundColor: '#eab308',
    shadowColor: '#eab308',
    borderWidth: 2,
    borderColor: '#fef08a',
  },
  nodeActive: {
    backgroundColor: '#06b6d4', // Cyan
    shadowColor: '#06b6d4',
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 20,
    borderWidth: 2,
    borderColor: '#a5f3fc',
  },
  activeRing: {
    position: 'absolute',
    width: NODE_SIZE + 24,
    height: NODE_SIZE + 24,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#22d3ee',
    borderStyle: 'dashed',
    top: -12,
    left: -12,
    opacity: 0.6,
  },
  nodeLocked: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 2,
    shadowColor: '#000',
  },
  // Etiquetas
  labelContainer: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  labelContainerActive: {
    borderColor: '#06b6d4',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  labelContainerLocked: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
  },
  nodeLabel: {
    color: '#e2e8f0',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  nodeLabelLocked: {
    color: '#475569',
  },
  
  // MASCOTA
  mascotContainer: {
    position: 'absolute',
    left: 20, 
    top: NODE_HEIGHT * 0.8, 
    zIndex: 5,
    alignItems: 'center',
  },
  mascotGlow: {
      position: 'absolute',
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#22d3ee',
      opacity: 0.2,
      transform: [{ scale: 1.5 }],
  },
  speechBubble: {
      position: 'absolute',
      top: -25,
      left: 30,
      backgroundColor: '#22d3ee',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderBottomLeftRadius: 0,
  },
  speechText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#020617'
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155'
  },
  modalHeader: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 6,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#020617', // Mismo color de fondo que tu app
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 24,
  },
  modalTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center'
  },
  modalDesc: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22
  },
  startButton: {
    backgroundColor: '#06b6d4',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#06b6d4',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  startButtonText: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1
  }
});