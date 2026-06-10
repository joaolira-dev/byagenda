import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button, Input } from '@/components';
import { colors, radius, spacing, typography } from '@/themes';

type AuthScreen = 'splash' | 'start' | 'login' | 'register' | 'forgot';

type LoginForm = {
  email: string;
  password: string;
};

type RegisterForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type ForgotForm = {
  email: string;
};

type FormErrors<T> = Partial<Record<keyof T, string>>;

const logoIcon = require('./assets/logo-icon.png');
const logoText = require('./assets/images/byagenda-logo-text.png');
const googleIcon = require('./assets/google-icon.png');

const initialLoginForm: LoginForm = {
  email: '',
  password: '',
};

const initialRegisterForm: RegisterForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

const initialForgotForm: ForgotForm = {
  email: '',
};

export default function App() {
  const [screen, setScreen] = useState<AuthScreen>('splash');
  const [loginForm, setLoginForm] = useState<LoginForm>(initialLoginForm);
  const [registerForm, setRegisterForm] = useState<RegisterForm>(initialRegisterForm);
  const [forgotForm, setForgotForm] = useState<ForgotForm>(initialForgotForm);
  const [loginErrors, setLoginErrors] = useState<FormErrors<LoginForm>>({});
  const [registerErrors, setRegisterErrors] = useState<FormErrors<RegisterForm>>({});
  const [forgotErrors, setForgotErrors] = useState<FormErrors<ForgotForm>>({});
  const [feedback, setFeedback] = useState('');

  const goTo = (nextScreen: AuthScreen) => {
    setFeedback('');
    setLoginErrors({});
    setRegisterErrors({});
    setForgotErrors({});
    setScreen(nextScreen);
  };

  const handleLogin = () => {
    const errors = validateLogin(loginForm);
    setLoginErrors(errors);

    if (hasErrors(errors)) {
      return;
    }

    setFeedback('Login validado. Pronto para conectar com a API.');
  };

  const handleRegister = () => {
    const errors = validateRegister(registerForm);
    setRegisterErrors(errors);

    if (hasErrors(errors)) {
      return;
    }

    setFeedback('Cadastro validado. Fluxo visual finalizado.');
  };

  const handleForgot = () => {
    const errors = validateForgot(forgotForm);
    setForgotErrors(errors);

    if (hasErrors(errors)) {
      return;
    }

    setFeedback('Enviamos as instrucoes para o email informado.');
  };

  if (screen === 'splash') {
    return <SplashScreen onFinish={() => setScreen('start')} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {screen === 'start' ? (
          <StartScreen onLogin={() => goTo('login')} onRegister={() => goTo('register')} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.authScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AuthBackButton onPress={() => goTo('start')} />

            {screen === 'login' ? (
              <LoginScreen
                feedback={feedback}
                form={loginForm}
                errors={loginErrors}
                onChange={(field, value) => setLoginForm((current) => ({ ...current, [field]: value }))}
                onForgotPassword={() => goTo('forgot')}
                onRegister={() => goTo('register')}
                onSubmit={handleLogin}
              />
            ) : null}

            {screen === 'register' ? (
              <RegisterScreen
                feedback={feedback}
                form={registerForm}
                errors={registerErrors}
                onChange={(field, value) => setRegisterForm((current) => ({ ...current, [field]: value }))}
                onLogin={() => goTo('login')}
                onSubmit={handleRegister}
              />
            ) : null}

            {screen === 'forgot' ? (
              <ForgotPasswordScreen
                feedback={feedback}
                form={forgotForm}
                errors={forgotErrors}
                onChange={(field, value) => setForgotForm((current) => ({ ...current, [field]: value }))}
                onLogin={() => goTo('login')}
                onSubmit={handleForgot}
              />
            ) : null}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  const entrance = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      duration: 700,
      toValue: 1,
      useNativeDriver: true,
    }).start();

    Animated.timing(progress, {
      duration: 2600,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: false,
    }).start();

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 760,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 760,
          easing: Easing.inOut(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseAnimation.start();
    const timeout = setTimeout(onFinish, 3000);

    return () => {
      clearTimeout(timeout);
      pulseAnimation.stop();
    };
  }, [entrance, onFinish, progress, pulse]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['30%', '100%'],
  });

  return (
    <SafeAreaView style={styles.splashScreen}>
      <StatusBar style="dark" />
      <Animated.View
        style={[
          styles.splashContent,
          {
            opacity: entrance,
            transform: [
              {
                translateY: entrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
            ],
          },
        ]}
      >
        <BrandLockup size="large" />

        <View style={styles.loaderRow}>
          <AnimatedDot pulse={pulse} step={0} />
          <AnimatedDot pulse={pulse} step={1} />
          <AnimatedDot pulse={pulse} step={2} />
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>

        <Text style={styles.loadingTitle}>Carregando...</Text>
        <Text style={styles.loadingSubtitle}>Preparando sua experiencia</Text>
      </Animated.View>

      <WaveFooter variant="splash" />
    </SafeAreaView>
  );
}

function AnimatedDot({ pulse, step }: { pulse: Animated.Value; step: 0 | 1 | 2 }) {
  const outputRanges = [
    [1, 0.48, 0.48],
    [0.48, 1, 0.48],
    [0.48, 0.48, 1],
  ];

  const opacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: outputRanges[step],
  });

  const scale = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: outputRanges[step].map((value) => 0.82 + value * 0.18),
  });

  return <Animated.View style={[styles.loadingDot, { opacity, transform: [{ scale }] }]} />;
}

function StartScreen({
  onLogin,
  onRegister,
}: {
  onLogin: () => void;
  onRegister: () => void;
}) {
  return (
    <View style={styles.startScreen}>
      <View style={styles.startCenter}>
        <BrandLockup size="large" />
        <Text style={styles.startDescription}>
          Agende servicos com praticidade e seguranca.
        </Text>
      </View>

      <View style={styles.startActions}>
        <Button
          title="Comecar agora"
          size="large"
          onPress={onRegister}
          style={styles.primaryActionButton}
          textStyle={styles.primaryActionText}
        />

        <View style={styles.loginPrompt}>
          <Text style={styles.promptText}>Ja tem uma conta?</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={onLogin}>
            <Text style={styles.promptLink}> Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <WaveFooter variant="start" />
    </View>
  );
}

function LoginScreen({
  feedback,
  form,
  errors,
  onChange,
  onForgotPassword,
  onRegister,
  onSubmit,
}: {
  feedback: string;
  form: LoginForm;
  errors: FormErrors<LoginForm>;
  onChange: (field: keyof LoginForm, value: string) => void;
  onForgotPassword: () => void;
  onRegister: () => void;
  onSubmit: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthForm title="Entrar" subtitle="Acesse sua conta para continuar">
      <Input
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.email}
        inputWrapperStyle={styles.figmaInputWrapper}
        keyboardType="email-address"
        label="E-mail"
        onChangeText={(value) => onChange('email', value)}
        placeholder="seu@email.com"
        style={styles.figmaInput}
        value={form.email}
      />

      <Input
        error={errors.password}
        inputWrapperStyle={styles.figmaInputWrapper}
        label="Senha"
        onChangeText={(value) => onChange('password', value)}
        placeholder="........."
        rightIcon={
          <PasswordVisibilityButton
            visible={showPassword}
            onPress={() => setShowPassword((current) => !current)}
          />
        }
        secureTextEntry={!showPassword}
        style={styles.figmaInput}
        value={form.password}
      />

      <TouchableOpacity activeOpacity={0.72} onPress={onForgotPassword} style={styles.forgotLink}>
        <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
      </TouchableOpacity>

      {feedback ? <FeedbackMessage message={feedback} /> : null}

      <Button
        title="Entrar"
        size="large"
        onPress={onSubmit}
        style={styles.primaryActionButton}
        textStyle={styles.primaryActionText}
      />

      <TouchableOpacity activeOpacity={0.74} style={styles.googleButton}>
        <Image resizeMode="contain" source={googleIcon} style={styles.googleIcon} />
        <Text style={styles.googleText}>Continuar com Google</Text>
      </TouchableOpacity>

      <View style={styles.authBottomPrompt}>
        <Text style={styles.authPromptMuted}>Nao tem uma conta?</Text>
        <TouchableOpacity activeOpacity={0.72} onPress={onRegister}>
          <Text style={styles.authPromptLink}> Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </AuthForm>
  );
}

function RegisterScreen({
  feedback,
  form,
  errors,
  onChange,
  onLogin,
  onSubmit,
}: {
  feedback: string;
  form: RegisterForm;
  errors: FormErrors<RegisterForm>;
  onChange: (field: keyof RegisterForm, value: string) => void;
  onLogin: () => void;
  onSubmit: () => void;
}) {
  return (
    <AuthForm title="Cadastro" subtitle="Crie sua conta para comecar">
      <Input
        autoCapitalize="words"
        error={errors.name}
        inputWrapperStyle={styles.figmaInputWrapper}
        label="Nome"
        onChangeText={(value) => onChange('name', value)}
        placeholder="Seu nome completo"
        style={styles.figmaInput}
        value={form.name}
      />

      <Input
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.email}
        inputWrapperStyle={styles.figmaInputWrapper}
        keyboardType="email-address"
        label="E-mail"
        onChangeText={(value) => onChange('email', value)}
        placeholder="seu@email.com"
        style={styles.figmaInput}
        value={form.email}
      />

      <Input
        error={errors.phone}
        inputWrapperStyle={styles.figmaInputWrapper}
        keyboardType="phone-pad"
        label="Telefone"
        onChangeText={(value) => onChange('phone', value)}
        placeholder="(00) 00000-0000"
        style={styles.figmaInput}
        value={form.phone}
      />

      <Input
        error={errors.password}
        inputWrapperStyle={styles.figmaInputWrapper}
        label="Senha"
        onChangeText={(value) => onChange('password', value)}
        placeholder="Minimo de 6 caracteres"
        secureTextEntry
        style={styles.figmaInput}
        value={form.password}
      />

      <Input
        error={errors.confirmPassword}
        inputWrapperStyle={styles.figmaInputWrapper}
        label="Confirmar senha"
        onChangeText={(value) => onChange('confirmPassword', value)}
        placeholder="Repita sua senha"
        secureTextEntry
        style={styles.figmaInput}
        value={form.confirmPassword}
      />

      {feedback ? <FeedbackMessage message={feedback} /> : null}

      <Button
        title="Cadastrar"
        size="large"
        onPress={onSubmit}
        style={styles.primaryActionButton}
        textStyle={styles.primaryActionText}
      />

      <View style={styles.authBottomPrompt}>
        <Text style={styles.authPromptMuted}>Ja tem uma conta?</Text>
        <TouchableOpacity activeOpacity={0.72} onPress={onLogin}>
          <Text style={styles.authPromptLink}> Entrar</Text>
        </TouchableOpacity>
      </View>
    </AuthForm>
  );
}

function ForgotPasswordScreen({
  feedback,
  form,
  errors,
  onChange,
  onLogin,
  onSubmit,
}: {
  feedback: string;
  form: ForgotForm;
  errors: FormErrors<ForgotForm>;
  onChange: (field: keyof ForgotForm, value: string) => void;
  onLogin: () => void;
  onSubmit: () => void;
}) {
  return (
    <AuthForm title="Recuperar senha" subtitle="Informe seu e-mail para receber as instrucoes">
      <Input
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.email}
        inputWrapperStyle={styles.figmaInputWrapper}
        keyboardType="email-address"
        label="E-mail"
        onChangeText={(value) => onChange('email', value)}
        placeholder="seu@email.com"
        style={styles.figmaInput}
        value={form.email}
      />

      {feedback ? <FeedbackMessage message={feedback} /> : null}

      <Button
        title="Enviar instrucoes"
        size="large"
        onPress={onSubmit}
        style={styles.primaryActionButton}
        textStyle={styles.primaryActionText}
      />
      <Button title="Voltar para login" variant="ghost" onPress={onLogin} />
    </AuthForm>
  );
}

function AuthForm({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.authForm}>
      <Text style={styles.formTitle}>{title}</Text>
      <Text style={styles.formSubtitle}>{subtitle}</Text>
      <View style={styles.formContent}>{children}</View>
    </View>
  );
}

function AuthBackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.72} onPress={onPress} style={styles.backButton}>
      <Text style={styles.backIcon}>{'<'}</Text>
    </TouchableOpacity>
  );
}

function BrandLockup({ size }: { size: 'large' | 'small' }) {
  return (
    <View style={styles.brandLockup}>
      <Image
        resizeMode="contain"
        source={logoIcon}
        style={size === 'large' ? styles.logoIconLarge : styles.logoIconSmall}
      />
      <Image
        resizeMode="contain"
        source={logoText}
        style={size === 'large' ? styles.logoTextLarge : styles.logoTextSmall}
      />
    </View>
  );
}

function PasswordVisibilityButton({
  onPress,
  visible,
}: {
  onPress: () => void;
  visible: boolean;
}) {
  return (
    <Pressable hitSlop={10} onPress={onPress} style={styles.passwordToggle}>
      <Ionicons
        color="#8D8D8D"
        name={visible ? 'eye-off-outline' : 'eye-outline'}
        size={24}
      />
    </Pressable>
  );
}

function WaveFooter({ variant }: { variant: 'splash' | 'start' }) {
  return (
    <View pointerEvents="none" style={styles.waveStage}>
      <View style={[styles.waveLight, variant === 'start' && styles.waveLightStart]} />
      <View style={[styles.waveBlue, variant === 'start' && styles.waveBlueStart]} />
    </View>
  );
}

function FeedbackMessage({ message }: { message: string }) {
  return (
    <View style={styles.feedback}>
      <Text style={styles.feedbackText}>{message}</Text>
    </View>
  );
}

function validateLogin(form: LoginForm): FormErrors<LoginForm> {
  const errors: FormErrors<LoginForm> = {};

  if (!isValidEmail(form.email)) {
    errors.email = 'Informe um e-mail valido.';
  }

  if (form.password.trim().length < 6) {
    errors.password = 'A senha deve ter pelo menos 6 caracteres.';
  }

  return errors;
}

function validateRegister(form: RegisterForm): FormErrors<RegisterForm> {
  const errors: FormErrors<RegisterForm> = {};

  if (form.name.trim().length < 3) {
    errors.name = 'Informe seu nome completo.';
  }

  if (!isValidEmail(form.email)) {
    errors.email = 'Informe um e-mail valido.';
  }

  if (onlyNumbers(form.phone).length < 10) {
    errors.phone = 'Informe um telefone valido.';
  }

  if (form.password.trim().length < 6) {
    errors.password = 'A senha deve ter pelo menos 6 caracteres.';
  }

  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'As senhas precisam ser iguais.';
  }

  return errors;
}

function validateForgot(form: ForgotForm): FormErrors<ForgotForm> {
  if (!isValidEmail(form.email)) {
    return {
      email: 'Informe um e-mail valido.',
    };
  }

  return {};
}

function isValidEmail(value: string) {
  return /\S+@\S+\.\S+/.test(value.trim());
}

function onlyNumbers(value: string) {
  return value.replace(/\D/g, '');
}

function hasErrors<T extends object>(errors: FormErrors<T>) {
  return Object.keys(errors).length > 0;
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.white,
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  splashScreen: {
    backgroundColor: colors.white,
    flex: 1,
  },
  splashContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 76,
    paddingHorizontal: spacing.xl,
  },
  brandLockup: {
    alignItems: 'center',
  },
  logoIconLarge: {
    height: 138,
    width: 138,
  },
  logoIconSmall: {
    height: 68,
    width: 68,
  },
  logoTextLarge: {
    alignSelf: 'center',
    height: 62,
    marginTop: spacing.sm,
    width: 260,
  },
  logoTextSmall: {
    alignSelf: 'center',
    height: 36,
    marginTop: spacing.xs,
    width: 150,
  },
  loaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  loadingDot: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 18,
    width: 18,
  },
  progressTrack: {
    backgroundColor: '#BFDBFE',
    borderRadius: radius.full,
    height: 15,
    marginLeft: spacing.md,
    overflow: 'hidden',
    width: 120,
  },
  progressFill: {
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    height: '100%',
  },
  loadingTitle: {
    color: '#444444',
    fontFamily: typography.fontFamily.semiBold,
    fontSize: 23,
    fontWeight: '700',
    marginTop: spacing.xl,
  },
  loadingSubtitle: {
    color: '#858585',
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.md,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  startScreen: {
    backgroundColor: colors.white,
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  startCenter: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 38,
  },
  startDescription: {
    color: '#4A4A4A',
    fontFamily: typography.fontFamily.regular,
    fontSize: 17,
    lineHeight: 25,
    marginTop: spacing.lg,
    maxWidth: 306,
    textAlign: 'center',
  },
  startActions: {
    paddingBottom: 148,
  },
  primaryActionButton: {
    borderRadius: 16,
    minHeight: 59,
  },
  primaryActionText: {
    fontSize: 20,
    fontWeight: '500',
  },
  loginPrompt: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  promptText: {
    color: '#4A4A4A',
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.md,
  },
  promptLink: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.md,
    fontWeight: '800',
  },
  waveStage: {
    bottom: -52,
    height: 200,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
  },
  waveLight: {
    backgroundColor: '#EAF3FF',
    borderTopLeftRadius: 260,
    borderTopRightRadius: 380,
    height: 136,
    left: -80,
    position: 'absolute',
    right: -80,
    top: 24,
    transform: [{ rotate: '-8deg' }],
  },
  waveBlue: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 330,
    borderTopRightRadius: 220,
    bottom: -54,
    height: 132,
    left: -50,
    position: 'absolute',
    right: -50,
    transform: [{ rotate: '-6deg' }],
  },
  waveLightStart: {
    top: 78,
    transform: [{ rotate: '5deg' }],
  },
  waveBlueStart: {
    bottom: -72,
    transform: [{ rotate: '-12deg' }],
  },
  authScrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: 48,
  },
  backButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    marginBottom: 46,
    width: 48,
  },
  backIcon: {
    color: '#222222',
    fontSize: 38,
    lineHeight: 48,
  },
  authForm: {
    flex: 1,
  },
  formTitle: {
    color: '#050505',
    fontFamily: typography.fontFamily.bold,
    fontSize: 30,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  formSubtitle: {
    color: '#4A4A4A',
    fontFamily: typography.fontFamily.regular,
    fontSize: 17,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  formContent: {
    gap: 14,
  },
  figmaInputWrapper: {
    borderColor: '#8D8D8D',
    borderRadius: 14,
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  figmaInput: {
    fontSize: 17,
  },
  passwordToggle: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
    paddingVertical: spacing.sm,
  },
  forgotText: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.sm,
    fontWeight: '800',
  },
  googleButton: {
    alignItems: 'center',
    borderColor: '#8D8D8D',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  googleIcon: {
    height: 28,
    width: 28,
  },
  googleText: {
    color: '#050505',
    fontFamily: typography.fontFamily.bold,
    fontSize: 17,
    fontWeight: '800',
  },
  authBottomPrompt: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 58,
  },
  authPromptMuted: {
    color: '#858585',
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.md,
  },
  authPromptLink: {
    color: colors.primary,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.md,
    fontWeight: '800',
  },
  feedback: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  feedbackText: {
    color: '#047857',
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.sm,
    fontWeight: '500',
  },
});
