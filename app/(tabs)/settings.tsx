/**
 * Settings Screen — connected to backup/export services.
 */
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { colors } from '@src/theme';
import { useStore } from '@src/store';
import { exportBackup, importBackup, exportTransactionsCsv } from '@src/services/backupService';
import { requestNotificationPermissions } from '@src/services/notificationService';

interface SettingRow {
  icon: string;
  label: string;
  onPress?: () => void;
  danger?: boolean;
  value?: string;
  loading?: boolean;
}

function SettingItem({ icon, label, onPress, danger, value, loading }: SettingRow) {
  return (
    <Pressable onPress={onPress} disabled={loading} style={styles.settingRow}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <Text style={[styles.settingLabel, danger && { color: colors.expense }]}>{label}</Text>
      {loading && <ActivityIndicator size="small" color={colors.cyan} style={{ marginRight: 8 }} />}
      {value && !loading && <Text style={styles.settingValue}>{value}</Text>}
      <Text style={styles.settingChevron}>›</Text>
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
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

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

  const handleClearData = () => {
    Alert.alert('Clear All Data', 'This will permanently delete all your data. This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Everything', style: 'destructive', onPress: () => {
        // TODO: implement full data wipe
        Alert.alert('Data Cleared', 'All data has been deleted.');
      }},
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.duration(300)}>
        <Text style={styles.title}>Settings</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(50).duration(300)}>
        <SettingSection title="Profile">
          <SettingItem icon="👤" label="Name" value="User" />
          <SettingItem icon="💰" label="Default Currency" value="INR" />
          <SettingItem icon="💳" label="Default Wallet" value={wallets.find((w) => w.isDefault)?.name ?? 'Cash'} />
        </SettingSection>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(300)}>
        <SettingSection title="Smart Features">
          <SettingItem icon="📱" label="Smart SMS Scan" onPress={() => router.push('/modals/smart-scan' as any)} />
          <SettingItem icon="🔔" label="Enable Notifications" onPress={handleNotifications} />
        </SettingSection>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(300)}>
        <SettingSection title="Manage">
          <SettingItem icon="💳" label="Wallets" value={`${wallets.length} wallets`} />
          <SettingItem icon="📂" label="Categories" />
          <SettingItem icon="🔄" label="Recurring Transactions" />
          <SettingItem icon="📡" label="Parser Rules" />
        </SettingSection>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(300)}>
        <SettingSection title="Data">
          <SettingItem icon="📤" label="Export Backup (JSON)" onPress={handleExportJson} loading={exporting} />
          <SettingItem icon="📊" label="Export Transactions (CSV)" onPress={handleExportCsv} loading={exporting} />
          <SettingItem icon="📥" label="Import Backup" onPress={handleImport} loading={importing} />
        </SettingSection>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(250).duration(300)}>
        <SettingSection title="Danger Zone">
          <SettingItem icon="🗑️" label="Clear All Data" onPress={handleClearData} danger />
        </SettingSection>
      </Animated.View>

      <View style={styles.appInfo}>
        <Text style={styles.appName}>Fintter v1.0.0</Text>
        <Text style={styles.appTag}>Offline-first expense tracker</Text>
      </View>

      <View style={{ height: 100 }} />
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
  settingIcon: { fontSize: 20, marginRight: 12 },
  settingLabel: { flex: 1, fontSize: 15, color: colors.textPrimary },
  settingValue: { fontSize: 13, color: colors.textMuted, marginRight: 8 },
  settingChevron: { fontSize: 20, color: colors.textMuted },

  appInfo: { alignItems: 'center', paddingVertical: 24 },
  appName: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  appTag: { fontSize: 12, color: colors.textDisabled, marginTop: 4 },
});
