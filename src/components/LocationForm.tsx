import { useCallback, useState, useRef } from 'react';
import { Drawer, Form, FormItem, Input, Button, useForm, Notification } from 'animal-island-ui';
import type { Trip, Location, TripColor } from '../types';
import { TRIP_COLOR_HEX, TRIP_COLORS } from '../constants';

interface LocationFormValues {
  city: string;
  date: string;
  description: string;
  lat: string;
  lng: string;
  tags: string[];
  photo: string;
  tripId: string;
  tripName: string;
  tripDate: string;
  tripColor: TripColor;
}

interface LocationFormProps {
  open: boolean;
  trips: Trip[];
  editingLocation: Location | null;
  onSubmit: (tripId: string, location: Omit<Location, 'id'>) => void;
  onSubmitWithNewTrip: (trip: { name: string; date: string; color: TripColor }, location: Omit<Location, 'id'>) => void;
  onClose: () => void;
}

const TAG_OPTIONS = ['自然风光', '美食', '城市漫步', '历史文化', '海边', '山野'];

export default function LocationForm({ open, trips, editingLocation, onSubmit, onSubmitWithNewTrip, onClose }: LocationFormProps) {
  const [form] = useForm<LocationFormValues>();
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = editingLocation !== null;

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      Notification.warning({ message: '图片太大', description: '请选择小于 500KB 的图片' });
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      form.setFieldValue('photo', dataUrl);
    };
    reader.readAsDataURL(file);
  }

  const handleFinish = useCallback(async (values: LocationFormValues) => {
    try {
      const location: Omit<Location, 'id'> = {
        city: values.city,
        date: values.date,
        description: values.description,
        lat: parseFloat(values.lat),
        lng: parseFloat(values.lng),
        tags: values.tags || [],
        photo: values.photo || '',
      };

      if (values.tripId === '__new__') {
        await onSubmitWithNewTrip({
          name: values.tripName,
          date: values.tripDate,
          color: values.tripColor,
        }, location);
      } else {
        await onSubmit(values.tripId, location);
      }

      form.resetFields();
      setShowNewTrip(false);
      setPhotoFile(null);
      setPhotoPreview('');
      onClose();
    } catch (e) {
      Notification.error({ message: '保存失败', description: e instanceof Error ? e.message : '未知错误' });
    }
  }, [onSubmit, onSubmitWithNewTrip, form, onClose]);

  const currentTripId = form.getFieldValue('tripId') as string;
  const currentTags = (form.getFieldValue('tags') as string[]) || [];
  const currentColor = (form.getFieldValue('tripColor') as string) || 'app-pink';

  const defaultTripId = editingLocation
    ? trips.find(t => t.locations.some(l => l.id === editingLocation.id))?.id || '__new__'
    : (trips[0]?.id ?? '__new__');

  return (
    <Drawer
      open={open}
      title={isEditing ? `编辑 - ${editingLocation.city}` : '新增旅行记忆'}
      placement="right"
      width={400}
      onClose={() => {
        form.resetFields();
        setShowNewTrip(false);
        setPhotoFile(null);
        setPhotoPreview('');
        onClose();
      }}
    >
      <Form
        form={form as any}
        initialValues={{
          tripId: defaultTripId,
          city: editingLocation?.city || '',
          date: editingLocation?.date || '',
          description: editingLocation?.description || '',
          lat: editingLocation?.lat?.toString() || '',
          lng: editingLocation?.lng?.toString() || '',
          tags: editingLocation?.tags || [],
          photo: editingLocation?.photo || '',
          tripName: '',
          tripDate: '',
          tripColor: 'app-pink' as TripColor,
        }}
        layout="vertical"
        onFinish={handleFinish as any}
      >

        {/* ====== 1. 选择旅行 ====== */}
        <FormItem label="所属旅行" name="tripId" rules={[{ required: true, message: '请选择' }]}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {trips.map(trip => (
              <span
                key={trip.id}
                onClick={() => {
                  form.setFieldValue('tripId', trip.id);
                  setShowNewTrip(false);
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 18,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: currentTripId === trip.id ? TRIP_COLOR_HEX[trip.color] : 'transparent',
                  color: currentTripId === trip.id ? '#fff' : '#725d42',
                  border: `2px solid ${TRIP_COLOR_HEX[trip.color]}`,
                  userSelect: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {trip.name}
              </span>
            ))}
            <span
              onClick={() => {
                form.setFieldValue('tripId', '__new__');
                setShowNewTrip(true);
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 18,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                background: currentTripId === '__new__' ? '#19c8b9' : 'transparent',
                color: currentTripId === '__new__' ? '#fff' : '#725d42',
                border: currentTripId === '__new__' ? '2px solid #19c8b9' : '2px dashed #c4b89e',
                userSelect: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              + 新建旅行
            </span>
          </div>
        </FormItem>

        {/* 新建旅行面板 */}
        {showNewTrip && (
          <div style={{
            background: 'rgb(247, 243, 223)',
            borderRadius: 14,
            padding: '12px 14px',
            marginBottom: 16,
          }}>
            <FormItem label="旅行名称" name="tripName" rules={[{ required: true, message: '请输入' }]}>
              <Input placeholder="杭州之旅" />
            </FormItem>
            <FormItem label="日期" name="tripDate" rules={[{ required: true, message: '请输入' }]}>
              <Input placeholder="2025-03" />
            </FormItem>
            <FormItem label="颜色" name="tripColor">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {TRIP_COLORS.map(c => (
                  <div
                    key={c}
                    onClick={() => form.setFieldValue('tripColor', c)}
                    style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: TRIP_COLOR_HEX[c],
                      cursor: 'pointer',
                      border: currentColor === c ? '3px solid #794f27' : '2px solid transparent',
                      transition: 'all 0.1s ease',
                    }}
                  />
                ))}
              </div>
            </FormItem>
          </div>
        )}

        {/* ====== 2. 地点信息 ====== */}
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

        {/* 经纬度 */}
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

        {/* ====== 3. 标签 ====== */}
        <FormItem label="标签" name="tags">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TAG_OPTIONS.map(tag => {
              const active = currentTags.includes(tag);
              return (
                <span
                  key={tag}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const next = active
                      ? currentTags.filter(t => t !== tag)
                      : [...currentTags, tag];
                    form.setFieldValue('tags', next);
                  }}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 18,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: active ? '#e6f9f6' : 'transparent',
                    color: active ? '#11a89b' : '#8f734f',
                    border: `2px solid ${active ? '#19c8b9' : '#c4b89e'}`,
                    userSelect: 'none',
                    pointerEvents: 'auto',
                  }}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        </FormItem>

        {/* ====== 4. 照片上传 ====== */}
        <FormItem label="照片" name="photo">
          <div>
            {photoPreview || (editingLocation?.photo) ? (
              <div style={{ marginBottom: 8 }}>
                <img
                  src={photoPreview || editingLocation?.photo || ''}
                  alt="预览"
                  style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 12 }}
                />
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="dashed" size="small" onClick={() => fileInputRef.current?.click()}>
                选择图片
              </Button>
              {(photoPreview || editingLocation?.photo) && (
                <Button type="text" size="small" danger onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview('');
                  form.setFieldValue('photo', '');
                }}>
                  移除
                </Button>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#c4b89e', marginTop: 4 }}>
              支持 jpg/png，最大 500KB
            </div>
          </div>
        </FormItem>

        <FormItem>
          <Button type="primary" htmlType="submit" block>保存记忆</Button>
        </FormItem>
      </Form>
    </Drawer>
  );
}
