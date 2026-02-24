import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomTabs } from './src/navigation/BottomTabs';
import { appTheme } from './src/theme/theme';
import { migrate, openDb, query } from './src/db';

export default function App() {
  useEffect(() => {
    openDb();
    migrate();
    const serviceCount = query<{ total: number }>('SELECT COUNT(*) as total FROM services;')[0]?.total ?? 0;
    console.log(`[DB] Serviços disponíveis após bootstrap: ${serviceCount}`);
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
        <NavigationContainer>
          <BottomTabs />
          <StatusBar style="auto" />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
