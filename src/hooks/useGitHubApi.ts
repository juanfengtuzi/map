import { useCallback } from 'react';
import type { TravelsData } from '../types';
import { GITHUB_API_URL } from '../constants';
import { v4 as uuidv4 } from 'uuid';

const PHOTOS_API_URL = 'https://api.github.com/repos/juanfengtuzi/map/contents/data/photos';
const PHOTOS_RAW_BASE = 'https://raw.githubusercontent.com/juanfengtuzi/map/main/data/photos';

export function useGitHubApi(token: string | null) {

  // Contents API 读取并解码（正确处理 UTF-8），认证或公开均可
  const readContentsApi = useCallback(async (authToken: string | null): Promise<TravelsData> => {
    const headers: Record<string, string> = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    const apiRes = await fetch(GITHUB_API_URL, { headers, cache: 'reload' });
    if (!apiRes.ok) {
      throw new Error(`读取文件失败: ${apiRes.status}`);
    }
    const fileInfo = await apiRes.json();
    const binary = atob(fileInfo.content);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  }, []);

  const fetchData = useCallback(async (): Promise<TravelsData> => {
    // 1) 有 token：认证 API（始终最新）
    if (token) {
      try {
        return await readContentsApi(token);
      } catch (e) {
        console.error('认证 API 读取失败，尝试公开 API:', e);
      }
    }
    // 2) 无 token：公开仓库免认证 API（始终最新，无 CDN 延迟）
    try {
      return await readContentsApi(null);
    } catch (e) {
      console.error('公开 API 读取失败:', e);
    }
    throw new Error('无法读取旅行数据');
  }, [token, readContentsApi]);

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
          cache: 'reload',
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
