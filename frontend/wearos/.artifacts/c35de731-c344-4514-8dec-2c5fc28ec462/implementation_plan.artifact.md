# Refactorización a Material 3 y Mejora de UX en Wear OS

Este plan detalla la refactorización de la aplicación "Guardian of the Missing" para cumplir con los estándares de Material 3 y las guías de UX de Wear OS, eliminando dependencias obsoletas y mejorando la interactividad.

## User Review Required

> [!IMPORTANT]
> Se migrará completamente de Material 2 a Material 3. Esto implica cambios en los nombres de algunos componentes y en la forma en que se maneja el tema (ColorScheme).
> Se añadirá feedback háptico (vibración) al presionar el botón de pánico, lo cual es una mejora crítica para la accesibilidad en emergencias.

## Proposed Changes

### Dependencias y Configuración

#### [MODIFY] [libs.versions.toml](file:///C:/Users/matias/Desktop/Nueva carpeta/host_api_guardian_of_the_missing/frontend/wearos/gradle/libs.versions.toml)
* Actualizar las versiones de `androidx.wear.compose` a `1.6.2` para asegurar compatibilidad total con Material 3 estable.

#### [MODIFY] [build.gradle.kts](file:///C:/Users/matias/Desktop/Nueva carpeta/host_api_guardian_of_the_missing/frontend/wearos/app/build.gradle.kts)
* Eliminar la dependencia de `androidx.wear.compose:compose-material` (M2).
* Asegurar que todas las dependencias de Wear Compose apunten a M3.

---

### UI y UX (Material 3)

#### [MODIFY] [Theme.kt](file:///C:/Users/matias/Desktop/Nueva carpeta/host_api_guardian_of_the_missing/frontend/wearos/app/src/main/java/com/example/wearos_guardianofthemissing/presentation/theme/Theme.kt)
* Implementar un `ColorScheme` de Material 3.
* Definir el color de emergencia (`0xFF9F0712`) como parte del esquema de colores (ej. `error` o `onErrorContainer`).
* Configurar la tipografía y formas de M3.

#### [MODIFY] [MainActivity.kt](file:///C:/Users/matias/Desktop/Nueva carpeta/host_api_guardian_of_the_missing/frontend/wearos/app/src/main/java/com/example/wearos_guardianofthemissing/presentation/MainActivity.kt)
* **Scaffolding**: Implementar `AppScaffold` y `ScreenScaffold`.
* **Componentes**: Reemplazar `Button`, `Text` e `Icon` de M2 por sus equivalentes en `androidx.wear.compose.material3`.
* **Feedback Háptico**: Integrar `LocalHapticFeedback` en la acción del botón.
* **Layout**: Ajustar `IconoConectividad` y el botón principal para usar `TimeText` y respetar el área segura de relojes redondos.

## Verification Plan

### Automated Tests
* Ejecutar `./gradlew assembleDebug` para confirmar que no hay errores de compilación ni dependencias faltantes.

### Manual Verification
* Verificar en el emulador o dispositivo:
    * El botón de pánico ocupa el espacio correcto y es altamente visible.
    * El texto de la hora (`TimeText`) es visible y no se solapa con el icono de conectividad.
    * La vibración ocurre al presionar el botón (si el hardware lo soporta).
    * El icono de conectividad cambia de color/estado al activar/desactivar el modo avión.
