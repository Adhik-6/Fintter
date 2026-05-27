import '../global.css';
import { useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { initializeDatabase } from '@src/db';
import { useStore } from '@src/store';
import { colors } from '@src/theme';
import { updateStreaks, checkTransactionMilestones } from '@src/services/gamificationEngine';
import { ConfettiOverlay } from '@src/components/animated/ConfettiOverlay';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  const fetchWallets = useStore((s) => s.fetchWallets);
  const fetchCategories = useStore((s) => s.fetchCategories);

  const [fontsLoaded] = useFonts({
    'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Initialize database on mount
  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase();
        // Hydrate critical store data
        await Promise.all([fetchWallets(), fetchCategories()]);
        setDbReady(true);
        // Fire-and-forget: update gamification
        updateStreaks().catch(console.warn);
        checkTransactionMilestones().catch(console.warn);
      } catch (error) {
        console.error('[App] DB init failed:', error);
        setDbError(error instanceof Error ? error.message : 'Unknown error');
      }
    }
    init();
  }, [fetchWallets, fetchCategories]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && dbReady) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  if (!fontsLoaded || !dbReady) {
    if (dbError) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.surface0, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: colors.expense, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Database Error</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center' }}>{dbError}</Text>
        </View>
      );
    }
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.surface0 }} onLayout={onLayoutRootView}>
        <StatusBar style="light" backgroundColor={colors.black} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.surface0 },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modals/quick-add"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="modals/transaction-detail"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="modals/category-picker"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="modals/mood-picker"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="modals/smart-scan"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="modals/wallets"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="modals/categories"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="modals/parser-rules"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
              headerShown: false,
            }}
          />
          <Stack.Screen name="onboarding/welcome" options={{ headerShown: false, animation: 'fade' }} />
          <Stack.Screen name="onboarding/setup-currency" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding/setup-categories" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <ConfettiOverlay />
      </View>
    </GestureHandlerRootView>
  );
}
