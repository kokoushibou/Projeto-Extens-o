import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Appbar, Button, FAB, List, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Service, ServicesRepo } from '../repositories/ServicesRepo';

export function ServicesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [price, setPrice] = useState('0');

  const [toDelete, setToDelete] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setServices(ServicesRepo.list());
  }, []);

  useFocusEffect(
    useCallback(() => {
      try {
        setLoading(true);
        load();
      } finally {
        setLoading(false);
      }
    }, [load]),
  );

  const onRefresh = () => {
    try {
      setRefreshing(true);
      load();
    } finally {
      setRefreshing(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDurationMinutes('30');
    setPrice('0');
    setModalVisible(true);
  };

  const openEdit = (item: Service) => {
    setEditing(item);
    setName(item.name);
    setDurationMinutes(String(item.durationMinutes));
    setPrice(String(item.price ?? 0));
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalVisible(false);
  };

  const saveService = () => {
    if (!name.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome do serviço.');
      return;
    }

    const duration = Number(durationMinutes);
    if (!Number.isFinite(duration) || duration <= 0) {
      Alert.alert('Duração inválida', 'Informe a duração em minutos (maior que zero).');
      return;
    }

    const parsedPrice = Number(price || '0');
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      Alert.alert('Preço inválido', 'Informe um preço válido ou deixe 0.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        durationMinutes: duration,
        price: parsedPrice,
      };

      if (editing) {
        ServicesRepo.update(editing.id, payload);
      } else {
        ServicesRepo.create(payload);
      }

      setModalVisible(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!toDelete) return;

    try {
      setDeleting(true);
      if (ServicesRepo.hasAppointments(toDelete.id)) {
        setToDelete(null);
        Alert.alert('Exclusão bloqueada', 'Este serviço já está vinculado a agendamentos.');
        return;
      }

      ServicesRepo.remove(toDelete.id);
      setToDelete(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  const content = useMemo(() => {
    if (loading) return <ActivityIndicator style={styles.loader} />;

    if (!services.length) {
      return <EmptyState title="Nenhum serviço cadastrado" subtitle="Toque no botão + para criar o primeiro serviço." />;
    }

    return (
      <FlatList
        data={services}
        keyExtractor={(item) => String(item.id)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={`${item.durationMinutes} min • R$ ${Number(item.price ?? 0).toFixed(2)}`}
            onPress={() => openEdit(item)}
            right={() => <List.Icon icon="chevron-right" />}
            style={styles.listItem}
          />
        )}
      />
    );
  }, [loading, onRefresh, refreshing, services]);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Serviços" />
      </Appbar.Header>

      <View style={styles.content}>{content}</View>

      <FAB icon="plus" style={styles.fab} onPress={openCreate} />

      <Portal>
        <Modal visible={modalVisible} onDismiss={closeModal} contentContainerStyle={styles.modal}>
          <Text variant="titleMedium">{editing ? 'Editar serviço' : 'Novo serviço'}</Text>

          <TextInput label="Nome *" value={name} onChangeText={setName} mode="outlined" style={styles.field} />

          <TextInput
            label="Duração (min) *"
            value={durationMinutes}
            onChangeText={setDurationMinutes}
            mode="outlined"
            keyboardType="number-pad"
            style={styles.field}
          />

          <TextInput
            label="Preço"
            value={price}
            onChangeText={setPrice}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.field}
          />

          <View style={styles.actions}>
            {editing ? (
              <Button mode="text" textColor="#B00020" onPress={() => setToDelete(editing)}>
                Excluir
              </Button>
            ) : (
              <View />
            )}

            <View style={styles.rightActions}>
              <Button onPress={closeModal} disabled={saving}>
                Cancelar
              </Button>
              <Button mode="contained" onPress={saveService} loading={saving}>
                Salvar
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

      <ConfirmDialog
        visible={Boolean(toDelete)}
        title="Excluir serviço"
        message="Deseja realmente excluir este serviço?"
        confirmLabel="Excluir"
        loading={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  loader: { marginTop: 24 },
  listItem: { borderRadius: 10 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 20,
  },
  modal: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  field: { backgroundColor: 'transparent' },
  actions: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightActions: { flexDirection: 'row', gap: 8 },
});
