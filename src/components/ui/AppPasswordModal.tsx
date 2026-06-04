/**
 * AppPasswordModal
 *
 * A reusable modal for verifying the app password before sensitive actions.
 * Supports a "Forgot Password?" flow that asks the 3 recovery questions.
 * If all answers are correct, the user can reset their password (and optionally questions).
 *
 * Usage:
 *   <AppPasswordModal
 *     visible={showModal}
 *     title="Enter Password to Export"
 *     onSuccess={() => doExport()}
 *     onCancel={() => setShowModal(false)}
 *   />
 */

import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@src/theme';
import {
  verifyPassword,
  getRecoveryQuestions,
  verifyRecoveryAnswers,
  setPassword,
} from '@src/services/appPasswordService';

type Phase =
  | 'verify'        // Enter PIN
  | 'recovery-q'    // Answer recovery questions
  | 'reset-pin'     // Set new PIN after recovery
  | 'reset-qa';     // Optionally reset recovery questions

interface Props {
  visible: boolean;
  title?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AppPasswordModal({ visible, title, onSuccess, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>('verify');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Recovery Q&A state
  const [questions, setQuestions] = useState<[string, string, string] | null>(null);
  const [a1, setA1] = useState('');
  const [a2, setA2] = useState('');
  const [a3, setA3] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  // Reset PIN state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinResetError, setPinResetError] = useState('');

  // Recovery QA setup state (optional after reset)
  const [newQ1, setNewQ1] = useState('');
  const [newA1, setNewA1] = useState('');
  const [newQ2, setNewQ2] = useState('');
  const [newA2, setNewA2] = useState('');
  const [newQ3, setNewQ3] = useState('');
  const [newA3, setNewA3] = useState('');
  const [qaError, setQaError] = useState('');

  // Temp stored answers from recovery-q phase so reset-qa can reuse them if not changed
  const [recoveredAnswers, setRecoveredAnswers] = useState<[string, string, string]>(['', '', '']);

  useEffect(() => {
    if (visible) {
      reset();
    }
  }, [visible]);

  function reset() {
    setPhase('verify');
    setPin('');
    setPinError('');
    setA1(''); setA2(''); setA3('');
    setRecoveryError('');
    setNewPin(''); setConfirmPin('');
    setPinResetError('');
    setNewQ1(''); setNewA1('');
    setNewQ2(''); setNewA2('');
    setNewQ3(''); setNewA3('');
    setQaError('');
    setQuestions(null);
    setShowPassword(false);
  }

  // ── Phase: Verify PIN ──────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!pin.trim()) { setPinError('Please enter your password.'); return; }
    setLoading(true);
    const ok = await verifyPassword(pin.trim());
    setLoading(false);
    if (ok) {
      reset();
      onSuccess();
    } else {
      setPinError('Incorrect password. Try again.');
      setPin('');
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    const qs = await getRecoveryQuestions();
    setLoading(false);
    if (!qs) { setPinError('No recovery questions found.'); return; }
    setQuestions(qs);
    setPhase('recovery-q');
  };

  // ── Phase: Recovery Questions ──────────────────────────────────────────────
  const handleVerifyRecovery = async () => {
    setLoading(true);
    const ok = await verifyRecoveryAnswers(a1, a2, a3);
    setLoading(false);
    if (ok) {
      setRecoveredAnswers([a1, a2, a3]);
      setPhase('reset-pin');
    } else {
      setRecoveryError('One or more answers are incorrect. All must be correct.');
    }
  };

  // ── Phase: Reset PIN ───────────────────────────────────────────────────────
  const handleResetPin = () => {
    if (!newPin.trim()) { setPinResetError('Please enter a new password.'); return; }
    if (newPin !== confirmPin) { setPinResetError('Passwords do not match.'); return; }
    setPhase('reset-qa');
  };

  // ── Phase: Reset QA (optional) ────────────────────────────────────────────
  const handleSaveAll = async (keepOldQA: boolean) => {
    setLoading(true);
    try {
      if (keepOldQA && questions) {
        // Keep original questions, use recovered answers
        await setPassword(
          newPin,
          questions[0], recoveredAnswers[0],
          questions[1], recoveredAnswers[1],
          questions[2], recoveredAnswers[2],
        );
      } else {
        if (!newQ1.trim() || !newA1.trim() || !newQ2.trim() || !newA2.trim() || !newQ3.trim() || !newA3.trim()) {
          setQaError('Please fill in all questions and answers.');
          setLoading(false);
          return;
        }
        await setPassword(newPin, newQ1, newA1, newQ2, newA2, newQ3, newA3);
      }
    } catch {
      setQaError('Failed to save password. Please try again.');
      setLoading(false);
      return;
    }
    setLoading(false);
    reset();
    onSuccess();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <Pressable style={styles.overlay} onPress={onCancel} />
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.lockIconWrap}>
              <Ionicons name="lock-closed" size={22} color={colors.cyan} />
            </View>
            <Text style={styles.title}>
              {phase === 'verify' ? (title ?? 'App Password') :
               phase === 'recovery-q' ? 'Recovery Questions' :
               phase === 'reset-pin' ? 'Set New Password' :
               'Update Recovery Questions'}
            </Text>
            <Pressable onPress={onCancel} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* ── Verify PIN ── */}
            {phase === 'verify' && (
              <View>
                <Text style={styles.subtitle}>Enter your app password to continue.</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={[styles.input, pinError ? styles.inputError : null, { flex: 1, marginBottom: 0 }]}
                    value={pin}
                    onChangeText={(v) => { setPin(v); setPinError(''); }}
                    placeholder="Password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleVerify}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                  </Pressable>
                </View>
                {pinError ? <Text style={[styles.error, { marginTop: 12 }]}>{pinError}</Text> : null}
                <Pressable style={[styles.btn, styles.btnPrimary, { marginTop: pinError ? 0 : 12 }]} onPress={handleVerify} disabled={loading}>
                  {loading ? <ActivityIndicator color={colors.black} /> : <Text style={styles.btnTextPrimary}>Confirm</Text>}
                </Pressable>
                <Pressable style={styles.forgotBtn} onPress={handleForgotPassword} disabled={loading}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>
              </View>
            )}

            {/* ── Recovery Questions ── */}
            {phase === 'recovery-q' && questions && (
              <View>
                <Text style={styles.subtitle}>Answer all 3 questions correctly to reset your password.</Text>
                {([questions[0], questions[1], questions[2]] as const).map((q, idx) => {
                  const val = [a1, a2, a3][idx];
                  const setter = [setA1, setA2, setA3][idx];
                  return (
                    <View key={idx} style={styles.qaBlock}>
                      <Text style={styles.questionText}>{idx + 1}. {q}</Text>
                      <TextInput
                        style={styles.input}
                        value={val}
                        onChangeText={(v) => { setter(v); setRecoveryError(''); }}
                        placeholder="Your answer"
                        placeholderTextColor={colors.textMuted}
                        returnKeyType={idx === 2 ? 'done' : 'next'}
                      />
                    </View>
                  );
                })}
                {recoveryError ? <Text style={styles.error}>{recoveryError}</Text> : null}
                <Pressable style={[styles.btn, styles.btnPrimary]} onPress={handleVerifyRecovery} disabled={loading}>
                  {loading ? <ActivityIndicator color={colors.black} /> : <Text style={styles.btnTextPrimary}>Verify Answers</Text>}
                </Pressable>
                <Pressable style={styles.forgotBtn} onPress={() => setPhase('verify')}>
                  <Text style={styles.forgotText}>← Back to Password</Text>
                </Pressable>
              </View>
            )}

            {/* ── Reset PIN ── */}
            {phase === 'reset-pin' && (
              <View>
                <Text style={styles.subtitle}>Recovery verified! Set a new password.</Text>
                <TextInput
                  style={[styles.input, pinResetError ? styles.inputError : null]}
                  value={newPin}
                  onChangeText={(v) => { setNewPin(v); setPinResetError(''); }}
                  placeholder="New password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  autoFocus
                />
                <TextInput
                  style={[styles.input, pinResetError ? styles.inputError : null]}
                  value={confirmPin}
                  onChangeText={(v) => { setConfirmPin(v); setPinResetError(''); }}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleResetPin}
                />
                {pinResetError ? <Text style={styles.error}>{pinResetError}</Text> : null}
                <Pressable style={[styles.btn, styles.btnPrimary]} onPress={handleResetPin} disabled={loading}>
                  <Text style={styles.btnTextPrimary}>Next →</Text>
                </Pressable>
              </View>
            )}

            {/* ── Reset QA (optional) ── */}
            {phase === 'reset-qa' && (
              <View>
                <Text style={styles.subtitle}>Would you like to update your recovery questions?</Text>

                <View style={styles.qaBlock}>
                  <Text style={styles.questionText}>Question 1</Text>
                  <TextInput style={styles.input} value={newQ1} onChangeText={setNewQ1} placeholder="Enter question" placeholderTextColor={colors.textMuted} />
                  <TextInput style={styles.input} value={newA1} onChangeText={setNewA1} placeholder="Enter answer" placeholderTextColor={colors.textMuted} />
                </View>
                <View style={styles.qaBlock}>
                  <Text style={styles.questionText}>Question 2</Text>
                  <TextInput style={styles.input} value={newQ2} onChangeText={setNewQ2} placeholder="Enter question" placeholderTextColor={colors.textMuted} />
                  <TextInput style={styles.input} value={newA2} onChangeText={setNewA2} placeholder="Enter answer" placeholderTextColor={colors.textMuted} />
                </View>
                <View style={styles.qaBlock}>
                  <Text style={styles.questionText}>Question 3</Text>
                  <TextInput style={styles.input} value={newQ3} onChangeText={setNewQ3} placeholder="Enter question" placeholderTextColor={colors.textMuted} />
                  <TextInput style={styles.input} value={newA3} onChangeText={setNewA3} placeholder="Enter answer" placeholderTextColor={colors.textMuted} />
                </View>

                {qaError ? <Text style={styles.error}>{qaError}</Text> : null}

                <View style={styles.rowBtns}>
                  <Pressable style={[styles.btn, styles.btnSecondary, { flex: 1 }]} onPress={() => handleSaveAll(true)} disabled={loading}>
                    {loading ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.btnTextSecondary}>Keep Old Questions</Text>}
                  </Pressable>
                  <Pressable style={[styles.btn, styles.btnPrimary, { flex: 1 }]} onPress={() => handleSaveAll(false)} disabled={loading}>
                    {loading ? <ActivityIndicator color={colors.black} /> : <Text style={styles.btnTextPrimary}>Save New Questions</Text>}
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'center' },
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  card: {
    marginHorizontal: 20,
    backgroundColor: colors.surface1,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '90%',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  lockIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.cyanGlow,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 20 },

  input: {
    backgroundColor: colors.surface2,
    borderRadius: 12,
    padding: 14,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  eyeIcon: { padding: 14 },
  inputError: { borderColor: colors.expense },

  error: { fontSize: 13, color: colors.expense, marginBottom: 12 },

  btn: { borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  btnPrimary: { backgroundColor: colors.cyan },
  btnSecondary: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  btnTextPrimary: { fontSize: 15, fontWeight: '700', color: colors.black },
  btnTextSecondary: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },

  forgotBtn: { alignItems: 'center', paddingVertical: 10 },
  forgotText: { fontSize: 13, color: colors.cyan, fontWeight: '600' },

  qaBlock: { marginBottom: 16 },
  questionText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginBottom: 8 },

  rowBtns: { flexDirection: 'row', gap: 10 },
});
