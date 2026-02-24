import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Card, Text } from 'react-native-paper';

export function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Config" subtitle="Preferências locais" />
      </Appbar.Header>

      <View style={styles.content}>
        <Card>
          <Card.Title title="Configurações" />
          <Card.Content>
            <Text>As preferências serão salvas com AsyncStorage.</Text>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16, gap: 12 },
});
