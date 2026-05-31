import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { BG, BORDER, GOLD, PURPLE, SURFACE, SURFACE2, TEXT, TEXT_DIM, TEXT_MUTED } from '../theme';

function sanitizeAuthError(msg: string | undefined): string {
  if (!msg) return 'Something went wrong. Please try again.';
  const m = msg.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials') || m.includes('invalid email or password'))
    return 'Invalid email or password.';
  if (m.includes('email not confirmed'))
    return 'Please confirm your email before signing in.';
  if (m.includes('already registered') || m.includes('user already exists'))
    return 'An account with this email already exists.';
  if (m.includes('rate limit') || m.includes('too many requests'))
    return 'Too many attempts. Please wait a moment and try again.';
  if (m.includes('password') && (m.includes('short') || m.includes('weak') || m.includes('length')))
    return 'Password must be at least 8 characters.';
  return 'Something went wrong. Please try again.';
}

export default function AuthScreen() {
  const [mode, setMode] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const retryAfter = useRef(0);

  const isSignUp = mode === 'sign_up';
  const accent = isSignUp ? PURPLE : GOLD;

  function switchMode() {
    setMode(m => (m === 'sign_in' ? 'sign_up' : 'sign_in'));
    setFirstName('');
    setEmail('');
    setPassword('');
  }

  async function handleSubmit() {
    if (Date.now() < retryAfter.current) {
      const secs = Math.ceil((retryAfter.current - Date.now()) / 1000);
      Alert.alert('Slow down', `Please wait ${secs} second${secs === 1 ? '' : 's'} before trying again.`);
      return;
    }
    if (isSignUp && !firstName.trim()) {
      Alert.alert('Required', 'Please enter your first name.');
      return;
    }
    const emailVal = email.trim();
    if (!emailVal || !password) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    const atIdx = emailVal.indexOf('@');
    if (atIdx < 1 || emailVal.lastIndexOf('.') <= atIdx + 1) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (isSignUp && password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: emailVal,
          password,
          options: { data: { first_name: firstName.trim() } },
        });
        if (error) throw error;
        Alert.alert('Account created', 'You can now sign in with your new account.');
        switchMode();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: emailVal, password });
        if (error) throw error;
        // onAuthStateChange in App.tsx handles navigation
      }
    } catch (e: any) {
      retryAfter.current = Date.now() + 10_000;
      Alert.alert('Error', sanitizeAuthError(e.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.kav}>
        <View style={s.inner}>

          {/* Hero */}
          <View style={s.hero}>
            <View style={[s.iconRing, { borderColor: accent + '70', backgroundColor: accent + '18' }]}>
              <Text style={s.heroIcon}>{isSignUp ? '⚔' : '🛡'}</Text>
            </View>
            <Text style={[s.heroTitle, { color: accent }]}>LifeForge</Text>
            <Text style={s.heroSub}>
              {isSignUp ? 'BEGIN YOUR JOURNEY' : 'YOUR LEGEND CONTINUES'}
            </Text>
          </View>

          {/* Form card */}
          <View style={[s.card, { borderColor: accent + '45' }]}>
            <Text style={[s.formTitle, { color: accent }]}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>

            {isSignUp && (
              <TextInput
                style={s.input}
                placeholder="First Name"
                placeholderTextColor={TEXT_MUTED}
                autoCapitalize="words"
                autoCorrect={false}
                value={firstName}
                onChangeText={setFirstName}
              />
            )}

            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor={TEXT_MUTED}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor={TEXT_MUTED}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Pressable
              style={({ pressed }) => [
                s.btn,
                { backgroundColor: accent },
                pressed && { opacity: 0.8 },
                loading && s.btnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={BG} />
                : <Text style={s.btnText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
              }
            </Pressable>
          </View>

          <Pressable onPress={switchMode}>
            <Text style={s.toggle}>
              {isSignUp
                ? 'Already have an account?  Sign in'
                : "Don't have an account?  Sign up"}
            </Text>
          </Pressable>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  kav: { flex: 1 },
  inner: { flex: 1, padding: 28, justifyContent: 'center', gap: 28 },
  hero: { alignItems: 'center', gap: 10 },
  iconRing: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  heroIcon: { fontSize: 36 },
  heroTitle: { fontSize: 34, fontWeight: '900', letterSpacing: 2 },
  heroSub: { fontSize: 10, fontWeight: '800', color: TEXT_DIM, letterSpacing: 3 },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16, borderWidth: 1,
    padding: 20, gap: 12,
  },
  formTitle: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  input: {
    backgroundColor: SURFACE2,
    borderRadius: 12, borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: TEXT,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 16, fontWeight: '800', color: BG },
  toggle: { textAlign: 'center', fontSize: 14, color: TEXT_DIM },
});
