import { useState, useEffect } from 'react';
import { FileText, ExternalLink, CheckCircle, Clock, AlertCircle, Upload, File, Award, X, Download } from 'lucide-react';
import api from '../../utils/api';

const AssignmentList = () => {
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, groupsRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/groups')
      ]);
      setAssignments(assignmentsRes.data.assignments);
      setGroups(groupsRes.data.groups);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      alert('Maximum 5 files allowed per submission');
      return;
    }
    
    // Check file sizes
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert('Each file must be less than 10MB');
      return;
    }
    
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedGroup) {
      alert('Please select a group');
      return;
    }

    if (selectedFiles.length === 0) {
      alert('Please upload at least one file');
      return;
    }

    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('assignmentId', selectedAssignment.id);
      formData.append('groupId', selectedGroup);
      formData.append('submissionNotes', submissionNotes);
      
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      await api.post('/submissions/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      alert('Assignment submitted successfully!');
      setShowSubmitModal(false);
      setSelectedFiles([]);
      setSubmissionNotes('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (assignment) => {
    const status = assignment.status || 'pending';
    
    switch (status) {
      case 'graded':
        return (
          <div className="text-right">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <Award className="w-4 h-4 mr-1" />
              Graded
            </span>
            {assignment.grade !== undefined && (
              <div className="mt-1 text-sm font-semibold text-green-700">
                Score: {assignment.grade}/100
              </div>
            )}
          </div>
        );
      case 'submitted':
      case 'reviewed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Submitted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="w-4 h-4 mr-1" />
            Not Submitted
          </span>
        );
    }
  };

  const openSubmitModal = (assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmitModal(true);
    setSelectedGroup('');
    setSubmissionNotes('');
    setSelectedFiles([]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="text-center py-8">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <FileText className="w-7 h-7 mr-2" />
        Assignments
      </h2>

      {assignments.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          No assignments available yet
        </div>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">{assignment.title}</h3>
                  <p className="text-gray-600 mt-2">{assignment.description}</p>
                  
                  <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                    <span>Due: {new Date(assignment.due_date).toLocaleString()}</span>
                    <span>Posted by: {assignment.creator_name}</span>
                  </div>

                  {/* Show feedback if graded */}
                  {assignment.status === 'graded' && assignment.feedback && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800 mb-1">Teacher Feedback:</p>
                      <p className="text-sm text-green-700">{assignment.feedback}</p>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 mt-4">
                    <a
                      href={assignment.onedrive_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary flex items-center space-x-2 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View Materials</span>
                    </a>

                    {assignment.status !== 'graded' && (
                      <button
                        onClick={() => openSubmitModal(assignment)}
                        className="btn btn-primary text-sm flex items-center space-x-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{assignment.status === 'submitted' || assignment.status === 'reviewed' ? 'Resubmit' : 'Submit Work'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="ml-4">
                  {getStatusBadge(assignment)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Submit Assignment</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Group *</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Choose a group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.member_count} members)
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Upload Files * (Max 5 files, 10MB each)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.zip"
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, XLS, PPT, Images, TXT, ZIP
                    </p>
                  </label>
                </div>

                {/* Selected Files List */}
                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <File className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                <textarea
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  className="input"
                  rows="3"
                  placeholder="Any additional notes for your teacher..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ Make sure you've uploaded all required files before submitting. 
                  You can resubmit if needed before the assignment is graded.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedGroup || selectedFiles.length === 0}
                  className="btn btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Submit Assignment</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="btn btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentList;
