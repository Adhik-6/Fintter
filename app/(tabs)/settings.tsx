/**
 * Settings Screen — connected to all management screens and backup/export services.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
  ActivityIndicator, TextInput, Modal, Switch,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@src/theme';
import { useStore } from '@src/store';
import { exportBackup, importBackup } from '@src/services/backupService';
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  cancelDailyReminder,
} from '@src/services/notificationService';
import {
  isPasswordSet,
  setPassword,
  removePassword,
} from '@src/services/appPasswordService';
import { AppPasswordModal } from '@src/components/ui/AppPasswordModal';
import { settingsRepository } from '@src/db/repositories/settingsRepository';
import { getDb, seedTestData } from '@src/db';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AED', 'SGD', 'AUD', 'CAD'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

interface SettingRowProps {
  icon: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
  danger?: boolean;
  value?: string;
  loading?: boolean;
}

function SettingItem({ iconName, label, onPress, danger, value, loading }: SettingRowProps) {
  return (
    <Pressable onPress={onPress} disabled={loading} style={styles.settingRow}>
      <Ionicons name={iconName} size={20} color={danger ? colors.expense : colors.cyan} style={styles.settingIcon} />
      <Text style={[styles.settingLabel, danger && { color: colors.expense }]}>{label}</Text>
      {loading && <ActivityIndicator size="small" color={colors.cyan} style={{ marginRight: 8 }} />}
      {value && !loading && <Text style={styles.settingValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

// ── Password Setup Flow Modal (Set or Change password) ────────────────────────
type SetupStep = 'pin' | 'qa';

interface PasswordSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function PasswordSetupModal({ visible, onClose, onSaved }: PasswordSetupModalProps) {
  const [step, setStep] = useState<SetupStep>('pin');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [q1, setQ1] = useState(''); const [a1, setA1] = useState('');
  const [q2, setQ2] = useState(''); const [a2, setA2] = useState('');
  const [q3, setQ3] = useState(''); const [a3, setA3] = useState('');
  const [qaError, setQaError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!visible) {
      setStep('pin'); setPin(''); setConfirmPin(''); setPinError('');
      setQ1(''); setA1(''); setQ2(''); setA2(''); setQ3(''); setA3(''); setQaError('');
      setShowPassword(false);
    }
  }, [visible]);

  const handlePinNext = () => {
    if (pin.trim().length < 4) { setPinError('Password must be at least 4 characters.'); return; }
    if (pin !== confirmPin) { setPinError('Passwords do not match.'); return; }
    setStep('qa');
  };

  const handleSave = async () => {
    if (!q1.trim() || !a1.trim() || !q2.trim() || !a2.trim() || !q3.trim() || !a3.trim()) {
      setQaError('Please fill in all 3 questions and answers.');
      return;
    }
    setSaving(true);
    try {
      await setPassword(pin, q1, a1, q2, a2, q3, a3);
      onSaved();
    } catch {
      setQaError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.dialog}>
        <Text style={styles.dialogTitle}>
          {step === 'pin' ? '🔐 Set App Password' : '🛡️ Recovery Questions'}
        </Text>
        <Text style={styles.dialogSubtitle}>
          {step === 'pin'
            ? 'This password protects your sensitive data actions.'
            : 'Set 3 recovery questions in case you forget your password. All 3 must be answered correctly to recover.'}
        </Text>

        {step === 'pin' && (
          <>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.dialogInput, pinError ? styles.inputError : null, { flex: 1, marginBottom: 0 }]}
                value={pin}
                onChangeText={(v) => { setPin(v); setPinError(''); }}
                placeholder="New password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                autoFocus
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={[styles.inputWrap, { marginTop: 12 }]}>
              <TextInput
                style={[styles.dialogInput, pinError ? styles.inputError : null, { flex: 1, marginBottom: 0 }]}
                value={confirmPin}
                onChangeText={(v) => { setConfirmPin(v); setPinError(''); }}
                placeholder="Confirm password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handlePinNext}
              />
            </View>
            {pinError ? <Text style={styles.fieldError}>{pinError}</Text> : null}
            <View style={styles.dialogActions}>
              <Pressable onPress={onClose} style={styles.dialogCancel}>
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handlePinNext} style={styles.dialogSave}>
                <Text style={styles.dialogSaveText}>Next →</Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 'qa' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {[
              { q: q1, a: a1, setQ: setQ1, setA: setA1, label: 'Question 1' },
              { q: q2, a: a2, setQ: setQ2, setA: setA2, label: 'Question 2' },
              { q: q3, a: a3, setQ: setQ3, setA: setA3, label: 'Question 3' },
            ].map(({ q, a, setQ, setA, label }, idx) => (
              <View key={idx} style={{ marginBottom: 14 }}>
                <Text style={styles.qaLabel}>{label}</Text>
                <TextInput
                  style={styles.dialogInput}
                  value={q}
                  onChangeText={(v) => { setQ(v); setQaError(''); }}
                  placeholder="e.g. Name of your first pet?"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={styles.dialogInput}
                  value={a}
                  onChangeText={(v) => { setA(v); setQaError(''); }}
                  placeholder="Your answer (case insensitive)"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            ))}
            {qaError ? <Text style={styles.fieldError}>{qaError}</Text> : null}
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setStep('pin')} style={styles.dialogCancel}>
                <Text style={styles.dialogCancelText}>← Back</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={styles.dialogSave} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.black} /> : <Text style={styles.dialogSaveText}>Save</Text>}
              </Pressable>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ── Main Settings Screen ───────────────────────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();
  const wallets = useStore((s) => s.wallets);
  const fetchWallets = useStore((s) => s.fetchWallets);
  const fetchCategories = useStore((s) => s.fetchCategories);
  const fetchTransactions = useStore((s) => s.fetchTransactions);
  const fetchBudgets = useStore((s) => s.fetchBudgets);
  const refreshAnalytics = useStore((s) => s.refreshAnalytics);
  const fetchGamification = useStore((s) => s.fetchGamification);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Profile settings
  const [userName, setUserName] = useState('User');
  const [currency, setCurrency] = useState('INR');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // Daily reminder settings
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [pendingHour, setPendingHour] = useState(20);
  const [pendingMinute, setPendingMinute] = useState(0);

  // App password state
  const [passwordSet, setPasswordSet] = useState(false);
  const [lockBalance, setLockBalance] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // AppPasswordModal state (verify before action)
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyModalTitle, setVerifyModalTitle] = useState('');
  const pendingAction = useRef<(() => void) | null>(null);

  const loadSettings = useCallback(async () => {
    const name = await settingsRepository.get('user_name');
    const cur = await settingsRepository.get('currency');
    const remEnabled = await settingsRepository.get('reminder_enabled');
    const remHour = await settingsRepository.get('reminder_hour');
    const remMinute = await settingsRepository.get('reminder_minute');
    const lockBal = await settingsRepository.get('app_lock_balance');
    if (name) setUserName(name);
    if (cur) setCurrency(cur);
    if (remEnabled === '1') setReminderEnabled(true);
    if (remHour) setReminderHour(parseInt(remHour, 10));
    if (remMinute) setReminderMinute(parseInt(remMinute, 10));
    if (lockBal === '1') setLockBalance(true);
    const hasPin = await isPasswordSet();
    setPasswordSet(hasPin);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * If a password is set, shows the verify modal and runs `action` on success.
   * Otherwise runs `action` immediately.
   */
  const requirePassword = (title: string, action: () => void) => {
    if (!passwordSet) { action(); return; }
    setVerifyModalTitle(title);
    pendingAction.current = action;
    setShowVerifyModal(true);
  };

  // ── Profile ─────────────────────────────────────────────────────────────────
  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await settingsRepository.set('user_name', trimmed);
    setUserName(trimmed);
    setShowNameModal(false);
  };

  const handleSelectCurrency = async (cur: string) => {
    await settingsRepository.set('currency', cur);
    setCurrency(cur);
    setShowCurrencyModal(false);
  };

  // ── Notifications ───────────────────────────────────────────────────────────
  const handleToggleReminder = async (value: boolean) => {
    const granted = await requestNotificationPermissions();
    if (!granted) {
      Alert.alert('❌ Permission Denied', 'Please enable notifications in system settings.');
      return;
    }
    setReminderEnabled(value);
    await settingsRepository.set('reminder_enabled', value ? '1' : '0');
    if (value) {
      await scheduleDailyReminder(reminderHour, reminderMinute);
    } else {
      await cancelDailyReminder();
    }
  };

  const handleOpenTimePicker = () => {
    setPendingHour(reminderHour);
    setPendingMinute(reminderMinute);
    setShowTimeModal(true);
  };

  const handleSaveTime = async () => {
    setReminderHour(pendingHour);
    setReminderMinute(pendingMinute);
    await settingsRepository.set('reminder_hour', String(pendingHour));
    await settingsRepository.set('reminder_minute', String(pendingMinute));
    setShowTimeModal(false);
    if (reminderEnabled) {
      await scheduleDailyReminder(pendingHour, pendingMinute);
    }
  };

  // ── Security ─────────────────────────────────────────────────────────────────
  const handleSetPassword = () => {
    if (!passwordSet) {
      setShowSetupModal(true);
    } else {
      // Must verify current password before changing
      requirePassword('Enter Current Password', () => setShowSetupModal(true));
    }
  };

  const handleRemovePassword = () => {
    requirePassword('Enter Password to Remove', () => {
      Alert.alert(
        'Remove App Password',
        'Are you sure? This will disable all password protection.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove', style: 'destructive', onPress: async () => {
              await removePassword();
              setPasswordSet(false);
              setLockBalance(false);
            },
          },
        ]
      );
    });
  };

  const handleToggleLockBalance = async (value: boolean) => {
    setLockBalance(value);
    await settingsRepository.set('app_lock_balance', value ? '1' : '0');
  };

  // ── Data ─────────────────────────────────────────────────────────────────────
  const handleExportJson = () => {
    requirePassword('Enter Password to Export', async () => {
      setExporting(true);
      try {
        await exportBackup();
        Alert.alert('✅ Export Complete', 'Your backup file has been shared.');
      } catch (error) {
        Alert.alert('Export Error', error instanceof Error ? error.message : 'Unknown error');
      }
      setExporting(false);
    });
  };

  const handleImport = () => {
    requirePassword('Enter Password to Import', async () => {
      setImporting(true);
      try {
        const result = await importBackup();
        if (result) {
          const summary = Object.entries(result).map(([k, v]) => `${k}: ${v}`).join('\n');
          Alert.alert('✅ Import Complete', `Records imported:\n${summary}`);
        }
      } catch (error) {
        Alert.alert('Import Error', error instanceof Error ? error.message : 'Unknown error');
      }
      setImporting(false);
    });
  };

  const handleSeedData = () => {
    Alert.alert(
      'Seed Test Data',
      'This will clear your current transactions, categories, budgets, and wallets, and replace them with 30 days of rich test data. Do you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          onPress: async () => {
            setSeeding(true);
            try {
              const db = getDb();
              await seedTestData(db);
              await Promise.all([
                fetchWallets(),
                fetchCategories(),
                fetchTransactions({ limit: 50 }),
                refreshAnalytics(),
                fetchGamification(),
              ]);
              Alert.alert('✅ Seeding Complete', 'Database has been populated with mock test data.');
            } catch (error) {
              Alert.alert('Seeding Error', error instanceof Error ? error.message : 'Unknown error');
            } finally {
              setSeeding(false);
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    requirePassword('Enter Password to Clear Data', () => {
      Alert.alert('Clear All Data', 'This will permanently delete all your transactions, budgets, and recurring templates. Wallets and system categories will be kept. This action cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything', style: 'destructive', onPress: async () => {
            try {
              const db = getDb();
              await db.runAsync('DELETE FROM transactions');
              await db.runAsync('DELETE FROM budgets');
              await db.runAsync('DELETE FROM categories WHERE is_system = 0');
              await db.runAsync('UPDATE wallets SET balance = 0');
              await Promise.all([
                fetchWallets(),
                fetchCategories(),
                fetchTransactions({ limit: 50 }),
                fetchBudgets(),
                refreshAnalytics(),
              ]);
              Alert.alert('Data Cleared', 'All transactions, budgets, and recurring templates have been deleted.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
          },
        },
      ]);
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.duration(300)}>
        <Text style={styles.title}>Settings</Text>
      </Animated.View>

      {/* Profile */}
      <Animated.View entering={FadeInDown.delay(50).duration(300)}>
        <SettingSection title="Profile">
          <SettingItem
            icon="👤" iconName="person-outline" label="Name" value={userName}
            onPress={() => { setNameInput(userName); setShowNameModal(true); }}
          />
          <SettingItem
            icon="💰" iconName="cash-outline" label="Currency" value={currency}
            onPress={() => setShowCurrencyModal(true)}
          />
          <SettingItem
            icon="💳" iconName="wallet-outline" label="Wallets"
            value={`${wallets.length} wallets`}
            onPress={() => router.push('/modals/wallets' as any)}
          />
        </SettingSection>
      </Animated.View>

      {/* Smart Features */}
      <Animated.View entering={FadeInDown.delay(100).duration(300)}>
        <SettingSection title="Smart Features">
          <SettingItem icon="📱" iconName="phone-portrait-outline" label="Smart SMS Scan" onPress={() => router.push('/modals/smart-scan' as any)} />
          {/* Daily Reminder toggle */}
          <View style={styles.settingRow}>
            <Ionicons name="notifications-outline" size={20} color={colors.cyan} style={styles.settingIcon} />
            <Text style={styles.settingLabel}>Daily Reminder</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: colors.border, true: colors.cyan }}
              thumbColor="#FFFFFF"
            />
          </View>
          {reminderEnabled && (
            <Pressable style={styles.settingRow} onPress={handleOpenTimePicker}>
              <Ionicons name="time-outline" size={20} color={colors.cyan} style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Reminder Time</Text>
              <Text style={[styles.settingValue, styles.timeValue]}>
                {pad(reminderHour)}:{pad(reminderMinute)}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </SettingSection>
      </Animated.View>

      {/* Security */}
      <Animated.View entering={FadeInDown.delay(130).duration(300)}>
        <SettingSection title="Security">
          <SettingItem
            icon="🔐"
            iconName={passwordSet ? 'key-outline' : 'lock-open-outline'}
            label={passwordSet ? 'Change App Password' : 'Set App Password'}
            value={passwordSet ? 'Enabled' : undefined}
            onPress={handleSetPassword}
          />
          {passwordSet && (
            <>
              <SettingItem
                icon="🗝️" iconName="trash-outline" label="Remove App Password"
                onPress={handleRemovePassword} danger
              />
              {/* Lock balance toggle */}
              <View style={styles.settingRow}>
                <Ionicons name="eye-off-outline" size={20} color={colors.cyan} style={styles.settingIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Lock Balance View</Text>
                  <Text style={styles.settingMeta}>Require password to reveal balance on home screen</Text>
                </View>
                <Switch
                  value={lockBalance}
                  onValueChange={handleToggleLockBalance}
                  trackColor={{ false: colors.border, true: colors.cyan }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </>
          )}
        </SettingSection>
      </Animated.View>

      {/* Manage */}
      <Animated.View entering={FadeInDown.delay(160).duration(300)}>
        <SettingSection title="Manage">
          <SettingItem
            icon="📂" iconName="folder-outline" label="Categories"
            onPress={() => router.push('/modals/categories' as any)}
          />
          <SettingItem
            icon="📡" iconName="code-slash-outline" label="Parser Rules"
            onPress={() => router.push('/modals/parser-rules' as any)}
          />
        </SettingSection>
      </Animated.View>

      {/* Data */}
      <Animated.View entering={FadeInDown.delay(200).duration(300)}>
        <SettingSection title="Data">
          <SettingItem icon="📤" iconName="cloud-upload-outline" label="Export Backup (JSON)" onPress={handleExportJson} loading={exporting} />
          <SettingItem icon="📥" iconName="cloud-download-outline" label="Import Backup" onPress={handleImport} loading={importing} />
          <SettingItem icon="🧪" iconName="flask-outline" label="Seed Test Data" onPress={handleSeedData} loading={seeding} />
        </SettingSection>
      </Animated.View>

      {/* Danger Zone */}
      <Animated.View entering={FadeInDown.delay(250).duration(300)}>
        <SettingSection title="Danger Zone">
          <SettingItem icon="🗑️" iconName="trash-outline" label="Clear All Data" onPress={handleClearData} danger />
        </SettingSection>
      </Animated.View>

      <View style={styles.appInfo}>
        <Text style={styles.appName}>Fintter v1.0.0</Text>
        <Text style={styles.appTag}>Offline-first expense tracker</Text>
      </View>

      <View style={{ height: 100 }} />

      {/* ── Modals ── */}

      {/* Name Modal */}
      <Modal visible={showNameModal} transparent animationType="fade" onRequestClose={() => setShowNameModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowNameModal(false)} />
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>Your Name</Text>
          <TextInput
            style={styles.dialogInput}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Enter your name"
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
          <View style={styles.dialogActions}>
            <Pressable onPress={() => setShowNameModal(false)} style={styles.dialogCancel}>
              <Text style={styles.dialogCancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSaveName} style={styles.dialogSave} disabled={!nameInput.trim()}>
              <Text style={styles.dialogSaveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Currency Modal */}
      <Modal visible={showCurrencyModal} transparent animationType="fade" onRequestClose={() => setShowCurrencyModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowCurrencyModal(false)} />
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>Select Currency</Text>
          {CURRENCIES.map((cur) => (
            <Pressable key={cur} onPress={() => handleSelectCurrency(cur)} style={styles.currencyRow}>
              <Text style={styles.currencyText}>{cur}</Text>
              {currency === cur && <Ionicons name="checkmark" size={18} color={colors.cyan} />}
            </Pressable>
          ))}
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={showTimeModal} transparent animationType="fade" onRequestClose={() => setShowTimeModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowTimeModal(false)} />
        <View style={[styles.dialog, styles.timeDialog]}>
          <Text style={styles.dialogTitle}>Set Reminder Time</Text>
          <Text style={styles.timeSubtitle}>You'll get a daily nudge at this time.</Text>
          <View style={styles.timePickerRow}>
            <View style={styles.drumColumn}>
              <Text style={styles.drumLabel}>HH</Text>
              <ScrollView
                style={styles.drum}
                showsVerticalScrollIndicator={false}
                snapToInterval={44}
                decelerationRate="fast"
                contentContainerStyle={{ paddingVertical: 44 }}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.y / 44);
                  setPendingHour(Math.min(Math.max(idx, 0), 23));
                }}
                contentOffset={{ x: 0, y: pendingHour * 44 }}
              >
                {HOURS.map((h) => (
                  <Pressable key={h} onPress={() => setPendingHour(h)}>
                    <Text style={[styles.drumItem, h === pendingHour && styles.drumItemActive]}>{pad(h)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.drumColumn}>
              <Text style={styles.drumLabel}>MM</Text>
              <ScrollView
                style={styles.drum}
                showsVerticalScrollIndicator={false}
                snapToInterval={44}
                decelerationRate="fast"
                contentContainerStyle={{ paddingVertical: 44 }}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.y / 44);
                  setPendingMinute(Math.min(Math.max(idx, 0), 59));
                }}
                contentOffset={{ x: 0, y: pendingMinute * 44 }}
              >
                {MINUTES.map((m) => (
                  <Pressable key={m} onPress={() => setPendingMinute(m)}>
                    <Text style={[styles.drumItem, m === pendingMinute && styles.drumItemActive]}>{pad(m)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
          <Text style={styles.timePreview}>Every day at {pad(pendingHour)}:{pad(pendingMinute)}</Text>
          <View style={styles.dialogActions}>
            <Pressable onPress={() => setShowTimeModal(false)} style={styles.dialogCancel}>
              <Text style={styles.dialogCancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSaveTime} style={styles.dialogSave}>
              <Text style={styles.dialogSaveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Password Setup Modal (set / change) */}
      <PasswordSetupModal
        visible={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSaved={() => {
          setShowSetupModal(false);
          setPasswordSet(true);
          Alert.alert('✅ Password Set', 'Your app password has been saved.');
        }}
      />

      {/* AppPasswordModal — verify before sensitive actions */}
      <AppPasswordModal
        visible={showVerifyModal}
        title={verifyModalTitle}
        onSuccess={() => {
          setShowVerifyModal(false);
          pendingAction.current?.();
          pendingAction.current = null;
        }}
        onCancel={() => {
          setShowVerifyModal(false);
          pendingAction.current = null;
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 24 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCard: { backgroundColor: colors.surface1, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },

  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  settingIcon: { marginRight: 12 },
  settingLabel: { flex: 1, fontSize: 15, color: colors.textPrimary },
  settingMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  settingValue: { fontSize: 13, color: colors.textMuted, marginRight: 8 },

  appInfo: { alignItems: 'center', paddingVertical: 24 },
  appName: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  appTag: { fontSize: 12, color: colors.textDisabled, marginTop: 4 },

  // Modals
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  dialog: { position: 'absolute', top: '25%', left: 24, right: 24, backgroundColor: colors.surface1, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border, maxHeight: '70%' },
  dialogTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  dialogSubtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 19 },
  dialogInput: { backgroundColor: colors.surface2, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  eyeIcon: { padding: 14 },
  inputError: { borderColor: colors.expense },
  fieldError: { fontSize: 13, color: colors.expense, marginBottom: 10, marginTop: 10 },
  dialogActions: { flexDirection: 'row', gap: 12, marginTop: 14 },
  dialogCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center' },
  dialogCancelText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
  dialogSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.cyan, alignItems: 'center' },
  dialogSaveText: { fontSize: 15, color: colors.black, fontWeight: '700' },
  currencyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  currencyText: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  qaLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginBottom: 6 },

  // Time Picker
  timeValue: { fontSize: 15, color: colors.cyan, fontWeight: '700', marginRight: 8 },
  timeDialog: { top: '15%' },
  timeSubtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 20 },
  timePickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  drumColumn: { alignItems: 'center' },
  drumLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' },
  drum: { height: 132, width: 72, backgroundColor: colors.surface2, borderRadius: 12, overflow: 'hidden' },
  drumItem: { height: 44, textAlign: 'center', lineHeight: 44, fontSize: 18, color: colors.textMuted, fontWeight: '500' },
  drumItemActive: { color: colors.cyan, fontWeight: '700', fontSize: 22 },
  timeSeparator: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginTop: 24 },
  timePreview: { textAlign: 'center', fontSize: 13, color: colors.textMuted, marginBottom: 20 },
});
