import { useState, useEffect } from 'react';
import { TrendingUp, Target, CheckCircle2, Clock } from 'lucide-react';
import api from '../../utils/api';

const ProgressTracker = () => {
  const [groups, setGroups] = useState([]);
  const [progressData, setProgressData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const groupsRes = await api.get('/groups');
      const groups = groupsRes.data.groups;
      setGroups(groups);

      const progressPromises = groups.map(group =>
        api.get(`/submissions/progress/${group.id}`)
      );
      const progressResults = await Promise.all(progressPromises);

      const progress = {};
      groups.forEach((group, index) => {
        progress[group.id] = progressResults[index].data;
      });

      setProgressData(progress);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching progress:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading progress...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <TrendingUp className="w-7 h-7 mr-2" />
        Group Progress
      </h2>

      {groups.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          Join or create a group to track progress
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {groups.map((group) => {
            const progress = progressData[group.id] || {};
            const percentage = progress.completionPercentage || 0;

            return (
              <div key={group.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{group.name}</h3>
                  <span className="text-2xl font-bold text-primary-600">{percentage}%</span>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Target className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-2xl font-bold text-blue-600">{progress.total || 0}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-600" />
                    <p className="text-2xl font-bold text-green-600">{progress.confirmed || 0}</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
                    <p className="text-2xl font-bold text-yellow-600">{progress.pending || 0}</p>
                    <p className="text-xs text-gray-600">Pending</p>
                  </div>
                </div>

                {/* Completion Badge */}
                {percentage === 100 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                    <p className="text-green-800 font-medium">🎉 All assignments completed!</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
