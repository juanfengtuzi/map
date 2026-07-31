import { useCallback } from 'react';
import type { TravelsData } from '../types';
import { GITHUB_RAW_URL, GITHUB_API_URL } from '../constants';
import { v4 as uuidv4 } from 'uuid';

const PHOTOS_API_URL = 'https://api.github.com/repos/juanfengtuzi/map/contents/data/photos';
const PHOTOS_RAW_BASE = 'https://raw.githubusercontent.com/juanfengtuzi/map/main/data/photos';

export function useGitHubApi(token: string | null) {

  const fetchData = useCallback(async (): Promise<TravelsData> => {
    // 有 token 时走 API（永远最新，不受 CDN 影响）
    if (token) {
      try {
        const apiRes = await fetch(GITHUB_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (apiRes.ok) {
          const fileInfo = await apiRes.json();
          // Content API 返回 base64 编码的内容
          const decoded = atob(fileInfo.content);
          return JSON.parse(decoded);
        }
      } catch { /* fall through to raw URL */ }
    }
    // 无 token 时走 raw URL
    const url = `${GITHUB_RAW_URL}?t=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`获取数据失败: ${response.status}`);
    }
    return response.json();
  }, [token]);

  const saveData = useCallback(async (data: TravelsData): Promise<void> => {
    if (!token) {
      throw new Error('未设置 GitHub Token');
    }

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // 获取当前文件的 sha
        const getResponse = await fetch(GITHUB_API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!getResponse.ok) {
          if (getResponse.status === 401) {
            throw new Error('Token 无效，请重新输入');
          }
          throw new Error(`获取文件信息失败: ${getResponse.status}`);
        }
        const fileInfo = await getResponse.json();
        const sha: string = fileInfo.sha;

        // PUT 更新文件
        const putResponse = await fetch(GITHUB_API_URL, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: '更新旅行数据',
            content,
            sha,
            branch: 'main',
          }),
        });

        if (putResponse.ok) return; // 成功

        if (putResponse.status === 409) {
          // SHA 冲突，重试
          continue;
        }

        if (putResponse.status === 401) {
          throw new Error('Token 无效，请重新输入');
        }

        const err = await putResponse.json();
        throw new Error(`保存失败: ${err.message}`);
      } catch (e) {
        if (e instanceof Error && e.message.includes('冲突')) continue;
        throw e;
      }
    }
    throw new Error('保存失败，请重试');
  }, [token]);

  const uploadPhoto = useCallback(async (dataUrl: string): Promise<string> => {
    if (!token) throw new Error('未设置 GitHub Token');

    // base64 data URL → raw base64
    const base64 = dataUrl.split(',')[1];
    if (!base64) throw new Error('无效的图片数据');
    if (base64.length > 700 * 1024) throw new Error('图片过大，请压缩后再上传');

    const filename = `${uuidv4()}.jpg`;
    const apiPath = `${PHOTOS_API_URL}/${filename}`;

    const putResponse = await fetch(apiPath, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `上传照片 ${filename}`,
        content: base64,
        branch: 'main',
      }),
    });

    if (!putResponse.ok) {
      if (putResponse.status === 401) throw new Error('Token 无效，请重新输入');
      const err = await putResponse.json().catch(() => ({}));
      throw new Error(`上传照片失败: ${(err as any).message || putResponse.status}`);
    }

    return `${PHOTOS_RAW_BASE}/${filename}`;
  }, [token]);

  return { fetchData, saveData, uploadPhoto };
}
