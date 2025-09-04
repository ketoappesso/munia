import { TosClient, TosClientError } from '@volcengine/tos-sdk';
import fs from 'fs/promises';
import path from 'path';

const customTOSDomain = 'https://assets.xyuan.chat';
// 确保配置参数都是字符串类型
const configs = {
  accessKeyId: String(process.env.VOLCENGINE_TOS_ACCESS_KEY || ''),
  accessKeySecret: String(process.env.VOLCENGINE_TOS_ACCESS_SECRET || ''),
  region: 'cn-guangzhou',
};

const tosClient = new TosClient({
  ...configs,
});

async function uploadAudio(tempFilePath: string): Promise<string> {
  // 强制转换为字符串并清理路径
  const cleanFilePath = String(tempFilePath).trim();
  const bucket = 'xiaoyuan-chat';
  // 生成当前日期的路径 (YYYY-MM-DD格式)
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;

  const fileName = path.basename(cleanFilePath).replace(/[^a-zA-Z0-9_\-.]/g, '_');
  const key = `audios/${dateStr}/${fileName}`;
  try {
    // 1. 验证文件存在性
    try {
      await fs.access(cleanFilePath);
    } catch {
      throw new Error(`文件不存在: ${cleanFilePath}`);
    }

    // 2. 读取文件内容
    const body = await fs.readFile(tempFilePath);
    const input = {
      bucket,
      key,
      body,
    };
    const uploadResult = await tosClient.putObject(input);

    // 6. 清理临时文件
    await fs.unlink(cleanFilePath);

    // 7. 构建URL - 使用自定义域名
    let fileUrl: string;
    if (uploadResult && typeof uploadResult === 'object') {
      // 手动构建URL - 使用自定义域名
      fileUrl = `${customTOSDomain}/${key}`;
    }
    return fileUrl!;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('\n===== [TOS] 上传错误 =====');
    // eslint-disable-next-line no-console
    console.error('[TOS] 错误类型:', (err as Error).constructor.name);
    // eslint-disable-next-line no-console
    console.error('[TOS] 错误消息:', (err as Error).message);
    // eslint-disable-next-line no-console
    console.error('[TOS] 错误堆栈:', (err as Error).stack);

    if (err instanceof TosClientError) {
      // eslint-disable-next-line no-console
      console.error('[TOS] SDK错误详情:', {
        message: err.message,
      });
    }

    // 清理临时文件
    try {
      await fs.access(cleanFilePath);
      await fs.unlink(cleanFilePath);
    } catch (unlinkErr) {
      // eslint-disable-next-line no-console
      console.warn('[TOS] 错误处理: 清理临时文件失败:', (unlinkErr as Error).message);
    }

    throw new Error(`[TOS] 上传失败: ${(err as Error).message}`);
  }
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
async function uploadUserAvatar(userId: string, file: any): Promise<string> {
  const bucket = 'xiaoyuan-chat';

  try {
    // 1. 获取文件扩展名
    let fileExt = '.jpg'; // 默认扩展名
    if (file.originalname) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        fileExt = ext;
      }
    } else if (file.mimetype) {
      // 根据 MIME 类型判断扩展名
      const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
      };
      fileExt = mimeToExt[file.mimetype as keyof typeof mimeToExt] || '.jpg';
    }

    // 2. 构建文件名和对象键
    const filename = `${userId}${fileExt}`;
    const key = `avatars/${filename}`;

    // 3. 尝试删除旧头像（遍历常见图片格式）
    const commonExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const deletePromises = commonExts.map(async (ext) => {
      const oldKey = `avatars/${userId}${ext}`;
      try {
        // 检查对象是否存在
        await tosClient.headObject({
          bucket,
          key: oldKey,
        });
        // 如果存在则删除
        await tosClient.deleteObject({
          bucket,
          key: oldKey,
        });
        // eslint-disable-next-line no-console
        console.log(`[TOS] 已删除旧头像: ${oldKey}`);
        return { success: true, key: oldKey };
      } catch (err) {
        // 对象不存在，忽略错误
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        if ((err as any).statusCode !== 404) {
          // eslint-disable-next-line no-console
          console.warn(`[TOS] 删除旧头像失败: ${oldKey}`, (err as Error).message);
        }
        return { success: false, key: oldKey, error: (err as Error).message };
      }
    });

    // 并行执行所有删除操作
    await Promise.allSettled(deletePromises);

    // 4. 上传新头像
    const uploadInput = {
      bucket,
      key,
      body: file.buffer, // Multer 内存存储的文件数据
      contentType: file.mimetype || 'image/jpeg',
    };

    const uploadResult = await tosClient.putObject(uploadInput);

    // 5. 构建返回的URL - 使用自定义域名
    let avatarUrl;
    if (uploadResult && typeof uploadResult === 'object') {
      // 手动构建URL - 使用自定义域名
      avatarUrl = `${customTOSDomain}/${key}`;
    }

    if (!avatarUrl) {
      // 如果还是没有URL，使用自定义域名
      avatarUrl = `${customTOSDomain}/${key}`;
    }

    // eslint-disable-next-line no-console
    console.log(`[TOS] 头像上传成功: ${avatarUrl}`);
    return avatarUrl;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('\n===== [TOS] 头像上传错误 =====');
    // eslint-disable-next-line no-console
    console.error('[TOS] 错误类型:', (err as Error).constructor.name);
    // eslint-disable-next-line no-console
    console.error('[TOS] 错误消息:', (err as Error).message);
    // eslint-disable-next-line no-console
    console.error('[TOS] 错误堆栈:', (err as Error).stack);

    if (err instanceof TosClientError) {
      // eslint-disable-next-line no-console
      console.error('[TOS] SDK错误详情:', {
        message: err.message,
      });
    }

    throw new Error(`[TOS] 头像上传失败: ${(err as Error).message}`);
  }
}

export { tosClient, uploadAudio, uploadUserAvatar };
