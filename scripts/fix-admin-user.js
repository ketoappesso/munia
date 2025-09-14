const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAdminUser() {
  const adminPhone = '18874748888';
  const defaultPassword = '123456'; // 默认密码

  try {
    // 查找管理员用户
    let adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: adminPhone },
          { username: adminPhone }
        ]
      }
    });

    if (!adminUser) {
      console.log('管理员用户不存在，正在创建...');

      // 创建管理员用户
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      adminUser = await prisma.user.create({
        data: {
          phoneNumber: adminPhone,
          username: adminPhone,
          passwordHash: passwordHash,
          name: '管理员',
          email: 'admin@appesso.com',
          punked: true,
          ttsRemainingTrainings: 999,
        }
      });

      console.log('✅ 管理员用户创建成功！');
      console.log('手机号：', adminPhone);
      console.log('密码：', defaultPassword);
    } else {
      console.log('管理员用户已存在，正在重置密码...');

      // 重置密码
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          passwordHash: passwordHash,
          phoneNumber: adminPhone,
          username: adminPhone,
        }
      });

      console.log('✅ 密码已重置成功！');
      console.log('手机号：', adminPhone);
      console.log('新密码：', defaultPassword);
    }

    console.log('\n用户信息：');
    console.log('- ID:', adminUser.id);
    console.log('- 手机号:', adminPhone);
    console.log('- 用户名:', adminPhone);
    console.log('- 姓名:', adminUser.name || '管理员');

  } catch (error) {
    console.error('❌ 错误：', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminUser();