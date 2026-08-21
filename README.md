# UberClone

## Integrantes

- Juan Esteban Martinez
- Sebastian Guzman
  
---

# App UberClone

## 📋 Tabla de Contenidos
- [Descripción General](#-descripción-general)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Modelo de Datos](#-modelo-de-datos)
- [Servicios y Endpoints](#-servicios-y-endpoints)
- [Flujo de Ejecución del Código](#-flujo-de-ejecución-del-código)
- [Seguridad y Autenticación](#-seguridad-y-autenticación)
- [Despliegue](#-despliegue)

## 🎯 Descripción General

UberClone es una aplicación móvil (React Native) que simula el flujo completo de una app de transporte tipo Uber: registro/login de usuarios, solicitud de viajes con cálculo de tarifa, seguimiento en tiempo real simulado del conductor, pago con Mercado Pago e historial de viajes.

**Características principales:**

- ✅ Autenticación simple por número de teléfono (sin contraseña), persistida en Firestore
- ✅ Registro y edición de perfil de usuario (foto, nombre, teléfono, género, correo, idioma)
- ✅ Búsqueda de destino con Google Places Autocomplete
- ✅ Cálculo de ruta, distancia y duración con Google Directions / Distance Matrix
- ✅ Cálculo de tarifa estimada según categoría de vehículo (Economy, XL, Premium)
- ✅ Simulación de seguimiento en tiempo real del conductor sobre un `MapView`
- ✅ Pago integrado con Mercado Pago (Checkout Pro vía WebView)
- ✅ Historial de viajes completados almacenado en Firestore
- ✅ Soporte multi-idioma (Español / Inglés) mediante un diccionario i18n propio
- ✅ Estado global manejado con Redux Toolkit + Context API para UI liviana

## 🏗️ Arquitectura del Sistema

La aplicación sigue una arquitectura por capas típica de React Native, separando **presentación**, **estado global**, **lógica de dominio/utilidades** y **servicios de infraestructura** (Firebase, Google Maps, Mercado Pago).

### 📋 Estructura por Capas

**🎯 Capa de Presentación**

Screens & Components

```
AuthScreen, LoginScreen, RegisterProfileScreen
RideRequestScreen, RealTimeTrackingScreen
PaymentScreen, TripHistoryScreen
AppButton, AppInput, Dropdown, LoadingOverlay,
RideInfoCard, VehicleCategoryCard
```

↓

**🧭 Capa de Navegación**

```
AppNavigator  → decide Auth vs App según authSlice
AuthNavigator → Auth, Login, Register
StackNavigator → MainTabs, RealTimeTracking, Payment
TabNavigator  → Profile, RideRequest, TripHistory
```

↓

**📦 Capa de Estado Global (Redux Toolkit)**

```
authSlice        → sesión (userId, isAuthenticated)
userSlice        → perfil del usuario
rideSlice        → viaje activo (origen, destino, ruta, tarifa)
paymentSlice     → estado del flujo de pago
tripHistorySlice → historial de viajes
AppContext       → estado UI liviano (tema, mensajes globales)
```

↓

**💎 Capa de Dominio / Utilidades**

```
fareCalculator.js   → cálculo de tarifa estimada
validators.js       → validación de formularios
i18n.js              → traducciones ES/EN
useCurrentLocation   → hook de geolocalización
useDriverSimulation  → hook de simulación de conductor
useImagePicker       → hook de selección de imagen
constants.js         → categorías de vehículo, colores, spacing, etc.
```

↓

**🔧 Capa de Servicios (Infraestructura)**

```
firebaseConfig.js   → instancia de Firestore y colecciones
userService.js      → CRUD de perfiles de usuario
tripService.js      → CRUD de viajes completados
googleMapsService.js → Places, Directions, Distance Matrix
paymentService.js   → creación/confirmación de pagos (Mercado Pago)
```

↓

**🗄️ Backend de Pagos (Node.js / Express)**

```
server.js → expone /api/payments/mercado-pago/preference
             y /api/payments/mercado-pago/confirm
```

↓

**☁️ Servicios Externos**

```
Firebase Firestore → persistencia de usuarios y viajes
Google Maps APIs   → Places, Directions, Distance Matrix
Mercado Pago API   → creación y confirmación de preferencias de pago
```

### 🔄 Flujo de Datos

```
UI (Screens)
    ↓
Redux Actions / Hooks
    ↓
Redux Slices (estado global)
    ↓
Services (Firebase / Google Maps / Payment)
    ↓
Firestore / Google Maps API / Backend Express
    ↓
Backend Express → Mercado Pago API
```

### ✨ Principios de Diseño

| Principio | Descripción |
|---|---|
| Separación de responsabilidades | Pantallas, estado y servicios están desacoplados |
| Single source of truth | Redux Toolkit centraliza el estado de negocio (auth, user, ride, payment, tripHistory) |
| Estado liviano vs. estado de negocio | Context API sólo maneja UI (tema, mensajes); Redux maneja datos de negocio |
| Servicios como adaptadores | `services/` aísla el resto de la app de Firebase, Google Maps y Mercado Pago |
| Seguridad de credenciales | Los secretos de Mercado Pago viven únicamente en el backend, nunca en la app |

## 🛠️ Tecnologías Utilizadas

### App móvil (Frontend)
- React 19 / React Native 0.85
- @reduxjs/toolkit + react-redux (estado global)
- @react-navigation (native-stack + bottom-tabs)
- @react-native-firebase/app y /firestore (persistencia)
- @react-native-community/geolocation (ubicación del usuario)
- react-native-maps (mapa, marcadores, polylines)
- react-native-webview (checkout de Mercado Pago)
- react-native-image-picker (foto de perfil)
- react-native-config / react-native-dotenv (variables de entorno)

### Backend de pagos
- Node.js
- Express 5
- mercadopago SDK 3
- cors, dotenv

### Base de datos / Servicios externos
- Firebase Firestore (usuarios y viajes)
- Google Maps Platform: Places Autocomplete, Place Details, Directions, Distance Matrix
- Mercado Pago (Checkout Pro)

## 📊 Modelo de Datos

### Colecciones en Firestore

```
┌───────────────────────┐        ┌───────────────────────┐
│         users          │        │         trips          │
├───────────────────────┤        ├───────────────────────┤
│ id (doc id)            │◄───┐   │ id (doc id)            │
│ profileImage           │    │   │ userId (FK → users)    │
│ fullName               │    └───┤ origin {lat, lng}      │
│ phoneNumber (único)    │        │ destination {..., name}│
│ gender                 │        │ vehicleCategory        │
│ email                  │        │ fare                   │
│ language                │        │ distanceText           │
│ updatedAt               │        │ durationText            │
└───────────────────────┘        │ paymentProvider         │
                                    │ transactionId           │
                                    │ status ('completed')    │
                                    │ createdAt                │
                                    └───────────────────────┘
```

### Entidades principales (estado de dominio en Redux)

**User (userSlice)**
```
profileImage: string | null
fullName: string
phoneNumber: string
gender: string
email: string
language: 'es' | 'en'
isProfileCompleted: boolean
```

**Ride (rideSlice)**
```
origin: { latitude, longitude } | null
destination: { name, address, latitude, longitude } | null
routeCoordinates: Array<{ latitude, longitude }>
selectedVehicleCategory: 'economy' | 'xl' | 'premium'
distanceText / distanceValue
durationText / durationValue
estimatedFare: number
driverLocation: { latitude, longitude } | null
rideStatus: 'idle' | 'searching' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
```

**Payment (paymentSlice)**
```
selectedPaymentMethod: string   // ej. 'mercado_pago_wallet'
paymentProvider: string         // 'mercado_pago'
transactionId: string | null
paymentStatus: 'idle' | 'processing' | 'success' | 'failed'
isLoading: boolean
error: string | null
```

**Vehicle Category (constants.js)**
```
id: 'economy' | 'xl' | 'premium'
label, description
baseFare, pricePerKilometer, pricePerMinute, multiplier
```

## 🔗 Servicios y Endpoints

### Backend de pagos (Express)

**Base URL local:** `http://localhost:3000`

#### `POST /api/payments/mercado-pago/preference`
Crea una preferencia de pago en Mercado Pago para el monto del viaje.

Request:
```json
{
  "amount": 15000,
  "description": "UberClone ride to Parque Lleras"
}
```

Response:
```json
{
  "id": "1234567-abcdefgh",
  "initPoint": "https://sandbox.mercadopago.com/checkout/v1/redirect?..."
}
```

#### `POST /api/payments/mercado-pago/confirm`
Confirma el estado de un pago luego de que el usuario vuelve del checkout.

Request:
```json
{
  "paymentId": "123456789",
  "userId": "user-1700000000000-ab12cd"
}
```

Response:
```json
{
  "paymentId": "123456789",
  "userId": "user-1700000000000-ab12cd",
  "status": "approved"
}
```

### Servicios internos (Firestore, vía `services/`)

| Servicio | Función | Descripción |
|---|---|---|
| `userService.js` | `saveUserProfile(userId, profileData)` | Crea o actualiza (merge) el perfil de un usuario |
| `userService.js` | `getUserProfile(userId)` | Obtiene un perfil por ID |
| `userService.js` | `getUserByPhone(phoneNumber)` | Login: busca usuario por teléfono |
| `userService.js` | `deleteUserProfile(userId)` | Elimina un perfil |
| `tripService.js` | `saveCompletedTrip(tripData)` | Guarda un viaje completado y pagado |
| `tripService.js` | `getTripsByUser(userId)` | Lista el historial de viajes de un usuario |
| `tripService.js` | `getTripById(tripId)` | Obtiene el detalle de un viaje |
| `tripService.js` | `updateTripStatus(tripId, status)` | Actualiza el estado de un viaje |

### Servicios de Google Maps (`googleMapsService.js`)

| Función | API de Google | Uso |
|---|---|---|
| `searchPlaces(input)` | Places Autocomplete | Sugerencias de destino mientras el usuario escribe |
| `getPlaceDetails(placeId)` | Place Details | Obtiene lat/lng y dirección del destino seleccionado |
| `getDirections(origin, destination)` | Directions | Calcula ruta y decodifica el polyline para el mapa |
| `getDistanceMatrix(origin, destination)` | Distance Matrix | Calcula distancia y duración estimadas |

## 🔄 Flujo de Ejecución del Código

### Flujo 1: Registro / Login de usuario

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │ Completa formulario en RegisterProfileScreen
       ▼
┌──────────────────────────────────────────────────────┐
│  validateUserProfile()  (utils/validators.js)         │
│  Valida imagen, nombre, teléfono, género, correo...   │
└──────┬───────────────────────────────────────────────┘
       │ válido
       ▼
┌──────────────────────────────────────────────────────┐
│  dispatch(setUserProfile(profileData))  → userSlice   │
│  saveUserProfile(userId, profileData)   → Firestore   │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  dispatch(loginSuccess({ userId }))  → authSlice       │
│  isAuthenticated = true                                 │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
  AppNavigator detecta el cambio y muestra StackNavigator
  (MainTabs → RideRequest / Profile / TripHistory)
```

Login (usuarios existentes) usa `getUserByPhone(phoneNumber)` para
recuperar el documento en Firestore y cargar el perfil completo en
`userSlice` antes de despachar `loginSuccess`.

### Flujo 2: Solicitud de viaje y cálculo de tarifa

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │ Escribe destino en RideRequestScreen
       ▼
┌──────────────────────────────────────────────────────┐
│  searchPlaces(input)  → Google Places Autocomplete     │
│  Muestra predicciones de destino                       │
└──────┬───────────────────────────────────────────────┘
       │ Usuario selecciona un destino
       ▼
┌──────────────────────────────────────────────────────┐
│  getPlaceDetails(placeId)                              │
│  dispatch(setDestination(destinationData))              │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  getDirections(origin, destination)                     │
│  getDistanceMatrix(origin, destination)                  │
│  dispatch(setRouteCoordinates(...))                       │
│  dispatch(setRideMetrics({ distance, duration }))          │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  calculateEstimatedFare({ distanceValue, durationValue, │
│                             vehicleCategoryId })          │
│  dispatch(setEstimatedFare(fare))                          │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
  Usuario presiona "Request ride"
  dispatch(setRideStatus('searching'))
  navigation.navigate('RealTimeTracking')
```

### Flujo 3: Seguimiento en tiempo real (simulado)

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │ Presiona "Start simulated tracking"
       ▼
┌──────────────────────────────────────────────────────┐
│  useDriverSimulation.moveAlongRoute(routeCoordinates)   │
│  Mueve el marcador del conductor punto a punto           │
│  cada 450ms usando setInterval                            │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  dispatch(setDriverLocation(driverLocation))              │
│  AnimatedRegion anima el marcador en el MapView           │
└──────┬───────────────────────────────────────────────┘
       │ Ruta finalizada
       ▼
┌──────────────────────────────────────────────────────┐
│  dispatch(setRideStatus('completed'))                      │
│  Alert → "Go to payment" → navigation.navigate('Payment')  │
└──────────────────────────────────────────────────────┘
```

### Flujo 4: Pago con Mercado Pago

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │ Selecciona "Mercado Pago" y presiona "Confirmar pago"
       ▼
┌──────────────────────────────────────────────────────┐
│  dispatch(startPayment())                                 │
│  createMercadoPagoPreference({ amount, currency, ... })    │
│      → POST /api/payments/mercado-pago/preference          │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Backend Express                                        │
│  Preference(client).create({...})  → API Mercado Pago    │
│  Retorna { id, initPoint }                                 │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  La app abre initPoint en un WebView (Checkout Pro)      │
│  El usuario completa el pago en Mercado Pago               │
└──────┬───────────────────────────────────────────────┘
       │ Redirección a back_url con collection_status y payment_id
       ▼
┌──────────────────────────────────────────────────────┐
│  processMpRedirectUrl(url)                                │
│  confirmMercadoPagoPayment({ paymentId, userId })            │
│      → POST /api/payments/mercado-pago/confirm               │
└──────┬───────────────────────────────────────────────┘
       │ status === 'approved'
       ▼
┌──────────────────────────────────────────────────────┐
│  dispatch(paymentSuccess({ transactionId }))                │
│  saveCompletedTrip({...})  → Firestore (colección trips)     │
│  dispatch(addTripToHistory(completedTrip))                   │
│  dispatch(clearRide()) / dispatch(clearPayment())             │
└──────────────────────────────────────────────────────┘
```

### Flujo 5: Historial de viajes

```
┌─────────────┐
│   Usuario   │
└──────┬──────┘
       │ Abre la pestaña "Historial"
       ▼
┌──────────────────────────────────────────────────────┐
│  dispatch(fetchTripsStart())                              │
│  getTripsByUser(userId)  → Firestore (query + orderBy)     │
│  dispatch(fetchTripsSuccess(trips))                          │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
  FlatList renderiza cada viaje (destino, tarifa, fecha,
  distancia, duración, vehículo, método de pago)
```

## 🔒 Seguridad y Autenticación

### Sesión basada en Firestore (sin contraseña)

La app no usa contraseñas ni tokens JWT: el "login" busca al usuario
por su número de teléfono en Firestore (`getUserByPhone`) y, si existe,
guarda su `userId` en `authSlice` con `isAuthenticated: true`. Este
flag es leído por `AppNavigator` para decidir si mostrar
`AuthNavigator` o `StackNavigator`.

```
isAuthenticated = false → AuthNavigator (Auth, Login, Register)
isAuthenticated = true  → StackNavigator (MainTabs, Tracking, Payment)
```

> ⚠️ Nota: este esquema es apto para fines académicos/demo. En un
> entorno de producción se recomienda integrar Firebase Authentication
> u otro proveedor con verificación real (OTP, contraseña, etc.).

### Protección de credenciales de pago

Las credenciales sensibles de Mercado Pago (`MP_ACCESS_TOKEN`) **nunca**
se almacenan en la app móvil. Viven únicamente en el backend Express,
en variables de entorno (`.env`), y se usan para instanciar el cliente
del SDK:

```js
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});
```

La app móvil sólo conoce la URL del backend (`PAYMENT_BACKEND_BASE_URL`)
y el dominio de redirección (`MP_REDIRECT_DOMAIN`), configurados vía
`react-native-dotenv` (`@env`).

### Validación de pagos

El estado de un pago nunca se confía únicamente al cliente: tras el
retorno del checkout de Mercado Pago, la app llama a
`confirmMercadoPagoPayment`, que reenvía la validación al backend antes
de marcar el viaje como pagado y guardarlo en el historial.

### Variables de entorno utilizadas

| Variable | Ubicación | Descripción |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | App móvil (`.env`) | Autenticación ante Google Maps Platform |
| `PAYMENT_BACKEND_BASE_URL` | App móvil (`.env`) | URL base del backend de pagos |
| `MP_REDIRECT_DOMAIN` | App móvil (`.env`) | Dominio usado para detectar el retorno del checkout |
| `MP_ACCESS_TOKEN` | Backend (`.env`) | Access token privado de Mercado Pago |

## 🚀 Despliegue

### Requisitos previos

- Node.js `>= 22.11.0`
- React Native CLI y entorno configurado (Android Studio / Xcode)
- Cuenta de Firebase con un proyecto y Firestore habilitado
- Credenciales de Google Maps Platform (Places, Directions, Distance Matrix)
- Cuenta de Mercado Pago (Access Token de prueba o producción)

### Backend de pagos

```bash
cd backend
npm install
# Crear un archivo .env con:
# MP_ACCESS_TOKEN=tu_access_token
node server.js
# Servidor corriendo en http://localhost:3000
```

### App móvil

```bash
# En la raíz del proyecto
npm install

# Crear un archivo .env con:
# GOOGLE_MAPS_API_KEY=...
# PAYMENT_BACKEND_BASE_URL=http://<tu-ip-local>:3000/api/payments
# MP_REDIRECT_DOMAIN=www.google.com

# Android
npm run android

# iOS
npm run ios
```

### Firebase

1. Crear un proyecto en Firebase Console.
2. Habilitar Firestore Database.
3. Crear las colecciones `users` y `trips` (se crean automáticamente
   al guardar el primer documento).
4. Descargar y colocar `google-services.json` (Android) /
   `GoogleService-Info.plist` (iOS) según la configuración de
   `@react-native-firebase`.

## 📝 Notas Importantes

- El seguimiento del conductor es **simulado**: no hay un conductor
  real ni un backend de tracking en vivo; `useDriverSimulation` anima
  el marcador entre las coordenadas devueltas por Directions.
- `MP_ACCESS_TOKEN` **nunca** debe subirse al repositorio ni
  incluirse en el bundle de la app móvil.
- El `backend/server.js` está pensado para desarrollo/demo (usa
  `console.log` para depuración y URLs de retorno de ejemplo hacia
  `google.com`); en producción deben configurarse `back_urls` reales
  y remover los logs sensibles.
- El proyecto usa `react-native-dotenv` (`@env`) para variables de la
  app móvil y `dotenv` para el backend Express; son mecanismos
  independientes y requieren archivos `.env` separados.
