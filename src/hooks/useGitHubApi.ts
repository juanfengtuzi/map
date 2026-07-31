import { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import type { TravelsData } from '../types';
import { GITHUB_RAW_URL, GITHUB_API_URL } from '../constants';
import { v4 as uuidv4 } from 'uuid';

const PHOTOS_API_URL = 'https://api.github.com/repos/juanfengtuzi/map/contents/data/photos';
const PHOTOS_RAW_BASE = 'https://raw.githubusercontent.com/juanfengtuzi/map/main/data/photos';

export function useGitHubApi(token: string | null) {

  const fetchData = useCallback(async (): Promise<TravelsData> => {
    // 加时间戳绕过 GitHub CDN 缓存
    const url = `${GITHUB_RAW_URL}?t=${Date.now()}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`获取数据失败: ${response.status}`);
    }
    return response.json();
  }, []);

  const saveData = useCallback(async (data: TravelsData, gen?: number, genRef?: MutableRefObject<number>): Promise<void> => {
    if (!token) {
      throw new Error('未设置 GitHub Token');
    }

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

    // Helper: check if this save is still the latest; abort if a newer save superseded it
    const isLatest = () => !genRef || !gen || genRef.current <= gen;

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      // Before each attempt, verify we are still the latest write request
      if (!isLatest()) return;

      try {
        // 先获取当前文件的 sha
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

        if (putResponse.ok) return; // Success

        if (putResponse.status === 409) {
          // Re-check before retry: if superseded, don't overwrite newer data
          if (!isLatest()) return;
          lastError = new Error('冲突，正在重试...');
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
    throw lastError || new Error('保存失败，请重试');
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
