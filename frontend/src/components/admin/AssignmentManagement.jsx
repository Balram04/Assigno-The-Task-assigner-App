import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import api from '../../utils/api';

const AssignmentManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [selectedAssignmentDetails, setSelectedAssignmentDetails] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradeData, setGradeData] = useState({ grade: '', feedback: '' });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    onedriveLink: '',
    isForAll: true,
    groupIds: []
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments/admin/all');
      setAssignments(response.data.assignments);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAssignment) {
        await api.put(`/assignments/${editingAssignment.id}`, formData);
      } else {
        await api.post('/assignments', formData);
      }
      setShowModal(false);
      resetForm();
      fetchAssignments();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save assignment');
    }
  };

  const deleteAssignment = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    
    try {
      await api.delete(`/assignments/${id}`);
      fetchAssignments();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete assignment');
    }
  };

  const openEditModal = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.due_date.split('T')[0] + 'T' + assignment.due_date.split('T')[1].slice(0, 5),
      onedriveLink: assignment.onedrive_link,
      isForAll: assignment.is_for_all,
      groupIds: []
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingAssignment(null);
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      onedriveLink: '',
      isForAll: true,
      groupIds: []
    });
  };

  const viewAssignmentDetails = async (assignmentId) => {
    try {
      const response = await api.get(`/assignments/admin/${assignmentId}`);
      setSelectedAssignmentDetails(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      alert('Failed to load assignment details');
    }
  };

  const viewSubmissionDetails = async (submissionId) => {
    try {
      const response = await api.get(`/submissions/${submissionId}`);
      setSelectedSubmission(response.data.submission);
      setGradeData({
        grade: response.data.submission.grade || '',
        feedback: response.data.submission.feedback || ''
      });
      setShowReviewModal(true);
    } catch (error) {
      console.error('Error fetching submission:', error);
      alert('Failed to load submission details');
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    try {
      await api.post(`/submissions/grade/${selectedSubmission._id}`, gradeData);
      alert('Grade submitted successfully!');
      setShowReviewModal(false);
      // Refresh assignment details
      if (selectedAssignmentDetails) {
        viewAssignmentDetails(selectedAssignmentDetails.assignment.id);
      }
      fetchAssignments();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit grade');
    }
  };

  const downloadFile = (submissionId, fileIndex, fileName) => {
    const url = `/api/submissions/download/${submissionId}/${fileIndex}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
  };

  if (loading) {
    return <div className="text-center py-8">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Manage Assignments</h2>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Assignment</span>
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          No assignments yet. Create your first assignment!
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{assignment.title}</h3>
                  <p className="text-gray-600 mt-2">{assignment.description}</p>
                  
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                    <span>Due: {new Date(assignment.due_date).toLocaleString()}</span>
                    <span>
                      Submitted: {assignment.submitted_count || 0}/{assignment.total_groups} groups
                    </span>
                    <span className="text-green-600">
                      Graded: {assignment.graded_count || 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => viewAssignmentDetails(assignment.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="View Details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(assignment)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteAssignment(assignment.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows="4"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">OneDrive Link</label>
                <input
                  type="url"
                  value={formData.onedriveLink}
                  onChange={(e) => setFormData({ ...formData, onedriveLink: e.target.value })}
                  className="input"
                  placeholder="https://..."
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isForAll"
                  checked={formData.isForAll}
                  onChange={(e) => setFormData({ ...formData, isForAll: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isForAll" className="text-sm font-medium">
                  Assign to all students
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingAssignment ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Details Modal */}
      {showDetailsModal && selectedAssignmentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Assignment Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Assignment Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-lg mb-2">{selectedAssignmentDetails.assignment.title}</h4>
              <p className="text-gray-600 mb-3">{selectedAssignmentDetails.assignment.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Created by:</span> {selectedAssignmentDetails.assignment.creator_name}
                </div>
                <div>
                  <span className="font-medium">Due Date:</span> {new Date(selectedAssignmentDetails.assignment.due_date).toLocaleString()}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">OneDrive Link:</span>{' '}
                  <a
                    href={selectedAssignmentDetails.assignment.onedrive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Link
                  </a>
                </div>
              </div>
            </div>

            {/* Submissions Table */}
            <div>
              <h4 className="font-semibold mb-3">Group Submissions</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-4 py-2 text-left">Group Name</th>
                      <th className="border px-4 py-2 text-left">Members</th>
                      <th className="border px-4 py-2 text-left">Status</th>
                      <th className="border px-4 py-2 text-left">Grade</th>
                      <th className="border px-4 py-2 text-left">Files</th>
                      <th className="border px-4 py-2 text-left">Submitted By</th>
                      <th className="border px-4 py-2 text-left">Submitted At</th>
                      <th className="border px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAssignmentDetails.submissions.map((submission) => (
                      <tr key={submission.group_id} className="hover:bg-gray-50">
                        <td className="border px-4 py-2">{submission.group_name}</td>
                        <td className="border px-4 py-2">{submission.member_count}</td>
                        <td className="border px-4 py-2">
                          {submission.status === 'graded' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Graded
                            </span>
                          ) : submission.status === 'submitted' || submission.status === 'reviewed' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Not Submitted
                            </span>
                          )}
                        </td>
                        <td className="border px-4 py-2">
                          {submission.grade !== undefined && submission.grade !== null ? (
                            <span className="font-semibold text-green-700">{submission.grade}/100</span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="border px-4 py-2">
                          {submission.file_count > 0 ? (
                            <span className="text-blue-600">{submission.file_count} file(s)</span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="border px-4 py-2">
                          {submission.submitted_by_name || '-'}
                        </td>
                        <td className="border px-4 py-2">
                          {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : '-'}
                        </td>
                        <td className="border px-4 py-2">
                          {submission.submission_id && submission.status !== 'pending' ? (
                            <button
                              onClick={() => viewSubmissionDetails(submission.submission_id)}
                              className="text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                              Review
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {showReviewModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl my-8">
            <h3 className="text-xl font-bold mb-4">Review Submission</h3>

            <div className="space-y-4">
              {/* Submission Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Submitted By:</span> {selectedSubmission.submitted_by_name}
                  </div>
                  <div>
                    <span className="font-medium">Submitted At:</span>{' '}
                    {new Date(selectedSubmission.submittedAt).toLocaleString()}
                  </div>
                  {selectedSubmission.submissionNotes && (
                    <div className="col-span-2">
                      <span className="font-medium">Student Notes:</span>
                      <p className="mt-1 text-gray-700">{selectedSubmission.submissionNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Uploaded Files */}
              {selectedSubmission.uploadedFiles && selectedSubmission.uploadedFiles.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Uploaded Files ({selectedSubmission.uploadedFiles.length})</h4>
                  <div className="space-y-2">
                    {selectedSubmission.uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{file.originalName}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          onClick={() => downloadFile(selectedSubmission._id, index, file.originalName)}
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grading Form */}
              <form onSubmit={handleGradeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Grade (0-100) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradeData.grade}
                    onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Feedback
                  </label>
                  <textarea
                    value={gradeData.feedback}
                    onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                    className="input"
                    rows="4"
                    placeholder="Provide feedback to the student..."
                  />
                </div>

                {selectedSubmission.status === 'graded' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      ✓ This submission has already been graded. You can update the grade and feedback.
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 pt-2">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                  >
                    {selectedSubmission.status === 'graded' ? 'Update Grade' : 'Submit Grade'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagement;
