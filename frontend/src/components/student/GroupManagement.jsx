import { useState, useEffect } from 'react';
import { Users, Plus, UserPlus, Trash2 } from 'lucide-react';
import api from '../../utils/api';

const GroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [memberEmail, setMemberEmail] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.groups);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setLoading(false);
    }
  };

  const fetchGroupDetails = async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}`);
      setSelectedGroup(response.data.group);
      setGroupMembers(response.data.members);
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/groups', newGroup);
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '' });
      fetchGroups();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create group');
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      await api.post(`/groups/${selectedGroup.id}/members`, {
        emailOrStudentId: memberEmail
      });
      setMemberEmail('');
      setShowAddMemberModal(false);
      fetchGroupDetails(selectedGroup.id);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add member');
    }
  };

  const removeMember = async (userId) => {
    if (!selectedGroup || !window.confirm('Remove this member?')) return;

    try {
      await api.delete(`/groups/${selectedGroup.id}/members/${userId}`);
      fetchGroupDetails(selectedGroup.id);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to remove member');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading groups...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Users className="w-7 h-7 mr-2" />
          My Groups
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Group</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Groups List */}
        <div className="space-y-4">
          {groups.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">
              No groups yet. Create your first group!
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                onClick={() => fetchGroupDetails(group.id)}
                className={`card cursor-pointer hover:shadow-lg transition-shadow ${
                  selectedGroup?.id === group.id ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <h3 className="font-semibold text-lg">{group.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{group.description}</p>
                <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                  <span>{group.member_count} members</span>
                  <span>Created by {group.creator_name}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Group Details */}
        <div>
          {selectedGroup ? (
            <div className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-xl">{selectedGroup.name}</h3>
                  <p className="text-gray-600 mt-1">{selectedGroup.description}</p>
                </div>
                {selectedGroup.creator_id === JSON.parse(localStorage.getItem('user')).id && (
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="btn btn-primary flex items-center space-x-1 text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                )}
              </div>

              <h4 className="font-medium text-gray-700 mb-3">Members ({groupMembers.length})</h4>
              <div className="space-y-2">
                {groupMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{member.full_name}</p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      {member.student_id && (
                        <p className="text-xs text-gray-500">ID: {member.student_id}</p>
                      )}
                    </div>
                    {selectedGroup.creator_id === JSON.parse(localStorage.getItem('user')).id &&
                      member.id !== selectedGroup.creator_id && (
                        <button
                          onClick={() => removeMember(member.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center py-12 text-gray-500">
              Select a group to view details
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create New Group</h3>
            <form onSubmit={createGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Group Name</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="input"
                  rows="3"
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn btn-primary flex-1">Create</button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Group Member</h3>
            <form onSubmit={addMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email or Student ID</label>
                <input
                  type="text"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  className="input"
                  placeholder="student@example.com or ST12345"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn btn-primary flex-1">Add Member</button>
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupManagement;
