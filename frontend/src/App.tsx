import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Button, Card, Input, SearchBar } from '@/components';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/services/api';
import { colors, radius, spacing, typography } from '@/themes';
import type { UserRole } from '@/types/auth';

type UserType = 'client' | 'business';
type AuthMode = 'login' | 'register';
type ClientTab = 'home' | 'appointments' | 'favorites' | 'profile';
type ClientRoute =
  | { name: 'tabs' }
  | { name: 'establishment'; establishmentId: string }
  | { name: 'search' }
  | { name: 'booking'; step: BookingStep; establishmentId: string }
  | { name: 'bookingSuccess'; establishmentId: string }
  | { name: 'appointmentDetail'; appointmentId: string }
  | { name: 'map'; establishmentId: string }
  | { name: 'notifications' }
  | { name: 'profileOption'; title: string };
type BusinessRoute =
  | 'dashboard'
  | 'appointments'
  | 'services'
  | 'professionals'
  | 'clients'
  | 'settings'
  | 'hours'
  | 'plans';
type BookingStep = 'service' | 'professional' | 'datetime' | 'summary';

type Category = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Establishment = {
  id: string;
  name: string;
  category: string;
  rating: string;
  reviews: number;
  distance: string;
  address: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  image: string;
  services: Service[];
  professionals: Professional[];
};

type Service = {
  id: string;
  name: string;
  duration: string;
  price: string;
};

type Professional = {
  id: string;
  name: string;
  role: string;
  rating: string;
};

type Appointment = {
  id: string;
  establishmentId: string;
  service: string;
  professional: string;
  date: string;
  time: string;
  status: 'Confirmado' | 'Pendente' | 'Concluído';
};

type FeaturedService = {
  id: string;
  title: string;
  category: string;
  rating: string;
  reviews: number;
  price: string;
  image: string;
};

type NotificationItem = {
  id: string;
  title: string;
  text: string;
  read: boolean;
};

type BookingSelection = {
  service: Service;
  professional: Professional;
  dateTime: string;
};

const logoIcon = require('./assets/logo-icon.png');
const logoText = require('./assets/images/byagenda-logo-text.png');

const TEST_CLIENT_EMAIL = 'cliente@byagenda.com';
const TEST_BUSINESS_EMAIL = 'empresa@byagenda.com';
const TEST_PASSWORD = '123456';

function showActionFeedback(title: string, message = 'Ação mockada executada com sucesso.') {
  Alert.alert(title, message);
}

const categories: Category[] = [
  { id: 'hair', label: 'Cabeleireiro', icon: 'people-outline' },
  { id: 'barber', label: 'Barbearia', icon: 'cut-outline' },
  { id: 'nails', label: 'Manicure', icon: 'color-wand-outline' },
  { id: 'aesthetic', label: 'Estética', icon: 'sparkles-outline' },
  { id: 'makeup', label: 'Maquiagem', icon: 'happy-outline' },
];

const establishments: Establishment[] = [
  {
    id: 'studio-beleza',
    name: 'Studio Beleza',
    category: 'Cabeleireiro',
    rating: '4,9',
    reviews: 120,
    distance: '1,2 km',
    address: 'Av. Boa Viagem, 1200 - Recife',
    coordinate: { latitude: -8.1037, longitude: -34.8879 },
    image:
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=520&q=85',
    services: [
      { id: 'cut', name: 'Corte feminino', duration: '50 min', price: 'R$ 90' },
      { id: 'brush', name: 'Escova modelada', duration: '40 min', price: 'R$ 70' },
      { id: 'color', name: 'Mechas + tonalização', duration: '2h', price: 'R$ 180' },
    ],
    professionals: [
      { id: 'ana', name: 'Ana Lira', role: 'Colorista', rating: '4,9' },
      { id: 'bia', name: 'Bia Torres', role: 'Hair stylist', rating: '4,8' },
    ],
  },
  {
    id: 'barbearia-vip',
    name: 'Barbearia VIP',
    category: 'Barbearia',
    rating: '4,8',
    reviews: 98,
    distance: '650 m',
    address: 'Rua do Futuro, 88 - Recife',
    coordinate: { latitude: -8.0399, longitude: -34.8995 },
    image:
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=520&q=85',
    services: [
      { id: 'barber-cut', name: 'Corte masculino', duration: '35 min', price: 'R$ 45' },
      { id: 'beard', name: 'Barba completa', duration: '30 min', price: 'R$ 40' },
    ],
    professionals: [
      { id: 'joao', name: 'João Melo', role: 'Barbeiro', rating: '4,9' },
      { id: 'leo', name: 'Léo Ramos', role: 'Barbeiro', rating: '4,7' },
    ],
  },
  {
    id: 'espaco-beaute',
    name: 'Espaço Beauté',
    category: 'Estética',
    rating: '4,7',
    reviews: 76,
    distance: '1,1 km',
    address: 'Rua das Flores, 455 - Recife',
    coordinate: { latitude: -8.0522, longitude: -34.9286 },
    image:
      'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=520&q=85',
    services: [
      { id: 'skin', name: 'Limpeza de pele profunda', duration: '60 min', price: 'R$ 120' },
      { id: 'massage', name: 'Massagem relaxante', duration: '50 min', price: 'R$ 110' },
    ],
    professionals: [
      { id: 'clara', name: 'Clara Nunes', role: 'Esteticista', rating: '4,8' },
    ],
  },
];

const featuredServices: FeaturedService[] = [
  {
    id: 'skin-care',
    title: 'Limpeza de Pele Profunda',
    category: 'Estética Facial',
    rating: '4,9',
    reviews: 210,
    price: 'R$ 120',
    image:
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=640&q=85',
  },
  {
    id: 'hair-color',
    title: 'Mechas + Tonalização',
    category: 'Cabeleireiro',
    rating: '4,8',
    reviews: 168,
    price: 'R$ 180',
    image:
      'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=640&q=85',
  },
  {
    id: 'makeup-event',
    title: 'Make para Eventos',
    category: 'Maquiagem',
    rating: '4,9',
    reviews: 134,
    price: 'R$ 150',
    image:
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=640&q=85',
  },
];

const initialAppointments: Appointment[] = [
  {
    id: 'a1',
    establishmentId: 'studio-beleza',
    service: 'Mechas + tonalização',
    professional: 'Ana Lira',
    date: '18 jun',
    time: '14:30',
    status: 'Confirmado',
  },
  {
    id: 'a2',
    establishmentId: 'barbearia-vip',
    service: 'Corte masculino',
    professional: 'João Melo',
    date: '21 jun',
    time: '10:00',
    status: 'Pendente',
  },
  {
    id: 'a3',
    establishmentId: 'espaco-beaute',
    service: 'Limpeza de pele',
    professional: 'Clara Nunes',
    date: '04 jun',
    time: '09:30',
    status: 'Concluído',
  },
];

const plans = [
  { id: 'basic', name: 'Básico', price: 'R$ 49/mês', benefits: ['Agenda online', 'Cadastro de serviços', 'Suporte por email'] },
  { id: 'pro', name: 'Profissional', price: 'R$ 89/mês', benefits: ['Tudo do Básico', 'Profissionais ilimitados', 'Relatórios simples'] },
  { id: 'premium', name: 'Premium', price: 'R$ 149/mês', benefits: ['Tudo do Profissional', 'Destaque na busca', 'Campanhas e automações'] },
];

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const [isLoading, setIsLoading] = useState(true);
  const { isLoading: isAuthLoading, logout, user } = useAuth();

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 1800);

    return () => clearTimeout(timeout);
  }, []);

  if (isLoading || isAuthLoading) {
    return <PreloadScreen />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  const userType = user.role === 'OWNER' ? 'business' : 'client';

  if (userType === 'business') {
    return <BusinessApp onLogout={() => void logout()} />;
  }

  return <ClientApp onLogout={() => void logout()} />;
}

function PreloadScreen() {
  return (
    <SafeAreaView style={styles.preload}>
      <StatusBar style="dark" />
      <View style={styles.preloadLogoWrap}>
        <Image resizeMode="contain" source={logoIcon} style={styles.preloadIcon} />
        <Image resizeMode="contain" source={logoText} style={styles.preloadText} />
      </View>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.preloadCaption}>Preparando sua experiência</Text>
    </SafeAreaView>
  );
}

function AuthScreen() {
  const { isSubmitting, login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [accountType, setAccountType] = useState<UserType>('client');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(TEST_CLIENT_EMAIL);
  const [password, setPassword] = useState(TEST_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState('');

  const isLogin = mode === 'login';

  const submit = async () => {
    setFeedback('');
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes('@')) {
      setFeedback('Informe um email válido.');
      return;
    }

    if (password.length < 6) {
      setFeedback('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (!isLogin && name.trim().length < 3) {
      setFeedback('Informe seu nome completo.');
      return;
    }

    try {
      if (isLogin) {
        await login({
          email: normalizedEmail,
          password,
        });
        return;
      }

      await register({
        email: normalizedEmail,
        name: name.trim(),
        password,
        role: mapAccountTypeToRole(accountType),
      });
    } catch (error) {
      setFeedback(getAuthErrorMessage(error));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.authContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authBrand}>
            <Image resizeMode="contain" source={logoIcon} style={styles.authLogoIcon} />
            <Image resizeMode="contain" source={logoText} style={styles.authLogoText} />
          </View>

          <Text style={styles.authTitle}>{isLogin ? 'Entrar' : 'Criar conta'}</Text>
          <Text style={styles.authSubtitle}>
            {isLogin
              ? 'Acesse sua agenda e descubra serviços perto de você.'
              : 'Escolha seu tipo de conta e comece no ByAgenda.'}
          </Text>

          {!isLogin ? (
            <>
              <SegmentedControl
                options={[
                  { label: 'Cliente', value: 'client' },
                  { label: 'Estabelecimento', value: 'business' },
                ]}
                value={accountType}
                onChange={(value) => setAccountType(value as UserType)}
              />
              <Input label="Nome" placeholder="Seu nome" value={name} onChangeText={setName} />
            </>
          ) : null}

          <Input
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            label="Email"
            placeholder="cliente@byagenda.com"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Senha"
            placeholder="123456"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            rightIcon={
              <TouchableOpacity onPress={() => setShowPassword((current) => !current)}>
                <Ionicons
                  color={colors.textSecondary}
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                />
              </TouchableOpacity>
            }
          />

          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

          <Button
            title={isSubmitting ? 'Aguarde...' : isLogin ? 'Entrar' : 'Cadastrar'}
            size="large"
            onPress={submit}
          />
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => showActionFeedback('Google', 'Login com Google ainda não está conectado.')}
            style={styles.googleButton}
          >
            <Ionicons color={colors.text} name="logo-google" size={22} />
            <Text style={styles.googleButtonText}>Continuar com Google</Text>
          </TouchableOpacity>
          <Button
            title={isLogin ? 'Cadastre-se' : 'Já tem uma conta? Entrar'}
            variant="ghost"
            onPress={() => {
              setMode(isLogin ? 'register' : 'login');
              setFeedback('');
            }}
          />

          <View style={styles.testBox}>
            <Text style={styles.testTitle}>Acessos de teste</Text>
            <Text style={styles.testText}>Cliente: {TEST_CLIENT_EMAIL} / {TEST_PASSWORD}</Text>
            <Text style={styles.testText}>Empresa: {TEST_BUSINESS_EMAIL} / {TEST_PASSWORD}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function mapAccountTypeToRole(accountType: UserType): UserRole {
  return accountType === 'business' ? 'OWNER' : 'CLIENT';
}

function getAuthErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return 'Não foi possível concluir. Tente novamente.';
}

function ClientApp({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<ClientTab>('home');
  const [route, setRoute] = useState<ClientRoute>({ name: 'tabs' });
  const [appointments, setAppointments] = useState(initialAppointments);
  const [favoriteIds, setFavoriteIds] = useState(['studio-beleza']);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      title: 'Agendamento confirmado',
      text: 'Studio Beleza confirmou seu horário de 18 jun às 14:30.',
      read: false,
    },
    {
      id: 'n2',
      title: 'Novo destaque perto de você',
      text: 'Espaço Beauté publicou horários para limpeza de pele esta semana.',
      read: false,
    },
    {
      id: 'n3',
      title: 'Lembrete',
      text: 'Você tem um agendamento pendente aguardando confirmação.',
      read: true,
    },
  ]);

  const goHome = (nextTab: ClientTab) => {
    setRoute({ name: 'tabs' });
    setTab(nextTab);
  };

  const toggleFavorite = (id: string) => {
    setFavoriteIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const unreadNotifications = notifications.filter((item) => !item.read).length;

  const createAppointment = (establishmentId: string, selection: BookingSelection) => {
    const establishment = establishments.find((item) => item.id === establishmentId) ?? establishments[0];

    setAppointments((current) => [
      {
        id: `a${current.length + 1}`,
        establishmentId: establishment.id,
        service: selection.service.name,
        professional: selection.professional.name,
        date: selection.dateTime.split(' · ')[0],
        time: selection.dateTime.split(' · ')[1],
        status: 'Confirmado',
      },
      ...current,
    ]);
    setNotifications((current) => [
      {
        id: `n${current.length + 1}`,
        title: 'Novo agendamento criado',
        text: `${selection.service.name} em ${establishment.name} foi confirmado para ${selection.dateTime}.`,
        read: false,
      },
      ...current,
    ]);
    setRoute({ name: 'bookingSuccess', establishmentId: establishment.id });
  };

  if (route.name === 'establishment') {
    const establishment = establishments.find((item) => item.id === route.establishmentId) ?? establishments[0];
    return (
      <ScreenFrame
        title={establishment.name}
        onBack={() => setRoute({ name: 'tabs' })}
      >
        <EstablishmentDetails
          establishment={establishment}
          favorite={favoriteIds.includes(establishment.id)}
          onBook={() => setRoute({ name: 'booking', step: 'service', establishmentId: establishment.id })}
          onMap={() => setRoute({ name: 'map', establishmentId: establishment.id })}
          onToggleFavorite={() => toggleFavorite(establishment.id)}
        />
      </ScreenFrame>
    );
  }

  if (route.name === 'search') {
    return (
      <ScreenFrame title="Busca e filtros" onBack={() => setRoute({ name: 'tabs' })}>
        <SearchAndFilters onOpen={(id) => setRoute({ name: 'establishment', establishmentId: id })} />
      </ScreenFrame>
    );
  }

  if (route.name === 'booking') {
    const establishment = establishments.find((item) => item.id === route.establishmentId) ?? establishments[0];

    return (
      <ScreenFrame title="Novo agendamento" onBack={() => setRoute({ name: 'establishment', establishmentId: establishment.id })}>
        <BookingFlow
          establishment={establishment}
          step={route.step}
          onChangeStep={(step) => setRoute({ name: 'booking', step, establishmentId: establishment.id })}
          onConfirm={(selection) => createAppointment(establishment.id, selection)}
        />
      </ScreenFrame>
    );
  }

  if (route.name === 'notifications') {
    return (
      <ScreenFrame title="Notificações" onBack={() => setRoute({ name: 'tabs' })}>
        <NotificationsScreen
          notifications={notifications}
          onMarkAllRead={() =>
            setNotifications((current) => current.map((item) => ({ ...item, read: true })))
          }
          onToggle={(id) =>
            setNotifications((current) =>
              current.map((item) => (item.id === id ? { ...item, read: !item.read } : item)),
            )
          }
        />
      </ScreenFrame>
    );
  }

  if (route.name === 'bookingSuccess') {
    return (
      <ScreenFrame title="Agendamento confirmado">
        <SuccessScreen
          onAppointments={() => goHome('appointments')}
          onCalendar={() => showActionFeedback('Calendário', 'Evento adicionado ao calendário mockado.')}
          onMap={() => setRoute({ name: 'map', establishmentId: route.establishmentId })}
        />
      </ScreenFrame>
    );
  }

  if (route.name === 'appointmentDetail') {
    const appointment = appointments.find((item) => item.id === route.appointmentId) ?? appointments[0];
    return (
      <ScreenFrame title="Detalhes" onBack={() => goHome('appointments')}>
        <AppointmentDetails
          appointment={appointment}
          onMap={() => setRoute({ name: 'map', establishmentId: appointment.establishmentId })}
        />
      </ScreenFrame>
    );
  }

  if (route.name === 'map') {
    const establishment = establishments.find((item) => item.id === route.establishmentId) ?? establishments[0];
    return (
      <ScreenFrame title="Mapa e localização" onBack={() => setRoute({ name: 'establishment', establishmentId: establishment.id })}>
        <MapFallback establishment={establishment} />
      </ScreenFrame>
    );
  }

  if (route.name === 'profileOption') {
    return (
      <ScreenFrame title={route.title} onBack={() => goHome('profile')}>
        <TemporaryScreen title={route.title} />
      </ScreenFrame>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {tab === 'home' ? (
        <HomeScreen
          favoriteIds={favoriteIds}
          notificationCount={unreadNotifications}
          onOpen={(id) => setRoute({ name: 'establishment', establishmentId: id })}
          onNotifications={() => setRoute({ name: 'notifications' })}
          onSearch={() => setRoute({ name: 'search' })}
          onToggleFavorite={toggleFavorite}
        />
      ) : null}
      {tab === 'appointments' ? (
        <AppointmentsScreen
          appointments={appointments}
          onCreate={() => setRoute({ name: 'booking', step: 'service', establishmentId: establishments[0].id })}
          onOpen={(id) => setRoute({ name: 'appointmentDetail', appointmentId: id })}
        />
      ) : null}
      {tab === 'favorites' ? (
        <FavoritesScreen
          favoriteIds={favoriteIds}
          onOpen={(id) => setRoute({ name: 'establishment', establishmentId: id })}
          onToggleFavorite={toggleFavorite}
        />
      ) : null}
      {tab === 'profile' ? (
        <ProfileScreen
          onLogout={onLogout}
          onOpen={(title) => setRoute({ name: 'profileOption', title })}
        />
      ) : null}
      <BottomTabs active={tab} onChange={goHome} />
    </SafeAreaView>
  );
}

function HomeScreen({
  favoriteIds,
  notificationCount,
  onOpen,
  onNotifications,
  onSearch,
  onToggleFavorite,
}: {
  favoriteIds: string[];
  notificationCount: number;
  onOpen: (id: string) => void;
  onNotifications: () => void;
  onSearch: () => void;
  onToggleFavorite: (id: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('hair');

  const visibleEstablishments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const selectedLabel = categories.find((category) => category.id === selectedCategory)?.label;

    return establishments.filter((establishment) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        establishment.name.toLowerCase().includes(normalizedSearch) ||
        establishment.category.toLowerCase().includes(normalizedSearch);
      const matchesCategory =
        selectedCategory === 'hair' || establishment.category === selectedLabel;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Header notificationCount={notificationCount} onNotifications={onNotifications} />
      <SearchBar
        autoCapitalize="none"
        autoCorrect={false}
        containerStyle={styles.search}
        onChangeText={setSearchTerm}
        placeholder="Buscar serviços ou estabelecimentos"
        searchIcon={<Ionicons color="#667085" name="search-outline" size={31} />}
        value={searchTerm}
      />
      <FlatList
        contentContainerStyle={styles.categories}
        data={categories}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CategoryButton
            active={selectedCategory === item.id}
            item={item}
            onPress={() => setSelectedCategory(item.id)}
          />
        )}
        showsHorizontalScrollIndicator={false}
      />
      <SectionHeader title="Próximos de você" onSeeAll={onSearch} />
      <View style={styles.listGap}>
        {visibleEstablishments.map((establishment) => (
          <EstablishmentCard
            establishment={establishment}
            favorite={favoriteIds.includes(establishment.id)}
            key={establishment.id}
            onOpen={() => onOpen(establishment.id)}
            onToggleFavorite={() => onToggleFavorite(establishment.id)}
          />
        ))}
      </View>
      <SectionHeader title="Em destaque" onSeeAll={onSearch} />
      <FlatList
        contentContainerStyle={styles.featuredList}
        data={featuredServices}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeaturedCard service={item} />}
        showsHorizontalScrollIndicator={false}
      />
    </ScrollView>
  );
}

function BusinessApp({ onLogout }: { onLogout: () => void }) {
  const [route, setRoute] = useState<BusinessRoute>('dashboard');

  return (
    <ScreenFrame
      title={getBusinessTitle(route)}
      onBack={route === 'dashboard' ? undefined : () => setRoute('dashboard')}
      noPadding={route === 'dashboard'}
    >
      {route === 'dashboard' ? (
        <BusinessDashboard onLogout={onLogout} onOpen={setRoute} />
      ) : null}
      {route === 'appointments' ? <BusinessList title="Agendamentos recebidos" items={['Ana - Corte feminino - 14:30', 'Lucas - Barba - 16:00', 'Marta - Limpeza de pele - pendente']} /> : null}
      {route === 'services' ? <BusinessList title="Gerenciar serviços" items={['Corte feminino - R$ 90', 'Mechas + tonalização - R$ 180', 'Limpeza de pele - R$ 120']} /> : null}
      {route === 'professionals' ? <BusinessList title="Profissionais" items={['Ana Lira - Colorista', 'João Melo - Barbeiro', 'Clara Nunes - Esteticista']} /> : null}
      {route === 'clients' ? <BusinessList title="Clientes" items={['Mariana Costa', 'Lucas Andrade', 'Beatriz Lima']} /> : null}
      {route === 'settings' ? <BusinessList title="Configurações" items={['Editar dados do estabelecimento', 'Fotos e capa', 'Notificações', 'Privacidade']} /> : null}
      {route === 'hours' ? <BusinessList title="Horário de funcionamento" items={['Segunda a sexta: 08:00 - 18:00', 'Sábado: 08:00 - 13:00', 'Domingo: fechado']} /> : null}
      {route === 'plans' ? <PlansScreen /> : null}
    </ScreenFrame>
  );
}

function Header({
  notificationCount = 0,
  onNotifications,
}: {
  notificationCount?: number;
  onNotifications?: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <Image resizeMode="contain" source={logoIcon} style={styles.logoIcon} />
        <Image resizeMode="contain" source={logoText} style={styles.logoText} />
      </View>
      <TouchableOpacity activeOpacity={0.75} onPress={onNotifications} style={styles.notificationButton}>
        <Ionicons color={colors.text} name="notifications-outline" size={34} />
        {notificationCount > 0 ? (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}

function ScreenFrame({
  children,
  noPadding = false,
  onBack,
  title,
}: {
  children: React.ReactNode;
  noPadding?: boolean;
  onBack?: () => void;
  title: string;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screenHeader}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons color={colors.text} name="chevron-back" size={28} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        <Text numberOfLines={1} style={styles.screenTitle}>{title}</Text>
        <View style={styles.backButton} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.screenContent, noPadding && styles.noPadding]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ onSeeAll, title }: { onSeeAll?: () => void; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity activeOpacity={0.75} onPress={onSeeAll}>
        <Text style={styles.seeAll}>Ver todos</Text>
      </TouchableOpacity>
    </View>
  );
}

function CategoryButton({ active, item, onPress }: { active: boolean; item: Category; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress} style={styles.categoryButton}>
      <View style={[styles.categoryIconBox, active && styles.categoryIconBoxActive]}>
        <Ionicons color={colors.primary} name={item.icon} size={36} />
      </View>
      <Text numberOfLines={1} style={styles.categoryLabel}>{item.label}</Text>
    </TouchableOpacity>
  );
}

function EstablishmentCard({
  establishment,
  favorite,
  onOpen,
  onToggleFavorite,
}: {
  establishment: Establishment;
  favorite: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <Card style={styles.establishmentCard}>
      <TouchableOpacity activeOpacity={0.86} onPress={onOpen} style={styles.establishmentPress}>
        <Image source={{ uri: establishment.image }} style={styles.establishmentImage} />
        <View style={styles.establishmentInfo}>
          <Text numberOfLines={1} style={styles.establishmentName}>{establishment.name}</Text>
          <Text style={styles.establishmentCategory}>{establishment.category}</Text>
          <RatingLine distance={establishment.distance} rating={establishment.rating} reviews={establishment.reviews} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteButton}>
        <Ionicons
          color={favorite ? colors.error : '#59657C'}
          name={favorite ? 'heart' : 'heart-outline'}
          size={26}
        />
      </TouchableOpacity>
    </Card>
  );
}

function FeaturedCard({ service }: { service: FeaturedService }) {
  return (
    <Card style={styles.featuredCard}>
      <View style={styles.featuredImageWrapper}>
        <Image source={{ uri: service.image }} style={styles.featuredImage} />
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>{service.category}</Text>
        </View>
      </View>
      <View style={styles.featuredBody}>
        <Text numberOfLines={2} style={styles.featuredTitle}>{service.title}</Text>
        <RatingLine price={service.price} rating={service.rating} reviews={service.reviews} />
      </View>
    </Card>
  );
}

function RatingLine({
  distance,
  price,
  rating,
  reviews,
}: {
  distance?: string;
  price?: string;
  rating: string;
  reviews: number;
}) {
  return (
    <View style={styles.ratingLine}>
      <Ionicons color="#F8AA00" name="star" size={20} />
      <Text numberOfLines={1} style={styles.ratingText}>
        {rating} ({reviews})  ·  {distance ?? 'a partir de'} {price}
      </Text>
    </View>
  );
}

function EstablishmentDetails({
  establishment,
  favorite,
  onBook,
  onMap,
  onToggleFavorite,
}: {
  establishment: Establishment;
  favorite: boolean;
  onBook: () => void;
  onMap: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <View style={styles.detailStack}>
      <Image source={{ uri: establishment.image }} style={styles.heroImage} />
      <View style={styles.detailTitleRow}>
        <View style={styles.flex}>
          <Text style={styles.detailTitle}>{establishment.name}</Text>
          <Text style={styles.muted}>{establishment.address}</Text>
        </View>
        <TouchableOpacity onPress={onToggleFavorite} style={styles.roundIcon}>
          <Ionicons color={favorite ? colors.error : colors.textSecondary} name={favorite ? 'heart' : 'heart-outline'} size={28} />
        </TouchableOpacity>
      </View>
      <RatingLine distance={establishment.distance} rating={establishment.rating} reviews={establishment.reviews} />
      <ActionRow
        actions={[
          { icon: 'calendar-outline', label: 'Agendar', onPress: onBook },
          { icon: 'location-outline', label: 'Mapa', onPress: onMap },
          { icon: 'share-social-outline', label: 'Compartilhar', onPress: () => Share.share({ message: `Conheça ${establishment.name} no ByAgenda.` }) },
        ]}
      />
      <Text style={styles.blockTitle}>Serviços</Text>
      {establishment.services.map((service) => (
        <ServiceCard key={service.id} service={service} onPress={onBook} />
      ))}
      <Text style={styles.blockTitle}>Profissionais</Text>
      {establishment.professionals.map((professional) => (
        <MiniCard
          icon="person-circle-outline"
          key={professional.id}
          title={professional.name}
          subtitle={`${professional.role} · ${professional.rating}`}
        />
      ))}
    </View>
  );
}

function ServiceCard({ onPress, service }: { onPress: () => void; service: Service }) {
  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress}>
      <Card style={styles.serviceCard}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{service.name}</Text>
          <Text style={styles.muted}>{service.duration}</Text>
        </View>
        <Text style={styles.price}>{service.price}</Text>
      </Card>
    </TouchableOpacity>
  );
}

function SearchAndFilters({ onOpen }: { onOpen: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [minRating, setMinRating] = useState('4,5+');
  const filtered = establishments.filter((item) =>
    `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <View style={styles.detailStack}>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar por nome ou categoria" />
      <View style={styles.filterGrid}>
        {['Categoria', 'Distância', 'Preço', minRating].map((item) => (
          <Chip key={item} label={item} onPress={() => setMinRating('4,8+')} />
        ))}
        <Chip active={openNow} label="Aberto agora" onPress={() => setOpenNow((current) => !current)} />
        <Chip label="Limpar" onPress={() => { setQuery(''); setOpenNow(false); setMinRating('4,5+'); }} />
      </View>
      <Button title="Ver resultados" onPress={() => showActionFeedback('Filtros aplicados', `${filtered.length} resultado(s) encontrados.`)} />
      {filtered.map((item) => (
        <EstablishmentCard
          establishment={item}
          favorite={false}
          key={item.id}
          onOpen={() => onOpen(item.id)}
          onToggleFavorite={() => showActionFeedback('Favoritos', `${item.name} foi salvo nos favoritos mockados.`)}
        />
      ))}
    </View>
  );
}

function BookingFlow({
  establishment,
  onChangeStep,
  onConfirm,
  step,
}: {
  establishment: Establishment;
  onChangeStep: (step: BookingStep) => void;
  onConfirm: (selection: BookingSelection) => void;
  step: BookingStep;
}) {
  const steps: BookingStep[] = ['service', 'professional', 'datetime', 'summary'];
  const currentIndex = steps.indexOf(step);
  const dateTimes = ['24 jun · 09:00', '24 jun · 15:00', '25 jun · 11:30'];
  const [selectedServiceId, setSelectedServiceId] = useState(establishment.services[0].id);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(establishment.professionals[0].id);
  const [selectedDateTime, setSelectedDateTime] = useState(dateTimes[1]);

  const selectedService =
    establishment.services.find((service) => service.id === selectedServiceId) ?? establishment.services[0];
  const selectedProfessional =
    establishment.professionals.find((professional) => professional.id === selectedProfessionalId) ??
    establishment.professionals[0];

  const goNext = () => {
    if (step === 'summary') {
      onConfirm({
        dateTime: selectedDateTime,
        professional: selectedProfessional,
        service: selectedService,
      });
      return;
    }

    onChangeStep(steps[currentIndex + 1]);
  };

  return (
    <View style={styles.detailStack}>
      <View style={styles.stepRow}>
        {steps.map((item, index) => (
          <View key={item} style={[styles.stepDot, index <= currentIndex && styles.stepDotActive]}>
            <Text style={[styles.stepText, index <= currentIndex && styles.stepTextActive]}>{index + 1}</Text>
          </View>
        ))}
      </View>
      {step === 'service' ? (
        <View style={styles.detailStack}>
          <Text style={styles.blockTitle}>Escolha o serviço</Text>
          {establishment.services.map((service) => (
            <SelectableOption
              key={service.id}
              active={selectedServiceId === service.id}
              subtitle={service.duration}
              title={`${service.name} · ${service.price}`}
              onPress={() => setSelectedServiceId(service.id)}
            />
          ))}
        </View>
      ) : null}
      {step === 'professional' ? (
        <View style={styles.detailStack}>
          <Text style={styles.blockTitle}>Escolha o profissional</Text>
          {establishment.professionals.map((professional) => (
            <SelectableOption
              key={professional.id}
              active={selectedProfessionalId === professional.id}
              subtitle={`Avaliação ${professional.rating}`}
              title={`${professional.name} · ${professional.role}`}
              onPress={() => setSelectedProfessionalId(professional.id)}
            />
          ))}
        </View>
      ) : null}
      {step === 'datetime' ? (
        <View style={styles.detailStack}>
          <Text style={styles.blockTitle}>Data e hora</Text>
          {dateTimes.map((dateTime) => (
            <SelectableOption
              key={dateTime}
              active={selectedDateTime === dateTime}
              title={dateTime}
              onPress={() => setSelectedDateTime(dateTime)}
            />
          ))}
        </View>
      ) : null}
      {step === 'summary' ? (
        <Card style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Resumo</Text>
          <Text style={styles.muted}>{establishment.name}</Text>
          <Text style={styles.muted}>{selectedService.name} com {selectedProfessional.name}</Text>
          <Text style={styles.price}>{selectedDateTime} · {selectedService.price}</Text>
        </Card>
      ) : null}
      {currentIndex > 0 ? (
        <Button
          title="Voltar etapa"
          variant="ghost"
          onPress={() => onChangeStep(steps[currentIndex - 1])}
        />
      ) : null}
      <Button
        title={step === 'summary' ? 'Confirmar agendamento' : 'Continuar'}
        onPress={goNext}
      />
    </View>
  );
}

function SelectableOption({
  active,
  onPress,
  subtitle,
  title,
}: {
  active: boolean;
  onPress: () => void;
  subtitle?: string;
  title: string;
}) {
  return (
    <TouchableOpacity activeOpacity={0.84} onPress={onPress}>
      <Card style={[styles.selectableCard, active && styles.selectableCardActive]}>
        <Ionicons
          color={active ? colors.primary : colors.textSecondary}
          name={active ? 'checkmark-circle' : 'ellipse-outline'}
          size={29}
        />
        <View style={styles.flex}>
          <Text style={styles.selectableTitle}>{title}</Text>
          {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function SuccessScreen({
  onAppointments,
  onCalendar,
  onMap,
}: {
  onAppointments: () => void;
  onCalendar: () => void;
  onMap: () => void;
}) {
  return (
    <View style={styles.success}>
      <Ionicons color={colors.success} name="checkmark-circle" size={86} />
      <Text style={styles.detailTitle}>Agendamento confirmado!</Text>
      <Text style={styles.centerMuted}>Seu horário foi reservado com sucesso.</Text>
      <Button title="Ver meus agendamentos" onPress={onAppointments} />
      <Button title="Traçar rota" variant="outline" onPress={onMap} />
      <Button title="Adicionar ao calendário" variant="ghost" onPress={onCalendar} />
    </View>
  );
}

function NotificationsScreen({
  notifications,
  onMarkAllRead,
  onToggle,
}: {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onToggle: (id: string) => void;
}) {
  return (
    <View style={styles.detailStack}>
      <Button title="Marcar todas como lidas" variant="outline" onPress={onMarkAllRead} />
      {notifications.map((notification) => (
        <TouchableOpacity
          activeOpacity={0.84}
          key={notification.id}
          onPress={() => onToggle(notification.id)}
        >
          <Card style={[styles.notificationCard, !notification.read && styles.notificationCardUnread]}>
            <View style={styles.cardRow}>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{notification.title}</Text>
                <Text style={styles.muted}>{notification.text}</Text>
              </View>
              <Ionicons
                color={notification.read ? colors.textSecondary : colors.primary}
                name={notification.read ? 'mail-open-outline' : 'mail-unread-outline'}
                size={24}
              />
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function AppointmentsScreen({
  appointments,
  onCreate,
  onOpen,
}: {
  appointments: Appointment[];
  onCreate: () => void;
  onOpen: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'pending' | 'done'>('pending');
  const visible = appointments.filter((appointment) =>
    filter === 'pending' ? appointment.status !== 'Concluído' : appointment.status === 'Concluído',
  );

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Meus agendamentos</Text>
      <SegmentedControl
        options={[
          { label: 'Pendentes', value: 'pending' },
          { label: 'Concluídos', value: 'done' },
        ]}
        value={filter}
        onChange={(value) => setFilter(value as 'pending' | 'done')}
      />
      <Button title="Novo agendamento" onPress={onCreate} />
      <View style={styles.listGap}>
        {visible.map((appointment) => (
          <AppointmentCard appointment={appointment} key={appointment.id} onOpen={() => onOpen(appointment.id)} />
        ))}
      </View>
    </ScrollView>
  );
}

function AppointmentCard({
  appointment,
  onOpen,
  showDetailsButton = true,
}: {
  appointment: Appointment;
  onOpen: () => void;
  showDetailsButton?: boolean;
}) {
  const establishment = establishments.find((item) => item.id === appointment.establishmentId);
  return (
    <Card style={styles.appointmentCard}>
      <View style={styles.cardRow}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{appointment.service}</Text>
          <Text style={styles.muted}>{establishment?.name} · {appointment.professional}</Text>
          <Text style={styles.price}>{appointment.date} às {appointment.time}</Text>
        </View>
        <StatusPill status={appointment.status} />
      </View>
      {showDetailsButton ? <Button title="Ver detalhes" variant="outline" onPress={onOpen} /> : null}
    </Card>
  );
}

function AppointmentDetails({ appointment, onMap }: { appointment: Appointment; onMap: () => void }) {
  const establishment = establishments.find((item) => item.id === appointment.establishmentId) ?? establishments[0];
  return (
    <View style={styles.detailStack}>
      <AppointmentCard appointment={appointment} showDetailsButton={false} onOpen={() => undefined} />
      <MiniCard icon="location-outline" title={establishment.address} subtitle="Distância aproximada: 1,2 km" />
      <Button title="Traçar rota" onPress={onMap} />
      <Button title="Cancelar agendamento" variant="outline" onPress={() => showActionFeedback('Agendamento', 'Solicitação de cancelamento registrada.')} />
    </View>
  );
}

function FavoritesScreen({
  favoriteIds,
  onOpen,
  onToggleFavorite,
}: {
  favoriteIds: string[];
  onOpen: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const favorites = establishments.filter((item) => favoriteIds.includes(item.id));
  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Favoritos</Text>
      {favorites.length === 0 ? (
        <EmptyState title="Nada salvo ainda" text="Toque no coração dos estabelecimentos para encontrar tudo aqui." />
      ) : (
        <View style={styles.listGap}>
          {favorites.map((item) => (
            <EstablishmentCard
              establishment={item}
              favorite
              key={item.id}
              onOpen={() => onOpen(item.id)}
              onToggleFavorite={() => onToggleFavorite(item.id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function ProfileScreen({ onLogout, onOpen }: { onLogout: () => void; onOpen: (title: string) => void }) {
  const items = [
    'Editar perfil',
    'Alterar senha',
    'Notificações',
    'Métodos de pagamento',
    'Endereços',
    'Privacidade e segurança',
    'Ajuda e suporte',
    'Termos de uso',
  ];

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Meu Perfil</Text>
      <Card style={styles.profileCard}>
        <View style={styles.avatar}><Text style={styles.avatarText}>CL</Text></View>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>Cliente ByAgenda</Text>
          <Text style={styles.muted}>{TEST_CLIENT_EMAIL}</Text>
          <Text style={styles.muted}>+55 81 90000-0000</Text>
        </View>
      </Card>
      {items.map((item) => <ProfileMenuItem key={item} title={item} onPress={() => onOpen(item)} />)}
      <ProfileMenuItem danger title="Sair da conta" onPress={onLogout} />
    </ScrollView>
  );
}

function MapFallback({ establishment }: { establishment: Establishment }) {
  const [userCoordinate, setUserCoordinate] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [permissionLabel, setPermissionLabel] = useState('Solicitando localização...');

  useEffect(() => {
    let mounted = true;

    async function loadLocation() {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!mounted) {
        return;
      }

      if (permission.status !== 'granted') {
        setPermissionLabel('Permissão não concedida. Exibindo o estabelecimento no mapa.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({});

      if (!mounted) {
        return;
      }

      setUserCoordinate({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
      setPermissionLabel('Sua localização está ativa.');
    }

    loadLocation().catch(() => {
      if (mounted) {
        setPermissionLabel('Não foi possível obter sua localização agora.');
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${establishment.coordinate.latitude},${establishment.coordinate.longitude}`;

  return (
    <View style={styles.detailStack}>
      <View style={styles.mapBox}>
        <MapView
          initialRegion={{
            latitude: establishment.coordinate.latitude,
            longitude: establishment.coordinate.longitude,
            latitudeDelta: 0.025,
            longitudeDelta: 0.025,
          }}
          showsUserLocation
          style={styles.map}
        >
          <Marker
            coordinate={establishment.coordinate}
            description={establishment.address}
            title={establishment.name}
          />
          {userCoordinate ? (
            <Marker
              coordinate={userCoordinate}
              description="Você está aqui"
              pinColor={colors.primary}
              title="Sua localização"
            />
          ) : null}
        </MapView>
      </View>
      <MiniCard icon="location-outline" title={establishment.name} subtitle={`${establishment.address} · ${permissionLabel}`} />
      <ActionRow
        actions={[
          { icon: 'navigate-outline', label: 'Traçar rota', onPress: () => Linking.openURL(mapsUrl) },
          { icon: 'map-outline', label: 'Como chegar', onPress: () => Linking.openURL(mapsUrl) },
          { icon: 'share-social-outline', label: 'Compartilhar', onPress: () => Share.share({ message: `Rota para ${establishment.name}: ${mapsUrl}` }) },
          { icon: 'bookmark-outline', label: 'Salvar', onPress: () => showActionFeedback('Local salvo', `${establishment.name} foi salvo.`) },
        ]}
      />
      <Button title="Ver detalhes" onPress={() => showActionFeedback('Detalhes', establishment.address)} />
    </View>
  );
}

function BusinessDashboard({ onLogout, onOpen }: { onLogout: () => void; onOpen: (route: BusinessRoute) => void }) {
  const cards: Array<{ icon: keyof typeof Ionicons.glyphMap; title: string; route: BusinessRoute }> = [
    { icon: 'calendar-outline', title: 'Agendamentos recebidos', route: 'appointments' },
    { icon: 'pricetag-outline', title: 'Gerenciar serviços', route: 'services' },
    { icon: 'people-outline', title: 'Profissionais', route: 'professionals' },
    { icon: 'person-add-outline', title: 'Clientes', route: 'clients' },
    { icon: 'time-outline', title: 'Horário de funcionamento', route: 'hours' },
    { icon: 'card-outline', title: 'Planos e pagamento', route: 'plans' },
    { icon: 'settings-outline', title: 'Configurações', route: 'settings' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Header />
      <Text style={styles.pageTitle}>Dashboard da empresa</Text>
      <View style={styles.metricGrid}>
        <Metric value="12" label="Hoje" />
        <Metric value="R$ 860" label="Receita" />
        <Metric value="4,8" label="Avaliação" />
      </View>
      <View style={styles.listGap}>
        {cards.map((item) => (
          <ProfileMenuItem
            icon={item.icon}
            key={item.title}
            title={item.title}
            onPress={() => onOpen(item.route)}
          />
        ))}
        <ProfileMenuItem danger icon="exit-outline" title="Sair da conta" onPress={onLogout} />
      </View>
    </ScrollView>
  );
}

function BusinessList({ items, title }: { items: string[]; title: string }) {
  const [localItems, setLocalItems] = useState(items);

  return (
    <View style={styles.detailStack}>
      <Text style={styles.blockTitle}>{title}</Text>
      {localItems.map((item) => <MiniCard icon="checkmark-circle-outline" key={item} title={item} subtitle="Toque em adicionar para simular novos registros." />)}
      <Button
        title="Adicionar"
        onPress={() => setLocalItems((current) => [`Novo item ${current.length + 1}`, ...current])}
      />
    </View>
  );
}

function PlansScreen() {
  const [selected, setSelected] = useState('pro');
  const [subscribed, setSubscribed] = useState('');

  return (
    <View style={styles.detailStack}>
      <Text style={styles.muted}>Planos disponíveis apenas para estabelecimentos.</Text>
      {subscribed ? <Text style={styles.feedback}>Plano {subscribed} assinado com sucesso.</Text> : null}
      {plans.map((plan) => (
        <TouchableOpacity key={plan.id} onPress={() => setSelected(plan.id)} activeOpacity={0.86}>
          <Card style={[styles.planCard, selected === plan.id && styles.planCardActive]}>
            <View style={styles.cardRow}>
              <View>
                <Text style={styles.cardTitle}>{plan.name}</Text>
                <Text style={styles.price}>{plan.price}</Text>
              </View>
              {selected === plan.id ? <Ionicons color={colors.primary} name="checkmark-circle" size={26} /> : null}
            </View>
            {plan.benefits.map((benefit) => <Text key={benefit} style={styles.muted}>• {benefit}</Text>)}
            <Button title="Assinar plano" onPress={() => setSubscribed(plan.name)} />
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function BottomTabs({ active, onChange }: { active: ClientTab; onChange: (tab: ClientTab) => void }) {
  const tabs: Array<{ label: string; value: ClientTab; icon: keyof typeof Ionicons.glyphMap }> = [
    { label: 'Início', value: 'home', icon: 'home' },
    { label: 'Agendamentos', value: 'appointments', icon: 'calendar-outline' },
    { label: 'Favoritos', value: 'favorites', icon: 'heart-outline' },
    { label: 'Perfil', value: 'profile', icon: 'person-outline' },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const selected = active === tab.value;
        return (
          <TouchableOpacity key={tab.value} onPress={() => onChange(tab.value)} style={styles.bottomTab}>
            <Ionicons color={selected ? colors.primary : '#59657C'} name={tab.icon} size={30} />
            <Text style={[styles.bottomTabText, selected && styles.bottomTabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SegmentedControl({
  onChange,
  options,
  value,
}: {
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Chip({ active = false, label, onPress }: { active?: boolean; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatusPill({ status }: { status: Appointment['status'] }) {
  const color = status === 'Concluído' ? colors.success : status === 'Pendente' ? colors.warning : colors.primary;
  return (
    <View style={[styles.statusPill, { backgroundColor: `${color}18` }]}>
      <Text style={[styles.statusText, { color }]}>{status}</Text>
    </View>
  );
}

function MiniCard({
  icon,
  onPress,
  subtitle,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  subtitle?: string;
  title: string;
}) {
  return (
    <TouchableOpacity activeOpacity={0.82} disabled={!onPress} onPress={onPress}>
      <Card style={styles.miniCard}>
        <Ionicons color={colors.primary} name={icon} size={25} />
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
        </View>
        {onPress ? <Ionicons color={colors.textSecondary} name="chevron-forward" size={22} /> : null}
      </Card>
    </TouchableOpacity>
  );
}

function ProfileMenuItem({
  danger = false,
  icon = 'chevron-forward-circle-outline',
  onPress,
  title,
}: {
  danger?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  title: string;
}) {
  return (
    <TouchableOpacity activeOpacity={0.82} onPress={onPress}>
      <Card style={styles.menuItem}>
        <Ionicons color={danger ? colors.error : colors.primary} name={icon} size={24} />
        <Text style={[styles.menuText, danger && styles.dangerText]}>{title}</Text>
        <Ionicons color={colors.textSecondary} name="chevron-forward" size={22} />
      </Card>
    </TouchableOpacity>
  );
}

function ActionRow({
  actions,
}: {
  actions: Array<{ icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }>;
}) {
  return (
    <View style={styles.actionRow}>
      {actions.map((action) => (
        <TouchableOpacity key={action.label} onPress={action.onPress} style={styles.actionButton}>
          <Ionicons color={colors.primary} name={action.icon} size={24} />
          <Text style={styles.actionLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function EmptyState({ text, title }: { text: string; title: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons color={colors.primary} name="sparkles-outline" size={42} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.centerMuted}>{text}</Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </Card>
  );
}

function TemporaryScreen({ title }: { title: string }) {
  if (title === 'Editar perfil') {
    return (
      <View style={styles.detailStack}>
        <Input defaultValue="Cliente ByAgenda" label="Nome" />
        <Input defaultValue={TEST_CLIENT_EMAIL} label="Email" />
        <Input defaultValue="+55 81 90000-0000" label="Telefone" />
        <Button title="Atualizar perfil" onPress={() => showActionFeedback('Perfil atualizado')} />
      </View>
    );
  }

  if (title === 'Alterar senha') {
    return (
      <View style={styles.detailStack}>
        <Input label="Senha atual" placeholder="Digite sua senha atual" secureTextEntry />
        <Input label="Nova senha" placeholder="Mínimo de 6 caracteres" secureTextEntry />
        <Input label="Confirmar nova senha" placeholder="Repita a nova senha" secureTextEntry />
        <Button title="Alterar senha" onPress={() => showActionFeedback('Senha alterada', 'Sua nova senha mockada foi registrada.')} />
      </View>
    );
  }

  if (title === 'Notificações') {
    return (
      <View style={styles.detailStack}>
        <ToggleCard active title="Lembretes de agendamento" />
        <ToggleCard active title="Promoções dos favoritos" />
        <ToggleCard title="Resumo semanal" />
        <Button title="Salvar preferências" onPress={() => showActionFeedback('Preferências salvas')} />
      </View>
    );
  }

  if (title === 'Métodos de pagamento') {
    return (
      <View style={styles.detailStack}>
        <MiniCard icon="card-outline" title="Visa final 4242" subtitle="Cartão principal mockado" />
        <MiniCard icon="qr-code-outline" title="Pix" subtitle="Ativo para pagamentos no app" />
        <Button title="Adicionar método" onPress={() => showActionFeedback('Pagamento', 'Novo método de pagamento mockado adicionado.')} />
      </View>
    );
  }

  if (title === 'Endereços') {
    return (
      <View style={styles.detailStack}>
        <MiniCard icon="home-outline" title="Casa" subtitle="Rua das Palmeiras, 120 - Recife" />
        <MiniCard icon="business-outline" title="Trabalho" subtitle="Av. Rio Branco, 22 - Recife" />
        <Button title="Adicionar endereço" onPress={() => showActionFeedback('Endereço', 'Novo endereço mockado adicionado.')} />
      </View>
    );
  }

  if (title === 'Privacidade e segurança') {
    return (
      <View style={styles.detailStack}>
        <ToggleCard active title="Autenticação em duas etapas" />
        <ToggleCard active title="Ocultar telefone para estabelecimentos" />
        <MiniCard icon="shield-checkmark-outline" title="Sessões ativas" subtitle="1 dispositivo conectado" />
        <Button title="Revisar segurança" onPress={() => showActionFeedback('Segurança revisada')} />
      </View>
    );
  }

  if (title === 'Ajuda e suporte') {
    return (
      <View style={styles.detailStack}>
        <MiniCard icon="chatbubble-ellipses-outline" title="Falar com suporte" subtitle="Resposta em até 1 dia útil" />
        <MiniCard icon="help-circle-outline" title="Perguntas frequentes" subtitle="Agendamentos, pagamentos e cancelamentos" />
        <Button title="Abrir chamado" onPress={() => showActionFeedback('Chamado aberto', 'Protocolo mockado #BYA-1024.')} />
      </View>
    );
  }

  if (title === 'Termos de uso') {
    return (
      <View style={styles.detailStack}>
        <Text style={styles.blockTitle}>Termos de uso</Text>
        <Text style={styles.muted}>
          Esta é uma prévia mockada dos termos do ByAgenda. A versão final deve incluir política
          de privacidade, regras de cancelamento, uso de localização e consentimento de dados.
        </Text>
        <Button title="Li e concordo" onPress={() => showActionFeedback('Termos aceitos')} />
      </View>
    );
  }

  return (
    <View style={styles.detailStack}>
      <EmptyState title={title} text="Tela mockada navegável, pronta para receber integração definitiva." />
    </View>
  );
}

function ToggleCard({ active = false, title }: { active?: boolean; title: string }) {
  const [enabled, setEnabled] = useState(active);

  return (
    <TouchableOpacity activeOpacity={0.82} onPress={() => setEnabled((current) => !current)}>
      <Card style={styles.menuItem}>
        <Ionicons color={enabled ? colors.primary : colors.textSecondary} name={enabled ? 'radio-button-on' : 'radio-button-off'} size={28} />
        <Text style={styles.menuText}>{title}</Text>
        <Text style={[styles.statusText, { color: enabled ? colors.primary : colors.textSecondary }]}>
          {enabled ? 'Ativo' : 'Inativo'}
        </Text>
      </Card>
    </TouchableOpacity>
  );
}

function getBusinessTitle(route: BusinessRoute) {
  const titles: Record<BusinessRoute, string> = {
    appointments: 'Agendamentos',
    clients: 'Clientes',
    dashboard: 'Empresa',
    hours: 'Horários',
    plans: 'Planos e pagamento',
    professionals: 'Profissionais',
    services: 'Serviços',
    settings: 'Configurações',
  };
  return titles[route];
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.white,
    flex: 1,
  },
  preload: {
    alignItems: 'center',
    backgroundColor: colors.white,
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  preloadLogoWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  preloadIcon: {
    height: 124,
    width: 124,
  },
  preloadText: {
    height: 52,
    marginTop: spacing.sm,
    width: 230,
  },
  preloadCaption: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  flex: {
    flex: 1,
  },
  authContent: {
    flexGrow: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  authBrand: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  authLogoIcon: {
    height: 92,
    width: 92,
  },
  authLogoText: {
    height: 48,
    marginTop: spacing.sm,
    width: 210,
  },
  authTitle: {
    color: colors.text,
    fontFamily: typography.fontFamily.bold,
    fontSize: 32,
    fontWeight: '800',
  },
  authSubtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 23,
  },
  feedback: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.primary,
    fontWeight: '700',
    padding: spacing.md,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1.2,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 54,
  },
  googleButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  testBox: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  testTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  testText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tabContent: {
    paddingBottom: 118,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  logoIcon: {
    height: 58,
    width: 58,
  },
  logoText: {
    height: 44,
    width: 178,
  },
  notificationButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  notificationDot: {
    backgroundColor: '#FF3448',
    borderColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 2,
    height: 14,
    position: 'absolute',
    right: 7,
    top: 8,
    width: 14,
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderColor: colors.white,
    borderRadius: radius.full,
    borderWidth: 2,
    minHeight: 22,
    minWidth: 22,
    paddingHorizontal: 5,
    position: 'absolute',
    right: 2,
    top: 2,
  },
  notificationBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  search: {
    borderColor: '#DBE2EE',
    borderRadius: radius.lg,
    minHeight: 64,
    paddingHorizontal: 18,
  },
  categories: {
    gap: 14,
    paddingBottom: spacing.sm,
    paddingTop: spacing.lg,
  },
  categoryButton: {
    alignItems: 'center',
    gap: 10,
    width: 86,
  },
  categoryIconBox: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#DBE2EE',
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 82,
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    width: 82,
  },
  categoryIconBoxActive: {
    borderColor: 'rgba(37, 99, 235, 0.34)',
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
  },
  categoryLabel: {
    color: colors.text,
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.fontFamily.bold,
    fontSize: 24,
    fontWeight: '800',
  },
  seeAll: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
    fontSize: 16,
    fontWeight: '800',
  },
  listGap: {
    gap: 14,
  },
  establishmentCard: {
    alignItems: 'center',
    borderColor: '#E1E7F0',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 126,
    padding: 12,
  },
  establishmentPress: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
  establishmentImage: {
    borderRadius: radius.md,
    height: 102,
    width: 118,
  },
  establishmentInfo: {
    flex: 1,
    gap: 9,
  },
  establishmentName: {
    color: colors.text,
    fontFamily: typography.fontFamily.bold,
    fontSize: 19,
    fontWeight: '800',
  },
  establishmentCategory: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: 16,
    fontWeight: '600',
  },
  favoriteButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 38,
  },
  ratingLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  ratingText: {
    color: '#53617C',
    flex: 1,
    fontFamily: typography.fontFamily.bold,
    fontSize: 14,
    fontWeight: '700',
  },
  featuredList: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  featuredCard: {
    borderColor: '#E1E7F0',
    borderRadius: radius.lg,
    marginRight: spacing.md,
    overflow: 'hidden',
    padding: 0,
    width: 244,
  },
  featuredImageWrapper: {
    height: 138,
  },
  featuredImage: {
    height: '100%',
    width: '100%',
  },
  featuredBadge: {
    backgroundColor: colors.white,
    borderRadius: radius.full,
    bottom: 14,
    left: 16,
    paddingHorizontal: 13,
    paddingVertical: 9,
    position: 'absolute',
  },
  featuredBadgeText: {
    color: colors.primary,
    fontWeight: '800',
  },
  featuredBody: {
    gap: 14,
    padding: spacing.md,
  },
  featuredTitle: {
    color: colors.text,
    fontFamily: typography.fontFamily.bold,
    fontSize: 19,
    fontWeight: '800',
    minHeight: 44,
  },
  bottomNav: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopColor: '#E1E7F0',
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    height: 86,
    justifyContent: 'space-around',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  bottomTab: {
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
    minWidth: 72,
  },
  bottomTabText: {
    color: '#59657C',
    fontFamily: typography.fontFamily.bold,
    fontSize: 12,
    fontWeight: '700',
  },
  bottomTabTextActive: {
    color: colors.primary,
  },
  screenHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: spacing.md,
  },
  backButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  screenTitle: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.fontFamily.bold,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  screenContent: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  noPadding: {
    padding: 0,
  },
  detailStack: {
    gap: spacing.md,
  },
  heroImage: {
    borderRadius: radius.lg,
    height: 210,
    width: '100%',
  },
  detailTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  detailTitle: {
    color: colors.text,
    fontFamily: typography.fontFamily.bold,
    fontSize: 26,
    fontWeight: '800',
  },
  muted: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  centerMuted: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  roundIcon: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: radius.md,
    flexGrow: 1,
    gap: spacing.xs,
    minWidth: 92,
    padding: spacing.md,
  },
  actionLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  blockTitle: {
    color: colors.text,
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    fontWeight: '800',
  },
  serviceCard: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: colors.text,
    fontFamily: typography.fontFamily.bold,
    fontSize: 17,
    fontWeight: '800',
  },
  price: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
    fontSize: 15,
    fontWeight: '800',
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: '800',
  },
  chipTextActive: {
    color: colors.white,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  stepDot: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.full,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepText: {
    color: colors.textSecondary,
    fontWeight: '800',
  },
  stepTextActive: {
    color: colors.white,
  },
  summaryCard: {
    gap: spacing.sm,
  },
  selectableCard: {
    alignItems: 'center',
    borderColor: '#E1E7F0',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 74,
  },
  selectableCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
  },
  selectableTitle: {
    color: colors.text,
    fontFamily: typography.fontFamily.bold,
    fontSize: 20,
    fontWeight: '900',
  },
  success: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xl,
  },
  pageTitle: {
    color: colors.text,
    fontFamily: typography.fontFamily.bold,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  segmented: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  segment: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.textSecondary,
    fontWeight: '800',
  },
  segmentTextActive: {
    color: colors.white,
  },
  appointmentCard: {
    gap: spacing.md,
  },
  notificationCard: {
    borderColor: '#E1E7F0',
  },
  notificationCardUnread: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  cardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  statusPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  profileCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: radius.full,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  menuText: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  dangerText: {
    color: colors.error,
  },
  mapBox: {
    backgroundColor: '#DDEAFE',
    borderRadius: radius.lg,
    height: 280,
    overflow: 'hidden',
  },
  map: {
    height: '100%',
    width: '100%',
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EAF3FF',
    opacity: 0.9,
  },
  userPin: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 42,
    justifyContent: 'center',
    left: 70,
    position: 'absolute',
    top: 150,
    width: 42,
  },
  placePin: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: radius.full,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    right: 82,
    top: 72,
    width: 42,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metricCard: {
    flex: 1,
    padding: spacing.md,
  },
  metricValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  miniCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  planCard: {
    gap: spacing.md,
  },
  planCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
});
