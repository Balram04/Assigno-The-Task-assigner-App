import { useState } from 'react';
import { Users, FileText, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import EnhancedGroupManagement from '../components/student/EnhancedGroupManagement';
import AssignmentList from '../components/student/AssignmentList';
import ProgressTracker from '../components/student/ProgressTracker';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('assignments');

  const tabs = [
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'groups', label: 'My Groups', icon: Users },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === 'assignments' && <AssignmentList />}
          {activeTab === 'groups' && <EnhancedGroupManagement />}
          {activeTab === 'progress' && <ProgressTracker />}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
