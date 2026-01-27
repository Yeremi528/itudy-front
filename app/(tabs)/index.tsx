import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Cpu,
  Flame,
  Globe,
  Lock,
  X,
  Zap
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

// --- INTERFACES ---
interface Language {
  _id: string;
  code: string;
  name: string;
  flag: string;
  isActive: boolean;
}

interface TechCourse {
  tech: string;
  levels: string[];
}

const { width } = Dimensions.get('window');
const NODE_SIZE = 80; 
const NODE_HEIGHT = 160; 

// --- COMPONENTE DE FONDO (REUTILIZABLE) ---
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
  const { user, updateUserData } = useAuth(); // Asumo que user tiene la propiedad .active o similar
  const router = useRouter();

  // --- ESTADOS GENERALES ---
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  

  // --- ESTADOS DE ONBOARDING ---
  // Si user.active es null/false, iniciamos en onboardingStep 1, sino 0 (Home normal)
  // NOTA: Ajusta la condición `!user?.active` según cómo venga exactamente tu backend (null vs false)
  const [onboardingStep, setOnboardingStep] = useState(0); 
  const [techOptions, setTechOptions] = useState<TechCourse[]>([]);
  const [firstLesson, setFirstLesson] = useState<any>(false);
  
  // --- ESTADOS DEL MAPA (EXISTENTE) ---
  const [progress, setProgress] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [languages, setLanguages] = useState<Language[]>([]); 
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [nextID, setNextID] = useState("");

 
  // --- ANIMACIONES ---
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // 1. VERIFICACIÓN INICIAL DE USUARIO
  useEffect(() => {
    fetchLanguage()

    if (user && ( user.courses_info?.active === null || user?.courses_info.active === '')) { 
        setFirstLesson(true)
        setOnboardingStep(1); // Paso 1: Elegir Idioma
        setIsInitialLoading(false);
    }
  }, []);

  
  // Paso 2: Traer Tecnologías basadas en idioma
  const fetchTechByLang = async (langCode: string) => {
      const langCodeLower = langCode.toLowerCase();
      try {
          setIsInitialLoading(true);
          // API del Screenshot
          const response = await axios.get(`http://0.0.0.0:4518/courses?lang=${langCodeLower}`);
          if (response.data) {
              setTechOptions(response.data);
              setOnboardingStep(2); 
          }
      } catch (err) {
          Alert.alert("Error", "No pudimos cargar los cursos disponibles.");
      } finally {
          setIsInitialLoading(false);
      }
  };

  const handleLevelSelection = async (tech: string, level: string) => {
    const levelLower = level.toLowerCase().trim();
    const techLower = tech.toLowerCase().trim();


    if (levelLower === 'junior') {
        // Lógica de éxito para JUNIOR
        
        const successAction = () => {
            updateUserProgress(techLower, levelLower);
            setOnboardingStep(0); 
            
        };

        if (Platform.OS === 'web') {
            // SOLUCIÓN PARA WEB: Usamos window.confirm nativo del navegador
            // window.confirm devuelve true si el usuario da "Aceptar"
            const userAccepted = window.confirm(`¡Bienvenido! Comenzando ruta ${tech} nivel Junior`);
            if (userAccepted) {
                successAction();
            }
        } else {
            // SOLUCIÓN PARA MÓVIL (iOS/Android): Tu Alert original
            Alert.alert("¡Bienvenido!", `Comenzando ruta ${tech} nivel Junior`, [
                { 
                    text: "Dale con todo", 
                    onPress: successAction
                }
            ]);
        }

    } // Agregar else con redirreción
};
  // --- FUNCIONES EXISTENTES (MAPA) ---
  const goToLesson = (ID: string, nextID: string) => {
    const [tech, level] = user?.courses_info?.active?.split('_') || [];

    const idAsString = String(ID);
    setSelectedCourse(null)
    router.navigate({
      pathname: "/lesson",
      params: { 
          id: idAsString,
          courseId: `${tech}_${level}`,       
          userId: user?.id,
          nextLessonId: nextID
      }
    });
  };

 

  const fetchLanguage = async () => {
    try {
      const response = await axios.get("http://localhost:4518/courses/languages");
      if (response.data && response.data.length > 0) {
          setLanguages(response.data);
      } else {
          console.warn("La API devolvió un array vacío");
      }
    } catch (error) {
      console.error("Error fetching languages:", error);
    }
  }

  const fetchProgress = async () => {
    
    if (!user?.id) return;
    const [tech, level] = user?.courses_info?.active?.split('_') || [];
    try {
      const PROGRESS_URL = `http://0.0.0.0:4518/lessons?userID=${user?.id}&courseID=${tech}_${level}`;
      const response = await axios.get(PROGRESS_URL); 
      if (response.data) {
        setProgress(response.data);
      }
    } catch (error) {
      console.error("Error updating progress", error);
    }
  };

  const updateUserProgress = async (tech: string, level: string) => {
    if (!user?.id) return;
    if (!firstLesson) return; // Asumo que esto viene de props o estado local

    try {
      // OJO: 0.0.0.0 no suele funcionar en Android Emulator, usa 10.0.2.2 o tu IP local
      const UPDATE_PROGRESS_URL = `http://0.0.0.0:4518/user`; 

      const newCoursesInfo = {
          active: `${tech}_${level}`,
          list: [{ id: `${tech}_${level}` }] // Asegúrate de manejar la lógica de agregar a la lista, no reemplazarla toda si ya tenías cursos
      };

      const payload = {
        id: user.id,        
        courses_info: newCoursesInfo,
      };

      // 1. Actualizar en Backend
      await axios.put(UPDATE_PROGRESS_URL, payload);

      // 2. Actualizar en Contexto Global + AsyncStorage
      // Aquí solo pasas la parte que cambió
      await updateUserData({ courses_info: newCoursesInfo as any }); 
      

  } catch (error) {
    console.log("Error updating user progress", error);
  }
}
  const createProgress = async (tech:string,level:string, firstCourse:string) => {
    if (!user?.id) return;
    if (!firstLesson) return;

    try {
      const CREATE_PROGRESS_URL = `http://0.0.0.0:4518/lessons`;

      console.log(firstCourse,"first Course")
      const firstLesson = {
        id:`lesson_${user?.id}_${tech}_${level}`,
        user_id: user?.id,
        course_id: `${tech}_${level}`,
        last_lesson_id: firstCourse,
        lessons_progress: {
          [firstCourse]: { status: "active" }
        },
      }
      await axios.post(CREATE_PROGRESS_URL, firstLesson );
      setProgress(firstLesson);
    }  catch (error) {
      console.log("Error creating progress", error);
    }
  }

  useFocusEffect(
    useCallback(() => {
        if (onboardingStep === 0)   fetchProgress();
    }, [onboardingStep,data])
  );

  useEffect(() => {
    // Animaciones
    Animated.loop(Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: Platform.OS !== 'web' })
    ])).start();
    Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' })
    ])).start();
    Animated.loop(Animated.timing(rotateAnim, {
        toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web'
    })).start();
  }, []);

  useEffect(() => {
    if (onboardingStep === 0 && user?.courses_info?.active != "") {
        const fetchCourses = async () => {
          const languagesCodeLower = selectedLang?.code.toLowerCase() || 'es';
          try {
            const [tech, level] = user?.courses_info?.active?.split('_') || [];
            const API_URL = `http://0.0.0.0:4518/courses/byID?lv=${level}&lang=${languagesCodeLower}&tech=${tech}`; 
            const response = await axios.get(API_URL); 
            if (response.data && response.data.courses) {
                setData(response.data.courses);
            }

            if (firstLesson){
              const firstCourse = response?.data.courses[0]?.course_id || ''
              createProgress(tech,level, firstCourse);
              setFirstLesson(false);
            
            }
          } catch (error) {
            console.error("Error loading courses", error);
          } finally {
            setIsInitialLoading(false);
          }
        };
        fetchCourses();
    }
  }, [languages, selectedLang, onboardingStep,user]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const getPosition = (index: number) => {
    const pattern = ['center', 'left', 'center', 'right'];
    return pattern[index % 4];
  };

  // --- RENDERIZADO CONDICIONAL ---

  if (isInitialLoading) {
    return (
       <View style={styles.loadingContainer}>
          <TechBackground />
          <ActivityIndicator size="large" color="#22d3ee" />
          <Text style={[styles.loadingText, {marginTop: 20}]}>Sincronizando...</Text>
       </View>
    );
  }

  // --- VISTA ONBOARDING PASO 1: IDIOMA ---
  if (onboardingStep === 1) {
      return (
        <View style={styles.container}>
            <TechBackground />
            <SafeAreaView style={{ flex: 1, padding: 24 }}>
                <View style={styles.onboardingHeader}>
                    <Globe color="#22d3ee" size={48} />
                    <Text style={styles.onboardingTitle}>Hola, Dev.</Text>
                    <Text style={styles.onboardingSubtitle}>Para empezar, ¿en qué idioma prefieres aprender?</Text>
                </View>

                <ScrollView contentContainerStyle={{ gap: 16 }}>
                    {languages.map((lang) => (
                        <TouchableOpacity 
                            key={lang._id} 
                            style={styles.cardSelect}
                            onPress={() => {
                                setSelectedLang(lang);
                                fetchTechByLang(lang?.code);
                            }}
                        >
                            <Text style={{fontSize: 32}}>{lang.flag}</Text>
                            <Text style={styles.cardSelectText}>{lang.name}</Text>
                            <ChevronRight color="#38bdf8" />
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </View>
      );
  }

  // --- VISTA ONBOARDING PASO 2: TECH & NIVEL ---
  if (onboardingStep === 2) {
    return (
      <View style={styles.container}>
          <TechBackground />
          <SafeAreaView style={{ flex: 1, padding: 24 }}>
              <TouchableOpacity onPress={() => setOnboardingStep(1)} style={{marginBottom: 20}}>
                  <Text style={{color: '#94a3b8'}}>← Volver</Text>
              </TouchableOpacity>

              <View style={styles.onboardingHeader}>
                  <Code2 color="#f472b6" size={48} />
                  <Text style={styles.onboardingTitle}>Elige tu Stack</Text>
                  <Text style={styles.onboardingSubtitle}>
                    Selecciona la tecnología y tu nivel actual para personalizar tu ruta.
                  </Text>
              </View>

              <ScrollView contentContainerStyle={{ gap: 24, paddingBottom: 40 }}>
                  {techOptions.map((item, index) => (
                      <View key={index} style={styles.techCard}>
                          <LinearGradient
                              colors={['rgba(30, 41, 59, 0.8)', 'rgba(15, 23, 42, 0.9)']}
                              style={styles.techCardGradient}
                          >
                            <View style={styles.techTitleRow}>
                                <Cpu color="#fff" size={24} />
                                <Text style={styles.techTitle}>{item.tech}</Text>
                            </View>
                            
                            <View style={styles.divider} />
                            
                            <Text style={styles.levelLabel}>Selecciona tu nivel:</Text>
                            <View style={styles.levelContainer}>
                                {item.levels.map((level) => {
                                    // Estilos dinámicos según nivel
                                    let btnColor = '#38bdf8'; // Default Junior (Cyan)
                                    if(level === 'semi-senior') btnColor = '#fbbf24'; // Amber
                                    if(level === 'senior') btnColor = '#f87171'; // Red

                                    return (
                                        <TouchableOpacity 
                                            key={level}
                                            style={[styles.levelButton, { borderColor: btnColor }]}
                                            onPress={() => handleLevelSelection(item.tech, level)}
                                        >
                                            <View style={[styles.levelDot, { backgroundColor: btnColor }]} />
                                            <Text style={styles.levelText}>{level.charAt(0).toUpperCase() + level.slice(1)}</Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                          </LinearGradient>
                      </View>
                  ))}
              </ScrollView>
          </SafeAreaView>
      </View>
    );
  }

  // --- VISTA PRINCIPAL (MAPA) ---
  return (
    <View style={styles.container}>
      <TechBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* HEADER (Mismo código original) */}
        <View style={styles.header}>
            <TouchableOpacity 
                style={styles.langButton}
                onPress={() => setIsModalVisible(true)}
            >
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

            {/* Modal Selección Idioma (Home) */}
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
                        <Text style={styles.modalTitle}>Cambiar idioma</Text>
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
                                }}
                            >
                                <Text style={styles.optionFlag}>{item.flag}</Text>
                                <Text style={styles.optionText}>{item.name}</Text>
                                {selectedLang?.code === item.code && <View style={styles.checkDot} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>

        {/* MAPA DE CURSOS (Mismo código original) */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.titleContainer}>
            <View style={styles.chipContainer}>
                <Cpu size={12} color="#22d3ee" />
                <Text style={styles.subTitle}>RUTA BACKEND</Text>
            </View>
            <Text style={styles.mainTitle}>Golang Mastery</Text>
          </View>

          <View style={styles.mapContainer}>
            {data.length > 0 ? (
                data.map((course, index) => {
                  const currentID = course.course_id; 
                  const nextCourse = data[index + 1];
                  const nextID = nextCourse ? nextCourse.course_id : currentID;
                  const userLessonData = progress?.lessons_progress?.[currentID];
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
                            <Animated.View style={{ transform: isActive ? [{ scale: pulseAnim }] : [] }}>
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
                                  }} 
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
                <Text style={styles.loadingText}>Cargando mapa...</Text>
            )}
          </View>
          <View style={{height: 100}} /> 
        </ScrollView>

        {/* MODAL CURSO SELECCIONADO */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={!!selectedCourse}
          onRequestClose={() => setSelectedCourse(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient colors={['#0891b2', '#0f172a']} style={styles.modalHeader}>
                <Text style={{fontSize: 60}}>{selectedCourse?.icon}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedCourse(null)}>
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

// --- STYLES NUEVOS & VIEJOS ---
const styles = StyleSheet.create({
  // ... Styles de Onboarding Nuevos ...
  onboardingHeader: {
      marginBottom: 30,
      marginTop: 20
  },
  onboardingTitle: {
      color: 'white',
      fontSize: 32,
      fontWeight: '800',
      marginTop: 10
  },
  onboardingSubtitle: {
      color: '#94a3b8',
      fontSize: 16,
      marginTop: 8,
      lineHeight: 24
  },
  cardSelect: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(30, 41, 59, 0.6)',
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.2)',
      marginBottom: 10
  },
  cardSelectText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
      marginLeft: 15
  },
  techCard: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  techCardGradient: {
      padding: 20,
  },
  techTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 15
  },
  techTitle: {
      color: 'white',
      fontSize: 24,
      fontWeight: 'bold'
  },
  divider: {
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.1)',
      marginBottom: 15
  },
  levelLabel: {
      color: '#94a3b8',
      fontSize: 14,
      marginBottom: 12
  },
  levelContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10
  },
  levelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 100,
      borderWidth: 1,
      backgroundColor: 'rgba(0,0,0,0.3)',
      gap: 6
  },
  levelDot: {
      width: 8,
      height: 8,
      borderRadius: 4
  },
  levelText: {
      color: '#e2e8f0',
      fontWeight: '600',
      fontSize: 13
  },

  // ... Styles Originales mantenidos abajo ...
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937', 
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
    backgroundColor: '#020617', 
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
    backgroundColor: 'rgba(2, 6, 23, 0.5)', 
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.1)',
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
  nodeButton: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: 20, 
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
    backgroundColor: '#020617', 
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