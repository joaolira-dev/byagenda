import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  AppModal,
  Avatar,
  BottomTab,
  Button,
  Card,
  Header,
  Input,
  Loading,
  SearchBar,
} from '@/components';
import { colors, spacing, typography } from '@/themes';

export default function App() {
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <Header
        showBackButton
        subtitle="Componentes reutilizaveis"
        title="ByAgenda"
        rightIcon={<Text style={styles.headerAction}>+</Text>}
        onRightPress={() => setModalVisible(true)}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.profileCard}>
          <Avatar name="Joao Lira" size={56} />
          <View style={styles.profileText}>
            <Text style={styles.title}>Agenda profissional</Text>
            <Text style={styles.subtitle}>Base visual pronta para futuras telas.</Text>
          </View>
        </Card>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
          placeholder="Buscar clientes ou horarios"
        />

        <Input
          label="Nome"
          placeholder="Digite o nome do cliente"
        />

        <Input
          error="Informe um email valido."
          keyboardType="email-address"
          label="Email"
          placeholder="cliente@email.com"
        />

        <Card
          title="Proximo atendimento"
          subtitle="Hoje, 14:30"
        >
          <Text style={styles.cardText}>
            Corte e finalizacao com duracao estimada de 45 minutos.
          </Text>
        </Card>

        <View style={styles.buttonRow}>
          <Button
            title="Confirmar"
            style={styles.button}
            onPress={() => setModalVisible(true)}
          />
          <Button
            title="Cancelar"
            variant="outline"
            style={styles.button}
          />
        </View>

        <Button
          loading
          title="Carregando"
          variant="secondary"
        />

        <Loading message="Sincronizando agenda" />
      </ScrollView>

      <View style={styles.tabBar}>
        <BottomTab active label="Agenda" icon={<Text style={styles.tabIcon}>A</Text>} />
        <BottomTab label="Clientes" icon={<Text style={styles.tabIcon}>C</Text>} />
        <BottomTab label="Perfil" icon={<Text style={styles.tabIcon}>P</Text>} />
      </View>

      <AppModal
        visible={modalVisible}
        title="Novo agendamento"
        onClose={() => setModalVisible(false)}
        footer={
          <Button
            title="Entendi"
            onPress={() => setModalVisible(false)}
          />
        }
      >
        <Text style={styles.modalText}>
          Este modal usa apenas o componente Modal do React Native e esta pronto
          para receber conteudos das proximas telas.
        </Text>
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  profileCard: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  profileText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    color: colors.text,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.size.lg,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.sm,
    marginTop: spacing.xs,
  },
  cardText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tabIcon: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.size.sm,
    fontWeight: '600',
  },
  headerAction: {
    color: colors.primary,
    fontSize: 28,
    lineHeight: 30,
  },
  modalText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.md,
    lineHeight: 22,
  },
});
