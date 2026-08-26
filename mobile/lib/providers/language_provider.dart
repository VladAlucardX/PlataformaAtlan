import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Estado del idioma actual (ES/EN)
class LanguageState {
  final String locale; // 'es' o 'en'

  const LanguageState({this.locale = 'es'});
}

/// Notifier para el idioma de la app — equivalente a LanguageContext.js de la web
class LanguageNotifier extends StateNotifier<LanguageState> {
  LanguageNotifier() : super(const LanguageState()) {
    _loadSavedLocale();
  }

  Future<void> _loadSavedLocale() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('app_locale') ?? 'es';
    state = LanguageState(locale: saved);
  }

  Future<void> setLocale(String locale) async {
    state = LanguageState(locale: locale);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('app_locale', locale);
  }

  void toggleLocale() {
    setLocale(state.locale == 'es' ? 'en' : 'es');
  }
}

/// Provider global del idioma
final languageProvider = StateNotifierProvider<LanguageNotifier, LanguageState>((ref) {
  return LanguageNotifier();
});
