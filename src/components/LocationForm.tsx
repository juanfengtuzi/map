import { useCallback } from 'react';
import { Modal, Form, FormItem, Input, Select, Button, useForm } from 'animal-island-ui';
import type { Trip, Location, TripColor } from '../types';
// TRIP_COLORS available for color selection if needed

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
  onSubmit: (tripId: string, location: Omit<Location, 'id'>, tripInfo?: { name: string; date: string; color: TripColor }) => void;
  onAddTrip: (trip: { name: string; date: string; color: TripColor }) => string;
  onClose: () => void;
}

export default function LocationForm({ open, trips, editingLocation, onSubmit, onAddTrip, onClose }: LocationFormProps) {
  const [form] = useForm<LocationFormValues>();
  const isNewTrip = !editingLocation && trips.length === 0;

  const handleFinish = useCallback((values: LocationFormValues) => {
    let targetTripId = values.tripId;

    if (values.tripId === '__new__') {
      targetTripId = onAddTrip({
        name: values.tripName,
        date: values.tripDate,
        color: values.tripColor,
      });
    }

    onSubmit(targetTripId, {
      city: values.city,
      date: values.date,
      description: values.description,
      lat: parseFloat(values.lat),
      lng: parseFloat(values.lng),
      tags: values.tags,
      photo: values.photo || '',
    });
    form.resetFields();
    onClose();
  }, [onSubmit, onAddTrip, form, onClose]);

  const tripOptions = [
    ...trips.map(t => ({ key: t.id, label: t.name })),
    { key: '__new__', label: '+ 新建旅行' },
  ];

  const tagOptions = [
    { label: '自然风光', value: '自然风光' },
    { label: '美食', value: '美食' },
    { label: '城市漫步', value: '城市漫步' },
    { label: '历史文化', value: '历史文化' },
    { label: '海边', value: '海边' },
    { label: '山野', value: '山野' },
  ];

  return (
    <Modal
      open={open}
      title={editingLocation ? `编辑 - ${editingLocation.city}` : '新增地点'}
      onClose={onClose}
      footer={null}
      typewriter={false}
    >
      <Form
        form={form as any}
        initialValues={{
          tripId: editingLocation ? trips.find(t => t.locations.some(l => l.id === editingLocation.id))?.id || trips[0]?.id || '__new__' : isNewTrip ? '__new__' : trips[0]?.id || '__new__',
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
        <FormItem label="所属旅行" name="tripId" rules={[{ required: true, message: '请选择旅行' }]}>
          <Select options={tripOptions} value={form.getFieldValue('tripId') as string} onChange={v => form.setFieldValue('tripId', v)} />
        </FormItem>

        <FormItem label="城市名" name="city" rules={[{ required: true, message: '请输入城市名' }]}>
          <Input placeholder="例如：杭州" />
        </FormItem>

        <FormItem label="日期" name="date" rules={[{ required: true, message: '请输入日期' }]}>
          <Input placeholder="例如：2025-03-15" />
        </FormItem>

        <FormItem label="纬度" name="lat" rules={[{ required: true, message: '请输入纬度' }]}>
          <Input placeholder="例如：30.2741" />
        </FormItem>

        <FormItem label="经度" name="lng" rules={[{ required: true, message: '请输入经度' }]}>
          <Input placeholder="例如：120.1551" />
        </FormItem>

        <FormItem label="描述" name="description" rules={[{ required: true, message: '请输入描述' }]}>
          <Input placeholder="一起做了什么..." />
        </FormItem>

        <FormItem label="标签" name="tags">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tagOptions.map(tag => {
              const currentTags = (form.getFieldValue('tags') as string[]) || [];
              const isSelected = currentTags.includes(tag.value);
              return (
                <span
                  key={tag.value}
                  onClick={() => {
                    const next = isSelected
                      ? currentTags.filter(v => v !== tag.value)
                      : [...currentTags, tag.value];
                    form.setFieldValue('tags', next);
                  }}
                  style={{
                    padding: '2px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: `2px solid ${isSelected ? '#19c8b9' : '#c4b89e'}`,
                    backgroundColor: isSelected ? '#e6f9f6' : 'transparent',
                    color: isSelected ? '#11a89b' : '#8f734f',
                    userSelect: 'none',
                  }}
                >
                  {tag.label}
                </span>
              );
            })}
          </div>
        </FormItem>

        <FormItem label="照片 URL" name="photo">
          <Input placeholder="https://..." />
        </FormItem>

        <FormItem>
          <Button type="primary" htmlType="submit" block>保存</Button>
        </FormItem>
      </Form>
    </Modal>
  );
}
