
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash, Upload, LogOut } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import LanguageAutocomplete from './LanguageAutocomplete';

interface Language {
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Expert';
  expertConfirmed?: boolean;
}

const InternForm: React.FC = () => {
  const { user, logout, submitInternData, getCurrentUserData } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    college: '',
    photo: '',
    languages: [] as Language[]
  });
  
  const [showExpertDialog, setShowExpertDialog] = useState(false);
  const [expertLanguageIndex, setExpertLanguageIndex] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const existingData = getCurrentUserData();
    if (existingData) {
      setFormData({
        name: existingData.name,
        college: existingData.college,
        photo: existingData.photo,
        languages: existingData.languages
      });
      setSubmitted(true);
    } else if (user) {
      setFormData(prev => ({ ...prev, name: user.name }));
    }
  }, [user, getCurrentUserData]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, photo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addLanguage = () => {
    setFormData(prev => ({
      ...prev,
      languages: [...prev.languages, { name: '', proficiency: 'Beginner' }]
    }));
  };

  const removeLanguage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const updateLanguage = (index: number, field: 'name' | 'proficiency', value: string) => {
    if (field === 'proficiency' && value === 'Expert') {
      setExpertLanguageIndex(index);
      setShowExpertDialog(true);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.map((lang, i) => 
        i === index ? { ...lang, [field]: value } : lang
      )
    }));
  };

  const handleExpertConfirmation = (confirmed: boolean) => {
    if (expertLanguageIndex !== null) {
      setFormData(prev => ({
        ...prev,
        languages: prev.languages.map((lang, i) => 
          i === expertLanguageIndex 
            ? { ...lang, proficiency: 'Expert', expertConfirmed: confirmed }
            : lang
        )
      }));
    }
    setShowExpertDialog(false);
    setExpertLanguageIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.college.trim()) {
      toast({
        title: "College Required",
        description: "Please enter your college or university name",
        variant: "destructive",
      });
      return;
    }

    if (formData.languages.length === 0) {
      toast({
        title: "Programming Languages Required",
        description: "Please add at least one programming language",
        variant: "destructive",
      });
      return;
    }

    // Check if all languages have names
    const emptyLanguages = formData.languages.some(lang => !lang.name.trim());
    if (emptyLanguages) {
      toast({
        title: "Language Names Required",
        description: "Please enter a name for all programming languages",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitInternData(formData);
      setSubmitted(true);
      toast({
        title: "Success!",
        description: "Your details have been submitted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-green-600">Submission Successful!</CardTitle>
            <CardDescription>
              Your details have been submitted successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-6xl">✅</div>
            <p className="text-gray-600">
              Thank you for submitting your information. Your details are now stored permanently and available to the admin team.
            </p>
            <Button onClick={logout} variant="outline" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Intern Registration</h1>
            <p className="text-gray-600">Welcome {user?.name}! Please fill in your details.</p>
          </div>
          <Button onClick={logout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="college">College/University *</Label>
                <Input
                  id="college"
                  value={formData.college}
                  onChange={(e) => setFormData(prev => ({ ...prev, college: e.target.value }))}
                  placeholder="Enter your college or university name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="photo">Upload Photo</Label>
                <div className="flex items-center space-x-4">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="flex-1"
                  />
                  <Upload className="w-5 h-5 text-gray-400" />
                </div>
                {formData.photo && (
                  <div className="mt-2">
                    <img 
                      src={formData.photo} 
                      alt="Preview" 
                      className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Programming Languages *</CardTitle>
              <CardDescription>
                Add the programming languages you know and your proficiency level (at least one required)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.languages.map((language, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <Label>Language Name *</Label>
                    <LanguageAutocomplete
                      value={language.name}
                      onChange={(value) => updateLanguage(index, 'name', value)}
                      placeholder="e.g., JavaScript, Python, Java"
                    />
                  </div>
                  <div className="w-40 space-y-2">
                    <Label>Proficiency</Label>
                    <Select
                      value={language.proficiency}
                      onValueChange={(value) => updateLanguage(index, 'proficiency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeLanguage(index)}
                    className="mt-6"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addLanguage}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Programming Language
              </Button>
              
              {formData.languages.length === 0 && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                  ⚠️ At least one programming language is required
                </p>
              )}
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
          </Button>
        </form>
      </div>

      <Dialog open={showExpertDialog} onOpenChange={setShowExpertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expert Level Confirmation</DialogTitle>
            <DialogDescription>
              Are you capable of creating a project or working independently on a project in this language?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="space-x-2">
            <Button
              variant="outline"
              onClick={() => handleExpertConfirmation(false)}
            >
              No
            </Button>
            <Button
              onClick={() => handleExpertConfirmation(true)}
            >
              Yes, I can work independently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternForm;
