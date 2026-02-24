import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, Appbar, Button, Card, Chip, FAB, Text } from 'react-native-paper';
import { EmptyState } from '../components/EmptyState';
import { AgendaStackParamList } from '../navigation/AgendaStack';
import { AppointmentWithRelations, AppointmentsRepo } from '../repositories/AppointmentsRepo';
import { dateOnlyKey, formatTime } from '../utils/datetime';

type Navigation = NativeStackNavigationProp<AgendaStackParamList, 'AgendaList'>;

export function AgendaScreen() {
  const navigation = useNavigation<Navigation>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const load = useCallback((baseDate: Date) => {
    setAppointments(AppointmentsRepo.listByDate(dateOnlyKey(baseDate)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      try {
        setLoading(true);
        load(selectedDate);
      } finally {
        setLoading(false);
      }
    }, [load, selectedDate]),
  );

  const onRefresh = () => {
    try {
      setRefreshing(true);
      load(selectedDate);
    } finally {
      setRefreshing(false);
    }
  };

  const content = useMemo(() => {
    if (loading) return <ActivityIndicator style={styles.loader} />;

    if (!appointments.length) {
      return <EmptyState title="Nenhum agendamento no dia" subtitle="Use o botão + para criar um agendamento." />;
    }

    return (
      <FlatList
        data={appointments}
        keyExtractor={(item) => String(item.id)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => navigation.navigate('AppointmentForm', { appointmentId: item.id })}>
            <Card.Title title={`${formatTime(item.startAt)} • ${item.clientName}`} subtitle={item.serviceName} />
            <Card.Content style={styles.cardContent}>
              <Text>Duração: {item.durationMinutes} min</Text>
              {item.notes ? <Text>Obs: {item.notes}</Text> : null}
              <Chip compact style={styles.chip}>
                {item.status}
              </Chip>
            </Card.Content>
          </Card>
        )}
      />
    );
  }, [appointments, loading, navigation, onRefresh, refreshing]);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Agenda" subtitle="Compromissos do dia" />
      </Appbar.Header>

      <View style={styles.content}>
        <Button mode="outlined" icon="calendar" onPress={() => setShowDatePicker(true)}>
          {selectedDate.toLocaleDateString('pt-BR')}
        </Button>

        {showDatePicker ? (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowDatePicker(false);
              if (!date) return;
              setSelectedDate(date);
              load(date);
            }}
          />
        ) : null}

        {content}
      </View>

      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate('AppointmentForm')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16, gap: 12 },
  loader: { marginTop: 24 },
  listContent: { gap: 10, paddingBottom: 80 },
  card: { borderRadius: 12 },
  cardContent: { gap: 6 },
  chip: { alignSelf: 'flex-start' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
  },
});
