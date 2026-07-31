import { useCallback, useState, useEffect } from 'react';
import { Drawer, Form, FormItem, Input, Select, Button, useForm, Notification } from 'animal-island-ui';
import type { Trip, Location, TripColor } from '../types';
import { TRIP_COLORS } from '../constants';

interface LocationFormValues {
  city: string;
  date: string;
  description: string;
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
  pickedLat: number | null;
  pickedLng: number | null;
  onSubmit: (tripId: string, location: Omit<Location, 'id'>) => void;
  onAddTrip: (trip: { name: string; date: string; color: TripColor }) => Promise<string>;
  onClose: () => void;
}

const tagOptions = [
  { label: '自然风光', value: '自然风光' },
  { label: '美食', value: '美食' },
  { label: '城市漫步', value: '城市漫步' },
  { label: '历史文化', value: '历史文化' },
  { label: '海边', value: '海边' },
  { label: '山野', value: '山野' },
];

export default function LocationForm({ open, trips, editingLocation, pickedLat, pickedLng, onSubmit, onAddTrip, onClose }: LocationFormProps) {
  const [form] = useForm<LocationFormValues>();
  const [isNewTrip, setIsNewTrip] = useState(trips.length === 0);

  useEffect(() => {
    if (editingLocation) {
      form.setFieldsValue({
        city: editingLocation.city,
        date: editingLocation.date,
        description: editingLocation.description,
        tags: editingLocation.tags,
        photo: editingLocation.photo,
        tripId: trips.find(t => t.locations.some(l => l.id === editingLocation.id))?.id || '__new__',
        tripName: '',
        tripDate: '',
        tripColor: 'app-pink',
      });
    }
  }, [editingLocation, trips, form]);

  const handleFinish = useCallback(async (values: LocationFormValues) => {
    if (pickedLat === null || pickedLng === null) {
      Notification.warning({ message: '请先点击地图标记位置', description: '在地图上点击你要记录的地点' });
      return;
    }

    try {
      let targetTripId = values.tripId;

      if (values.tripId === '__new__') {
        targetTripId = await onAddTrip({
          name: values.tripName,
          date: values.tripDate,
          color: values.tripColor,
        });
      }

      await onSubmit(targetTripId, {
        city: values.city,
        date: values.date,
        description: values.description,
        lat: pickedLat,
        lng: pickedLng,
        tags: values.tags,
        photo: values.photo || '',
      });
      form.resetFields();
      setIsNewTrip(false);
      onClose();
    } catch (e) {
      Notification.error({ message: '保存失败', description: e instanceof Error ? e.message : '未知错误' });
    }
  }, [onSubmit, onAddTrip, form, onClose, pickedLat, pickedLng]);

  const tripOptions = [
    ...trips.map(t => ({ key: t.id, label: t.name })),
    { key: '__new__', label: '+ 新建旅行' },
  ];

  const colorOptions = TRIP_COLORS.map(c => ({ key: c, label: c }));

  const hasCoords = pickedLat !== null && pickedLng !== null;

  return (
    <Drawer
      open={open}
      title="新增旅行记忆"
      placement="right"
      width={400}
      onClose={() => { form.resetFields(); setIsNewTrip(false); onClose(); }}
    >
      <Form
        form={form as any}
        initialValues={{
          tripId: trips[0]?.id ?? '__new__',
          city: '',
          date: '',
          description: '',
          tags: [],
          photo: '',
          tripName: '',
          tripDate: '',
          tripColor: 'app-pink' as TripColor,
        }}
        layout="vertical"
        onFinish={handleFinish as any}
      >
        {/* 地图选点 */}
        <div style={{
          background: hasCoords ? '#e6f9f6' : '#f0ece2',
          borderRadius: 16,
          padding: hasCoords ? '10px 16px' : '14px 16px',
          marginBottom: 16,
          textAlign: 'center',
          border: hasCoords ? '2px solid #19c8b9' : '2px dashed #c4b89e',
          transition: 'all 0.2s ease',
        }}>
          {hasCoords ? (
            <div>
              <span style={{ fontSize: 24 }}>📍</span>
              <div style={{ fontSize: 12, color: '#9f927d', marginTop: 4 }}>
                已标记位置 ({pickedLat?.toFixed(4)}, {pickedLng?.toFixed(4)})
              </div>
              <div style={{ fontSize: 11, color: '#19c8b9', marginTop: 2, fontWeight: 600 }}>
                点击地图其他位置可以修改
              </div>
            </div>
          ) : (
            <div>
              <span style={{ fontSize: 24 }}>👆</span>
              <div style={{ fontSize: 13, color: '#9f927d', marginTop: 4, fontWeight: 600 }}>
                点击地图标记位置
              </div>
              <div style={{ fontSize: 11, color: '#c4b89e', marginTop: 2 }}>
                在左侧地图上点击你去过的地方
              </div>
            </div>
          )}
        </div>

        {/* 所属旅行 */}
        <FormItem label="所属旅行" name="tripId" rules={[{ required: true, message: '请选择旅行' }]}>
          <Select
            options={tripOptions}
            value={form.getFieldValue('tripId') as string}
            onChange={v => {
              form.setFieldValue('tripId', v);
              setIsNewTrip(v === '__new__');
            }}
          />
        </FormItem>

        {/* 新建旅行字段 */}
        {isNewTrip && (
          <>
            <FormItem label="旅行名称" name="tripName" rules={[{ required: true, message: '请输入' }]}>
              <Input placeholder="例如：杭州之旅" />
            </FormItem>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <FormItem label="旅行日期" name="tripDate" rules={[{ required: true, message: '请输入' }]}>
                  <Input placeholder="2025-03" />
                </FormItem>
              </div>
              <div style={{ flex: 1 }}>
                <FormItem label="路线颜色" name="tripColor">
                  <Select
                    options={colorOptions}
                    value={form.getFieldValue('tripColor') as string}
                    onChange={v => form.setFieldValue('tripColor', v as TripColor)}
                  />
                </FormItem>
              </div>
            </div>
          </>
        )}

        {/* 地点信息 */}
        <FormItem label="城市" name="city" rules={[{ required: true, message: '请输入城市名' }]}>
          <Input placeholder="杭州" />
        </FormItem>

        <FormItem label="日期" name="date" rules={[{ required: true, message: '请输入日期' }]}>
          <Input placeholder="2025-03-15" />
        </FormItem>

        <FormItem label="回忆" name="description" rules={[{ required: true, message: '写点什么吧' }]}>
          <Input placeholder="一起做了什么..." />
        </FormItem>

        {/* 标签选择 */}
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
                    padding: '4px 12px',
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

        <FormItem label="照片链接" name="photo">
          <Input placeholder="https://..." />
        </FormItem>

        <FormItem>
          <Button type="primary" htmlType="submit" block>保存</Button>
        </FormItem>
      </Form>
    </Drawer>
  );
}
