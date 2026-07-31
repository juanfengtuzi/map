import { useState } from 'react';
import { Modal, Input, Button, Card } from 'animal-island-ui';

interface AuthModalProps {
  open: boolean;
  token: string | null;
  onSetToken: (token: string) => void;
  onClearToken: () => void;
  onClose: () => void;
}

export default function AuthModal({ open, token, onSetToken, onClearToken, onClose }: AuthModalProps) {
  const [value, setValue] = useState('');

  function handleOk() {
    const trimmed = value.trim();
    if (trimmed) {
      onSetToken(trimmed);
      setValue('');
    }
  }

  function handleClose() {
    setValue('');
    onClose();
  }

  return (
    <Modal
      open={open}
      title="管理设置"
      onClose={handleClose}
      footer={token ? (
        <>
          <Button onClick={handleClose}>关闭</Button>
        </>
      ) : (
        <>
          <Button onClick={handleClose}>取消</Button>
          <Button type="primary" onClick={handleOk}>确认</Button>
        </>
      )}
    >
      {token ? (
        <div>
          <Card color="app-teal">
            <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>
              已认证
            </p>
            <p style={{ color: '#fff', fontSize: 12, marginTop: 4, opacity: 0.85 }}>
              Token 已存储在本地浏览器中
            </p>
            <p style={{
              color: '#fff', fontSize: 12, marginTop: 8,
              fontFamily: 'monospace', background: 'rgba(0,0,0,0.15)',
              padding: '4px 8px', borderRadius: 6, wordBreak: 'break-all',
            }}>
              {token.slice(0, 6)}...{token.slice(-4)}
            </p>
          </Card>
          <div style={{ marginTop: 16 }}>
            <p style={{ color: '#725d42', fontSize: 13, marginBottom: 12 }}>
              如需更换 Token，请输入新的：
            </p>
            <Input
              placeholder="ghp_xxxxxxxxxxxx"
              value={value}
              onChange={e => setValue((e.target as HTMLInputElement).value)}
              allowClear
              shadow
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Button type="primary" size="small" onClick={handleOk} disabled={!value.trim()}>更换</Button>
              <Button type="text" size="small" danger onClick={onClearToken}>清除 Token</Button>
            </div>
            <div style={{
              marginTop: 16, padding: '10px 12px',
              background: 'rgb(247, 243, 223)', borderRadius: 12,
              fontSize: 12, color: '#9f927d',
            }}>
              请务必将 Token 保存在安全的地方（如密码管理器）。浏览器清除数据后需要重新输入。
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ marginBottom: 12, color: '#725d42', fontSize: 14 }}>
            GitHub Token 用于保存旅行数据到仓库。
          </p>
          <Input
            placeholder="ghp_xxxxxxxxxxxx"
            value={value}
            onChange={e => setValue((e.target as HTMLInputElement).value)}
            allowClear
            shadow
          />
          <div style={{
            marginTop: 16, padding: '10px 12px',
            background: 'rgb(247, 243, 223)', borderRadius: 12,
            fontSize: 12, color: '#9f927d', lineHeight: 1.6,
          }}>
            创建 Token：GitHub Settings → Developer settings → Personal access tokens → 勾选 <strong style={{ color: '#725d42' }}>repo</strong> 权限。
            Token 只存本地浏览器，不会上传到任何服务器。
          </div>
        </div>
      )}
    </Modal>
  );
}
