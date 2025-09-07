import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

const prisma = new PrismaClient();

async function createAIUser() {
  const aiUserId = 'ai-user-001';
  const aiUsername = 'xiaoyuan_ai';
  
  try {
    // Check if AI user already exists
    const existingAiUser = await prisma.user.findUnique({
      where: { id: aiUserId }
    });
    
    if (existingAiUser) {
      console.log('AI user already exists:', existingAiUser);
      return existingAiUser;
    }

    // Create AI user
    const aiUser = await prisma.user.create({
      data: {
        id: aiUserId,
        username: aiUsername,
        name: '小猿AI',
        email: 'ai@munia.app',
        bio: '你的AI智能助手，随时为你答疑解惑，帮助你完成各种任务。',
        profilePhoto: 'ai-avatar.png', // You'll need to add this image
        gender: 'NONBINARY',
        apeBalance: 999999999, // Give AI unlimited balance
      }
    });
    
    console.log('Created AI user:', aiUser);
    return aiUser;
    
  } catch (error) {
    console.error('Error creating AI user:', error);
    throw error;
  }
}

async function main() {
  console.log('Creating AI user...');
  await createAIUser();
  console.log('AI user created successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });