import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AgendaStack } from './AgendaStack';
import { ClientsScreen } from '../screens/ClientsScreen';
import { ServicesScreen } from '../screens/ServicesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export type RootTabParamList = {
  Agenda: undefined;
  Clientes: undefined;
  Servicos: undefined;
  Config: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function BottomTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Agenda" component={AgendaStack} />
      <Tab.Screen name="Clientes" component={ClientsScreen} />
      <Tab.Screen name="Servicos" component={ServicesScreen} options={{ title: 'Serviços' }} />
      <Tab.Screen name="Config" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
