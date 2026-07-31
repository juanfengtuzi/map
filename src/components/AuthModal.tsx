import { useState } from 'react';
import { Modal, Input, Button } from 'animal-island-ui';

interface AuthModalProps {
  open: boolean;
  onSetToken: (token: string) => void;
  onClose: () => void;
}

export default function AuthModal({ open, onSetToken, onClose }: AuthModalProps) {
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
      title="输入 GitHub Token"
      onClose={handleClose}
      onOk={handleOk}
      footer={
        <>
          <Button onClick={handleClose}>取消</Button>
          <Button type="primary" onClick={handleOk}>确认</Button>
        </>
      }
    >
      <p style={{ marginBottom: 12, color: '#725d42' }}>
        请输入 GitHub Personal Access Token 来管理旅行数据。
        Token 只存储在本地浏览器中。
      </p>
      <Input
        placeholder="ghp_xxxxxxxxxxxx"
        value={value}
        onChange={e => setValue((e.target as HTMLInputElement).value)}
        allowClear
        shadow
      />
    </Modal>
  );
}
