import { useState, useEffect } from 'react';
import { 
  Users, Plus, UserPlus, Trash2, Search, Filter, 
  MessageCircle, FileText, Bell, TrendingUp, X, Send
} from 'lucide-react';
import api from '../../utils/api';

const EnhancedGroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, messages, resources, announcements
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDiscoverModal, setShowDiscoverModal] = useState(false);

  // Message state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Group stats
  const [groupStats, setGroupStats] = useState(null);

  // Create group form
  const [newGroup, setNewGroup] = useState({ 
    name: '', 
    description: '', 
    category: 'general',
    tags: [],
    isPublic: true,
    maxMembers: 50
  });

  // Discovery and search
  const [discoverGroups, setDiscoverGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  // Join requests
  const [joinRequests, setJoinRequests] = useState([]);
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState(false);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'study', label: '📚 Study Groups' },
    { value: 'project', label: '💻 Project Teams' },
    { value: 'class', label: '🎓 Class Sections' },
    { value: 'general', label: '👥 General' }
  ];

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup && activeTab === 'messages') {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [selectedGroup, activeTab]);

  useEffect(() => {
    if (selectedGroup && activeTab === 'overview') {
      fetchGroupStats();
    }
  }, [selectedGroup, activeTab]);

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

  const fetchMessages = async () => {
    if (!selectedGroup) return;
    try {
      const response = await api.get(`/groups/${selectedGroup.id}/messages?limit=50`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchGroupStats = async () => {
    if (!selectedGroup) return;
    try {
      const response = await api.get(`/groups/${selectedGroup.id}/stats`);
      setGroupStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const searchDiscoverGroups = async () => {
    try {
      let url = '/groups/browse'; // Use browse endpoint to get all public groups
      
      // If there's a search query or filter, use search endpoint instead
      if (searchQuery || filterCategory !== 'all') {
        url = '/groups/search?';
        if (searchQuery) url += `query=${encodeURIComponent(searchQuery)}&`;
        if (filterCategory !== 'all') url += `category=${filterCategory}`;
      }
      
      const response = await api.get(url);
      setDiscoverGroups(response.data.groups);
    } catch (error) {
      console.error('Error searching groups:', error);
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/groups', newGroup);
      setShowCreateModal(false);
      setNewGroup({ 
        name: '', 
        description: '', 
        category: 'general', 
        tags: [],
        isPublic: true,
        maxMembers: 50 
      });
      fetchGroups();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create group');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup) return;

    try {
      await api.post(`/groups/${selectedGroup.id}/messages`, {
        content: newMessage
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to send message');
    }
  };

  const requestToJoin = async (groupId) => {
    try {
      await api.post(`/groups/${groupId}/join`, {
        message: 'I would like to join this group'
      });
      alert('Join request sent!');
      searchDiscoverGroups();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to send join request');
    }
  };

  const fetchJoinRequests = async (groupId) => {
    try {
      const response = await api.get(`/groups/${groupId}/requests`);
      setJoinRequests(response.data.requests || []);
      setShowJoinRequestsModal(true);
    } catch (error) {
      console.error('Error fetching join requests:', error);
      alert(error.response?.data?.error || 'Failed to fetch join requests');
    }
  };

  const approveJoinRequest = async (groupId, userId) => {
    try {
      await api.post(`/groups/${groupId}/approve/${userId}`);
      alert('Join request approved!');
      fetchJoinRequests(groupId);
      fetchGroups(); // Refresh groups list
      if (selectedGroup?.id === groupId) {
        fetchGroupDetails(groupId); // Refresh group details
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to approve request');
    }
  };

  const rejectJoinRequest = async (groupId, userId) => {
    try {
      await api.post(`/groups/${groupId}/reject/${userId}`);
      alert('Join request rejected');
      fetchJoinRequests(groupId);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to reject request');
    }
  };

  const deleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/groups/${groupId}`);
      alert('Group deleted successfully');
      setSelectedGroup(null);
      fetchGroups();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete group');
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      study: '📚',
      project: '💻',
      class: '🎓',
      general: '👥'
    };

    return icons[category] || '👥';
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
        <div className="flex space-x-3">
          <button
            onClick={() => {
              searchDiscoverGroups();
              setShowDiscoverModal(true);
            }}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Search className="w-5 h-5" />
            <span>Discover Groups</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-gray-700">Your Groups ({groups.length})</h3>
          {groups.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">
              No groups yet. Create or join a group!
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                onClick={() => {
                  fetchGroupDetails(group.id);
                  setActiveTab('overview');
                }}
                className={`card cursor-pointer hover:shadow-lg transition-all ${
                  selectedGroup?.id === group.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getCategoryIcon(group.category)}</span>
                      <h3 className="font-semibold text-lg">{group.name}</h3>
                    </div>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{group.description}</p>
                  </div>
                  {group.unread_count > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {group.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {group.member_count} members
                  </span>
                  <span className="text-xs capitalize bg-gray-100 px-2 py-1 rounded">
                    {group.user_role}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Group Details */}
        <div className="md:col-span-2">
          {selectedGroup ? (
            <div className="card">
              <div className="border-b pb-4 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-3xl">{getCategoryIcon(selectedGroup.category)}</span>
                      <h3 className="font-bold text-2xl">{selectedGroup.name}</h3>
                    </div>
                    <p className="text-gray-600 mt-2">{selectedGroup.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedGroup.tags?.map((tag, idx) => (
                        <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Admin Actions */}
                  <div className="flex flex-col gap-2">
                    {groupMembers.find(m => m.id === JSON.parse(localStorage.getItem('user')).id)?.role === 'admin' && (
                      <button
                        onClick={() => fetchJoinRequests(selectedGroup.id)}
                        className="btn btn-secondary text-sm flex items-center space-x-1"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Join Requests</span>
                      </button>
                    )}
                    
                    {selectedGroup.creator_id === JSON.parse(localStorage.getItem('user')).id && (
                      <button
                        onClick={() => deleteGroup(selectedGroup.id)}
                        className="btn bg-red-600 hover:bg-red-700 text-white text-sm flex items-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Group</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-4 border-b mb-4">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-2 px-1 font-medium transition-colors ${
                    activeTab === 'overview' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`pb-2 px-1 font-medium transition-colors ${
                    activeTab === 'messages' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 inline mr-1" />
                  Messages
                </button>
                <button
                  onClick={() => setActiveTab('resources')}
                  className={`pb-2 px-1 font-medium transition-colors ${
                    activeTab === 'resources' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-1" />
                  Resources
                </button>
                <button
                  onClick={() => setActiveTab('announcements')}
                  className={`pb-2 px-1 font-medium transition-colors ${
                    activeTab === 'announcements' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Bell className="w-4 h-4 inline mr-1" />
                  Announcements
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Group Statistics</h4>
                  {groupStats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Members</p>
                        <p className="text-2xl font-bold text-blue-700">{groupStats.total_members}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Messages</p>
                        <p className="text-2xl font-bold text-green-700">{groupStats.total_messages}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">Resources</p>
                        <p className="text-2xl font-bold text-purple-700">{groupStats.total_resources}</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <p className="text-sm text-orange-600 font-medium">Active</p>
                        <p className="text-2xl font-bold text-orange-700">{groupStats.active_members}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Loading stats...</p>
                  )}

                  <h4 className="font-semibold text-lg mt-6">Members ({groupMembers.length})</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {groupMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                        <div>
                          <p className="font-medium">{member.full_name}</p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                          {member.student_id && (
                            <p className="text-xs text-gray-500">ID: {member.student_id}</p>
                          )}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          member.role === 'admin' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'messages' && (
                <div className="space-y-4">
                  <div className="h-96 overflow-y-auto bg-gray-50 p-4 rounded-lg space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</p>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className="bg-white p-3 rounded-lg shadow-sm">
                          <div className="flex items-start justify-between">
                            <p className="font-medium text-sm text-gray-900">
                              {msg.senderId?.fullName || 'Unknown User'}
                            </p>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-700 mt-1">{msg.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={sendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="input flex-1"
                    />
                    <button type="submit" className="btn btn-primary">
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'resources' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-lg">Shared Resources</h4>
                    <button className="btn btn-primary text-sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Upload
                    </button>
                  </div>
                  {selectedGroup.resources?.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No resources shared yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedGroup.resources?.map((resource) => (
                        <div key={resource._id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                          <p className="font-medium">{resource.name}</p>
                          <p className="text-sm text-gray-600">{resource.description}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs text-gray-500">
                              Uploaded by {resource.uploadedBy?.fullName}
                            </span>
                            <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer" 
                              className="text-blue-600 text-sm hover:underline">
                              View
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'announcements' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-lg">Announcements</h4>
                    {groupMembers.find(m => m.id === JSON.parse(localStorage.getItem('user')).id)?.role === 'admin' && (
                      <button className="btn btn-primary text-sm">
                        <Plus className="w-4 h-4 mr-1" />
                        New
                      </button>
                    )}
                  </div>
                  {selectedGroup.announcements?.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No announcements yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedGroup.announcements?.map((announcement) => (
                        <div key={announcement._id} className={`p-4 rounded-lg ${
                          announcement.isPinned ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                        }`}>
                          {announcement.isPinned && (
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">Pinned</span>
                          )}
                          <h5 className="font-semibold mt-2">{announcement.title}</h5>
                          <p className="text-gray-700 mt-1">{announcement.content}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            By {announcement.createdBy?.fullName} • {new Date(announcement.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-24 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Select a group to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Create New Group</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={createGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Group Name *</label>
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
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={newGroup.category}
                  onChange={(e) => setNewGroup({ ...newGroup, category: e.target.value })}
                  className="input"
                >
                  <option value="general">👥 General</option>
                  <option value="study">📚 Study Group</option>
                  <option value="project">💻 Project Team</option>
                  <option value="class">🎓 Class Section</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Members</label>
                <input
                  type="number"
                  value={newGroup.maxMembers}
                  onChange={(e) => setNewGroup({ ...newGroup, maxMembers: parseInt(e.target.value) })}
                  className="input"
                  min="2"
                  max="100"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newGroup.isPublic}
                  onChange={(e) => setNewGroup({ ...newGroup, isPublic: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isPublic" className="text-sm">Make group public (discoverable by others)</label>
              </div>
              <div className="flex space-x-3">
                <button type="submit" className="btn btn-primary flex-1">Create Group</button>
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

      {/* Discover Groups Modal */}
      {showDiscoverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Discover Groups</h3>
              <button onClick={() => setShowDiscoverModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex space-x-3 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups..."
                className="input flex-1"
              />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input w-48"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <button onClick={searchDiscoverGroups} className="btn btn-primary">
                <Search className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {discoverGroups.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No groups found. Try different search criteria.</p>
              ) : (
                discoverGroups.map((group) => (
                  <div key={group.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getCategoryIcon(group.category)}</span>
                          <h4 className="font-semibold text-lg">{group.name}</h4>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{group.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>{group.member_count}/{group.maxMembers} members</span>
                          <span className="capitalize">{group.category}</span>
                        </div>
                      </div>
                      <div>
                        {group.is_member ? (
                          <span className="text-sm text-green-600 font-medium">Joined ✓</span>
                        ) : group.has_pending_request ? (
                          <span className="text-sm text-yellow-600 font-medium">Pending...</span>
                        ) : group.is_full ? (
                          <span className="text-sm text-gray-500">Full</span>
                        ) : (
                          <button
                            onClick={() => requestToJoin(group.id)}
                            className="btn btn-primary text-sm"
                          >
                            Join
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Join Requests Modal */}
      {showJoinRequestsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Join Requests</h3>
              <button onClick={() => setShowJoinRequestsModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-3">
              {joinRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No pending join requests</p>
              ) : (
                joinRequests.map((request) => (
                  <div key={request.user_id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-lg">{request.full_name}</p>
                        <p className="text-sm text-gray-600">{request.email}</p>
                        {request.student_id && (
                          <p className="text-xs text-gray-500 mt-1">Student ID: {request.student_id}</p>
                        )}
                        {request.message && (
                          <p className="text-sm text-gray-700 mt-2 italic">"{request.message}"</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Requested: {new Date(request.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => approveJoinRequest(selectedGroup.id, request.user_id)}
                          className="btn btn-primary text-sm px-4 py-2"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectJoinRequest(selectedGroup.id, request.user_id)}
                          className="btn bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedGroupManagement;
