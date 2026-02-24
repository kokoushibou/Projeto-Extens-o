import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Appbar, FAB, List, Modal, Portal, Searchbar, Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Client, ClientsRepo } from '../repositories/ClientsRepo';

export function ClientsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [toDelete, setToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback((term?: string) => {
    const value = term?.trim() ?? '';
    const rows = value ? ClientsRepo.search(value) : ClientsRepo.list();
    setClients(rows);
  }, []);

  const initialLoad = useCallback(() => {
    try {
      setLoading(true);
      load(query);
    } finally {
      setLoading(false);
    }
  }, [load, query]);

  useFocusEffect(
    useCallback(() => {
      initialLoad();
    }, [initialLoad]),
  );

  const onRefresh = () => {
    try {
      setRefreshing(true);
      load(query);
    } finally {
      setRefreshing(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPhone('');
    setModalVisible(true);
  };

  const openEdit = (item: Client) => {
    setEditing(item);
    setName(item.name);
    setPhone(item.phone ?? '');
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalVisible(false);
  };

  const saveClient = () => {
    if (!name.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome do cliente.');
      return;
    }

    try {
      setSaving(true);
      if (editing) {
        ClientsRepo.update(editing.id, { name: name.trim(), phone: phone.trim() || undefined });
      } else {
        ClientsRepo.create({ name: name.trim(), phone: phone.trim() || undefined });
      }
      setModalVisible(false);
      load(query);
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (item: Client) => setToDelete(item);

  const confirmDelete = () => {
    if (!toDelete) return;

    try {
      setDeleting(true);
      if (ClientsRepo.hasAppointments(toDelete.id)) {
        setToDelete(null);
        Alert.alert('Exclusão bloqueada', 'Este cliente possui agendamentos vinculados.');
        return;
      }

      ClientsRepo.remove(toDelete.id);
      setToDelete(null);
      load(query);
    } finally {
      setDeleting(false);
    }
  };

  const content = useMemo(() => {
    if (loading) {
      return <ActivityIndicator style={styles.loader} />;
    }

    if (!clients.length) {
      return <EmptyState title="Nenhum cliente encontrado" subtitle="Toque no botão + para adicionar um cliente." />;
    }

    return (
      <FlatList
        data={clients}
        keyExtractor={(item) => String(item.id)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={item.phone || 'Sem telefone'}
            onPress={() => openEdit(item)}
            right={() => <List.Icon icon="chevron-right" />}
            style={styles.listItem}
          />
        )}
      />
    );
  }, [clients, loading, onRefresh, refreshing]);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Clientes" />
      </Appbar.Header>

      <View style={styles.content}>
        <Searchbar
          placeholder="Buscar por nome ou telefone"
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            load(text);
          }}
        />

        {content}
      </View>

      <FAB icon="plus" style={styles.fab} onPress={openCreate} />

      <Portal>
        <Modal visible={modalVisible} onDismiss={closeModal} contentContainerStyle={styles.modal}>
          <Text variant="titleMedium">{editing ? 'Editar cliente' : 'Novo cliente'}</Text>

          <TextInput
            label="Nome *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.field}
          />

          <TextInput
            label="Telefone"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.field}
          />

          <View style={styles.actions}>
            {editing ? (
              <Button mode="text" textColor="#B00020" onPress={() => askDelete(editing)}>
                Excluir
              </Button>
            ) : (
              <View />
            )}

            <View style={styles.rightActions}>
              <Button onPress={closeModal} disabled={saving}>
                Cancelar
              </Button>
              <Button mode="contained" onPress={saveClient} loading={saving}>
                Salvar
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

      <ConfirmDialog
        visible={Boolean(toDelete)}
        title="Excluir cliente"
        message="Deseja realmente excluir este cliente?"
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
  content: { flex: 1, padding: 16, gap: 12 },
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
