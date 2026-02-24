import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@salao/settings';

export type AppSettings = {
  openTime: string;
  closeTime: string;
  slotInterval: number;
};

const DEFAULT_SETTINGS: AppSettings = {
  openTime: '08:00',
  closeTime: '18:00',
  slotInterval: 30,
};

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_SETTINGS;

  return {
    ...DEFAULT_SETTINGS,
    ...JSON.parse(raw),
  };
}

export async function saveSettings(payload: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next = { ...current, ...payload };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}
