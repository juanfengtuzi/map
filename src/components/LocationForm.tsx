import { useCallback, useState, useRef, useEffect } from 'react';
import { Drawer, Form, FormItem, Input, Button, useForm, Notification } from 'animal-island-ui';
import type { Trip, Location, TripColor } from '../types';
import { TRIP_COLOR_HEX, TRIP_COLORS } from '../constants';

interface LocationFormProps {
  open: boolean;
  trips: Trip[];
  editingLocation: Location | null;
  onSubmit: (tripId: string, location: Omit<Location, 'id'>) => void;
  onSubmitWithNewTrip: (trip: { name: string; date: string; color: TripColor }, location: Omit<Location, 'id'>) => void;
  onUploadPhoto: (dataUrl: string) => Promise<string>;
  onClose: () => void;
}

interface LocationFormValues {
  tripId: string;
  city: string;
  date: string;
  description: string;
  lat: string;
  lng: string;
  tags: string[];
  tripName: string;
  tripDate: string;
  tripColor: TripColor;
}

const PRESET_TAGS = ['自然风光', '美食', '城市漫步', '历史文化', '海边', '山野'];

export default function LocationForm({ open, trips, editingLocation, onSubmit, onSubmitWithNewTrip, onUploadPhoto, onClose }: LocationFormProps) {
  const [form] = useForm<LocationFormValues>();
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = editingLocation !== null;

  // 编辑模式时预填
  useEffect(() => {
    if (open && editingLocation) {
      form.setFieldsValue({
        city: editingLocation.city,
        date: editingLocation.date,
        description: editingLocation.description,
        lat: editingLocation.lat.toString(),
        lng: editingLocation.lng.toString(),
        tags: editingLocation.tags,
        tripId: trips.find(t => t.locations.some(l => l.id === editingLocation.id))?.id || '__new__',
        tripName: '',
        tripDate: '',
        tripColor: 'app-pink',
      });
      setPhotoPreview(editingLocation.photo || '');
      setPhotoDataUrl('');
      setPhotoRemoved(false);
      setCustomTags([]);
    }
  }, [open, editingLocation, trips, form]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      Notification.warning({ message: '图片太大', description: '请选择小于 10MB 的图片' });
      e.target.value = '';
      return;
    }

    // Canvas 压缩：最大宽度 1200px，JPEG 质量 0.7
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const maxW = 1200;
        let w = img.width, h = img.height;
        if (w > maxW) { h = h * (maxW / w); w = maxW; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        let compressed = canvas.toDataURL('image/jpeg', 0.7);
        // 压缩后仍超过 500KB → 再降质量
        if (compressed.length > 500 * 1024) {
          compressed = canvas.toDataURL('image/jpeg', 0.4);
        }
        setPhotoPreview(compressed);
        setPhotoDataUrl(compressed);
        setPhotoRemoved(false);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  function handleTagClick(tag: string) {
    const current = (form.getFieldValue('tags') as string[]) || [];
    const next = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
    form.setFieldValue('tags', next);
  }

  function handleAddCustomTag() {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (customTags.includes(trimmed) || PRESET_TAGS.includes(trimmed)) {
      handleTagClick(trimmed);
      setTagInput('');
      return;
    }
    setCustomTags(prev => [...prev, trimmed]);
    handleTagClick(trimmed);
    setTagInput('');
  }

  const handleFinish = useCallback(async (values: LocationFormValues) => {
    setSubmitting(true);
    try {
      const lat = parseFloat(values.lat);
      const lng = parseFloat(values.lng);
      if (isNaN(lat) || isNaN(lng)) {
        Notification.warning({ message: '坐标无效', description: '请输入有效的经纬度数字' });
        setSubmitting(false);
        return;
      }
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        Notification.warning({ message: '坐标超出范围', description: '纬度 -90~90，经度 -180~180' });
        setSubmitting(false);
        return;
      }

      // 上传照片到 GitHub
      let photoUrl = '';
      if (!photoRemoved && editingLocation?.photo && !photoDataUrl) {
        photoUrl = editingLocation.photo;
      } else if (photoDataUrl && !photoRemoved) {
        try {
          photoUrl = await onUploadPhoto(photoDataUrl);
        } catch (e) {
          Notification.error({ message: '照片上传失败', description: e instanceof Error ? e.message : '请重试' });
          setSubmitting(false);
          return;
        }
      }

      const location: Omit<Location, 'id'> = {
        city: String(values.city),
        date: String(values.date),
        description: String(values.description),
        lat,
        lng,
        tags: (values.tags as string[]) || [],
        photo: photoUrl,
      };

      if (values.tripId === '__new__') {
        await onSubmitWithNewTrip({
          name: String(values.tripName),
          date: String(values.tripDate),
          color: values.tripColor as TripColor,
        }, location);
      } else {
        await onSubmit(String(values.tripId), location);
      }

      form.resetFields();
      setShowNewTrip(false);
      setPhotoPreview('');
      setPhotoDataUrl('');
      setPhotoRemoved(false);
      setCustomTags([]);
      setTagInput('');
      onClose();
    } catch (e) {
      Notification.error({ message: '保存失败', description: e instanceof Error ? e.message : '未知错误' });
    } finally {
      setSubmitting(false);
    }
  }, [onSubmit, onSubmitWithNewTrip, onUploadPhoto, form, onClose, editingLocation, photoDataUrl, photoRemoved]);

  const currentTripId = (form.getFieldValue('tripId') as string) || '';
  const currentTags = (form.getFieldValue('tags') as string[]) || [];
  const currentColor = (form.getFieldValue('tripColor') as string) || 'app-pink';
  const allTags = [...new Set([...PRESET_TAGS, ...customTags])];
  const showPhotoPreview = !photoRemoved && (photoPreview || editingLocation?.photo);

  return (
    <Drawer
      key={editingLocation?.id || 'new'}
      open={open}
      title={isEditing ? `编辑 - ${editingLocation?.city}` : '新增旅行记忆'}
      placement="right"
      width={400}
      onClose={() => {
        form.resetFields();
        setShowNewTrip(false);
        setPhotoPreview('');
        setPhotoDataUrl('');
        setPhotoRemoved(false);
        setCustomTags([]);
        setTagInput('');
        onClose();
      }}
    >
      <Form
        form={form as any}
        initialValues={{
          tripId: editingLocation ? trips.find(t => t.locations.some(l => l.id === editingLocation.id))?.id || '__new__' : (trips[0]?.id ?? '__new__'),
          city: '',
          date: '',
          description: '',
          lat: '',
          lng: '',
          tags: [],
          tripName: '',
          tripDate: '',
          tripColor: 'app-pink',
        }}
        layout="vertical"
        onFinish={handleFinish as any}
      >

        {/* ====== 所属旅行 ====== */}
        <FormItem label="所属旅行" name="tripId" rules={[{ required: true, message: '请选择' }]}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {trips.map(trip => (
              <span key={trip.id}
                onClick={() => { form.setFieldValue('tripId', trip.id); setShowNewTrip(false); }}
                style={{
                  padding: '6px 14px', borderRadius: 18, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s ease',
                  background: currentTripId === trip.id ? TRIP_COLOR_HEX[trip.color] : 'transparent',
                  color: currentTripId === trip.id ? '#fff' : '#725d42',
                  border: `2px solid ${TRIP_COLOR_HEX[trip.color]}`,
                  boxShadow: currentTripId === trip.id ? `0 2px 10px ${TRIP_COLOR_HEX[trip.color]}50` : 'none',
                }}
              >{trip.name}</span>
            ))}
            <span
              onClick={() => { form.setFieldValue('tripId', '__new__'); setShowNewTrip(true); }}
              style={{
                padding: '6px 14px', borderRadius: 18, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s ease',
                background: currentTripId === '__new__' ? '#19c8b9' : 'transparent',
                color: currentTripId === '__new__' ? '#fff' : '#725d42',
                border: currentTripId === '__new__' ? '2px solid #19c8b9' : '2px dashed #c4b89e',
                boxShadow: currentTripId === '__new__' ? '0 2px 10px #19c8b950' : 'none',
              }}
            >+ 新建</span>
          </div>
        </FormItem>

        {/* 新建旅行面板 */}
        {showNewTrip && (
          <div style={{ background: 'rgb(247, 243, 223)', borderRadius: 14, padding: '12px 14px', marginBottom: 16 }}>
            <FormItem label="旅行名称" name="tripName" rules={[{ required: true, message: '请输入' }]}>
              <Input placeholder="杭州之旅" />
            </FormItem>
            <FormItem label="日期" name="tripDate" rules={[{ required: true, message: '请输入' }]}>
              <Input placeholder="2025-03" />
            </FormItem>
            <FormItem label="颜色" name="tripColor">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {TRIP_COLORS.map(c => (
                  <div key={c} onClick={() => form.setFieldValue('tripColor', c)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                      background: TRIP_COLOR_HEX[c],
                      border: currentColor === c ? '3px solid #794f27' : '2px solid transparent',
                      boxShadow: currentColor === c ? `0 0 8px ${TRIP_COLOR_HEX[c]}` : 'none',
                      transition: 'all 0.1s ease',
                    }}
                  />
                ))}
              </div>
            </FormItem>
          </div>
        )}

        {/* ====== 地点信息 ====== */}
        <FormItem label="城市" name="city" rules={[{ required: true, message: '必填' }]}>
          <Input placeholder="杭州" allowClear />
        </FormItem>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <FormItem label="日期" name="date" rules={[{ required: true, message: '必填' }]}>
              <Input placeholder="2025-03-15" />
            </FormItem>
          </div>
          <div style={{ flex: 1 }}>
            <FormItem label="描述" name="description" rules={[{ required: true, message: '必填' }]}>
              <Input placeholder="一起看日落" />
            </FormItem>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <FormItem label="纬度" name="lat" rules={[{ required: true, message: '必填' }]}>
              <Input placeholder="30.2741" />
            </FormItem>
          </div>
          <div style={{ flex: 1 }}>
            <FormItem label="经度" name="lng" rules={[{ required: true, message: '必填' }]}>
              <Input placeholder="120.1551" />
            </FormItem>
          </div>
        </div>

        {/* ====== 标签 ====== */}
        <FormItem label="标签" name="tags">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {allTags.map(tag => {
              const active = currentTags.includes(tag);
              return (
                <span key={tag}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTagClick(tag); }}
                  style={{
                    padding: '5px 14px', borderRadius: 18, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', userSelect: 'none', pointerEvents: 'auto',
                    transition: 'all 0.15s ease',
                    background: active ? '#e6f9f6' : 'transparent',
                    color: active ? '#11a89b' : '#8f734f',
                    border: `2px solid ${active ? '#19c8b9' : '#c4b89e'}`,
                    boxShadow: active ? '0 0 10px #19c8b940, inset 0 1px 2px #19c8b920' : 'none',
                    transform: active ? 'scale(1.06)' : 'scale(1)',
                  }}
                >{tag}</span>
              );
            })}
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <input
                placeholder="+ 自定义"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTag(); } }}
                style={{
                  width: 78, border: '2px dashed #c4b89e', borderRadius: 18, padding: '4px 10px',
                  fontSize: 12, color: '#725d42', background: 'transparent', outline: 'none',
                  fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.borderColor = '#19c8b9'}
                onBlur={e => e.target.style.borderColor = '#c4b89e'}
              />
            </span>
          </div>
        </FormItem>

        {/* ====== 照片 ====== */}
        <FormItem label="照片">
          <div>
            {showPhotoPreview && (
              <div style={{ marginBottom: 8 }}>
                <img src={photoPreview || editingLocation?.photo} alt="预览"
                  style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12 }} />
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Button type="dashed" size="small" onClick={() => fileInputRef.current?.click()}>选择图片</Button>
              {showPhotoPreview && (
                <Button type="text" size="small" danger onClick={() => {
                  setPhotoPreview('');
                  setPhotoDataUrl('');
                  setPhotoRemoved(true);
                }}>移除</Button>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#c4b89e', marginTop: 4 }}>
              支持 jpg/png，自动压缩，最大 10MB
            </div>
          </div>
        </FormItem>

        <FormItem>
          <Button type="primary" htmlType="submit" block loading={submitting} disabled={submitting}>保存记忆</Button>
        </FormItem>
      </Form>
    </Drawer>
  );
}
