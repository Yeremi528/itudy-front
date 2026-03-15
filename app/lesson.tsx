import { URL_BASE } from "@/constants/URL";
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle,
    Cpu,
    GripHorizontal,
    Heart,
    Terminal,
    X
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    LayoutAnimation,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';

// Configuración de LayoutAnimation para Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- COMPONENTES VISUALES ---
const ProgressBar = ({ current, total }: any) => {
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
  const params = useLocalSearchParams();
  const { id: lessonId, courseId, userId, nextLessonId } = params;
  
  const [stepIndex, setStepIndex] = useState(0);
  
  // userAnswer reemplaza a selectedOption para ser más dinámico (número, string, o array)
  const [userAnswer, setUserAnswer] = useState<any>(null);
  
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle'); 
  const [lives, setLives] = useState(5);
  const [data, setData] = useState<any>(null); 
  const [loading, setLoading] = useState(true);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(20)).current;
  
  const updateLessonProgress = async (lessonID: string, courseID:string, userID: string) => {
    try {
        const UPDATE_URL = `${URL_BASE}/lessons?userID=${userID}&courseID=${courseID}&lessonID=${lessonID}&nextID=${nextLessonId}`;
        await axios.put(UPDATE_URL);
    } catch (error) {
        console.error("Error actualizando progreso:", error);
    }
  }

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        setLoading(true);
        const API_URL = `${URL_BASE}/courses/${lessonId}/content`; 
        const response = await axios.get(API_URL);

        if (response.data) {
           setStatus('idle');
           setStepIndex(0);
           setLives(5);
           
           const normalizedData = {
              content: [
                  {
                      type: 'theory',
                      title: 'Lección del Día', 
                      markdown: response.data.theory_markdown || "Contenido no disponible.",
                      image_url: null 
                  },
                  ...(response.data.exercises || []).map((ex: any) => ({
                      ...ex
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

    if (lessonId) {
        fetchLessonData();
    }
  }, [lessonId]);

  useEffect(() => {
    fadeAnim.setValue(0);
    contentAnim.setValue(20);
    
    Animated.parallel([
        Animated.timing(fadeAnim, { 
            toValue: 1, 
            duration: 500, 
            useNativeDriver: Platform.OS !== 'web'
        }),
        Animated.timing(contentAnim, { 
            toValue: 0, 
            duration: 500, 
            useNativeDriver: Platform.OS !== 'web' 
        })
    ]).start();
  }, [stepIndex, loading]);

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

  const currentStep = data.content[stepIndex];
  const totalSteps = data.content.length;
  if (!currentStep) return null; 

  const isTheory = currentStep.type === 'theory';

  const handleCheck = () => {
    if (isTheory) {
        handleNext();
        return;
    }

    if (userAnswer === null || userAnswer === '') return;

    let isCorrect = false;

    switch (currentStep.type) {
        case 'multiple_choice':
        case 'true_false':
            isCorrect = userAnswer === currentStep.correct_answer_index;
            break;
        case 'code_fix':
            isCorrect = userAnswer === currentStep.error_line_index;
            break;
        case 'fill_in_the_blank':
            isCorrect = String(userAnswer).trim().toLowerCase() === String(currentStep.correct_answer).toLowerCase();
            break;
        case 'drag_and_drop':
            // Aseguramos que todas las ranuras estén llenas
            if (Array.isArray(userAnswer) && userAnswer.length === currentStep.correct_order.length) {
                isCorrect = JSON.stringify(userAnswer) === JSON.stringify(currentStep.correct_order);
            }
            break;
        default:
            isCorrect = false;
    }

    if (isCorrect) {
        setStatus('correct');
    } else {
        setStatus('wrong');
        setLives(l => Math.max(0, l - 1));
    }
  };

  const handleNext = async () => {
    if (stepIndex < totalSteps - 1) {
        setStepIndex(stepIndex + 1);
        setUserAnswer(null); // Reset answer for next step
        setStatus('idle');
    } else {
        if (lessonId && courseId && userId) {
             await updateLessonProgress(lessonId as string, courseId as string, userId as string);
        }
        router.back();
    }
  };

  // --- RENDERIZADORES ESPECÍFICOS ---

  const renderTheory = () => (
    <View style={{ flex: 1 }}>
        <Text style={styles.theoryTitle}>{currentStep.title}</Text>
        <View style={{ height: 250, marginVertical: 24 }}>
            <TechImageFrame>
                {currentStep.image_url ? (
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

  const renderMultipleChoice = () => (
    <View style={styles.optionsContainer}>
        {currentStep.options?.map((opt: string, idx: number) => {
            const isSelected = userAnswer === idx;
            return (
                <TouchableOpacity
                    key={idx}
                    style={[styles.baseOption, isSelected ? styles.optionSelected : styles.optionButton]}
                    onPress={() => status === 'idle' && setUserAnswer(idx)}
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
  );

  const renderTrueFalse = () => {
    // Para verdadero y falso, mostramos dos botones lado a lado.
    return (
      <View style={{flexDirection: 'row', gap: 16, marginTop: 10}}>
          {currentStep.options?.map((opt: string, idx: number) => {
              const isSelected = userAnswer === idx;
              const isTrue = opt.toLowerCase() === 'true';
              const label = isTrue ? 'VERDADERO' : 'FALSO';
              
              // Colores dinámicos al seleccionar
              const selectedBgColor = isTrue ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
              const selectedBorderColor = isTrue ? '#22c55e' : '#ef4444';
              const selectedTextColor = isTrue ? '#4ade80' : '#f87171';

              return (
                  <TouchableOpacity
                      key={idx}
                      style={[
                          styles.baseOption, 
                          styles.optionButton,
                          { flex: 1, justifyContent: 'center' },
                          isSelected && { backgroundColor: selectedBgColor, borderColor: selectedBorderColor }
                      ]}
                      onPress={() => status === 'idle' && setUserAnswer(idx)}
                      disabled={status !== 'idle'}
                      activeOpacity={0.7}
                  >
                      <Text style={[
                          styles.optionText, 
                          { textAlign: 'center', fontSize: 18 },
                          isSelected && { color: selectedTextColor, fontWeight: '900' }
                      ]}>
                          {label}
                      </Text>
                  </TouchableOpacity>
              );
          })}
      </View>
    );
  };

  const renderCodeFix = () => {
    // Reemplazamos literales "\\n" por saltos de línea reales en caso de que el backend los mande escapados
    const rawSnippet = currentStep.code_snippet || '';
    const formattedSnippet = rawSnippet.replace(/\\n/g, '\n');
    const lines = formattedSnippet ? formattedSnippet.split('\n') : [];
    
    return (
        <View style={styles.codeFixContainer}>
            <View style={styles.codeBlockHeader}>
                <Terminal size={16} color="#64748b" />
                <Text style={styles.codeBlockTitle}>ENCUENTRA EL ERROR</Text>
            </View>
            <View style={styles.codeBlockBody}>
                {lines.length > 0 ? lines.map((line: string, index: number) => {
                    const isSelected = userAnswer === index;
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[styles.codeLineButton, isSelected && styles.codeLineSelected]}
                            onPress={() => status === 'idle' && setUserAnswer(index)}
                            disabled={status !== 'idle'}
                        >
                            <Text style={styles.codeLineNumber}>{index + 1}</Text>
                            <Text style={[styles.codeLineText, isSelected && {color: '#22d3ee'}]}>{line}</Text>
                        </TouchableOpacity>
                    );
                }) : (
                    <Text style={{color: '#ef4444', padding: 16}}>Error: No se recibió código para analizar.</Text>
                )}
            </View>
        </View>
    );
  };

  const renderFillInTheBlank = () => {
    // Reemplazamos "___" por un input y arreglamos saltos de línea
    const rawSnippet = currentStep.code_snippet || '';
    const formattedSnippet = rawSnippet.replace(/\\n/g, '\n');
    const parts = formattedSnippet ? formattedSnippet.split('___') : [];
    
    return (
        <View style={styles.fillInContainer}>
            <View style={styles.codeBlockHeader}>
                <Terminal size={16} color="#64748b" />
                <Text style={styles.codeBlockTitle}>COMPLETA EL CÓDIGO</Text>
            </View>
            <View style={styles.fillInBody}>
                <Text style={styles.fillInCodeText}>
                    {parts[0]}
                </Text>
                <TextInput
                    style={[
                        styles.fillInInput, 
                        status === 'wrong' && styles.inputError,
                        status === 'correct' && styles.inputSuccess
                    ]}
                    value={userAnswer || ''}
                    onChangeText={(text) => status === 'idle' && setUserAnswer(text)}
                    editable={status === 'idle'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Escribe aquí"
                    placeholderTextColor="#64748b"
                />
                <Text style={styles.fillInCodeText}>
                    {parts[1]}
                </Text>
            </View>
        </View>
    );
  };

  const renderDragAndDrop = () => {
    // Inicializar el estado de Drag and Drop si no existe
    const blocks: string[] = currentStep.available_blocks || [];
    const currentAns = Array.isArray(userAnswer) ? userAnswer : [];
    
    // Función para mover un bloque de las opciones a las ranuras
    const addBlock = (blockIndex: number) => {
        if (status !== 'idle') return;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setUserAnswer([...currentAns, blockIndex]);
    };

    // Función para quitar un bloque de las ranuras
    const removeBlock = (slotIndex: number) => {
        if (status !== 'idle') return;
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newAns = [...currentAns];
        newAns.splice(slotIndex, 1);
        setUserAnswer(newAns);
    };

    return (
        <View style={styles.dndContainer}>
            <Text style={styles.dndSectionTitle}>LÍNEA DE CÓDIGO</Text>
            
            {/* Ranuras (Slots) */}
            <View style={styles.dndSlotsContainer}>
                {blocks.map((_, index) => {
                    const blockIndex = currentAns[index];
                    const isFilled = blockIndex !== undefined;
                    
                    return (
                        <TouchableOpacity 
                            key={`slot-${index}`}
                            style={[styles.dndSlot, isFilled && styles.dndSlotFilled]}
                            onPress={() => isFilled && removeBlock(index)}
                            activeOpacity={0.8}
                            disabled={!isFilled || status !== 'idle'}
                        >
                            {isFilled ? (
                                <Text style={styles.dndBlockText}>{blocks[blockIndex]}</Text>
                            ) : (
                                <Text style={styles.dndSlotTextPlaceholder}>vacío</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.dndDivider} />

            <Text style={styles.dndSectionTitle}>BLOQUES DISPONIBLES</Text>
            
            {/* Bloques Disponibles */}
            <View style={styles.dndBlocksContainer}>
                {blocks.map((block, index) => {
                    const isUsed = currentAns.includes(index);
                    if (isUsed) {
                        return (
                            <View key={`block-${index}`} style={[styles.dndBlock, styles.dndBlockUsed]}>
                                <Text style={styles.dndBlockTextUsed}>{block}</Text>
                            </View>
                        );
                    }
                    
                    return (
                        <TouchableOpacity 
                            key={`block-${index}`}
                            style={styles.dndBlock}
                            onPress={() => addBlock(index)}
                            activeOpacity={0.7}
                            disabled={status !== 'idle'}
                        >
                            <GripHorizontal size={14} color="#64748b" style={{marginRight: 6}} />
                            <Text style={styles.dndBlockText}>{block}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
  };

  const renderExercise = () => {
    // Mostrar siempre el snippet si existe, independientemente del tipo de ejercicio, a menos que el tipo de ejercicio (como code_fix o fill_in) ya lo renderice de forma especial
    const isSpecialRender = currentStep.type === 'code_fix' || currentStep.type === 'fill_in_the_blank';
    const hasGeneralSnippet = currentStep.code_snippet && !isSpecialRender;

    // Determinar si el botón debe estar deshabilitado
    let isButtonDisabled = false;
    if (currentStep.type === 'drag_and_drop') {
        isButtonDisabled = !Array.isArray(userAnswer) || userAnswer.length !== currentStep.correct_order.length;
    } else {
        isButtonDisabled = userAnswer === null || userAnswer === '';
    }

    return (
        <View style={{ flex: 1 }}>
            <Text style={styles.questionTitle}>DESAFÍO: {currentStep.type.replace(/_/g, ' ')}</Text>
            <Text style={styles.questionText}>{currentStep.question}</Text>

            {hasGeneralSnippet && (
                <View style={styles.codeBlock}>
                    <View style={styles.codeBlockHeader}>
                        <Terminal size={16} color="#64748b" />
                        <Text style={styles.codeBlockTitle}>CÓDIGO</Text>
                    </View>
                    <Text style={styles.codeText}>
                        {(currentStep.code_snippet || '').replace(/\\n/g, '\n')}
                    </Text>
                </View>
            )}

            {currentStep.type === 'multiple_choice' && renderMultipleChoice()}
            {currentStep.type === 'true_false' && renderTrueFalse()}
            {currentStep.type === 'code_fix' && renderCodeFix()}
            {currentStep.type === 'fill_in_the_blank' && renderFillInTheBlank()}
            {currentStep.type === 'drag_and_drop' && renderDragAndDrop()}
            
            {/* Controlamos la visibilidad del botón de acción según el ejercicio */}
            <View style={styles.spacer} />
        </View>
    );
  };

  // Determinar si el botón principal está habilitado
  let isButtonDisabled = false;
  if (!isTheory) {
      if (currentStep.type === 'drag_and_drop') {
          isButtonDisabled = !Array.isArray(userAnswer) || userAnswer.length !== currentStep.correct_order.length;
      } else {
          isButtonDisabled = userAnswer === null || userAnswer === '';
      }
  }

  return (
    <SafeAreaView style={styles.container}>
        <LinearGradient
            colors={['#020617', '#0f172a']}
            style={StyleSheet.absoluteFill}
        />

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

        <ScrollView contentContainerStyle={styles.scrollContent}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: contentAnim }], flex: 1 }}>
                {isTheory ? renderTheory() : renderExercise()}
            </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
            {status === 'idle' ? (
                <TouchableOpacity 
                    style={[styles.mainButton, isButtonDisabled && styles.disabledButton]}
                    onPress={handleCheck}
                    disabled={isButtonDisabled}
                >
                    <Text style={styles.mainButtonText}>
                        {isTheory ? 'CONTINUAR' : 'COMPROBAR'}
                    </Text>
                </TouchableOpacity>
            ) : (
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
                        <Text style={styles.feedbackButtonText}>CONTINUAR</Text>
                        <ArrowRight size={20} color="white" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  iconButton: { padding: 8, backgroundColor: '#1e293b', borderRadius: 12 },
  livesContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  livesText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  progressContainer: { height: 8, backgroundColor: '#1e293b', borderRadius: 4, overflow: 'hidden' },
  progressTrack: { flex: 1, backgroundColor: '#1e293b' },
  progressFill: { height: '100%', backgroundColor: '#22d3ee', borderRadius: 4 },
  scrollContent: { padding: 24, paddingBottom: 150 },
  
  // THEORY
  theoryTitle: { fontSize: 28, fontWeight: '800', color: 'white', marginBottom: 8 },
  markdownBox: { backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: 20, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#22d3ee' },
  markdownText: { color: '#cbd5e1', fontSize: 16, lineHeight: 26 },
  frameContainer: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: '#334155', backgroundColor: '#020617', overflow: 'hidden', position: 'relative' },
  frameContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 10, height: 10, borderColor: '#22d3ee', zIndex: 10 },
  tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  placeholderImage: { alignItems: 'center', gap: 16, opacity: 0.8 },
  placeholderText: { color: '#22d3ee', fontSize: 12, fontWeight: 'bold', letterSpacing: 2 },

  // EXERCISE GENERAL
  questionTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  questionText: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 24, lineHeight: 30 },
  spacer: { height: 40 },

  // CODE BLOCKS
  codeBlock: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 24 },
  codeBlockHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 8 },
  codeBlockTitle: { color: '#64748b', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  codeBlockBody: { paddingVertical: 8 },
  codeText: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#a5f3fc', fontSize: 14, lineHeight: 22 },

  // MULTIPLE CHOICE
  optionsContainer: { gap: 12 },
  baseOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 2, gap: 16 },
  optionButton: { backgroundColor: '#1e293b', borderColor: '#334155' },
  optionSelected: { backgroundColor: 'rgba(34, 211, 238, 0.1)', borderColor: '#22d3ee' },
  optionKey: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  optionKeyText: { color: '#94a3b8', fontWeight: 'bold', fontSize: 14 },
  optionText: { color: 'white', fontSize: 16, fontWeight: '600', flex: 1 },

  // CODE FIX
  codeFixContainer: { backgroundColor: '#0f172a', borderRadius: 12, borderWidth: 1, borderColor: '#334155', overflow: 'hidden', marginBottom: 20 },
  codeLineButton: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12, borderLeftWidth: 4, borderLeftColor: 'transparent' },
  codeLineSelected: { backgroundColor: 'rgba(34, 211, 238, 0.15)', borderLeftColor: '#22d3ee' },
  codeLineNumber: { width: 24, color: '#475569', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', textAlign: 'right', marginRight: 12 },
  codeLineText: { flex: 1, color: '#e2e8f0', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  // FILL IN THE BLANK
  fillInContainer: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 20 },
  fillInBody: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 10 },
  fillInCodeText: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#a5f3fc', fontSize: 18, lineHeight: 30 },
  fillInInput: { backgroundColor: '#1e293b', color: '#22d3ee', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 18, borderWidth: 1, borderColor: '#38bdf8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginHorizontal: 8, minWidth: 100, textAlign: 'center' },
  inputError: { borderColor: '#ef4444', color: '#ef4444' },
  inputSuccess: { borderColor: '#22c55e', color: '#22c55e' },

  // DRAG AND DROP
  dndContainer: { backgroundColor: '#0f172a', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b' },
  dndSectionTitle: { color: '#64748b', fontSize: 12, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
  dndSlotsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, minHeight: 60, alignItems: 'center' },
  dndSlot: { backgroundColor: '#1e293b', borderRadius: 8, borderWidth: 2, borderColor: '#334155', borderStyle: 'dashed', paddingHorizontal: 16, paddingVertical: 12, minWidth: 80, alignItems: 'center', justifyContent: 'center' },
  dndSlotFilled: { backgroundColor: '#22d3ee', borderColor: '#06b6d4', borderStyle: 'solid' },
  dndSlotTextPlaceholder: { color: '#475569', fontStyle: 'italic' },
  dndDivider: { height: 1, backgroundColor: '#1e293b', marginVertical: 20 },
  dndBlocksContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dndBlock: { flexDirection: 'row', backgroundColor: '#334155', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#475569', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 2 },
  dndBlockUsed: { backgroundColor: '#0f172a', borderColor: '#1e293b', elevation: 0 },
  dndBlockText: { color: 'white', fontWeight: 'bold', fontSize: 16, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  dndBlockTextUsed: { color: '#334155', fontWeight: 'bold', fontSize: 16, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  // FOOTER & FEEDBACK
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 0, backgroundColor: 'transparent' },
  mainButton: { margin: 24, backgroundColor: '#22d3ee', paddingVertical: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#22d3ee', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  disabledButton: { backgroundColor: '#334155', shadowOpacity: 0 },
  mainButtonText: { color: '#020617', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  
  feedbackCard: { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 10 },
  feedbackCardSuccess: { backgroundColor: '#064e3b', borderColor: '#059669' },
  feedbackCardError: { backgroundColor: '#450a0a', borderColor: '#b91c1c' },
  feedbackHeader: { marginBottom: 20 },
  feedbackTitle: { color: '#4ade80', fontSize: 20, fontWeight: 'bold' },
  feedbackTitleError: { color: '#f87171', fontSize: 20, fontWeight: 'bold' },
  feedbackSubError: { color: '#e2e8f0', fontSize: 14, marginTop: 4, lineHeight: 20 },
  feedbackButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 16, gap: 8, elevation: 2 },
  feedbackButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});


/**
{
    "_id": "content_node_jr_001",
    "course_ref_id": "node_jr_001",
    "theory_markdown": "# Node.js y el Motor V8\n\nNode.js es un entorno de ejecución (**runtime**) para JavaScript, construido sobre el motor **V8 de Google Chrome**. Node no es un framework ni un lenguaje; es una plataforma que permite ejecutar JavaScript fuera del navegador.\n\n### ¿Qué es el Motor V8?\nEs un motor de código abierto escrito en **C++** que compila JavaScript a código de máquina nativo mediante compilación JIT (Just-In-Time), haciéndolo extremadamente rápido.\n\n### Características Clave\n- **E/S sin bloqueo:** Node utiliza un modelo asíncrono basado en eventos.\n- **Multiplataforma:** Se ejecuta nativamente en Windows, Linux y macOS.\n- **Reutilización:** Permite usar el mismo lenguaje en frontend y backend, evitando el cambio de contexto cognitivo.",
    "code_snippet": "",
    "exercises": [
        {
            "id": "ex_001_01",
            "type": "multiple_choice",
            "question": "¿Qué lenguaje de bajo nivel se utilizó para programar el motor V8 subyacente de Node.js?",
            "options": [
                "Rust",
                "C++",
                "Assembly",
                "Go"
            ],
            "correct_answer_index": 1,
            "explanation": "V8 es un motor de alto rendimiento escrito en C++ que Node.js utiliza para compilar JavaScript a código de máquina."
        },
        {
            "id": "ex_001_02",
            "type": "true_false",
            "question": "Técnicamente, Node.js es considerado un framework de JavaScript para el backend.",
            "options": [
                "true",
                "false"
            ],
            "correct_answer_index": 1,
            "explanation": "Falso. Node.js es un entorno de ejecución (runtime), no un framework. Express.js o NestJS sí son frameworks que corren sobre Node."
        },
        {
            "id": "ex_001_03",
            "type": "fill_in_the_blank",
            "question": "Node.js destaca por utilizar un modelo de Entrada/Salida (E/S) de naturaleza ___ bloqueante.",
            "options": null,
            "correct_answer_index": 0,
            "explanation": "El diseño de Node.js se basa en operaciones No-Bloqueantes ('Non-blocking') para gestionar una alta concurrencia eficientemente.",
            "code_snippet": "Modelo de E/S de naturaleza ___ bloqueante",
            "correct_answer": "no"
        },
        {
            "id": "ex_001_04",
            "type": "multiple_choice",
            "question": "¿Qué ventaja real ofrece el que Node.js sea una plataforma 'multiplataforma'?",
            "options": [
                "Permite desplegar el mismo código en servidores Linux, macOS y Windows.",
                "Traduce automáticamente código JavaScript a Python o Ruby.",
                "Integra bases de datos SQL y NoSQL sin instalar drivers.",
                "Ejecuta el código simultáneamente en todos los núcleos del procesador."
            ],
            "correct_answer_index": 0,
            "explanation": "Ser multiplataforma significa que el entorno (runtime) existe y se ejecuta de forma consistente en distintos sistemas operativos."
        },
        {
            "id": "ex_001_05",
            "type": "multiple_choice",
            "question": "¿Cuál es el orden correcto del flujo interno cuando V8 procesa tu código JavaScript?",
            "options": [
                "1. Ejecución, 2. Análisis, 3. Compilación nativa.",
                "1. Compilación nativa, 2. Ejecución, 3. Análisis.",
                "1. Análisis (Parse), 2. Compilación JIT, 3. Ejecución nativa.",
                "1. Transformación a bytecode, 2. Análisis, 3. Ejecución."
            ],
            "correct_answer_index": 2,
            "explanation": "V8 primero analiza el código (creando un AST), luego lo compila a código de máquina con su compilador JIT, y finalmente lo ejecuta en el procesador."
        },
        {
            "id": "ex_001_06",
            "type": "multiple_choice",
            "question": "¿A qué se refiere la ventaja de 'falta de cambio de contexto' al usar Node.js?",
            "options": [
                "El Event Loop nunca pausa el hilo principal.",
                "Evita que el sistema operativo intercambie procesos en la CPU.",
                "El desarrollador usa JavaScript tanto en frontend como en backend.",
                "Las variables no pierden su alcance global."
            ],
            "correct_answer_index": 2,
            "explanation": "Al mantener el mismo lenguaje en toda la pila (Full Stack), el programador no gasta energía mental cambiando entre las sintaxis de distintos lenguajes."
        },
        {
            "id": "ex_001_07",
            "type": "true_false",
            "question": "El motor V8 funciona como un intérprete puro, leyendo y ejecutando JavaScript línea por línea en tiempo real.",
            "options": [
                "true",
                "false"
            ],
            "correct_answer_index": 1,
            "explanation": "Falso. V8 utiliza compilación Just-In-Time (JIT) para transformar el código JS directamente a lenguaje de máquina, optimizando la velocidad."
        },
        {
            "id": "ex_001_08",
            "type": "multiple_choice",
            "question": "¿Cuál fue el propósito principal para el cual Ryan Dahl creó Node.js?",
            "options": [
                "Reemplazar a los navegadores web tradicionales.",
                "Llevar la ejecución de JavaScript al lado del servidor.",
                "Crear un lenguaje compilado más rápido que Java.",
                "Construir bases de datos relacionales en memoria."
            ],
            "correct_answer_index": 1,
            "explanation": "Node.js nació con la idea de sacar a JavaScript del aislamiento del navegador y permitirle gestionar peticiones de red y sistema de archivos."
        },
        {
            "id": "ex_001_09",
            "type": "fill_in_the_blank",
            "question": "Node.js está construido integrando el motor JavaScript ___ de Google Chrome.",
            "options": null,
            "correct_answer_index": 0,
            "explanation": "V8 es el motor open source desarrollado por Google para Chrome y es la base de ejecución de Node.js.",
            "code_snippet": "Motor JavaScript ___ de Google Chrome",
            "correct_answer": "V8"
        },
        {
            "id": "ex_001_10",
            "type": "multiple_choice",
            "question": "¿Qué patrón arquitectónico permite a Node.js manejar miles de conexiones concurrentes consumiendo poca RAM?",
            "options": [
                "Modelo de E/S orientado a eventos (Event-driven I/O).",
                "Creación de un hilo (Thread) por cada petición web.",
                "Uso intensivo de memoria caché distribuida.",
                "Procesamiento multi-núcleo mediante Worker Threads por defecto."
            ],
            "correct_answer_index": 0,
            "explanation": "El modelo orientado a eventos no crea hilos pesados por cada usuario, sino que delega las tareas y atiende eventos cuando finalizan, ahorrando RAM."
        },
        {
            "id": "ex_001_11",
            "type": "true_false",
            "question": "Al ejecutar una aplicación en Node.js, es obligatorio compilar el código manualmente usando un comando previo antes de iniciarlo.",
            "options": [
                "true",
                "false"
            ],
            "correct_answer_index": 1,
            "explanation": "Falso. Node.js (gracias a V8) compila el código Just-In-Time al momento de ejecutar 'node archivo.js'. No hay un paso de compilación manual previo."
        },
        {
            "id": "ex_001_12",
            "type": "multiple_choice",
            "question": "¿Cuál de las siguientes tareas NO es responsabilidad directa del Motor V8 en Node.js?",
            "options": [
                "Ejecutar operaciones aritméticas.",
                "Recolectar la memoria basura (Garbage Collection).",
                "Manejar el acceso nativo al sistema de archivos del SO.",
                "Traducir objetos JS a código de máquina."
            ],
            "correct_answer_index": 2,
            "explanation": "V8 solo entiende y ejecuta JavaScript. El acceso al sistema de archivos, redes y asincronía es proveído por librerías en C++ de Node, como libuv."
        }
    ]
}
 */