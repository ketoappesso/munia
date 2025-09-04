import axios from 'axios';
import crypto from 'node:crypto';
import { Transform } from 'stream';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';

class TtsAudioParser extends Transform {
  private residualData: string = '';

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  constructor(options?: any) {
    super({ ...options, readableObjectMode: false, writableObjectMode: false });
  }

  // eslint-disable-next-line
  _transform(chunk: any, encoding: BufferEncoding, callback: Function) {
    try {
      const chunkStr = this.residualData + chunk.toString('utf-8');
      const lines = chunkStr.split('\n');
      this.residualData = lines.pop() || '';

      // eslint-disable-next-line no-restricted-syntax
      for (const line of lines) {
        // eslint-disable-next-line no-continue
        if (!line.trim()) continue;

        const data = JSON.parse(line);
        if (data.code === 0 && data.data) {
          const audioBuffer = Buffer.from(data.data, 'base64');
          this.push(audioBuffer); // 推送到文件写入流
        } else if (data.code === 20000000) {
          this.push(null); // 结束流
          break;
        } else if (data.code > 0) {
          // eslint-disable-next-line no-console
          console.error('[TTS] Server error:', data);
          this.emit('error', new Error(`[TTS] 服务端错误: ${data.message || '未知错误'}（code: ${data.code}）`));
          break;
        }
      }
      callback();
    } catch (err) {
      this.emit('error', new Error(`[TTS] 解析错误: ${(err as Error).message}`));
      callback(err);
    }
  }

  // eslint-disable-next-line  @typescript-eslint/ban-types
  _flush(callback: Function) {
    if (this.residualData.trim()) {
      // eslint-disable-next-line no-console
      console.warn(`[TTS] 剩余未解析数据: ${this.residualData}`);
    }
    callback();
  }
}

async function generateTtsAudio(text: string, speaker: string): Promise<string> {
  const tempFileName = `${crypto.randomBytes(16).toString('hex')}.mp3`;
  const tempFilePath = path.join('/tmp', tempFileName); // /tmp/目录下的临时文件

  const fileWriteStream = fs.createWriteStream(tempFilePath, { flags: 'w' });
  const headers = {
    'X-Api-App-Id': process.env.VOLCENGINE_TTS_APP_ID,
    'X-Api-Access-Key': process.env.VOLCENGINE_TTS_ACCESS_TOKEN,
    'X-Api-Resource-Id': 'volc.megatts.default',
    'Content-Type': 'application/json',
    Connection: 'keep-alive',
  };

  const payload = {
    user: { uid: crypto.randomBytes(16).toString('hex') },
    req_params: {
      text,
      speaker,
      audio_params: {
        format: 'mp3',
        sample_rate: 24000,
        enable_timestamp: true,
        loudness_rate: 150,
      }, // 明确MP3格式
      additions: JSON.stringify({
        explicit_language: 'zh',
        disable_markdown_filter: true,
        enable_timestamp: true,
      }),
    },
  };

  const url = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional';

  return new Promise((resolve, reject) => {
    // 3. 发起TTS流式请求
    axios
      .post(url, payload, { headers, responseType: 'stream', timeout: 60000 })
      .then((response) => {
        const audioParser = new TtsAudioParser();
        response.data.pipe(audioParser).pipe(fileWriteStream);

        fileWriteStream.on('finish', () => {
          resolve(tempFilePath); // 返回临时文件路径，用于后续上传
        });

        // 6. 错误处理（任何环节出错都清理临时文件）
        const handleError = (errMsg: string) => {
          fileWriteStream.destroy(); // 终止文件写入
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath); // 清理未完成的临时文件
          }
          reject(new Error(errMsg));
        };

        audioParser.once('error', (err: Error) => handleError(`[TTS] 解析错误: ${err.message}`));
        response.data.once('error', (err: Error) => handleError(`[TTS] 请求流错误: ${err.message}`));
        fileWriteStream.once('error', (err: Error) => handleError(`[TTS] 文件写入错误: ${err.message}`));
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[TTS] Request failed:', err.message);
        // eslint-disable-next-line no-console
        console.error('[TTS] Request error details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
        });
        fileWriteStream.destroy(); // 终止文件写入
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath); // 清理未完成的临时文件
        }
        reject(new Error(`[TTS] 请求初始化失败: ${(err as Error).message}`));
      });
  });
}

export { generateTtsAudio };
