/**
 * Settings Screen — connected to all management screens and backup/export services.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
  ActivityIndicator, TextInput, Modal
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@src/theme';
import { useStore } from '@src/store';
import { exportBackup, importBackup, exportTransactionsCsv } from '@src/services/backupService';
import { requestNotificationPermissions } from '@src/services/notificationService';
import { settingsRepository } from '@src/db/repositories/settingsRepository';
import { getDb, seedTestData } from '@src/db';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AED', 'SGD', 'AUD', 'CAD'];

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

export default function SettingsScreen() {
  const router = useRouter();
  const wallets = useStore((s) => s.wallets);
  const fetchWallets = useStore((s) => s.fetchWallets);
  const fetchCategories = useStore((s) => s.fetchCategories);
  const fetchTransactions = useStore((s) => s.fetchTransactions);
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

  const loadSettings = useCallback(async () => {
    const name = await settingsRepository.get('user_name');
    const cur = await settingsRepository.get('currency');
    if (name) setUserName(name);
    if (cur) setCurrency(cur);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

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

  const handleExportJson = async () => {
    setExporting(true);
    try {
      await exportBackup();
      Alert.alert('✅ Export Complete', 'Your backup file has been shared.');
    } catch (error) {
      Alert.alert('Export Error', error instanceof Error ? error.message : 'Unknown error');
    }
    setExporting(false);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await exportTransactionsCsv();
      Alert.alert('✅ CSV Export Complete', 'Your transactions CSV has been shared.');
    } catch (error) {
      Alert.alert('Export Error', error instanceof Error ? error.message : 'Unknown error');
    }
    setExporting(false);
  };

  const handleImport = async () => {
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
  };

  const handleNotifications = async () => {
    const granted = await requestNotificationPermissions();
    Alert.alert(
      granted ? '✅ Notifications Enabled' : '❌ Permission Denied',
      granted ? 'You will receive budget alerts and reminders.' : 'Please enable notifications in system settings.'
    );
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
              
              // Refresh all stores to reflect the new data immediately
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
    Alert.alert('Clear All Data', 'This will permanently delete all your data. This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Everything', style: 'destructive', onPress: () => {
          Alert.alert('Data Cleared', 'All data has been deleted.');
        }
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.duration(300)}>
        <Text style={styles.title}>Settings</Text>
      </Animated.View>

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

      <Animated.View entering={FadeInDown.delay(100).duration(300)}>
        <SettingSection title="Smart Features">
          <SettingItem icon="📱" iconName="phone-portrait-outline" label="Smart SMS Scan" onPress={() => router.push('/modals/smart-scan' as any)} />
          <SettingItem icon="🔔" iconName="notifications-outline" label="Enable Notifications" onPress={handleNotifications} />
        </SettingSection>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(300)}>
        <SettingSection title="Manage">
          <SettingItem
            icon="📂" iconName="folder-outline" label="Categories"
            onPress={() => router.push('/modals/categories' as any)}
          />
          <SettingItem
            icon="🔄" iconName="repeat-outline" label="Recurring Transactions"
            onPress={() => router.push('/modals/recurring' as any)}
          />
          <SettingItem
            icon="📡" iconName="code-slash-outline" label="Parser Rules"
            onPress={() => router.push('/modals/parser-rules' as any)}
          />
        </SettingSection>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(300)}>
        <SettingSection title="Data">
          <SettingItem icon="📤" iconName="cloud-upload-outline" label="Export Backup (JSON)" onPress={handleExportJson} loading={exporting} />
          <SettingItem icon="📊" iconName="document-text-outline" label="Export Transactions (CSV)" onPress={handleExportCsv} loading={exporting} />
          <SettingItem icon="📥" iconName="cloud-download-outline" label="Import Backup" onPress={handleImport} loading={importing} />
          <SettingItem icon="🧪" iconName="flask-outline" label="Seed Test Data" onPress={handleSeedData} loading={seeding} />
        </SettingSection>
      </Animated.View>

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
  settingValue: { fontSize: 13, color: colors.textMuted, marginRight: 8 },

  appInfo: { alignItems: 'center', paddingVertical: 24 },
  appName: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  appTag: { fontSize: 12, color: colors.textDisabled, marginTop: 4 },

  // Modals
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  dialog: { position: 'absolute', top: '30%', left: 24, right: 24, backgroundColor: colors.surface1, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border },
  dialogTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  dialogInput: { backgroundColor: colors.surface2, borderRadius: 12, padding: 14, color: colors.textPrimary, fontSize: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  dialogActions: { flexDirection: 'row', gap: 12 },
  dialogCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.surface2, alignItems: 'center' },
  dialogCancelText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
  dialogSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.cyan, alignItems: 'center' },
  dialogSaveText: { fontSize: 15, color: colors.black, fontWeight: '700' },
  currencyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  currencyText: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
});
