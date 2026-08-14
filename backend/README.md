# Roma Fast Food — Backend

Backend distribuido para el proyecto de grado **Roma Fast Food**.

## Decisiones del Bloque 1

- Node.js 24 LTS + TypeScript.
- NestJS 11 en monorepo.
- 4 microservicios HTTP independientes:
  - `auth-service`
  - `operations-service`
  - `inventory-service`
  - `reporting-service`
- CQRS mediante `@nestjs/cqrs`.
- PostgreSQL 18, con una base lógica por microservicio.
- TypeORM como adaptador ORM, sin `synchronize` automático.
- RabbitMQ como broker de eventos asíncronos.
- OpenAPI/Swagger en cada servicio.
- Correlation ID para trazabilidad de peticiones.
- Health checks de proceso y base de datos.
- Docker Compose preparado para integración y despliegue.

## Límites de negocio

### Auth Service
Autenticación, usuarios, roles, permisos, access tokens y refresh tokens.

### Operations Service
Productos, categorías, clientes, pedidos/ventas, preparación, pagos, caja y PedidosYa.

### Inventory Service
Insumos, presentaciones, recetas versionadas, movimientos, consumos y conteos físicos.

### Reporting Service
Dashboard, reportes, conciliación, arqueos y proyecciones de lectura.

La separación no sigue pantallas del frontend: sigue capacidades de negocio para evitar microservicios excesivamente pequeños y transacciones distribuidas innecesarias.

## Puertos de desarrollo

| Servicio | HTTP | Swagger |
|---|---:|---|
| Auth | 3101 | `http://localhost:3101/docs` |
| Operations | 3102 | `http://localhost:3102/docs` |
| Inventory | 3103 | `http://localhost:3103/docs` |
| Reporting | 3104 | `http://localhost:3104/docs` |
| PostgreSQL | 55432 | solo localhost |
| RabbitMQ Management | 15672 | solo localhost |

## Comandos locales

Instalar dependencias:

```powershell
npm install
```

Compilar todos los servicios:

```powershell
npm run build:all
```

Lint:

```powershell
npm run lint
```

Pruebas:

```powershell
npm test
```

> Los servicios necesitan PostgreSQL para arrancar. En la PC de desarrollo prestada se puede compilar y ejecutar pruebas sin instalar Docker. La integración completa se realiza en un entorno Docker remoto/Codespaces o en una máquina autorizada para virtualización.

## Docker

Una vez disponible un host Docker:

```bash
docker compose up -d --build
```

Estado:

```bash
docker compose ps
```

Logs:

```bash
docker compose logs -f auth-service
```

Apagar sin borrar datos:

```bash
docker compose down
```

Apagar y eliminar volúmenes de desarrollo:

```bash
docker compose down -v
```

## Health checks

Ejemplo Auth:

```text
GET http://localhost:3101/api/v1/health/live
GET http://localhost:3101/api/v1/health/ready
```

`live` comprueba que el proceso está ejecutándose. `ready` comprueba además la conexión a PostgreSQL.

## Política de datos

Un microservicio es dueño de su base:

- `roma_auth`
- `roma_operations`
- `roma_inventory`
- `roma_reporting`

Ningún servicio debe modificar directamente tablas pertenecientes a otro servicio. La coordinación entre límites se realizará mediante APIs síncronas cuando se necesite respuesta inmediata y eventos RabbitMQ cuando se admita desacoplamiento/consistencia eventual.

## Siguiente bloque

El siguiente bloque implementará Auth Service de forma funcional:

1. entidades y migraciones de usuarios, roles, permisos y refresh tokens;
2. contraseñas con hash;
3. login mediante CQRS;
4. JWT con firma asimétrica;
5. refresh token rotatorio;
6. autorización por permisos;
7. seed equivalente a los usuarios/roles del frontend actual.


## Bloque 2A — Autenticación y sesión

El Auth Service incorpora el modelo persistente de usuarios, roles, permisos y sesiones renovables.
La contraseña se deriva mediante `scrypt` con salt aleatorio; el valor en texto plano nunca se almacena.
Los Access Tokens son JWT RS256 de corta duración. La clave privada solo pertenece a Auth y el refresh
token es opaco, rotativo y se guarda en PostgreSQL únicamente como SHA-256.

### Preparación

```powershell
npm install
Copy-Item .env.example .env.local
npm run auth:keys
```

Cuando PostgreSQL esté disponible:

```powershell
npm run db:migrate:auth
npm run db:seed:auth
npm run start:dev:auth
```

Endpoints iniciales:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

El refresh token viaja en una cookie `HttpOnly`; el frontend no necesita leerlo directamente.
