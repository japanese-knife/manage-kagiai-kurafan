import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Meeting } from '../../types';
import { Users, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAccordionState } from '../../hooks/useAccordionState';

interface MeetingsSectionProps {
  projectId: string;
  readOnly?: boolean;
}

export default function MeetingsSection({ projectId, readOnly = false }: MeetingsSectionProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    participants: '',
    summary: '',
    decisions: '',
  });
  const { isExpanded, toggleExpanded, setExpandedWithSave } = useAccordionState(projectId, 'meetings', true);

  useEffect(() => {
    loadMeetings();
  }, [projectId]);

  const loadMeetings = async () => {
  const { data } = await supabase
    .from('meetings')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true })
    .order('id', { ascending: true });

  setMeetings(data || []);
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await supabase.from('meetings').update(formData).eq('id', editingId);
      } else {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 最大の order_index を取得
  const { data: maxOrder } = await supabase
    .from('meetings')
    .select('order_index')
    .eq('project_id', projectId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = maxOrder ? maxOrder.order_index + 1 : 0;

  await supabase.from('meetings').insert({
    ...formData,
    project_id: projectId,
    user_id: user.id,
    order_index: nextOrder
  });
}

      setFormData({ date: '', participants: '', summary: '', decisions: '' });
      setIsAdding(false);
      setEditingId(null);
      loadMeetings();
    } catch (error) {
      console.error('Error saving meeting:', error);
    }
  };

  const handleEdit = (meeting: Meeting) => {
    setFormData({
      date: meeting.date,
      participants: meeting.participants,
      summary: meeting.summary,
      decisions: meeting.decisions,
    });
    setEditingId(meeting.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('削除してもよろしいですか?')) {
      await supabase.from('meetings').delete().eq('id', id);
      loadMeetings();
    }
  };

  const handleMoveUp = async (meeting: Meeting, index: number) => {
  if (index === 0) return;

  const prevMeeting = meetings[index - 1];
  
  await supabase
    .from('meetings')
    .update({ order_index: prevMeeting.order_index })
    .eq('id', meeting.id);
    
  await supabase
    .from('meetings')
    .update({ order_index: meeting.order_index })
    .eq('id', prevMeeting.id);
    
  loadMeetings();
};

const handleMoveDown = async (meeting: Meeting, index: number) => {
  if (index === meetings.length - 1) return;

  const nextMeeting = meetings[index + 1];
  
  await supabase
    .from('meetings')
    .update({ order_index: nextMeeting.order_index })
    .eq('id', meeting.id);
    
  await supabase
    .from('meetings')
    .update({ order_index: meeting.order_index })
    .eq('id', nextMeeting.id);
    
  loadMeetings();
};
  
  return (
    <section className="border-b border-gray-200 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <button
          onClick={toggleExpanded}
          className="flex items-center text-lg sm:text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
        >
          <Users className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-primary-600" />
          打ち合わせ内容
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 ml-2 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 ml-2 text-gray-500" />
          )}
        </button>
        {!readOnly && (
          <button
            onClick={() => {
              if (!isExpanded) setExpandedWithSave(true);
              setIsAdding(!isAdding);
            }}
            className="flex items-center justify-center px-3 py-1.5 text-sm btn-gradient-animated text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            追加
          </button>
        )}
      </div>

      {isExpanded && (
        <>
          {isAdding && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日付 *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                参加者
              </label>
              <input
                type="text"
                value={formData.participants}
                onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: 山田、鈴木、田中"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                要点
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="打ち合わせの要点"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                決定事項
              </label>
              <textarea
                value={formData.decisions}
                onChange={(e) => setFormData({ ...formData, decisions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="決定事項や次のアクション"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 btn-gradient-animated text-white rounded-lg"
              >
                {editingId ? '更新' : '追加'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({ date: '', participants: '', summary: '', decisions: '' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                キャンセル
              </button>
            </div>
          </div>
        </form>
          )}

          <div className="space-y-4">
        {meetings.map((meeting, index) => (
  <div key={meeting.id} className="bg-gray-50 p-4 rounded-lg">
    <div className="flex justify-between items-start mb-3">
      <div>
        <div className="text-sm font-semibold text-primary-600 mb-1">
          {new Date(meeting.date).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
        {meeting.participants && (
          <div className="text-sm text-gray-600">参加者: {meeting.participants}</div>
        )}
      </div>
      {!readOnly && (
        <div className="flex space-x-2">
          <button
            onClick={() => handleMoveUp(meeting, index)}
            disabled={index === 0}
            className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed"
            title="上に移動"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleMoveDown(meeting, index)}
            disabled={index === meetings.length - 1}
            className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed"
            title="下に移動"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(meeting)}
            className="p-1 text-gray-500 hover:text-primary-600"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(meeting.id)}
            className="p-1 text-gray-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
    {meeting.summary && (
      <div className="mb-2">
        <h4 className="text-sm font-medium text-gray-700 mb-1">要点</h4>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{meeting.summary}</p>
      </div>
    )}
    {meeting.decisions && (
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-1">決定事項</h4>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{meeting.decisions}</p>
      </div>
    )}
  </div>
))}
          </div>
        </>
      )}
    </section>
  );
}
