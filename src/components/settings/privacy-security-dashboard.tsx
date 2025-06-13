"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Eye, 
  Lock, 
  Smartphone,
  Globe,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Monitor,
  Loader2,
  Key,
  Database
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserSession {
  id: string;
  deviceInfo: {
    type: 'mobile' | 'desktop' | 'tablet';
    browser: string;
    os: string;
    location?: string;
  };
  lastActive: Date;
  createdAt: Date;
  isActive: boolean;
  isCurrent: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  workoutSharing: 'public' | 'friends' | 'private';
  showInSearch: boolean;
  dataCollection: boolean;
  analyticsOptOut: boolean;
  marketingEmails: boolean;
}

export function PrivacySecurityDashboard() {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    workoutSharing: 'friends',
    showInSearch: true,
    dataCollection: true,
    analyticsOptOut: false,
    marketingEmails: true
  });

  // Mock sessions data - in real app, fetch from backend
  useEffect(() => {
    const mockSessions: UserSession[] = [
      {
        id: '1',
        deviceInfo: {
          type: 'desktop',
          browser: 'Chrome',
          os: 'Windows',
          location: 'New York, US'
        },
        lastActive: new Date(),
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        isActive: true,
        isCurrent: true
      },
      {
        id: '2',
        deviceInfo: {
          type: 'mobile',
          browser: 'Safari',
          os: 'iOS',
          location: 'New York, US'
        },
        lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        isActive: false,
        isCurrent: false
      }
    ];
    setSessions(mockSessions);
  }, []);

  const handleLogoutSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      // In real app, call API to logout specific session
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Error logging out session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutAllOther = async () => {
    try {
      setIsLoading(true);
      // In real app, call API to logout all other sessions
      setSessions(prev => prev.filter(s => s.isCurrent));
    } catch (error) {
      console.error('Error logging out other sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      // In real app, call API to export user data
      console.log('Exporting user data...');
      // Simulate download
      setTimeout(() => {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent('User data export would be here'));
        element.setAttribute('download', 'gymzy-data-export.json');
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error exporting data:', error);
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        setIsLoading(true);
        // In real app, call API to delete account
        console.log('Deleting account...');
        await logout();
      } catch (error) {
        console.error('Error deleting account:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return Smartphone;
      case 'tablet': return Smartphone;
      default: return Monitor;
    }
  };

  const getSecurityScore = () => {
    let score = 60; // Base score
    if (privacySettings.profileVisibility === 'private') score += 10;
    if (privacySettings.workoutSharing === 'private') score += 10;
    if (!privacySettings.showInSearch) score += 5;
    if (!privacySettings.marketingEmails) score += 5;
    if (privacySettings.analyticsOptOut) score += 10;
    return Math.min(score, 100);
  };

  const securityScore = getSecurityScore();

  return (
    <div className="space-y-6">
      {/* Security Score */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-blue-600">{securityScore}/100</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${
                    securityScore >= 80 ? 'bg-green-500' : 
                    securityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${securityScore}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {securityScore >= 80 ? 'Excellent security!' : 
                 securityScore >= 60 ? 'Good security, room for improvement' : 'Consider improving your privacy settings'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Profile Visibility</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { id: 'public', label: 'Public', description: 'Anyone can see' },
                  { id: 'friends', label: 'Friends', description: 'Friends only' },
                  { id: 'private', label: 'Private', description: 'Only you' }
                ].map((option) => {
                  const isSelected = privacySettings.profileVisibility === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setPrivacySettings(prev => ({ ...prev, profileVisibility: option.id as any }))}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-600">{option.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Workout Sharing</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  { id: 'public', label: 'Public', description: 'Anyone can see' },
                  { id: 'friends', label: 'Friends', description: 'Friends only' },
                  { id: 'private', label: 'Private', description: 'Only you' }
                ].map((option) => {
                  const isSelected = privacySettings.workoutSharing === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setPrivacySettings(prev => ({ ...prev, workoutSharing: option.id as any }))}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-600">{option.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Show in Search Results</Label>
                  <p className="text-sm text-gray-600">Allow others to find you in search</p>
                </div>
                <Switch
                  checked={privacySettings.showInSearch}
                  onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showInSearch: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Data Collection</Label>
                  <p className="text-sm text-gray-600">Allow data collection for app improvement</p>
                </div>
                <Switch
                  checked={privacySettings.dataCollection}
                  onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, dataCollection: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Opt out of Analytics</Label>
                  <p className="text-sm text-gray-600">Disable usage analytics tracking</p>
                </div>
                <Switch
                  checked={privacySettings.analyticsOptOut}
                  onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, analyticsOptOut: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Marketing Emails</Label>
                  <p className="text-sm text-gray-600">Receive promotional emails and updates</p>
                </div>
                <Switch
                  checked={privacySettings.marketingEmails}
                  onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, marketingEmails: checked }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Manage your active sessions across devices</p>
            <Button 
              onClick={handleLogoutAllOther} 
              variant="outline" 
              size="sm"
              disabled={isLoading}
            >
              Logout All Others
            </Button>
          </div>

          <div className="space-y-3">
            {sessions.map((session) => {
              const DeviceIcon = getDeviceIcon(session.deviceInfo.type);
              return (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <DeviceIcon className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {session.deviceInfo.browser} on {session.deviceInfo.os}
                        </span>
                        {session.isCurrent && <Badge variant="secondary" className="text-xs">Current</Badge>}
                        {session.isActive && !session.isCurrent && <Badge variant="outline" className="text-xs">Active</Badge>}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.deviceInfo.location}
                        <span className="mx-1">•</span>
                        <Clock className="h-3 w-3" />
                        Last active {session.lastActive.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      onClick={() => handleLogoutSession(session.id)}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                    >
                      Logout
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleExportData}
              variant="outline"
              disabled={isLoading}
              className="flex items-center gap-2 h-auto p-4"
            >
              <Download className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Export Data</div>
                <div className="text-sm text-gray-600">Download all your data</div>
              </div>
            </Button>

            <Button
              onClick={handleDeleteAccount}
              variant="outline"
              disabled={isLoading}
              className="flex items-center gap-2 h-auto p-4 border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Delete Account</div>
                <div className="text-sm text-gray-600">Permanently delete your account</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {securityScore < 80 && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-yellow-600" />
                <span>Consider making your profile more private to improve security</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-yellow-600" />
              <span>Enable two-factor authentication (coming soon)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-yellow-600" />
              <span>Regularly review your active sessions</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
