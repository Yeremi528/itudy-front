import { URL_BASE } from "@/constants/URL";
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle,
    Cpu,
    Heart,
    Terminal,
    X
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';


// --- COMPONENTES VISUALES (MANTENIDOS) ---
const ProgressBar = ({ current, total }: any) => {
    // Aseguramos que total sea al menos 1 y current no supere a total
    const safeTotal = Math.max(1, total);
    const safeCurrent = Math.min(current, safeTotal);
    const progress = (safeCurrent / safeTotal) * 100;

    return (
        <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
        </View>
    );
};

const TechImageFrame = ({ children }:any) => (
    <View style={styles.frameContainer}>
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />
        <View style={styles.frameContent}>
            {children}
        </View>
        <LinearGradient 
            colors={['transparent', 'rgba(6, 182, 212, 0.1)', 'transparent']} 
            style={StyleSheet.absoluteFill}
            start={{x: 0, y:0}} end={{x: 0, y: 1}} 
        />
    </View>
);

export default function LessonScreen() {
  const router = useRouter();

  const params = useLocalSearchParams(); // Obtenemos params fuera del useEffect para uso general
  const { id: lessonId, courseId, userId,nextLessonId } = params;
  
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle'); 
  const [lives, setLives] = useState(5);
  
  // LOGICA CAMBIADA: Iniciamos en null para saber que está cargando
  const [data, setData] = useState<any>(null); 
  const [loading, setLoading] = useState(true);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(20)).current;
  
  const updateLessonProgress = async (lessonID: string,courseID:string, userID: string) => {
    try {
        const UPDATE_URL = `${URL_BASE}/lessons?userID=${userID}&courseID=${courseID}&lessonID=${lessonID}&nextID=${nextLessonId}`;
        await axios.put(UPDATE_URL);
    }catch (error) {
        console.error("Error actualizando progreso de lección:", error);
    }
  }
  // Efecto para obtener datos
  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        setLoading(true);
        const lessonId = params.id;

        // Ajusta tu IP si es necesario (ej: 192.168.1.XX para celular físico)
        const API_URL = `${URL_BASE}/courses/${lessonId}/content`; 

        const response = await axios.get(API_URL);

        if (response.data) {
           // 1. REINICIAMOS ESTADOS para evitar el bug de "ya completado"
           setStatus('idle');
           setStepIndex(0);
           setLives(5);

           // 2. CONSTRUIMOS LA DATA (Mapeo)
           // La API devuelve objeto plano, nosotros necesitamos un array 'content'
           const normalizedData = {
              content: [
                  // Elemento 1: La Teoría (creado manualmente desde response)
                  {
                      type: 'theory',
                      title: 'Lección del Día', 
                      markdown: response.data.theory_markdown || "Contenido no disponible.",
                      image_url: null 
                  },
                  // Elementos 2+: Los Ejercicios (mapeados del array exercises)
                  ...(response.data.exercises || []).map((ex: any) => ({
                      type: 'exercise',
                      question: ex.question,
                      options: ex.options,
                      correct_answer_index: ex.correct_answer_index,
                      explanation: ex.explanation,
                      code_snippet: ex.code_snippet
                  }))
              ]
           };

           setData(normalizedData);
        }
      } catch (error) {
        console.error("Error cargando lección:", error);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
        fetchLessonData();
    }
  }, [params.id]);
  // Efecto para animaciones de transición entre pasos
  // Efecto para animaciones: Agregamos 'loading' para que anime al aparecer la data
  useEffect(() => {
    fadeAnim.setValue(0);
    contentAnim.setValue(20);
    
    // Pequeño delay para asegurar que el render esté listo
    Animated.parallel([
        Animated.timing(fadeAnim, { 
            toValue: 1, 
            duration: 500, 
            useNativeDriver: Platform.OS !== 'web' // Corrección para el warning de native driver
        }),
        Animated.timing(contentAnim, { 
            toValue: 0, 
            duration: 500, 
            useNativeDriver: Platform.OS !== 'web' 
        })
    ]).start();
  }, [stepIndex, loading]); // <--- CLAVE: Agregamos 'loading' aquí

  // --- LOGICA DE RENDERIZADO DINÁMICO ---
  
  // Si está cargando o no hay datos aún, mostramos Loading manteniendo el fondo
  if (loading || !data || !data.content) {
      return (
        <SafeAreaView style={styles.container}>
             <LinearGradient colors={['#020617', '#0f172a']} style={StyleSheet.absoluteFill} />
             <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                <ActivityIndicator size="large" color="#22d3ee" />
                <Text style={{color: '#94a3b8', marginTop: 10}}>Decodificando lección...</Text>
             </View>
        </SafeAreaView>
      );
  }

  // VARIABLES DEPENDIENTES DE `data` (NO de la constante mockeada)
  const currentStep = data.content[stepIndex];
  const totalSteps = data.content.length;
  
  // Protección extra por si stepIndex se desborda (aunque no debería)
  if (!currentStep) return null; 

  const isTheory = currentStep.type === 'theory';

  const handleCheck = () => {
    if (isTheory) {
        handleNext();
        return;
    }

    if (selectedOption === null) return;

    if (selectedOption === currentStep.correct_answer_index) {
        setStatus('correct');
    } else {
        setStatus('wrong');
        setLives(l => Math.max(0, l - 1));
    }
  };

  const handleNext = async () => {
    if (stepIndex < totalSteps - 1) {
        setStepIndex(stepIndex + 1);
        setSelectedOption(null);
        setStatus('idle');
    } else {

        if (lessonId && courseId && userId) {
             await updateLessonProgress(lessonId as string, courseId as string, userId as string);
        }

        router.back();
    }
  };

  // --- RENDERIZADO DE TEORÍA ---
  const renderTheory = () => (
    <View style={{ flex: 1 }}>
        <Text style={styles.theoryTitle}>{currentStep.title}</Text>
        
        <View style={{ height: 250, marginVertical: 24 }}>
            <TechImageFrame>
                {/* Intentamos cargar imagen remota si existe, sino placeholder */}
                {currentStep.image_url ? (
                    // Aquí deberías usar <Image /> real de react-native
                    // Como pediste mantener estilos, dejo el placeholder visual pero con lógica
                   <View style={styles.placeholderImage}>
                        <Cpu size={64} color="#22d3ee" />
                        <Text style={styles.placeholderText}>IMAGEN: {currentStep.image_url.substring(0,10)}...</Text>
                   </View>
                ) : (
                    <View style={styles.placeholderImage}>
                        <Cpu size={64} color="#22d3ee" />
                        <Text style={styles.placeholderText}>VISUALIZACIÓN DE DATOS</Text>
                    </View>
                )}
            </TechImageFrame>
        </View>

        <View style={styles.markdownBox}>
            <Text style={styles.markdownText}>{currentStep.markdown}</Text>
        </View>
    </View>
  );

  // --- RENDERIZADO DE EJERCICIO ---
  const renderExercise = () => {
    // Verificamos si existe el snippet y no es una cadena vacía
    const hasCode = currentStep.code_snippet && currentStep.code_snippet.trim().length > 0;

    return (
        <View style={{ flex: 1 }}>
            <Text style={styles.questionTitle}>DESAFÍO DE CÓDIGO</Text>
            <Text style={styles.questionText}>{currentStep.question}</Text>

            {/* Renderizado condicional mejorado */}
            {hasCode && (
                <View style={styles.codeBlock}>
                    <View style={{flexDirection:'row', alignItems:'center', marginBottom: 8, gap: 6}}>
                        <Terminal size={16} color="#64748b" />
                        <Text style={{color:'#64748b', fontSize:12, fontWeight:'bold'}}>EJEMPLO</Text>
                    </View>
                    
                    <Text style={styles.codeText}>
                        {currentStep.code_snippet}
                    </Text>
                </View>
            )}

            <View style={styles.optionsContainer}>
                {currentStep.options?.map((opt: string, idx: number) => {
                    const isSelected = selectedOption === idx;
                    
                    let borderStyle = styles.optionButton;
                    
                    if (isSelected) {
                        borderStyle = styles.optionSelected;
                    }

                    return (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.baseOption, borderStyle]}
                            onPress={() => status === 'idle' && setSelectedOption(idx)}
                            disabled={status !== 'idle'}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.optionKey, isSelected && {backgroundColor: '#22d3ee'}]}>
                                <Text style={[styles.optionKeyText, isSelected && {color: '#0f172a'}]}>
                                    {String.fromCharCode(65 + idx)}
                                </Text>
                            </View>
                            <Text style={styles.optionText}>{opt}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
        <LinearGradient
            colors={['#020617', '#0f172a']}
            style={StyleSheet.absoluteFill}
        />

        {/* --- HEADER --- */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                <X color="#94a3b8" size={24} />
            </TouchableOpacity>
            
            <View style={{flex: 1, paddingHorizontal: 16}}>
                <ProgressBar current={stepIndex + 1} total={totalSteps} />
            </View>

            <View style={styles.livesContainer}>
                <Heart fill="#ef4444" color="#ef4444" size={20} />
                <Text style={styles.livesText}>{lives}</Text>
            </View>
        </View>

        {/* --- CONTENIDO PRINCIPAL --- */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: contentAnim }], flex: 1 }}>
                {isTheory ? renderTheory() : renderExercise()}
            </Animated.View>
        </ScrollView>

        {/* --- FOOTER / BOTÓN DE ACCIÓN --- */}
<View style={styles.footer}>
            {status === 'idle' ? (
                <TouchableOpacity 
                    style={[
                        styles.mainButton, 
                        (!isTheory && selectedOption === null) && styles.disabledButton
                    ]}
                    onPress={handleCheck}
                    disabled={!isTheory && selectedOption === null}
                >
                    <Text style={styles.mainButtonText}>
                        {isTheory ? 'CONTINUAR' : 'COMPROBAR'}
                    </Text>
                </TouchableOpacity>
            ) : (
                // --- AQUÍ ESTÁ EL CAMBIO VISUAL (Feedback Container) ---
                <View style={[
                    styles.feedbackCard, 
                    status === 'correct' ? styles.feedbackCardSuccess : styles.feedbackCardError
                ]}>
                    <View style={styles.feedbackHeader}>
                        {status === 'correct' ? (
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                <CheckCircle color="#22c55e" fill="#dcfce7" size={28} />
                                <Text style={styles.feedbackTitle}>¡Excelente!</Text>
                            </View>
                        ) : (
                            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                                <AlertCircle color="#ef4444" fill="#fee2e2" size={28} />
                                <View style={{flex: 1}}> 
                                    <Text style={styles.feedbackTitleError}>Incorrecto</Text>
                                    <Text style={styles.feedbackSubError}>
                                        {currentStep.explanation || "Respuesta incorrecta"}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                    
                    <TouchableOpacity 
                        style={[
                            styles.feedbackButton, 
                            status === 'correct' ? {backgroundColor: '#22c55e'} : {backgroundColor: '#ef4444'}
                        ]} 
                        onPress={handleNext}
                    >
                        <Text style={styles.feedbackButtonText}>
                            CONTINUAR
                        </Text>
                        <ArrowRight size={20} color="white" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    </SafeAreaView>
  );
}

// ... TUS ESTILOS SE MANTIENEN IGUAL ...
const styles = StyleSheet.create({
  // Pega aquí los estilos que tenías en tu archivo original
  // (container, header, progressContainer, etc...)
  // Para que el código compile, asegúrate de mantener 'container', 'progressContainer', etc.
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#1e293b',
  },
  iconButton: {
      padding: 8,
      backgroundColor: '#1e293b',
      borderRadius: 12,
  },
  livesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.2)'
  },
  livesText: {
      color: '#ef4444',
      fontWeight: 'bold',
      fontSize: 14
  },
  progressContainer: {
      height: 8,
      backgroundColor: '#1e293b',
      borderRadius: 4,
      overflow: 'hidden',
  },
  progressTrack: {
      flex: 1,
      backgroundColor: '#1e293b',
  },
  progressFill: {
      height: '100%',
      backgroundColor: '#22d3ee',
      borderRadius: 4,
  },
  scrollContent: {
      padding: 24,
      paddingBottom: 150, // Espacio para el footer
  },
  
  // THEORY
  theoryTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: 'white',
      marginBottom: 8,
  },
  markdownBox: {
      backgroundColor: 'rgba(30, 41, 59, 0.5)',
      padding: 20,
      borderRadius: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#22d3ee',
  },
  markdownText: {
      color: '#cbd5e1',
      fontSize: 16,
      lineHeight: 26,
  },
  
  // FRAME TECH
  frameContainer: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#334155',
      backgroundColor: '#020617',
      overflow: 'hidden',
      position: 'relative',
  },
  frameContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  corner: {
      position: 'absolute',
      width: 10,
      height: 10,
      borderColor: '#22d3ee',
      zIndex: 10,
  },
  tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  
  placeholderImage: {
      alignItems: 'center',
      gap: 16,
      opacity: 0.8
  },
  placeholderText: {
      color: '#22d3ee',
      fontSize: 12,
      fontWeight: 'bold',
      letterSpacing: 2
  },

  // EXERCISE
  questionTitle: {
      color: '#94a3b8',
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 1,
      marginBottom: 12,
      textTransform: 'uppercase'
  },
  questionText: {
      color: 'white',
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 24,
      lineHeight: 30
  },
  codeBlock: {
      backgroundColor: '#020617',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#334155',
      marginBottom: 32,
  },
  codeText: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: '#a5f3fc',
      fontSize: 14,
      lineHeight: 22
  },
  optionsContainer: {
      gap: 12,
  },
  baseOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      borderWidth: 2,
      gap: 16,
  },
  optionButton: {
      backgroundColor: '#1e293b',
      borderColor: '#334155',
  },
  optionSelected: {
      backgroundColor: 'rgba(34, 211, 238, 0.1)',
      borderColor: '#22d3ee',
  },
  optionKey: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: '#334155',
      justifyContent: 'center',
      alignItems: 'center',
  },
  optionKeyText: {
      color: '#94a3b8',
      fontWeight: 'bold',
      fontSize: 14
  },
  optionText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      flex: 1
  },


  disabledButton: {
      backgroundColor: '#334155',
      shadowOpacity: 0
  },
  mainButtonText: {
      color: '#020617',
      fontWeight: '900',
      fontSize: 16,
      letterSpacing: 1
  },
  
  // FEEDBACK
  feedbackContainer: {
      // styles for the bottom sheet result
  },
  feedbackSuccess: {
  },
  feedbackError: {
  },

  
 

  explanationText: {
      color: '#94a3b8',
      marginBottom: 20,
      lineHeight: 22
  },
  
 
  // ... resto de estilos ...

  // FOOTER & FEEDBACK MEJORADO
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 0, // Quitamos padding aquí para que el feedback toque los bordes si quieres, o déjalo en 24
    backgroundColor: 'transparent', 
},
mainButton: {
    margin: 24, // Margen para el botón normal
    backgroundColor: '#22d3ee',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#22d3ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
},
// ESTILO NUEVO: Tarjeta de Feedback (Fondo sólido)
feedbackCard: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
},
feedbackCardSuccess: {
    backgroundColor: '#064e3b', // Verde muy oscuro
    borderColor: '#059669',
},
feedbackCardError: {
    backgroundColor: '#450a0a', // Rojo muy oscuro
    borderColor: '#b91c1c',
},
feedbackHeader: {
    marginBottom: 20,
},
feedbackTitle: {
    color: '#4ade80', // Verde claro
    fontSize: 20,
    fontWeight: 'bold'
},
feedbackTitleError: {
    color: '#f87171', // Rojo claro
    fontSize: 20,
    fontWeight: 'bold'
},
feedbackSubError: {
    color: '#e2e8f0', // BLANCO GRISÁCEO (Mucho más legible)
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
},
feedbackButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    elevation: 2,
},
feedbackButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1
},
// ... resto de estilos
});

