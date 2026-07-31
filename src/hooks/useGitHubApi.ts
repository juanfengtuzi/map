import { useCallback } from 'react';
import type { TravelsData } from '../types';
import { GITHUB_RAW_URL, GITHUB_API_URL } from '../constants';

export function useGitHubApi(token: string | null) {

  const fetchData = useCallback(async (): Promise<TravelsData> => {
    const response = await fetch(GITHUB_RAW_URL, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`获取数据失败: ${response.status}`);
    }
    return response.json();
  }, []);

  const saveData = useCallback(async (data: TravelsData): Promise<void> => {
    if (!token) {
      throw new Error('未设置 GitHub Token');
    }

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
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

  return { fetchData, saveData };
}
