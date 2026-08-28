import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:geolocator/geolocator.dart';
import '../config/constants.dart';
import '../config/theme.dart';

/// Contenedor WebView nativo de alto rendimiento para Plataforma Atlan
/// Renderiza la aplicación con mapas Mapbox GL JS, puente GPS nativo en tiempo real
/// y control estricto de permisos de ubicación de Android.
class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  InAppWebViewController? _webViewController;
  double _progress = 0;
  bool _isLoading = true;
  String? _errorMessage;
  StreamSubscription<Position>? _positionStreamSubscription;

  final InAppWebViewSettings _settings = InAppWebViewSettings(
    useShouldOverrideUrlLoading: true,
    mediaPlaybackRequiresUserGesture: false,
    allowsInlineMediaPlayback: true,
    iframeAllow: "camera; microphone; geolocation",
    iframeAllowFullscreen: true,
    javaScriptEnabled: true,
    domStorageEnabled: true,
    databaseEnabled: true,
    geolocationEnabled: true,
    cacheEnabled: true,
    supportZoom: true,
    useWideViewPort: true,
    loadWithOverviewMode: true,
    transparentBackground: true,
    allowFileAccessFromFileURLs: true,
    allowUniversalAccessFromFileURLs: true,
  );

  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    _checkLocationPermission();
  }

  @override
  void dispose() {
    _positionStreamSubscription?.cancel();
    super.dispose();
  }

  /// Verifica y exige permisos de ubicación nativos de Android antes de proceder
  Future<void> _checkLocationPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      if (mounted) {
        _showLocationDialog(
          title: 'Ubicación GPS Desactivada',
          message: 'Plataforma Atlan requiere activar la ubicación GPS de tu teléfono para mostrarte el mapa y los lugares cercanos.',
          buttonText: 'Activar GPS',
          onPressed: () async {
            await Geolocator.openLocationSettings();
            _checkLocationPermission();
          },
        );
      }
      return;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.deniedForever) {
      if (mounted) {
        _showLocationDialog(
          title: 'Permiso de Ubicación Requerido',
          message: 'Para usar la aplicación Atlan, por favor concede el permiso de Ubicación en los ajustes de tu celular.',
          buttonText: 'Abrir Ajustes',
          onPressed: () async {
            await Geolocator.openAppSettings();
            _checkLocationPermission();
          },
        );
      }
      return;
    }

    if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
      _startNativeGpsStream();
    }
  }

  void _showLocationDialog({
    required String title,
    required String message,
    required String buttonText,
    required VoidCallback onPressed,
  }) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF0A192F),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.location_on_rounded, color: AtlanTheme.accent, size: 28),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: Text(
          message,
          style: const TextStyle(color: Colors.white70, fontSize: 14),
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              onPressed();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AtlanTheme.accent,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(buttonText, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          ),
        ],
      ),
    );
  }

  /// Inicia la lectura del GPS del chip de hardware del celular y envía coordenadas en tiempo real al mapa Web
  void _startNativeGpsStream() async {
    try {
      Position initialPos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      _sendGpsToWebView(initialPos.longitude, initialPos.latitude, initialPos.heading);
    } catch (e) {
      debugPrint('[Atlan Mobile] Posición inicial GPS no obtenida: $e');
    }

    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 3,
    );

    _positionStreamSubscription?.cancel();
    _positionStreamSubscription = Geolocator.getPositionStream(locationSettings: locationSettings).listen(
      (Position position) {
        _sendGpsToWebView(position.longitude, position.latitude, position.heading);
      },
      onError: (err) {
        debugPrint('[Atlan Mobile] Stream GPS Error: $err');
      },
    );
  }

  void _sendGpsToWebView(double lng, double lat, double heading) {
    _webViewController?.evaluateJavascript(
      source: "if (window.updateNativeGPSPosition) { window.updateNativeGPSPosition($lng, $lat, $heading); }",
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AtlanTheme.background,
      body: SafeArea(
        top: false,
        bottom: false,
        child: Stack(
          children: [
            InAppWebView(
              initialUrlRequest: URLRequest(
                url: WebUri(AppConstants.webAppUrl),
              ),
              initialSettings: _settings,
              onWebViewCreated: (controller) {
                _webViewController = controller;
              },
              onLoadStart: (controller, url) {
                setState(() {
                  _isLoading = true;
                  _errorMessage = null;
                });
              },
              onProgressChanged: (controller, progress) {
                setState(() {
                  _progress = progress / 100;
                });
              },
              onLoadStop: (controller, url) async {
                setState(() {
                  _isLoading = false;
                });
                // Al terminar de cargar la web, re-enviar coordenadas iniciales del GPS
                try {
                  Position pos = await Geolocator.getCurrentPosition(
                    locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
                  );
                  _sendGpsToWebView(pos.longitude, pos.latitude, pos.heading);
                } catch (_) {}
              },
              onReceivedError: (controller, request, error) {
                if (request.isForMainFrame ?? true) {
                  setState(() {
                    _isLoading = false;
                    _errorMessage = 'No se pudo conectar con el servidor en ${AppConstants.webAppUrl}.\n\nVerifica tu conexión a internet.';
                  });
                }
              },
              onGeolocationPermissionsShowPrompt: (controller, origin) async {
                return GeolocationPermissionShowPromptResponse(
                  origin: origin,
                  allow: true,
                  retain: true,
                );
              },
              onPermissionRequest: (controller, request) async {
                return PermissionResponse(
                  resources: request.resources,
                  action: PermissionResponseAction.GRANT,
                );
              },
            ),

            // Barra de progreso superior
            if (_isLoading)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: LinearProgressIndicator(
                  value: _progress > 0 ? _progress : null,
                  backgroundColor: Colors.transparent,
                  valueColor: const AlwaysStoppedAnimation<Color>(AtlanTheme.accent),
                  minHeight: 3,
                ),
              ),

            // Banner de error si falla la conexión
            if (_errorMessage != null)
              Center(
                child: Container(
                  margin: const EdgeInsets.all(24),
                  padding: const EdgeInsets.all(24),
                  decoration: AtlanTheme.glassDecorationGold,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.wifi_off_rounded, size: 56, color: AtlanTheme.accent),
                      const SizedBox(height: 16),
                      const Text(
                        'Plataforma Atlan Mobile',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AtlanTheme.textPrimary),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _errorMessage!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 14, color: AtlanTheme.textSecondary),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: () {
                          _webViewController?.reload();
                        },
                        icon: const Icon(Icons.refresh_rounded),
                        label: const Text('Reintentar Conexión'),
                        style: ElevatedButton.styleFrom(backgroundColor: AtlanTheme.primary),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
