# Unificación aprobada en main

Se consolidan los cambios aprobados del login, ADC Studio y la arquitectura en una única rama local `main` y su rama remota `origin/main`.

## Versiones preservadas

- `main` anterior: `39d56e2`.
- `log-in` publicado antes de la consolidación: `6214c64`.
- Efectos finales aprobados de `log-in-2`: `0cfe5de`.

La integración utiliza avances fast-forward; los commits originales quedan como antecesores de main. No se hace squash, reset ni push forzado. Eliminar los nombres de las ramas integradas no elimina sus acciones ni su historial.

## Contenido incorporado

Autenticación real del piloto, ojo de contraseñas, marca compacta con brillo naranja, tipeo de 2,5 segundos, hover de las tarjetas informativas y formulario de ingreso fijo; ADC Studio, guías/inspector, protección estructural, presets, historial, borradores, guardado local y refactorización compartida; mejoras de documentos y DP-01. Se conservan las implementaciones específicas aprobadas de DJ-01, DJ-02, OL-01, SC-01 y DL-01.

## Publicación

`config/publicacion.json` y la variable `ADC_PAGES_BRANCH` apuntan a main. El workflow se dispara únicamente por pushes de main y publica el artefacto web filtrado. La URL pública no cambia. Se retiran las reglas de despliegue de ramas antiguas después de verificar la publicación desde main.

La configuración de Supabase sigue siendo la del piloto: no se alteran cuentas, claves, RLS, confirmación por correo ni tablas. Los datos docentes y borradores locales no se migran ni se borran.

## Comprobaciones

La combinación final de las funcionalidades pasó 77 pruebas antes de consolidarse. Se verifica la ascendencia de las ramas, la compilación y configuración de publicación, y la versión pública antes de eliminar la rama remota log-in. Se permite crear otras ramas más adelante por pedido del usuario; no se recrean automáticamente las ramas retiradas.
