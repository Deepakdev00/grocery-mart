const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Starting comprehensive auth database seeding...\n');

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

    // 4. Create Admin Account
    console.log('\n📝 Creating Admin User...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.admin.upsert({
      where: { email: 'admin@grocerymart.com' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@grocerymart.com',
        password: adminPassword,
        role: 'admin'
      }
    });
    console.log('✅ Admin account ready: admin@grocerymart.com (pass: admin123)');

    // 5. Create Test Users with Various Roles (Submodules 1, 2, 3, 8)
    console.log('\n👥 Creating Users across Roles...');
    const testAccounts = [
      { username: 'customer_rahul', email: 'rahul@example.com', password: 'pass123', role: 'customer', status: 'active' },
      { username: 'staff_priya', email: 'staff@grocerymart.com', password: 'pass123', role: 'staff', status: 'active' },
      { username: 'supplier_freshfarms', email: 'supplier@grocerymart.com', password: 'pass123', role: 'supplier', status: 'active' },
      { username: 'retailer_supermart', email: 'retailer@grocerymart.com', password: 'pass123', role: 'retailer', status: 'active' },
      { username: 'suspended_user', email: 'suspended@example.com', password: 'pass123', role: 'customer', status: 'suspended' },
      { username: 'user1', email: 'user1@example.com', password: 'pass123', role: 'customer', status: 'active' }
    ];

    const users = [];
    for (const acc of testAccounts) {
      const hashedPassword = await bcrypt.hash(acc.password, 10);
      const user = await prisma.user.upsert({
        where: { email: acc.email },
        update: { role: acc.role, status: acc.status },
        create: {
          username: acc.username,
          email: acc.email,
          password: hashedPassword,
          role: acc.role,
          status: acc.status
        }
      });
      users.push(user);
      console.log(`✅ User: ${user.username} [Role: ${user.role}, Status: ${user.status}]`);
    }

    // 6. Seed Sample Activity & Login Logs (Submodule 7)
    console.log('\n📜 Creating Audit Logs...');
    const sampleUser = users[0];
    if (sampleUser) {
      await prisma.loginLog.create({
        data: {
          userId: sampleUser.id,
          email: sampleUser.email,
          action: 'login_success',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      await prisma.activityLog.create({
        data: {
          userId: sampleUser.id,
          action: 'user_created',
          details: 'Account registered with role: customer',
          ipAddress: '127.0.0.1'
        }
      });
    }

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📋 Demo Test Credentials:');
    console.log('   👑 Admin:    admin@grocerymart.com   / admin123');
    console.log('   👨‍💼 Staff:    staff@grocerymart.com   / pass123');
    console.log('   🚜 Supplier: supplier@grocerymart.com/ pass123');
    console.log('   🏬 Retailer: retailer@grocerymart.com/ pass123');
    console.log('   🛒 Customer: rahul@example.com       / pass123');
    console.log('   🚫 Suspended:suspended@example.com   / pass123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
