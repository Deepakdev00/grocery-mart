const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Seeding role and permission configuration...\n');

  try {
    // 1. Seed Roles (Submodule 3: RBAC)
    console.log('🛡️ Creating Roles...');
    const rolesList = [
      { name: 'admin', description: 'Full system administrator with all permissions' },
      { name: 'staff', description: 'Store staff managing products, orders and customer support' },
      { name: 'supplier', description: 'Suppliers providing grocery stock and inventory updates' },
      { name: 'retailer', description: 'Retail partners purchasing wholesale groceries' },
      { name: 'customer', description: 'Standard consumer purchasing groceries online' }
    ];

    const roles = {};
    for (const r of rolesList) {
      const role = await prisma.role.upsert({
        where: { name: r.name },
        update: { description: r.description },
        create: {
          name: r.name,
          description: r.description
        }
      });
      roles[r.name] = role;
      console.log(`✅ Role ready: ${role.name}`);
    }

    // 2. Seed Permissions
    console.log('\n🔑 Creating Permissions...');
    const permissionsList = [
      { name: 'manage_users', description: 'Create, update, deactivate users and roles', module: 'users' },
      { name: 'view_users', description: 'View user directory and profiles', module: 'users' },
      { name: 'manage_products', description: 'Add, edit, delete products catalog', module: 'products' },
      { name: 'view_products', description: 'Browse and search product catalog', module: 'products' },
      { name: 'manage_orders', description: 'Update order status and handle cancellations', module: 'orders' },
      { name: 'view_orders', description: 'View order history and details', module: 'orders' },
      { name: 'create_order', description: 'Place new grocery orders', module: 'orders' },
      { name: 'view_audit_logs', description: 'View login logs and activity audit trail', module: 'security' },
      { name: 'manage_inventory', description: 'Update stock levels as supplier', module: 'inventory' },
      { name: 'support_tickets', description: 'Manage customer support requests', module: 'support' }
    ];

    const permissions = {};
    for (const p of permissionsList) {
      const perm = await prisma.permission.upsert({
        where: { name: p.name },
        update: { description: p.description, module: p.module },
        create: {
          name: p.name,
          description: p.description,
          module: p.module
        }
      });
      permissions[p.name] = perm;
      console.log(`✅ Permission ready: ${perm.name}`);
    }

    // 3. Map Permissions to Roles
    console.log('\n🔗 Mapping Permissions to Roles...');
    const roleMappings = {
      admin: Object.keys(permissions),
      staff: ['view_users', 'manage_products', 'view_products', 'manage_orders', 'view_orders', 'support_tickets'],
      supplier: ['view_products', 'manage_inventory', 'view_orders'],
      retailer: ['view_products', 'create_order', 'view_orders'],
      customer: ['view_products', 'create_order', 'view_orders']
    };

    for (const [roleName, permNames] of Object.entries(roleMappings)) {
      const roleObj = roles[roleName];
      if (roleObj) {
        for (const pName of permNames) {
          const permObj = permissions[pName];
          if (permObj) {
            await prisma.rolePermissionMap.upsert({
              where: {
                roleId_permissionId: {
                  roleId: roleObj.id,
                  permissionId: permObj.id
                }
              },
              update: {},
              create: {
                roleId: roleObj.id,
                permissionId: permObj.id
              }
            });
          }
        }
      }
    }
    console.log('✅ Role-Permission mappings seeded successfully');

    console.log('\n✨ Role and permission configuration seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
