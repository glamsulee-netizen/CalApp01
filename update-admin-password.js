const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function updateAdminPassword() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    
    // Новый сложный пароль
    const newPassword = 'Admin@Secure#2026!';
    const hash = await bcrypt.hash(newPassword, 12); // Используем 12 раундов для большей безопасности
    
    console.log('Generated hash for new password');
    console.log('New password:', newPassword);
    console.log('Hash:', hash);
    
    // Обновляем пароль администратора
    const result = await prisma.user.update({
      where: { id: 1 }, // ID администратора
      data: { password: hash }
    });
    
    console.log('\nPassword updated successfully!');
    console.log('User:', result.email);
    console.log('Role:', result.role);
    
    // Проверяем обновление
    const user = await prisma.user.findUnique({
      where: { id: 1 },
      select: { email: true, password: true }
    });
    
    const match = await bcrypt.compare(newPassword, user.password);
    console.log('\nVerification:', match ? 'SUCCESS - Password works correctly' : 'FAILED');
    
    if (match) {
      console.log('\n=== Учетные данные администратора ===');
      console.log('Email: yuriooo@ya.ru');
      console.log('Password: Admin@Secure#2026!');
      console.log('====================================');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();