import { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, CheckCircle2, Clock, Award, TrendingUp } from 'lucide-react';
import api from '../../utils/api';

const Analytics = () => {
  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalGroups: 0,
    totalSubmissions: 0,
    totalGraded: 0,
    submissionRate: 0,
    gradingRate: 0,
    assignmentBreakdown: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [assignmentsRes, groupsRes] = await Promise.all([
        api.get('/assignments/admin/all'),
        api.get('/groups').catch(() => ({ data: { groups: [] } }))
      ]);
      
      const assignments = assignmentsRes.data.assignments;
      const groups = groupsRes.data.groups || [];
      
      const totalAssignments = assignments.length;
      const totalGroups = assignments[0]?.total_groups || groups.length || 0;
      
      const totalSubmitted = assignments.reduce((sum, a) => sum + parseInt(a.submitted_count || 0), 0);
      const totalGraded = assignments.reduce((sum, a) => sum + parseInt(a.graded_count || 0), 0);
      const totalPossible = totalAssignments * totalGroups;
      
      const submissionRate = totalPossible > 0 ? Math.round((totalSubmitted / totalPossible) * 100) : 0;
      const gradingRate = totalSubmitted > 0 ? Math.round((totalGraded / totalSubmitted) * 100) : 0;
      
      const assignmentBreakdown = assignments.map(a => ({
        title: a.title,
        submitted: a.submitted_count || 0,
        graded: a.graded_count || 0,
        total: totalGroups,
        submissionRate: totalGroups > 0 ? Math.round(((a.submitted_count || 0) / totalGroups) * 100) : 0
      }));

      setStats({
        totalAssignments,
        totalGroups,
        totalSubmissions: totalSubmitted,
        totalGraded,
        submissionRate,
        gradingRate,
        assignmentBreakdown
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <BarChart3 className="w-7 h-7 mr-2" />
          Analytics Dashboard
        </h2>
        <button 
          onClick={fetchStats}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Total Assignments</p>
              <p className="text-3xl font-bold text-blue-700">{stats.totalAssignments}</p>
            </div>
            <FileText className="w-12 h-12 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Total Groups</p>
              <p className="text-3xl font-bold text-green-700">{stats.totalGroups}</p>
            </div>
            <Users className="w-12 h-12 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Submission Rate</p>
              <p className="text-3xl font-bold text-purple-700">{stats.submissionRate}%</p>
            </div>
            <CheckCircle2 className="w-12 h-12 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-1">Grading Rate</p>
              <p className="text-3xl font-bold text-orange-700">{stats.gradingRate}%</p>
            </div>
            <Award className="w-12 h-12 text-orange-600 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600 mb-1">Total Submissions</p>
              <p className="text-2xl font-bold text-indigo-700">{stats.totalSubmissions}</p>
            </div>
            <FileText className="w-10 h-10 text-indigo-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-teal-50 to-teal-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-teal-600 mb-1">Graded Work</p>
              <p className="text-2xl font-bold text-teal-700">{stats.totalGraded}</p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-teal-600 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 mb-1">Pending Grading</p>
              <p className="text-2xl font-bold text-yellow-700">{stats.totalSubmissions - stats.totalGraded}</p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600 opacity-50" />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-lg mb-4">Overall Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Submission Rate</span>
              <span className="font-medium">{stats.submissionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full"
                style={{ width: `${stats.submissionRate}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Grading Progress</span>
              <span className="font-medium">{stats.gradingRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-green-500 to-teal-500 h-4 rounded-full"
                style={{ width: `${stats.gradingRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {stats.assignmentBreakdown.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-lg mb-4">Assignment Breakdown</h3>
          <div className="space-y-4">
            {stats.assignmentBreakdown.map((assignment, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50">
                <div className="flex justify-between mb-2">
                  <h4 className="font-semibold">{assignment.title}</h4>
                  <span className="text-sm text-gray-600">
                    {assignment.submitted}/{assignment.total} ({assignment.submissionRate}%)
                  </span>
                </div>
                <div className="flex gap-2 text-xs mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {assignment.submitted} Submitted
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                    {assignment.graded} Graded
                  </span>
                  {assignment.submitted > assignment.graded && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                      {assignment.submitted - assignment.graded} Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold text-lg mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Performance Insights
        </h3>
        <div className="space-y-3">
          {stats.submissionRate >= 75 && (
            <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded">
              <p className="text-green-800 font-medium">Excellent Submission Rate!</p>
              <p className="text-green-600 text-sm">Most groups are submitting on time.</p>
            </div>
          )}
          {stats.submissionRate >= 50 && stats.submissionRate < 75 && (
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
              <p className="text-yellow-800 font-medium">Good Progress</p>
              <p className="text-yellow-600 text-sm">About {stats.submissionRate}% of assignments submitted.</p>
            </div>
          )}
          {stats.submissionRate < 50 && stats.submissionRate > 0 && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-red-800 font-medium">Needs Attention</p>
              <p className="text-red-600 text-sm">Many assignments still pending.</p>
            </div>
          )}
          {stats.totalSubmissions > 0 && stats.gradingRate < 50 && (
            <div className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
              <p className="text-orange-800 font-medium">Grading Backlog</p>
              <p className="text-orange-600 text-sm">{stats.totalSubmissions - stats.totalGraded} submissions waiting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
