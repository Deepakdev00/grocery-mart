const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Create admin user
    console.log('📝 Creating admin user...');
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
    console.log('✅ Admin created:', admin.email);

    // Create test users
    console.log('\n📝 Creating test users...');
    const testUsers = [
      { username: 'user1', email: 'user1@example.com', password: 'pass123' },
      { username: 'user2', email: 'user2@example.com', password: 'pass123' },
      { username: 'user3', email: 'user3@example.com', password: 'pass123' },
      { username: 'user4', email: 'user4@example.com', password: 'pass123' },
      { username: 'user5', email: 'user5@example.com', password: 'pass123' }
    ];

    const users = [];
    for (const testUser of testUsers) {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      const user = await prisma.user.upsert({
        where: { email: testUser.email },
        update: {},
        create: {
          username: testUser.username,
          email: testUser.email,
          password: hashedPassword
        }
      });
      users.push(user);
      console.log(`✅ User created: ${user.username}`);
    }

    // Create test orders with past dates
    console.log('\n📝 Creating test orders...');
    const products = [
      { name: 'Tomatoes', weight: '1kg', price: 40 },
      { name: 'Onions', weight: '2kg', price: 60 },
      { name: 'Potatoes', weight: '5kg', price: 80 },
      { name: 'Carrots', weight: '500g', price: 30 },
      { name: 'Cabbage', weight: '1kg', price: 25 }
    ];

    for (let i = 0; i < 15; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const itemsCount = Math.floor(Math.random() * 3) + 1;
      const items = [];

      for (let j = 0; j < itemsCount; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        items.push({
          ...product,
          qty: Math.floor(Math.random() * 3) + 1,
          productId: `prod_${i}_${j}`
        });
      }

      const itemTotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const deliveryFee = itemTotal > 100 ? 0 : 25;
      const handlingFee = 2;
      const grandTotal = itemTotal + deliveryFee + handlingFee;

      // Create order with past date
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));

      const payment = await prisma.payment.create({
        data: {
          userId: user.id,
          itemTotal,
          deliveryFee,
          handlingFee,
          grandTotal,
          paymentMethod: ['upi', 'card', 'cod'][Math.floor(Math.random() * 3)],
          status: ['completed', 'pending', 'processing'][Math.floor(Math.random() * 3)],
          deliveryAddress: `${user.username}'s Address, Mumbai, MH 400001`,
          createdAt: orderDate,
          items: {
            create: items.map((item, idx) => ({
              productId: item.productId,
              name: item.name,
              weight: item.weight,
              price: item.price,
              qty: item.qty
            }))
          }
        },
        include: { items: true }
      });

      console.log(`✅ Order created for ${user.username}: ₹${grandTotal}`);
    }

    console.log('\n✨ Database seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`   Admin Users: 1`);
    console.log(`   Regular Users: ${users.length}`);
    console.log(`   Orders: 15`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();
