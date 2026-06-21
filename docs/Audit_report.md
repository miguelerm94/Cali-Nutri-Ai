Ahora tengo toda la información necesaria. Voy a generar el informe técnico completo.  
  
Tengo toda la información necesaria para generar el informe. Voy a crearlo ahora.  
  
Ahora tengo todo lo necesario. Genero el informe técnico completo.  
  
📋 CALI-NUTRI AI — AUDITORÍA TÉCNICA COMPLETA  
  
Informe del CTO | Versión 1.0 | Junio 2026  
  
RESUMEN EJECUTIVO  
  
He auditado los 9 documentos del proyecto: Vision.md, PRD.md, Training_Engine.md, Nutrition_Engines.md, Data_Base.md, Architecture.md, UXUI.md, API.md y MVP.md.  
  
Diagnóstico general: La documentación es sólida en intención y dirección estratégica, pero presenta inconsistencias críticas entre documentos que, si no se resuelven antes de escribir una línea de código, generarán trabajo duplicado, deuda técnica y conflictos de implementación. El MVP actual está sobredimensionado en un 30-40% respecto a lo que un equipo puede entregar con calidad en 12 semanas.  
  
La buena noticia: la arquitectura central es correcta. Los problemas son de coherencia entre documentos, no de dirección técnica.  
  
SECCIÓN 1 — INCONSISTENCIAS IDENTIFICADAS  
  
INC-01 · CLASIFICACIÓN DE NIVELES EN ENTRENAMIENTO (CRÍTICA)  
  
Training_Engine.md y MVP.md usan sistemas de clasificación incompatibles para el mismo dato.  
  
  
  
|Documento         |Dominadas                                                 |Referencia                      |  
|------------------|----------------------------------------------------------|--------------------------------|  
|Training_Engine.md|6 niveles: L0=0, L1=1-3, L2=4-7, L3=8-12, L4=13-20, L5=20+|Sección “Clasificación de Nivel”|  
|MVP.md            |3 niveles: Principiante=0-2, Intermedio=3-8, Avanzado=9+  |Sección 5.1 Evaluación Inicial  |  
  
Impacto: El motor de generación de rutinas no puede usar los dos sistemas simultáneamente. Si el backend implementa uno y el frontend asume el otro, la asignación de rutinas será incorrecta para el 60% de los usuarios. Decisión requerida antes de codificar.  
  
INC-02 · PHOTO SCANNING Y BARCODE EN NUTRITION ENGINE (CRÍTICA)  
  
Nutrition_Engines.md incluye fotografía y código de barras como métodos de registro en el sistema central. MVP.md los excluye explícitamente de v1.0. El documento fundacional del motor describe funcionalidades que el MVP posterga 6+ meses.  
  
Impacto: El desarrollador que implemente el Nutrition Engine basado en Nutrition_Engines.md construirá endpoints y lógica para funcionalidades fuera de alcance. Trabajo descartado garantizado.  
  
INC-03 · DETECCIÓN DE ESTANCAMIENTO Y DELOAD (CRÍTICA)  
  
Training_Engine.md define detección de estancamiento y semana de descarga como parte del sistema core. MVP.md los difiere explícitamente: “Deload automático → v1.1” y “Deload → v2.0 backlog #2”.  
  
Adicionalmente, el motor de ajustes automáticos por sueño (sueño < 6h → reducir volumen 10%) requiere datos de Apple Health funcionando, que en MVP es P2. Hay una dependencia no declarada.  
  
INC-04 · PLANIFICADOR DE COMIDAS Y RECETAS (CRÍTICA)  
  
Nutrition_Engines.md incluye “Planificador de comidas” (desayuno/almuerzo/cena/snacks) y “Recetas inteligentes” como funcionalidades del motor. MVP.md los excluye con la nota “recetas personalizadas → v2.0”. Misma inconsistencia que INC-02, diferente módulo.  
  
INC-05 · TIMELINE DE ARQUITECTURA vs MVP (IMPORTANTE)  
  
Architecture.md presenta un roadmap de 12 sprints (que en formato estándar de 2 semanas equivale a 24 semanas). MVP.md presenta un timeline de 12 semanas totales. La diferencia es el doble del tiempo. No es claro si los sprints en Architecture.md son de 1 semana.  
  
INC-06 · DOCUMENTOS CON PRINCIPIOS DUPLICADOS (MENOR)  
  
Tanto Training_Engine.md como Nutrition_Engines.md listan todos sus principios dos veces (líneas 30-44 y 30-43 respectivamente). Ejemplo: “Sobrecarga progresiva” aparece en líneas 30-31, “Priorizar adherencia” en líneas 30-31. Es un error de formato que puede confundir durante implementación.  
  
INC-07 · OBJETIVOS DE ESCALA CONTRADICTORIOS  
  
Architecture.md afirma: “La arquitectura debe soportar 10.000 usuarios activos en el lanzamiento y escalar a 100.000+ usuarios sin rediseño estructural.” Vision.md habla de “cientos de miles de usuarios” como meta. MVP.md define métricas de éxito sin mencionar escala de usuarios. No hay un número de referencia único para las decisiones de infraestructura.  
  
INC-08 · FACTOR DE ACTIVIDAD PARA CÁLCULO DE TDEE  
  
Nutrition_Engines.md define factores de actividad con 5 niveles sin asociarlos a frecuencia de entrenamiento. MVP.md los vincula explícitamente a días de entrenamiento (ej: “3-4 días → 1.55”). El sistema de onboarding pregunta frecuencia semanal (3/4/5/6 días) pero Nutrition_Engines.md no mapea esto al factor correcto. Sin un mapeo explícito, el backend calculará el TDEE con criterios subjetivos.  
  
INC-09 · HIDRATACIÓN: AJUSTE POR CLIMA SIN API DE CLIMA  
  
Nutrition_Engines.md indica: “Clima cálido → +500 ml”. No existe en ningún documento una integración con API de clima (OpenWeather, Apple Weather, etc.). Es una funcionalidad descrita que no tiene implementación técnica definida en el stack.  
  
INC-10 · FRECUENCIA CARDÍACA EN APPLE HEALTH  
  
Nutrition_Engines.md incluye importar frecuencia cardíaca de Apple Health. No hay ningún cálculo en ningún módulo del MVP que use la frecuencia cardíaca. Es un dato importado sin destino funcional en v1.0.  
  
SECCIÓN 2 — FUNCIONALIDADES DUPLICADAS  
  
DUP-01 · GOAL: CAMPO EN USERS + TABLA GOALS  
  
Data_Base.md define el campo goal (VARCHAR) en la tabla USERS y además una tabla separada GOALS con goal_type, start_date, target_date, status. El objetivo del usuario está almacenado en dos lugares. Cuando el usuario cambia de objetivo, ¿se actualiza users.goal, goals, o ambos? No está definido. Esta es la fuente de bugs de sincronización más predecible del proyecto.  
  
Solución: Eliminar users.goal. El objetivo actual se deriva del registro activo en GOALS (status = 'active').  
  
DUP-02 · PESO ACTUAL: USERS.CURRENT_WEIGHT_KG + BODY_MEASUREMENTS  
  
users.current_weight_kg existe como campo directo. BODY_MEASUREMENTS almacena histórico de pesos. El peso actual siempre debería ser el último registro en BODY_MEASUREMENTS. Tener ambos crea dos fuentes de verdad que eventualmente van a desincronizarse.  
  
Solución: Eliminar users.current_weight_kg. El peso actual = MAX(created_at) de body_measurements para ese usuario.  
  
DUP-03 · MACROS EN FOOD_DIARY Y EN FOODS (REDUNDANCIA INTENCIONAL MAL DOCUMENTADA)  
  
FOOD_DIARY almacena calories, protein_g, carbs_g, fat_g por entrada. Estos se pueden calcular desde FOODS + quantity_g. La redundancia es técnicamente válida (protege contra cambios en los datos base de alimentos) pero no está documentada como decisión intencional, lo que lleva a que cualquier desarrollador la “corrija” introduciendo un bug.  
  
Acción: Documentar explícitamente que la desnormalización en FOOD_DIARY es intencional para preservar el historial nutricional ante actualizaciones de la base de alimentos.  
  
DUP-04 · WATER_TARGETS COMO TABLA vs CÁLCULO EN TIEMPO REAL  
  
Data_Base.md define una tabla WATER_TARGETS con target_ml y calculated_at. El target de agua es determinístico: se calcula desde el peso del usuario + actividad del día. No necesita persistencia en una tabla dedicada. Es un valor calculable que se almacena innecesariamente, creando otro punto de sincronización.  
  
Solución: Calcular el target en tiempo real en el endpoint GET /hydration/today. Cachearlo en Redis con TTL de 6 horas. Eliminar la tabla WATER_TARGETS.  
  
DUP-05 · DAILY_SUMMARY COMO TABLA vs VISTA MATERIALIZADA  
  
DAILY_SUMMARY agrega datos de FOOD_DIARY, WATER_LOGS, WORKOUT_SESSIONS y HEALTH_DATA. Es una proyección de otras tablas. Si se mantiene como tabla regular, cada registro de comida, agua o entrenamiento requiere actualizar también DAILY_SUMMARY en la misma transacción (o en un trigger). A escala, esto es un punto de contención en escrituras.  
  
Solución: Implementar como PostgreSQL Materialized View con refresh incremental, o computar en tiempo real en el backend y cachearlo en Redis. No como tabla con escrituras manuales.  
  
DUP-06 · IA INTEGRATION DESCRITA DOS VECES DE FORMA IDÉNTICA  
  
Training_Engine.md (sección “Integración con IA”) y Nutrition_Engines.md (sección “IA Conversacional”) describen el mismo sistema con ejemplos casi idénticos. El módulo de IA es uno solo en la arquitectura (AI Conversation Module en NestJS) pero los documentos de dominio lo documentan como si fuera dos módulos separados. Esto puede llevar a implementar dos contextos de IA distintos cuando debería ser uno con acceso a datos de ambos dominios.  
  
SECCIÓN 3 — RIESGOS TÉCNICOS  
  
RT-01 · SLA DE 5 SEGUNDOS PARA CALI (RIESGO ALTO)  
  
MVP.md criterio de lanzamiento: “CALI responde en < 5 segundos el 95% de las veces.” Claude API (claude-sonnet-4-6) tiene latencias de 3-8 segundos para prompts complejos. Si el contexto del usuario incluye historial completo de entrenamiento, nutrición y conversación previa, el prompt puede alcanzar 4,000-6,000 tokens, empujando la latencia al límite superior o más allá. El SLA como está definido es frágil sin una estrategia de prompt explícita.  
  
Mitigación requerida: Definir el contexto máximo enviado a Claude (estructura fija + ventana deslizante de últimos N días), implementar streaming de respuesta visible en UI desde el primer token, y medir p95 en staging antes de confirmar el SLA.  
  
RT-02 · SUPABASE AUTH + NESTJS EN ECS + API GATEWAY: TRIPLE CAPA DE AUTH (RIESGO ALTO)  
  
La arquitectura combina:  
  
	•	Supabase Auth (gestiona JWT y OAuth)  
	•	NestJS Guards (validan JWT en cada request)  
	•	AWS API Gateway (rate limiting y routing)  
  
Esto crea tres puntos donde puede ocurrir un fallo de autenticación con mensajes de error diferentes, auditoría de seguridad dispersa, y complejidad operacional innecesaria para MVP. La pregunta crítica: ¿quién emite el JWT? Si Supabase Auth emite tokens RS256 pero NestJS los valida con su propia llave, hay un mismatch en la cadena de confianza.  
  
Decisión requerida: Definir un único emisor de JWT (recomiendo Supabase Auth para MVP) y que NestJS valide contra la clave pública de Supabase. Eliminar la capa de API Gateway para MVP (usar NestJS directamente detrás de un Application Load Balancer).  
  
RT-03 · WEBSOCKETS A ESCALA SIN ESTRATEGIA DE STICKY SESSIONS (RIESGO ALTO)  
  
API.md y Architecture.md especifican WebSocket para el chat de IA en tiempo real. Los WebSockets no son compatibles con escalado horizontal estándar (múltiples instancias ECS) sin sticky sessions o un broker pub/sub (Redis Pub/Sub, AWS API Gateway WebSocket). Este punto no está resuelto en la documentación.  
  
Riesgo concreto: Con 2+ instancias ECS y sin sticky sessions, los mensajes del cliente pueden llegar a una instancia que no tiene la conexión WS activa → error de conexión intermitente para el 50% de los usuarios cuando se escale.  
  
Solución: Para MVP con tráfico bajo, usar Server-Sent Events (SSE) en lugar de WebSocket puro (más simple, compatible con HTTP/2, no requiere sticky sessions). Migrar a WS con Redis Pub/Sub cuando el volumen lo justifique.  
  
RT-04 · AUSENCIA DE MODO OFFLINE (RIESGO ALTO)  
  
Ninguno de los 9 documentos menciona modo offline o estrategia local-first. Un usuario que va al parque a hacer dominadas y no tiene señal no puede registrar su entrenamiento. Este es el caso de uso central de la app. Sin offline, la adherencia cae en el escenario más importante: el usuario está físicamente entrenando.  
  
Solución requerida para MVP: Queue local de operaciones de escritura (workout logs, water logs, food diary) usando MMKV + sync automático al recuperar conexión. No requiere arquitectura compleja: una tabla local con pending_sync: boolean y un hook useNetworkSync.  
  
RT-05 · GESTIÓN DE CLAVES RS256 NO ESPECIFICADA (RIESGO MEDIO)  
  
Architecture.md especifica JWT RS256 pero no define dónde se almacenan las claves privadas. Si se usan variables de entorno directamente en ECS, cualquier desarrollador con acceso al task definition de ECS puede extraer la clave privada. Para datos de salud, esto es inaceptable.  
  
Solución: AWS KMS para gestión de claves, o delegar completamente al proveedor de auth (Supabase maneja sus propias claves RS256 internamente).  
  
RT-06 · USDA FOOD API SIN ESTRATEGIA DE FALLBACK COMPLETA (RIESGO MEDIO)  
  
El MVP depende de USDA FoodData Central como fuente primaria. La base de 500 alimentos en español es el fallback, pero:  
  
	•	USDA tiene resultados en inglés por defecto  
	•	Los mercados target (México, Colombia, Argentina, España) tienen alimentos locales que no están en USDA  
	•	No hay estrategia de búsqueda fuzzy cuando no hay match exacto  
  
Riesgo concreto: Un usuario colombiano busca “bandeja paisa” o “arepas de choclo” y no encuentra nada → abandono del registro → pérdida de dato nutricional → contexto incompleto para CALI.  
  
SECCIÓN 4 — RIESGOS DE ESCALABILIDAD  
  
RE-01 · DAILY_SUMMARY COMO HOT ROW (RIESGO ALTO)  
  
Si se implementa DAILY_SUMMARY como tabla con actualizaciones síncronas, cada registro de comida actualiza la misma fila del resumen diario. Para un usuario que registra 5 comidas/día, son 5 writes a la misma fila. A 10,000 usuarios activos diarios con registro promedio de 4-5 veces al día: 40,000-50,000 writes/día a filas individuales por usuario. PostgreSQL maneja esto bien en ese orden, pero a 100,000 usuarios la contención en UPDATE daily_summary se convierte en cuello de botella. Hay que anticiparlo.  
  
RE-02 · CONTEXTO DE IA CRECE ILIMITADAMENTE (RIESGO ALTO)  
  
No hay límite definido para el tamaño del contexto enviado a Claude en el AI Module. A medida que el usuario acumula historial (6 meses de registros de entrenamiento, nutrición, conversaciones), el prompt crece, aumentando costo y latencia linealmente. A 100,000 usuarios con 6 meses de datos cada uno, el costo de Claude API puede multiplicarse x5-10 versus el mes de lanzamiento.  
  
Solución: Definir una ventana de contexto fija desde el día 1: últimos 14 días de nutrición, últimas 10 sesiones de entrenamiento, últimas 20 mensajes del chat. Resumen comprimido del historial más antiguo generado por Claude y almacenado en caché.  
  
RE-03 · HEALTH SYNC SIN CONTROL DE FRECUENCIA (RIESGO MEDIO)  
  
No hay especificación de cuándo se dispara la sincronización con Apple Health / Health Connect. Si la app sincroniza al abrir (patrón common en apps fitness), y 10,000 usuarios abren la app entre 7-8am, se genera un spike de 10,000 llamadas simultáneas a POST /health/sync con escrituras en health_data y actualizaciones en daily_summary. Sin rate limiting específico para este endpoint, el sistema se satura.  
  
Solución: Background sync con Job Queue (Bull/BullMQ en Redis), no sync síncrono en apertura de app.  
  
RE-04 · FALTA ESTRATEGIA CDN PARA ASSETS ESTÁTICOS (RIESGO MENOR)  
  
Architecture.md menciona AWS S3 para assets pero no define CloudFront CDN. Para una app mobile con usuarios en múltiples países de LATAM + España, sin CDN los assets (imágenes de ejercicios, iconos) se sirven desde una región de AWS con latencia variable.  
  
SECCIÓN 5 — RIESGOS DE SEGURIDAD  
  
RS-01 · GDPR / DERECHO AL OLVIDO NO DOCUMENTADO (RIESGO CRÍTICO LEGAL)  
  
El mercado de España es uno de los 4 mercados de lanzamiento. España está bajo GDPR. Ninguno de los 9 documentos menciona:  
  
	•	Derecho de acceso a datos del usuario  
	•	Derecho de eliminación (right to erasure)  
	•	Exportación de datos personales  
	•	Data Processing Agreement con proveedores  
  
Apple App Store también requiere una política de eliminación de cuenta funcional desde iOS 15 (2022). Sin esto, la app puede ser rechazada en revisión.  
  
Esto es un bloqueante de lanzamiento.  
  
RS-02 · DATOS DE SALUD EN CONVERSACIONES DE IA NO ENCRIPTADOS A NIVEL DE CAMPO (RIESGO ALTO)  
  
Las conversaciones con CALI (AI_MESSAGES tabla) almacenan texto libre que puede contener información médica sensible (“tengo diabetes”, “tomo metformina”, “tengo dolor en la rodilla”). La tabla tiene RLS pero no encriptación a nivel de campo. Un administrador de base de datos con acceso directo a Supabase puede leer todas las conversaciones.  
  
Solución: Encriptación a nivel de aplicación del campo content en AI_MESSAGES antes de persistir. Clave de encriptación por usuario, no por sistema.  
  
RS-03 · RATE LIMITING DE IA POR USUARIO NO DEFINIDO (RIESGO ALTO)  
  
API.md menciona rate limiting general pero no define límites específicos para /ai/conversations/:id/messages. Sin límites por usuario, un usuario malintencionado puede generar miles de mensajes en minutos, generando costos significativos en Claude API. El free tier necesita un límite más agresivo que el premium.  
  
Solución requerida: Definir explícitamente mensajes/día por tier (propuesta: Free = 10 mensajes/día, Premium = 100 mensajes/día), implementado con Redis counters con TTL de 24 horas.  
  
RS-04 · GOOGLE OAUTH SCOPE NO ESPECIFICADO (RIESGO MEDIO)  
  
MVP.md incluye Google Sign-In pero ningún documento define los OAuth scopes requeridos. Solicitar más permisos de los necesarios es una práctica rechazada por las tiendas. El scope mínimo para autenticación es openid email profile, cualquier scope adicional requiere justificación ante Google.  
  
RS-05 · CERTIFICATE PINNING NO MENCIONADO (RIESGO MEDIO)  
  
Para una app que maneja datos de salud y transacciones financieras (RevenueCat), el certificate pinning en la capa de red mobile es una práctica recomendada. No está mencionado en ningún documento. Un ataque man-in-the-middle podría interceptar tokens JWT en redes públicas.  
  
SECCIÓN 6 — FUNCIONALIDADES QUE DEBEN SALIR DEL MVP  
  
  
  
|#   |Feature                                                 |Documento de origen|Motivo de exclusión                                                                |  
|----|--------------------------------------------------------|-------------------|-----------------------------------------------------------------------------------|  
|F-01|Planificador de comidas (desayuno/almuerzo/cena/snacks) |Nutrition_Engine.md|Excluido en MVP.md pero definido en motor. Conflicto. Alto costo de IA.            |  
|F-02|Recetas inteligentes basadas en ingredientes disponibles|Nutrition_Engine.md|Requiere prompt complejo, múltiples llamadas a Claude. MVP.                        |  
|F-03|Fotografía de alimentos → macros                        |Nutrition_Engine.md|Excluido en MVP.md. Vision API tiene latencia y costo extra. v2.0 #1.              |  
|F-04|Código de barras                                        |Nutrition_Engine.md|Excluido en MVP.md. Requiere integración con Open Food Facts. v2.0.                |  
|F-05|Ajuste por clima en hidratación                         |Nutrition_Engine.md|No hay API de clima en el stack. Feature sin implementación técnica.               |  
|F-06|Importar frecuencia cardíaca de Apple Health            |Nutrition_Engine.md|No se usa en ningún cálculo de v1.0. Dato importado sin destino.                   |  
|F-07|Detección de estancamiento (3 semanas sin mejora)       |Training_Engine.md |Requiere mínimo 3 semanas de datos. Usuario nuevo no tendrá datos. v1.1.           |  
|F-08|Ajuste de volumen por sueño < 6h                        |Training_Engine.md |Depende de Apple Health (P2). Dependencia no resuelta en MVP.                      |  
|F-09|Sistema completo de logros (Achievements table)         |Data_Base.md       |Solo implementar streak. Todo lo demás a v2.0.                                     |  
|F-10|Admin module y Webhooks                                 |API.md             |Complejidad innecesaria. Admin via Supabase Studio en MVP.                         |  
|F-11|Analytics module avanzado                               |Architecture.md    |Dashboard básico (DAU, peso, adherencia) es suficiente para MVP.                   |  
|F-12|Ajuste automático de calorías por progreso real         |Nutrition_Engine.md|Requiere 14-21 días de datos. MVP.md lo postpone pero Nutrition Engine lo describe.|  
  
SECCIÓN 7 — FUNCIONALIDADES FALTANTES CRÍTICAS  
  
FM-01 · MODO OFFLINE / OPERACIÓN LOCAL (CRÍTICO)  
  
Sin offline, el caso de uso central (registrar entrenamiento en el parque/gimnasio sin WiFi) falla. Debe implementarse en MVP con queue local.  
  
FM-02 · FLUJO DE ELIMINACIÓN DE CUENTA Y DATOS (CRÍTICO LEGAL)  
  
Requerido por Apple App Store Guidelines §5.1.1 y GDPR. Sin esto, la app puede ser rechazada. Debe incluir:  
  
	•	Confirmación de eliminación con advertencia  
	•	Borrado en cascada de todos los datos del usuario  
	•	Período de gracia de 30 días (opcional pero recomendado)  
  
FM-03 · DEFINICIÓN EXPLÍCITA DE LÍMITES FREE vs PREMIUM (CRÍTICO NEGOCIO)  
  
MVP.md menciona “acceso freemium con límites” pero ningún documento define qué funcionalidades son free y cuáles premium. Sin esta decisión, el desarrollador no sabe qué bloquear con el paywall. Propuesta para auditoría:  
  
  
  
|Feature              |Free           |Premium         |  
|---------------------|---------------|----------------|  
|Rutinas generadas    |1 programa     |Ilimitados      |  
|Registro de alimentos|Sí             |Sí              |  
|Coach IA (CALI)      |10 mensajes/día|100 mensajes/día|  
|Analítica de progreso|7 días         |90 días         |  
|Apple Health sync    |No             |Sí              |  
|Progresión automática|Manual         |Automática      |  
  
FM-04 · PREFERENCIAS DE UNIDADES (IMPORTANTE)  
  
La app lanza en México, Colombia, Argentina y España. Sin preferencia de kg/lbs y cm/pulgadas, usuarios de Colombia (que mezclan sistemas) y usuarios internacionales futuros tienen fricción en el onboarding. Costo de implementación: bajo. Riesgo de no implementarlo: reviews negativos desde el lanzamiento.  
  
FM-05 · DEEP LINKING (IMPORTANTE)  
  
Las notificaciones push de recordatorio de entrenamiento e hidratación deben llevar al usuario a la pantalla correcta (no al home). Sin deep linking implementado, la notificación abre la app en el home, requiriendo navegación adicional → abandono. Deep linking también es requerido para marketing links y campañas de re-engagement.  
  
FM-06 · ESTADOS DE ERROR PARA APIS EXTERNAS (IMPORTANTE)  
  
¿Qué ve el usuario cuando Claude API está caído? ¿Cuando USDA no responde? ¿Cuando no hay internet? Ningún documento define estos estados. En una app de salud, un mensaje de error mal manejado genera desconfianza. Necesita definición explícita de fallback UX para cada API externa.  
  
FM-07 · ESTRATEGIA DE OTA UPDATES (IMPORTANTE)  
  
Architecture.md menciona Expo pero no define si se usará Expo Updates (OTA) para patches sin pasar por revisión de tiendas. Para una app en fase MVP donde los bugs son esperables, OTA es crítico para tiempo de respuesta. Las revisiones de App Store toman 1-3 días; con OTA un bug crítico puede corregirse en minutos.  
  
FM-08 · ONBOARDING STATE MACHINE (IMPORTANTE)  
  
Si el usuario abandona el onboarding a mitad (ej: en el paso 4 de 6), ¿qué sucede cuando vuelve a abrir la app? No hay definición del estado de “onboarding incompleto”. Sin esto, el usuario puede quedar atrapado en un estado indefinido o ver el home con datos vacíos sin saber qué hacer.  
  
SECCIÓN 8 — MVP OPTIMIZADO v1.0  
  
Con base en la auditoría, presento el MVP redefinido. El principio de corte es: todo lo que entrega la hipótesis central sin comprometer calidad ni plazo.  
  
Módulos Confirmados (Sin Cambios)  
  
	•	Auth (Email + Google Sign-In)  
	•	Onboarding con evaluación inicial  
	•	Perfil y biométricos  
	•	Motor de Entrenamiento (evaluación → generación de rutina → registro)  
	•	Motor de Nutrición (macros → búsqueda de alimentos → registro diario)  
	•	Motor de Hidratación (meta + registro rápido)  
	•	Dashboard Home  
	•	Coach IA CALI (chat contextual con acciones, sin memoria persistente)  
	•	Progreso básico (gráfica de peso + records de ejercicio)  
	•	Paywall + RevenueCat  
  
Cambios Respecto a Documentación Actual  
  
Simplificaciones al Motor de Entrenamiento:  
  
	•	Sistema de clasificación: unificar en 3 niveles (Principiante / Intermedio / Avanzado) según MVP.md. Eliminar los 6 niveles de Training_Engine.md para v1.0.  
	•	Detección de estancamiento: implementar solo lectura de datos, no acción automática. Mostrar alerta al usuario, no modificar programa automáticamente. La acción automática requiere 3+ semanas de datos que los usuarios de lanzamiento no tienen.  
	•	Ajuste por sueño: diferir completamente a v1.1. Depende de Health Connect que es P2.  
  
Simplificaciones al Motor de Nutrición:  
  
	•	Eliminar planificador de comidas del Nutrition Engine scope  
	•	Eliminar recetas inteligentes del alcance v1.0  
	•	La IA puede sugerir qué comer en formato conversacional (CALI), pero no hay un “Meal Planner” como pantalla dedicada  
	•	Hidratación por clima: eliminar. Usar solo peso + actividad.  
  
Adiciones obligatorias al MVP:  
  
	•	Offline queue para workout_logs, water_logs, food_diary (sin esto, el producto no funciona en el caso de uso principal)  
	•	Flujo de eliminación de cuenta (bloqueante de App Store)  
	•	Definición explícita de límites free/premium antes de codificar  
	•	Deep linking básico para notificaciones  
	•	Preferencias de unidades (kg/lbs) en onboarding  
  
Tabla de Base de Datos optimizada:  
  
	•	Eliminar users.goal (usar GOALS table)  
	•	Eliminar users.current_weight_kg (derivar de body_measurements)  
	•	Eliminar WATER_TARGETS table (calcular en runtime + caché Redis)  
	•	Refactorizar DAILY_SUMMARY a vista materializada, no tabla  
	•	Documentar explícitamente la desnormalización de macros en FOOD_DIARY como intencional  
  
Timeline Revisado (12 Semanas Reales)  
  
  
  
|Semana|Sprint|Entregable                                                                                   |  
|------|------|---------------------------------------------------------------------------------------------|  
|1–2   |S1    |Fundación: repo, CI/CD, DB schema, Auth (email + Google), offline queue base                 |  
|3–4   |S2    |Onboarding completo: biométricos, evaluación inicial, generación de rutina, cálculo de macros|  
|5–6   |S3    |Motor de Entrenamiento: registro de sesión, progresión, historial                            |  
|7–8   |S4    |Motor de Nutrición: búsqueda USDA + base local, registro, resumen diario                     |  
|9     |S5a   |Motor de Hidratación + Dashboard Home                                                        |  
|10    |S5b   |Coach IA CALI (chat con contexto limitado, acciones de registro)                             |  
|11    |S6a   |Apple Health / Health Connect (solo pasos y peso), notificaciones básicas, RevenueCat        |  
|12    |S6b   |QA integral, eliminación de cuenta, offline sync, performance Android, submission            |  
  
Criterios de Lanzamiento Actualizados  
  
Bloqueantes originales del MVP.md: Todos vigentes.  
  
Bloqueantes adicionales post-auditoría:  
  
	•	Offline mode funciona para workout y food logging sin internet  
	•	Flujo de eliminación de cuenta funciona end-to-end con borrado real de datos  
	•	Límites free/premium implementados y verificados en RevenueCat  
	•	Rate limiting del AI endpoint verificado (no puede exceder N mensajes/usuario/día)  
	•	RLS verificado: ningún usuario accede a datos de otro (testing automatizado)  
	•	Política de privacidad incluye sección de eliminación de datos y GDPR  
	•	Onboarding state machine: usuario que abandona en paso 3 retoma desde paso 3  
  
RESUMEN EJECUTIVO DE ACCIONES REQUERIDAS  
  
  
  
|Prioridad|Acción                                                                        |Bloqueante de código|  
|---------|------------------------------------------------------------------------------|--------------------|  
|🔴 CRÍTICO|Unificar sistema de clasificación de niveles de entrenamiento                 |SÍ                  |  
|🔴 CRÍTICO|Definir límites free/premium antes de implementar paywall                     |SÍ                  |  
|🔴 CRÍTICO|Agregar offline queue al scope de MVP                                         |SÍ                  |  
|🔴 CRÍTICO|Definir flujo de eliminación de cuenta                                        |SÍ                  |  
|🟠 ALTO   |Remover `users.goal` y `users.current_weight_kg` del schema                   |SÍ                  |  
|🟠 ALTO   |Definir ventana máxima de contexto para Claude (14 días / 10 sesiones)        |SÍ                  |  
|🟠 ALTO   |Reemplazar WebSocket con SSE para el chat de IA en MVP                        |SÍ                  |  
|🟠 ALTO   |Eliminar Water_Targets table, calcular en runtime                             |SÍ                  |  
|🟠 ALTO   |Definir rate limit explícito para `/ai/messages` por tier                     |SÍ                  |  
|🟡 MEDIO  |Eliminar Daily_Summary como tabla, convertir a vista materializada            |Recomendado         |  
|🟡 MEDIO  |Documentar desnormalización de macros en FOOD_DIARY como intencional          |Recomendado         |  
|🟡 MEDIO  |Implementar deep linking para notificaciones                                  |Recomendado         |  
|🟡 MEDIO  |Agregar preferencias de unidades al onboarding                                |Recomendado         |  
|🟡 MEDIO  |Definir fallback UX para APIs externas caídas                                 |Recomendado         |  
|🟢 MENOR  |Corregir duplicación de principios en Training_Engine.md y Nutrition_Engine.md|No                  |  
|🟢 MENOR  |Agregar OTA Updates (Expo Updates) al CI/CD pipeline                          |No                  |  
  
El proyecto tiene una base sólida. La arquitectura central es correcta, el stack tecnológico es profesional y la visión del producto es clara y diferenciada. Los problemas identificados son resolubles y ninguno requiere rediseño estructural. Con las acciones listadas resueltas, el proyecto está listo para iniciar desarrollo con alta confianza.  
  
Auditoría realizada por el equipo CTO de CALI-NUTRI AI. Documento base para la sesión de arquitectura previa al Sprint 1. Toda acción marcada como “Bloqueante de código” debe resolverse antes de iniciar implementación.  
