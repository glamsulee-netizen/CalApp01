const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function updatePassword() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Generated hash:', hash);
    
    const result = await prisma.user.update({
      where: { id: 1 },
      data: { password: hash }
    });
    
    console.log('Password updated successfully for user:', result.email);
    
    // Verify the update
    const user = await prisma.user.findUnique({
      where: { id: 1 },
      select: { email: true, password: true }
    });
    
    console.log('Stored hash:', user.password);
    
    const match = await bcrypt.compare(password, user.password);
    console.log('Password verification:', match ? 'SUCCESS' : 'FAILED');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();