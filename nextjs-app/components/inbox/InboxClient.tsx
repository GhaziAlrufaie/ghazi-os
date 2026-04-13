'use client';
// Design: Inbox — message list with source badges, status filter, quick-add form

import { useState, useTransition } from 'react';
import {
  addMessage,
  updateMessageStatus,
  deleteMessage,
  type InboxMessage,
  type MessageSource,
  type MessageStatus,
} from '@/lib/inbox-actions';

const SOURCE_META: Record<MessageSource, { label: string; color: string; icon: string }> = {
  whatsapp:  { label: 'واتساب',   color: 'bg-green-500/20 text-green-400',  icon: '💬' },
  email:     { label: 'إيميل',    color: 'bg-blue-500/20 text-blue-400',    icon: '📧' },
  instagram: { label: 'إنستغرام', color: 'bg-pink-500/20 text-pink-400',    icon: '📸' },
  other:     { label: 'أخرى',     color: 'bg-gray-500/20 text-gray-400',    icon: '📩' },
};

const SOURCES: MessageSource[] = ['whatsapp', 'email', 'instagram', 'other'];

const STATUS_TABS: { id: MessageStatus | 'all'; label: string }[] = [
  { id: 'all',      label: 'الكل' },
  { id: 'unread',   label: 'غير مقروء' },
  { id: 'read',     label: 'مقروء' },
  { id: 'archived', label: 'أرشيف' },
];

interface Props {
  initialMessages: InboxMessage[];
  brands: { id: string; name: string; color: string }[];
}

interface AddFormProps {
  brands: { id: string; name: string; color: string }[];
  onAdd: (msg: InboxMessage) => void;
}

function AddForm({ brands, onAdd }: AddFormProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [sender, setSender] = useState('');
  const [source, setSource] = useState<MessageSource>('whatsapp');
  const [brandId, setBrandId] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!content.trim()) return;
    startTransition(async () => {
      const result = await addMessage({
        content: content.trim(),
        sender: sender.trim() || 'غير معروف',
        source,
        brandId: brandId || null,
      });
      if (result.message) {
        onAdd(result.message);
        setContent('');
        setSender('');
        setOpen(false);
      }
    });
  }

  return (
    <div className="mb-5">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-white border border-dashed border-white/10 hover:border-white/20 rounded-lg px-4 py-2 transition-all"
        >
          <span className="text-lg leading-none">+</span>
          إضافة رسالة جديدة
        </button>
      ) : (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="محتوى الرسالة..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-3 resize-none h-20 placeholder-gray-600"
          />
          <div className="flex gap-3 mb-3 flex-wrap">
            <input
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="المرسل"
              className="flex-1 min-w-[120px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600"
            />
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as MessageSource)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            >
              {SOURCES.map((s) => (
                <option key={s} value={s} className="bg-[#12121f]">
                  {SOURCE_META[s].icon} {SOURCE_META[s].label}
                </option>
              ))}
            </select>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="" className="bg-[#12121f]">بدون براند</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#12121f]">{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">إلغاء</button>
            <button
              onClick={handleSubmit}
              disabled={isPending || !content.trim()}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg"
            >
              {isPending ? 'جارٍ الإضافة...' : 'إضافة'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageCard({
  msg,
  brands,
  onStatusChange,
  onDelete,
}: {
  msg: InboxMessage;
  brands: { id: string; name: string; color: string }[];
  onStatusChange: (id: string, s: MessageStatus) => void;
  onDelete: (id: string) => void;
}) {
  const sm = SOURCE_META[msg.source];
  const brand = brands.find((b) => b.id === msg.brandId);
  const date = new Date(msg.createdAt).toLocaleDateString('ar-SA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`bg-[#1a1a2e] border rounded-xl p-4 group transition-all ${
        msg.status === 'unread' ? 'border-blue-500/30' : 'border-white/8 hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${sm.color}`}>
              {sm.icon} {sm.label}
            </span>
            {msg.status === 'unread' && (
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            )}
            {brand && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: brand.color + '30', color: brand.color }}
              >
                {brand.name}
              </span>
            )}
            <span className="text-[10px] text-gray-600">{msg.sender}</span>
            <span className="text-[10px] text-gray-700 mr-auto">{date}</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{msg.content}</p>
        </div>
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onDelete(msg.id)} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        {msg.status !== 'read' && (
          <button
            onClick={() => onStatusChange(msg.id, 'read')}
            className="text-[10px] px-2 py-1 rounded border border-white/10 text-gray-500 hover:text-gray-300 transition-all"
          >
            ✓ مقروء
          </button>
        )}
        {msg.status !== 'archived' && (
          <button
            onClick={() => onStatusChange(msg.id, 'archived')}
            className="text-[10px] px-2 py-1 rounded border border-white/10 text-gray-500 hover:text-gray-300 transition-all"
          >
            📁 أرشفة
          </button>
        )}
        {msg.status === 'archived' && (
          <button
            onClick={() => onStatusChange(msg.id, 'unread')}
            className="text-[10px] px-2 py-1 rounded border border-white/10 text-gray-500 hover:text-gray-300 transition-all"
          >
            ↩ إلغاء الأرشفة
          </button>
        )}
      </div>
    </div>
  );
}

export default function InboxClient({ initialMessages, brands }: Props) {
  const [messages, setMessages] = useState<InboxMessage[]>(initialMessages);
  const [activeTab, setActiveTab] = useState<MessageStatus | 'all'>('unread');
  const [, startTransition] = useTransition();

  const filtered =
    activeTab === 'all'
      ? messages
      : messages.filter((m) => m.status === activeTab);

  const unreadCount = messages.filter((m) => m.status === 'unread').length;

  function handleAdd(msg: InboxMessage) {
    setMessages((prev) => [msg, ...prev]);
  }

  function handleStatusChange(id: string, status: MessageStatus) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    startTransition(async () => { await updateMessageStatus(id, status); });
  }

  function handleDelete(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    startTransition(async () => { await deleteMessage(id); });
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">الوارد</h1>
          {unreadCount > 0 && (
            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
              {unreadCount} جديد
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">{messages.length} رسالة</span>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-5 border-b border-white/8 pb-3">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.id === 'all'
              ? messages.length
              : messages.filter((m) => m.status === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Add form */}
      <AddForm brands={brands} onAdd={handleAdd} />

      {/* Messages list */}
      <div className="flex flex-col gap-3 overflow-y-auto flex-1">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-600 text-sm py-16">
            لا توجد رسائل في هذا القسم
          </div>
        ) : (
          filtered.map((msg) => (
            <MessageCard
              key={msg.id}
              msg={msg}
              brands={brands}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
