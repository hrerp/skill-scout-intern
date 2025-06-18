
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Download, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard: React.FC = () => {
  const { user, interns, logout } = useAuth();
  const { toast } = useToast();

  const exportData = () => {
    const dataStr = JSON.stringify(interns, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'intern-data.json';
    link.click();
    
    toast({
      title: "Data Exported",
      description: "Intern data has been downloaded successfully",
    });
  };

  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency) {
      case 'Beginner': return 'bg-yellow-100 text-yellow-800';
      case 'Intermediate': return 'bg-blue-100 text-blue-800';
      case 'Expert': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.name}! Manage intern submissions here.</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={exportData} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button onClick={logout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="w-8 h-8 text-blue-600 mr-4" />
              <div>
                <p className="text-2xl font-bold">{interns.length}</p>
                <p className="text-gray-600">Total Interns</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-green-600 font-bold">E</span>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {interns.filter(intern => 
                    intern.languages.some(lang => lang.proficiency === 'Expert')
                  ).length}
                </p>
                <p className="text-gray-600">Expert Level</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-purple-600 font-bold">L</span>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {interns.reduce((acc, intern) => acc + intern.languages.length, 0)}
                </p>
                <p className="text-gray-600">Total Skills</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {interns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Submissions Yet</h3>
              <p className="text-gray-500">Intern submissions will appear here once they register.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {interns.map((intern) => (
              <Card key={intern.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    {intern.photo && (
                      <img 
                        src={intern.photo} 
                        alt={intern.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-xl">{intern.name}</CardTitle>
                      <CardDescription>{intern.college}</CardDescription>
                      <p className="text-sm text-gray-500">
                        Submitted: {new Date(intern.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold mb-2">Programming Languages:</h4>
                      <div className="flex flex-wrap gap-2">
                        {intern.languages.map((language, index) => (
                          <div key={index} className="flex items-center space-x-1">
                            <Badge variant="outline" className="font-medium">
                              {language.name}
                            </Badge>
                            <Badge className={getProficiencyColor(language.proficiency)}>
                              {language.proficiency}
                              {language.proficiency === 'Expert' && language.expertConfirmed && ' ✓'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {intern.languages.some(lang => lang.proficiency === 'Expert' && lang.expertConfirmed) && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 font-medium">
                          ✅ Confirmed independent project capability in expert languages
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
