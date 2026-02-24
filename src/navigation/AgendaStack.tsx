import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AgendaScreen } from '../screens/AgendaScreen';
import { AppointmentFormScreen } from '../screens/AppointmentFormScreen';

export type AgendaStackParamList = {
  AgendaList: undefined;
  AppointmentForm: { appointmentId?: number } | undefined;
};

const Stack = createNativeStackNavigator<AgendaStackParamList>();

export function AgendaStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AgendaList" component={AgendaScreen} />
      <Stack.Screen name="AppointmentForm" component={AppointmentFormScreen} />
    </Stack.Navigator>
  );
}
