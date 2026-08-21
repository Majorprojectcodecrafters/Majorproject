import { useState, useMemo, useEffect } from 'react';

export default function CustomTopicWeightage({ chapters, targetTotalMarks, onChange }) {
  // Topic marks mapping { [topicId]: markValue }
  const [topicMarks, setTopicMarks] = useState({});

  const handleMarkChange = (topicId, value) => {
    const num = Math.max(0, Number(value) || 0);
    const updated = { ...topicMarks, [topicId]: num };
    setTopicMarks(updated);
    if (onChange) {
      onChange(updated);
    }
  };

  // Calculate total assigned topic marks
  const totalAssignedMarks = useMemo(() => {
    return Object.values(topicMarks).reduce((sum, m) => sum + (Number(m) || 0), 0);
  }, [topicMarks]);

  const remainingMarks = targetTotalMarks - totalAssignedMarks;
  const isValid = totalAssignedMarks === Number(targetTotalMarks);

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Custom Topic Mark Allocation</h3>
          <p className="text-xs text-gray-500">Assign target marks to specific topics across chapters.</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="rounded bg-blue-50 px-3 py-1 text-blue-900 border border-blue-200">
            Target Marks: <strong>{targetTotalMarks}m</strong>
          </div>
          <div className={`rounded px-3 py-1 border ${isValid ? 'bg-green-50 text-green-800 border-green-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
            Assigned: <strong>{totalAssignedMarks}m</strong> | Remaining: <strong>{remainingMarks}m</strong>
          </div>
        </div>
      </div>

      {!isValid && (
        <div className="rounded bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          ⚠️ <strong>Weightage Validation:</strong> Total assigned topic marks ({totalAssignedMarks}m) must equal paper target marks ({targetTotalMarks}m). Remaining to allocate: {remainingMarks}m.
        </div>
      )}

      {/* Chapters & Topics List */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="rounded-md border border-gray-100 bg-gray-50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-gray-900">
                {chapter.chapterNo ? `Ch ${chapter.chapterNo}: ` : ''}{chapter.name}
              </h4>
              <span className="text-xs text-gray-500">
                {chapter.topics?.length || 0} topics
              </span>
            </div>

            {chapter.topics?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2 border-l-2 border-blue-200">
                {chapter.topics.map((topic) => (
                  <div key={topic.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 text-xs">
                    <span className="font-medium text-gray-700 truncate max-w-xs">{topic.name}</span>
                    <input
                      type="number"
                      min="0"
                      value={topicMarks[topic.id] || 0}
                      onChange={(e) => handleMarkChange(topic.id, e.target.value)}
                      className="input-field w-16 text-center font-bold text-xs"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 text-xs">
                <span className="font-medium text-gray-700">Entire Chapter</span>
                <input
                  type="number"
                  min="0"
                  value={topicMarks[chapter.id] || 0}
                  onChange={(e) => handleMarkChange(chapter.id, e.target.value)}
                  className="input-field w-16 text-center font-bold text-xs"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
