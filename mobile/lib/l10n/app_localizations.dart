import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_es.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('es'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In es, this message translates to:
  /// **'Atlan Nicaragua'**
  String get appTitle;

  /// No description provided for @descubreNicaragua.
  ///
  /// In es, this message translates to:
  /// **'Descubre Nicaragua.'**
  String get descubreNicaragua;

  /// No description provided for @tagline.
  ///
  /// In es, this message translates to:
  /// **'Descubrí lo tuyo, viví lo nuestro.'**
  String get tagline;

  /// No description provided for @explorarMapa.
  ///
  /// In es, this message translates to:
  /// **'Explorar Mapa'**
  String get explorarMapa;

  /// No description provided for @tienesNegocio.
  ///
  /// In es, this message translates to:
  /// **'¿Tienes un Negocio?'**
  String get tienesNegocio;

  /// No description provided for @iniciarSesion.
  ///
  /// In es, this message translates to:
  /// **'Iniciar Sesión'**
  String get iniciarSesion;

  /// No description provided for @registrarse.
  ///
  /// In es, this message translates to:
  /// **'Registrarse'**
  String get registrarse;

  /// No description provided for @cerrarSesion.
  ///
  /// In es, this message translates to:
  /// **'Cerrar Sesión'**
  String get cerrarSesion;

  /// No description provided for @correoElectronico.
  ///
  /// In es, this message translates to:
  /// **'Correo electrónico'**
  String get correoElectronico;

  /// No description provided for @contrasena.
  ///
  /// In es, this message translates to:
  /// **'Contraseña'**
  String get contrasena;

  /// No description provided for @nombre.
  ///
  /// In es, this message translates to:
  /// **'Nombre'**
  String get nombre;

  /// No description provided for @bienvenido.
  ///
  /// In es, this message translates to:
  /// **'Bienvenido'**
  String get bienvenido;

  /// No description provided for @miPerfil.
  ///
  /// In es, this message translates to:
  /// **'Mi Perfil'**
  String get miPerfil;

  /// No description provided for @misNegocios.
  ///
  /// In es, this message translates to:
  /// **'Mis Negocios'**
  String get misNegocios;

  /// No description provided for @misGiras.
  ///
  /// In es, this message translates to:
  /// **'Mis Giras'**
  String get misGiras;

  /// No description provided for @comunidad.
  ///
  /// In es, this message translates to:
  /// **'Comunidad'**
  String get comunidad;

  /// No description provided for @chat.
  ///
  /// In es, this message translates to:
  /// **'Chat'**
  String get chat;

  /// No description provided for @mapa.
  ///
  /// In es, this message translates to:
  /// **'Mapa'**
  String get mapa;

  /// No description provided for @inicio.
  ///
  /// In es, this message translates to:
  /// **'Inicio'**
  String get inicio;

  /// No description provided for @perfil.
  ///
  /// In es, this message translates to:
  /// **'Perfil'**
  String get perfil;

  /// No description provided for @departamentos.
  ///
  /// In es, this message translates to:
  /// **'Departamentos'**
  String get departamentos;

  /// No description provided for @masDeNicaragua.
  ///
  /// In es, this message translates to:
  /// **'Más de Nicaragua'**
  String get masDeNicaragua;

  /// No description provided for @buscar.
  ///
  /// In es, this message translates to:
  /// **'Buscar'**
  String get buscar;

  /// No description provided for @guardar.
  ///
  /// In es, this message translates to:
  /// **'Guardar'**
  String get guardar;

  /// No description provided for @cancelar.
  ///
  /// In es, this message translates to:
  /// **'Cancelar'**
  String get cancelar;

  /// No description provided for @enviar.
  ///
  /// In es, this message translates to:
  /// **'Enviar'**
  String get enviar;

  /// No description provided for @compartir.
  ///
  /// In es, this message translates to:
  /// **'Compartir'**
  String get compartir;

  /// No description provided for @seguir.
  ///
  /// In es, this message translates to:
  /// **'Seguir'**
  String get seguir;

  /// No description provided for @siguiendo.
  ///
  /// In es, this message translates to:
  /// **'Siguiendo'**
  String get siguiendo;

  /// No description provided for @seguidores.
  ///
  /// In es, this message translates to:
  /// **'Seguidores'**
  String get seguidores;

  /// No description provided for @publicaciones.
  ///
  /// In es, this message translates to:
  /// **'Publicaciones'**
  String get publicaciones;

  /// No description provided for @favoritos.
  ///
  /// In es, this message translates to:
  /// **'Favoritos'**
  String get favoritos;

  /// No description provided for @resenas.
  ///
  /// In es, this message translates to:
  /// **'Reseñas'**
  String get resenas;

  /// No description provided for @verificado.
  ///
  /// In es, this message translates to:
  /// **'Verificado'**
  String get verificado;

  /// No description provided for @pendienteVerificacion.
  ///
  /// In es, this message translates to:
  /// **'Pendiente de Verificación'**
  String get pendienteVerificacion;

  /// No description provided for @sinReclamar.
  ///
  /// In es, this message translates to:
  /// **'Sin Reclamar'**
  String get sinReclamar;

  /// No description provided for @historia.
  ///
  /// In es, this message translates to:
  /// **'Historia'**
  String get historia;

  /// No description provided for @economia.
  ///
  /// In es, this message translates to:
  /// **'Economía'**
  String get economia;

  /// No description provided for @turismo.
  ///
  /// In es, this message translates to:
  /// **'Turismo'**
  String get turismo;

  /// No description provided for @pasatiempos.
  ///
  /// In es, this message translates to:
  /// **'Pasatiempos'**
  String get pasatiempos;

  /// No description provided for @lugares.
  ///
  /// In es, this message translates to:
  /// **'Lugares'**
  String get lugares;

  /// No description provided for @actividades.
  ///
  /// In es, this message translates to:
  /// **'Actividades'**
  String get actividades;

  /// No description provided for @region.
  ///
  /// In es, this message translates to:
  /// **'Región'**
  String get region;

  /// No description provided for @cabecera.
  ///
  /// In es, this message translates to:
  /// **'Cabecera'**
  String get cabecera;

  /// No description provided for @extension.
  ///
  /// In es, this message translates to:
  /// **'Extensión'**
  String get extension;

  /// No description provided for @poblacion.
  ///
  /// In es, this message translates to:
  /// **'Población'**
  String get poblacion;

  /// No description provided for @apodo.
  ///
  /// In es, this message translates to:
  /// **'Apodo'**
  String get apodo;

  /// No description provided for @verHistoria.
  ///
  /// In es, this message translates to:
  /// **'Ver Historia y Pestañas'**
  String get verHistoria;

  /// No description provided for @ranking.
  ///
  /// In es, this message translates to:
  /// **'Ranking'**
  String get ranking;

  /// No description provided for @visitasReales.
  ///
  /// In es, this message translates to:
  /// **'Visitas Reales'**
  String get visitasReales;

  /// No description provided for @proximamente.
  ///
  /// In es, this message translates to:
  /// **'PRÓXIMAMENTE'**
  String get proximamente;

  /// No description provided for @cargando.
  ///
  /// In es, this message translates to:
  /// **'Cargando...'**
  String get cargando;

  /// No description provided for @errorGeneral.
  ///
  /// In es, this message translates to:
  /// **'Ocurrió un error. Intenta de nuevo.'**
  String get errorGeneral;

  /// No description provided for @sinResultados.
  ///
  /// In es, this message translates to:
  /// **'Sin resultados'**
  String get sinResultados;

  /// No description provided for @guardarYReenviar.
  ///
  /// In es, this message translates to:
  /// **'Guardar y Reenviar'**
  String get guardarYReenviar;

  /// No description provided for @cancelarReclamo.
  ///
  /// In es, this message translates to:
  /// **'Cancelar Reclamo'**
  String get cancelarReclamo;

  /// No description provided for @aprobar.
  ///
  /// In es, this message translates to:
  /// **'Aprobar'**
  String get aprobar;

  /// No description provided for @rechazar.
  ///
  /// In es, this message translates to:
  /// **'Rechazar'**
  String get rechazar;

  /// No description provided for @rechazarConObservaciones.
  ///
  /// In es, this message translates to:
  /// **'Rechazar con observaciones'**
  String get rechazarConObservaciones;

  /// No description provided for @liberarPunto.
  ///
  /// In es, this message translates to:
  /// **'Liberar punto'**
  String get liberarPunto;

  /// No description provided for @dashboard.
  ///
  /// In es, this message translates to:
  /// **'Dashboard'**
  String get dashboard;

  /// No description provided for @admin.
  ///
  /// In es, this message translates to:
  /// **'Administración'**
  String get admin;

  /// No description provided for @notificaciones.
  ///
  /// In es, this message translates to:
  /// **'Notificaciones'**
  String get notificaciones;

  /// No description provided for @mensajes.
  ///
  /// In es, this message translates to:
  /// **'Mensajes'**
  String get mensajes;

  /// No description provided for @escribirMensaje.
  ///
  /// In es, this message translates to:
  /// **'Escribe un mensaje...'**
  String get escribirMensaje;

  /// No description provided for @publicar.
  ///
  /// In es, this message translates to:
  /// **'Publicar'**
  String get publicar;

  /// No description provided for @meGusta.
  ///
  /// In es, this message translates to:
  /// **'Me gusta'**
  String get meGusta;

  /// No description provided for @comentar.
  ///
  /// In es, this message translates to:
  /// **'Comentar'**
  String get comentar;

  /// No description provided for @comentarios.
  ///
  /// In es, this message translates to:
  /// **'Comentarios'**
  String get comentarios;

  /// No description provided for @escribirComentario.
  ///
  /// In es, this message translates to:
  /// **'Escribe un comentario...'**
  String get escribirComentario;

  /// No description provided for @todosPacifico.
  ///
  /// In es, this message translates to:
  /// **'Todos'**
  String get todosPacifico;

  /// No description provided for @pacifico.
  ///
  /// In es, this message translates to:
  /// **'Pacífico'**
  String get pacifico;

  /// No description provided for @central.
  ///
  /// In es, this message translates to:
  /// **'Central'**
  String get central;

  /// No description provided for @caribe.
  ///
  /// In es, this message translates to:
  /// **'Caribe'**
  String get caribe;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'es'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
