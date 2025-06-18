// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const permissions = [
  { action: 'users:create', description: 'Permite crear nuevos usuarios subordinados.' },
  { action: 'users:read', description: 'Permite ver la lista de usuarios subordinados.' },
  { action: 'users:update', description: 'Permite editar usuarios subordinados existentes.' },
  { action: 'users:delete', description: 'Permite eliminar usuarios subordinados.' },
  { action: 'users:manage-permissions', description: 'Permite cambiar permisos de roles subordinados.' },
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
  { action: 'system:manage-master-data', description: 'Permite gestionar datos maestros (tipos/estatus de movimiento).' },
];

// CAMBIO IMPORTANTE: Ahora es un array de objetos para incluir la homeRoute
const roleDefinitions = [
  {
    name: 'ADMINISTRADOR',
    homeRoute: '/admin/home',
    permissions: [
      'users:create', 'users:read', 'users:update', 'users:delete', 'users:manage-permissions', 
      'transfers:read', 'receptions:read', 
      'reports:read:all-stores', 
      'system:manage-roles', 'system:manage-master-data'
    ]
  },
  {
    name: 'SUPERVISOR',
    homeRoute: '/supervisor/home',
    permissions: [
      'users:create', 'users:read', 'users:update', 'users:delete', 'users:manage-permissions',
      'reports:read:supervised-stores',
      // 👇 PERMISOS AÑADIDOS
      'transfers:create', 'transfers:read', 'transfers:close', 
      'receptions:create', 'receptions:read', 'receptions:confirm',
    ]
  },
  {
    name: 'GERENTE',
    homeRoute: '/gerente/home',
    permissions: [
      'users:create', 'users:read', 'users:update', 'users:delete',
      'reports:read:own-store',
      // Permisos que ya tenía y están correctos
      'transfers:create', 'transfers:read', 'transfers:close', 
      'receptions:create', 'receptions:read', 'receptions:confirm', 
    ]
  },
  {
    name: 'ENCARGADO',
    homeRoute: '/colaborador/home',
    permissions: [
      // Permisos que ya tenía y están correctos
      'transfers:create', 'transfers:read', 'transfers:close',
      'receptions:create', 'receptions:read', 'receptions:confirm'
    ]
  },
  {
    name: 'VENDEDOR',
    homeRoute: '/colaborador/home',
    permissions: [
      // 👇 PERMISOS AÑADIDOS
      'transfers:create', 'transfers:read', 'transfers:close',
      'receptions:create', 'receptions:read', 'receptions:confirm'
    ]
  }
];

async function main() {
  console.log('Start seeding ...');

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { action: p.action },
      update: {},
      create: p,
    }); 
  }
  console.log('Permissions created/verified.');

  // CAMBIO IMPORTANTE: El loop ahora usa la nueva estructura
  for (const roleDef of roleDefinitions) {
    const permissionsToConnect = await prisma.permission.findMany({
      where: { action: { in: roleDef.permissions } },
    });

    await prisma.role.upsert({
      where: { name: roleDef.name },
      update: {
        homeRoute: roleDef.homeRoute,
        permissions: { set: permissionsToConnect.map(p => ({ id: p.id })) },
      },
      create: {
        name: roleDef.name,
        description: `Rol de ${roleDef.name}`,
        homeRoute: roleDef.homeRoute,
        permissions: { connect: permissionsToConnect.map(p => ({ id: p.id })) },
      },
    });
  }
  console.log('Roles with permissions and home routes created/verified.');

  const movementTypes = ['TRASLADO_TIENDA', 'RECEPCION_PROVEEDOR', 'RECEPCION_3PL', 'DEVOLUCION_3PL', 'SALIDA_USO'];
  for (const typeName of movementTypes) {
    await prisma.movementType.upsert({ where: { name: typeName }, update: {}, create: { name: typeName } });
  }
  console.log('Movement Types created/verified.');
  
  const movementStatuses = ['EN_PREPARACION', 'EN_TRANSITO', 'RECIBIDO_CON_DISCREPANCIAS', 'CERRADO', 'CANCELADO'];
  for (const statusName of movementStatuses) {
    await prisma.movementStatus.upsert({ where: { name: statusName }, update: {}, create: { name: statusName } });
  }
  console.log('Movement Statuses created/verified.');

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
    console.log('Admin user created/verified.');
    console.log('Default credentials -> email: admin@uniongroup.com, password: SUPERVISORX#413017581');
  }

  console.log('Seeding finished.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});