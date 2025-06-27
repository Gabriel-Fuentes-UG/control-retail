// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Añadimos los nuevos permisos para incidencias
const permissions = [
  { action: 'users:create', description: 'Permite crear nuevos usuarios subordinados.' },
  { action: 'users:read', description: 'Permite ver la lista de usuarios subordinados.' },
  { action: 'users:update', description: 'Permite editar usuarios subordinados existentes.' },
  { action: 'users:delete', description: 'Permite eliminar usuarios subordinados.' },
  { action: 'transfers:create', description: 'Permite crear nuevos traslados/envíos.' },
  { action: 'transfers:read', description: 'Permite ver traslados.' },
  { action: 'transfers:close', description: 'Permite cerrar un traslado para su envío.' },
  { action: 'receptions:create', description: 'Permite iniciar una recepción de mercancía.' },
  { action: 'receptions:read', description: 'Permite ver el historial de recepciones.' },
  { action: 'receptions:confirm', description: 'Permite confirmar y cerrar una recepción.' },
  { action: 'reports:read:own-store', description: 'Permite ver reportes de la propia tienda.' },
  { action: 'reports:read:supervised-stores', description: 'Permite ver reportes de tiendas supervisadas.' },
  { action: 'reports:read:all-stores', description: 'Permite ver reportes de todas las tiendas.' },
  { action: 'system:manage-roles', description: 'Permite crear, editar y asignar permisos a roles.' },
  { action: 'incidents:detect', description: 'Permite reportar un traslado como desviado.' },
  { action: 'incidents:resolve', description: 'Permite resolver una incidencia de traslado (recibir o reenviar).' },
  { action: 'inventory:report-loss', description: 'Permite registrar una pérdida de inventario.' },
  { action: 'incidents:detect', description: 'Permite reportar un traslado como desviado.' },
  { action: 'incidents:resolve', description: 'Permite resolver una incidencia de traslado.' },
  { action: 'inventory:report-loss', description: 'Permite registrar una pérdida de inventario.' },

];

const roleDefinitions = [
    { name: 'ADMINISTRADOR', homeRoute: '/admin/home', permissions: ['users:read', 'system:manage-roles', 'reports:read:all-stores', 'incidents:resolve'] },
    { name: 'SUPERVISOR', homeRoute: '/supervisor/home', permissions: ['users:read', 'reports:read:supervised-stores', 'transfers:create', 'receptions:create', 'incidents:resolve', 'inventory:report-loss'] },
    { name: 'GERENTE', homeRoute: '/gerente/home', permissions: ['users:read', 'reports:read:own-store', 'transfers:create', 'receptions:create', 'incidents:detect', 'inventory:report-loss','receptions:read'] },
    { name: 'ENCARGADO', homeRoute: '/colaborador/home', permissions: ['transfers:create', 'receptions:create', 'incidents:detect','receptions:read'] },
    { name: 'VENDEDOR', homeRoute: '/colaborador/home', permissions: ['transfers:read', 'receptions:read','receptions:read', 'receptions:create'] }
];

const movementTypes = [
  { name: 'RECEPCION_TRASLADO',   description: 'Mercancía recibida de otra tienda o almacén interno.' },
  { name: 'RECEPCION_PROVEEDOR',  description: 'Mercancía recibida directamente de un proveedor externo.' },
  { name: 'RECEPCION_3PL',        description: 'Mercancía recibida desde un centro de distribución logístico (3PL).' },
  { name: 'TRASLADO_INTERNO',     description: 'Envío de mercancía a otra tienda o almacén de la organización.' },
  { name: 'TRASLADO_CORPORATIVO', description: 'Envío de mercancía a oficinas o uso corporativo.' },
  { name: 'SALIDA_USO_INTERNO',   description: 'Salida de mercancía por consumo, gasto o uniformes para el personal.' },
  { name: 'DEVOLUCION_EXTERNA',   description: 'Salida de mercancía como devolución a un proveedor o 3PL.' },
];

// Ajustamos solo los cuatro estados que usaremos para el flujo de recepciones
const movementStatuses = [
    { name: 'EN_PREPARACION', description: 'El traslado se está armando.' },
    { name: 'EN_TRANSITO', description: 'El traslado ya fue enviado y está en camino.' },
    { name: 'RECIBIDO_PARCIAL', description: 'Se recibió el traslado, pero aún no se confirma el contenido.' },
    { name: 'CERRADO', description: 'El ciclo del movimiento se completó exitosamente.' },
    { name: 'CANCELADO', description: 'El movimiento fue cancelado antes de completarse.' },
    // Nuevos estados de tu propuesta
    { name: 'DESVIADO', description: 'El traslado fue detectado en una ubicación incorrecta.' },
    { name: 'EN_REASIGNACION', description: 'Un supervisor está gestionando la incidencia del desvío.' },
    { name: 'CERRADO_CON_INCIDENCIA', description: 'El ciclo se cerró pero se resolvió a partir de un desvío.' },
    { name: 'PERDIDO_O_ROBADO', description: 'El traslado fue reportado como perdido o robado.' },
];

async function main() {
  console.log('Start seeding ...');

  // Permisos
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { action: p.action },
      update: { description: p.description },
      create: { action: p.action, description: p.description },
    });
  }
  console.log('Permissions created/verified.');

  // Roles y asignación de permisos
  for (const roleDef of roleDefinitions) {
    const perms = await prisma.permission.findMany({
      where: { action: { in: roleDef.permissions } },
    });
    await prisma.role.upsert({
      where: { name: roleDef.name },
      update: {
        homeRoute: roleDef.homeRoute,
        permissions: { set: perms.map(p => ({ id: p.id })) },
      },
      create: {
        name: roleDef.name,
        description: `Rol de ${roleDef.name}`,
        homeRoute: roleDef.homeRoute,
        permissions: { connect: perms.map(p => ({ id: p.id })) },
      },
    });
  }
  console.log('Roles with permissions and home routes created/verified.');

  // MovementTypes
  for (const type of movementTypes) {
    await prisma.movementType.upsert({
      where: { name: type.name },
      update: { description: type.description },
      create: type,
    });
  }
  console.log('Movement Types created/verified.');

  // MovementStatuses
  for (const status of movementStatuses) {
    await prisma.movementStatus.upsert({
      where: { name: status.name },
      update: { description: status.description },
      create: status,
    });
  }
  console.log('Movement Statuses PENDIENTE / PARCIAL / TOTAL / CANCELADO created/verified.');

  // Usuario admin
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMINISTRADOR' } });
  if (adminRole) {
    const hashedPassword = await bcrypt.hash('SUPERVISORX#413017581', 10);
    await prisma.user.upsert({
      where: { email: 'admin@uniongroup.com' },
      update: {},
      create: {
        name: 'Administrador del Sistema',
        email: 'admin@uniongroup.com',
        password: hashedPassword,
        roleId: adminRole.id,
        isActive: true,
      },
    });
      await prisma.movementType.upsert({
    where: { name: "TRASLADO_INTERNO" },
    update: {},
    create: { name: "TRASLADO_INTERNO", description: "Traslado entre tiendas" }
  });
  await prisma.movementStatus.upsert({
    where: { name: "EN_PREPARACION" },
    update: {},
    create: { name: "EN_PREPARACION", description: "En preparación" }
  });
    console.log('Admin user created/verified.');
  }

  console.log('Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
