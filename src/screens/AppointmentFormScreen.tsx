import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Appbar,
  Button,
  List,
  Modal,
  Portal,
  Searchbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AgendaStackParamList } from '../navigation/AgendaStack';
import { AppointmentsRepo } from '../repositories/AppointmentsRepo';
import { Client, ClientsRepo } from '../repositories/ClientsRepo';
import { Service, ServicesRepo } from '../repositories/ServicesRepo';
import { combineDateAndTime, dateOnlyKey, formatTime } from '../utils/datetime';

type Nav = NativeStackNavigationProp<AgendaStackParamList, 'AppointmentForm'>;
type Route = RouteProp<AgendaStackParamList, 'AppointmentForm'>;

export function AppointmentFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const appointmentId = route.params?.appointmentId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [clientId, setClientId] = useState<number | null>(null);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [notes, setNotes] = useState('');
  const [currentStatus, setCurrentStatus] = useState<'ACTIVE' | 'CANCELED'>('ACTIVE');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [showClientPicker, setShowClientPicker] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const [showServicePicker, setShowServicePicker] = useState(false);

  const [showQuickClient, setShowQuickClient] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const loadBase = useCallback(() => {
    const allClients = ClientsRepo.list();
    const allServices = ServicesRepo.list();

    setClients(allClients);
    setServices(allServices);

    if (appointmentId) {
      const appointment = AppointmentsRepo.getById(appointmentId);
      if (appointment) {
        setClientId(appointment.clientId);
        setServiceId(appointment.serviceId);
        setDate(new Date(appointment.startAt));
        setTime(formatTime(appointment.startAt));
        setDurationMinutes(String(appointment.durationMinutes));
        setNotes(appointment.notes ?? '');
        setCurrentStatus(appointment.status);
      }
    }

    if (!appointmentId && allServices.length > 0 && !serviceId) {
      setServiceId(allServices[0].id);
      setDurationMinutes(String(allServices[0].durationMinutes));
    }
  }, [appointmentId, serviceId]);

  useFocusEffect(
    useCallback(() => {
      try {
        setLoading(true);
        loadBase();
      } finally {
        setLoading(false);
      }
    }, [loadBase]),
  );

  const selectedClient = useMemo(() => clients.find((item) => item.id === clientId) ?? null, [clientId, clients]);
  const selectedService = useMemo(() => services.find((item) => item.id === serviceId) ?? null, [serviceId, services]);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const term = clientSearch.trim().toLowerCase();
    return clients.filter((item) => item.name.toLowerCase().includes(term) || (item.phone ?? '').includes(term));
  }, [clientSearch, clients]);

  const save = () => {
    if (!clientId) {
      Alert.alert('Campo obrigatório', 'Selecione um cliente.');
      return;
    }

    if (!serviceId) {
      Alert.alert('Campo obrigatório', 'Selecione um serviço.');
      return;
    }

    const duration = Number(durationMinutes);
    if (!Number.isFinite(duration) || duration <= 0) {
      Alert.alert('Duração inválida', 'Informe uma duração maior que zero.');
      return;
    }

    const startAt = combineDateAndTime(dateOnlyKey(date), time);
    const hasConflict = AppointmentsRepo.checkConflict(startAt, duration, appointmentId);
    if (currentStatus === 'ACTIVE' && hasConflict) {
      Alert.alert('Conflito de horário', 'Já existe outro agendamento ACTIVE nesse intervalo.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        clientId,
        serviceId,
        startAt,
        durationMinutes: duration,
        notes: notes.trim() || undefined,
      };

      if (appointmentId) {
        AppointmentsRepo.update(appointmentId, payload);
      } else {
        AppointmentsRepo.create(payload);
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const quickCreateClient = () => {
    if (!quickName.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome do cliente.');
      return;
    }

    const created = ClientsRepo.create({ name: quickName.trim(), phone: quickPhone.trim() || undefined });
    if (created) {
      setClients((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setClientId(created.id);
    }

    setQuickName('');
    setQuickPhone('');
    setShowQuickClient(false);
  };

  const cancelAppointment = () => {
    if (!appointmentId) return;
    AppointmentsRepo.cancel(appointmentId);
    setShowCancelConfirm(false);
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={appointmentId ? 'Editar agendamento' : 'Novo agendamento'} />
      </Appbar.Header>

      <View style={styles.content}>
        <Button mode="outlined" onPress={() => setShowClientPicker(true)}>
          Cliente: {selectedClient ? selectedClient.name : 'Selecionar'}
        </Button>

        <Button mode="text" onPress={() => setShowQuickClient(true)}>
          + Novo cliente rápido
        </Button>

        <Button mode="outlined" onPress={() => setShowServicePicker(true)}>
          Serviço: {selectedService ? selectedService.name : 'Selecionar'}
        </Button>

        <Button mode="outlined" icon="calendar" onPress={() => setShowDatePicker(true)}>
          Data: {date.toLocaleDateString('pt-BR')}
        </Button>

        <Button mode="outlined" icon="clock-outline" onPress={() => setShowTimePicker(true)}>
          Hora: {time}
        </Button>

        <TextInput
          label="Duração (min)"
          mode="outlined"
          value={durationMinutes}
          onChangeText={setDurationMinutes}
          keyboardType="number-pad"
        />

        <TextInput label="Observação" mode="outlined" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

        <Button mode="contained" onPress={save} loading={saving}>
          Salvar
        </Button>

        {appointmentId ? (
          <Button mode="text" textColor="#B00020" onPress={() => setShowCancelConfirm(true)}>
            Cancelar Agendamento
          </Button>
        ) : null}
      </View>

      {showDatePicker ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(_, selected) => {
            setShowDatePicker(false);
            if (selected) setDate(selected);
          }}
        />
      ) : null}

      {showTimePicker ? (
        <DateTimePicker
          value={new Date(combineDateAndTime(dateOnlyKey(date), time))}
          mode="time"
          is24Hour
          display="default"
          onChange={(_, selected) => {
            setShowTimePicker(false);
            if (selected) setTime(formatTime(selected));
          }}
        />
      ) : null}

      <Portal>
        <Modal visible={showClientPicker} onDismiss={() => setShowClientPicker(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleMedium">Selecionar cliente</Text>
          <Searchbar placeholder="Buscar cliente" value={clientSearch} onChangeText={setClientSearch} />
          <FlatList
            data={filteredClients}
            keyExtractor={(item) => String(item.id)}
            style={styles.pickerList}
            renderItem={({ item }) => (
              <List.Item
                title={item.name}
                description={item.phone || 'Sem telefone'}
                onPress={() => {
                  setClientId(item.id);
                  setShowClientPicker(false);
                }}
              />
            )}
          />
        </Modal>

        <Modal visible={showServicePicker} onDismiss={() => setShowServicePicker(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleMedium">Selecionar serviço</Text>
          <FlatList
            data={services}
            keyExtractor={(item) => String(item.id)}
            style={styles.pickerList}
            renderItem={({ item }) => (
              <List.Item
                title={item.name}
                description={`${item.durationMinutes} min • R$ ${Number(item.price ?? 0).toFixed(2)}`}
                onPress={() => {
                  setServiceId(item.id);
                  setDurationMinutes(String(item.durationMinutes));
                  setShowServicePicker(false);
                }}
              />
            )}
          />
        </Modal>

        <Modal visible={showQuickClient} onDismiss={() => setShowQuickClient(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleMedium">Novo cliente rápido</Text>
          <TextInput mode="outlined" label="Nome *" value={quickName} onChangeText={setQuickName} />
          <TextInput mode="outlined" label="Telefone" value={quickPhone} onChangeText={setQuickPhone} keyboardType="phone-pad" />
          <Button mode="contained" onPress={quickCreateClient}>
            Criar e selecionar
          </Button>
        </Modal>
      </Portal>

      <ConfirmDialog
        visible={showCancelConfirm}
        title="Cancelar agendamento"
        message="Deseja marcar este agendamento como CANCELED?"
        confirmLabel="Cancelar agendamento"
        onCancel={() => setShowCancelConfirm(false)}
        onConfirm={cancelAppointment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16, gap: 10 },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    gap: 10,
    maxHeight: '80%',
  },
  pickerList: { maxHeight: 320 },
});
