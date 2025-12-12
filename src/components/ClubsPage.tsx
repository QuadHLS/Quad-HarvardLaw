/**
 * ClubsPage Component Dependencies:
 * 
 * Direct Dependencies:
 * - react (React, useState)
 * - lucide-react (icons: Search, Users, Calendar, Award, Gavel, Scale, Globe2, Heart, Briefcase, BookOpen, Camera, Music, TreePine, Utensils, Gamepad2, UserCheck, Zap, Shield, Building, Star, Clock, Bell, BellRing, Settings, ChevronLeft, ChevronRight, Check, TrendingUp, DollarSign, Landmark, Rocket, Activity, Filter)
 * 
 * UI Components (from ./ui/):
 * - Button (./ui/button) - depends on: @radix-ui/react-slot, class-variance-authority, cn utility
 * - Input (./ui/input) - depends on: cn utility
 * - Badge (./ui/badge) - depends on: @radix-ui/react-slot, class-variance-authority, cn utility
 * - Tabs, TabsContent, TabsList, TabsTrigger (./ui/tabs) - depends on: @radix-ui/react-tabs, cn utility
 * - Card, CardContent (./ui/card) - depends on: cn utility
 * - Select, SelectContent, SelectItem, SelectTrigger, SelectValue (./ui/select) - depends on: @radix-ui/react-select, lucide-react (icons), cn utility
 * 
 * Indirect Dependencies (required by UI components):
 * - @radix-ui/react-slot@1.1.2
 * - @radix-ui/react-tabs@1.1.3
 * - @radix-ui/react-select@2.1.6
 * - class-variance-authority@0.7.1
 * - clsx (via ./ui/utils)
 * - tailwind-merge (via ./ui/utils)
 * 
 * Note: ClubDetailPage component (separate file) also uses:
 * - Dialog components (./ui/dialog) - depends on: @radix-ui/react-dialog@1.1.6
 * - Textarea (./ui/textarea) - depends on: cn utility
 */

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Search, Users, Gavel, Globe2, BookOpen, UserCheck, Zap, Star, Activity } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { supabase } from '../lib/supabase';
import { getStorageUrl } from '../utils/storage';
import { Skeleton } from './ui/skeleton';

interface ClubsPageProps {
  onNavigateToClub?: (clubId: string) => void;
}

// Helper function to create URL-friendly slug from club name
const createSlug = (name: string): string => {
  return encodeURIComponent(name.trim());
};

// Accent colors array for cycling through
const accentColors = ['#0080BD', '#04913A', '#FFBB06', '#F22F21'];

const AllGroupsTab = lazy(() => import('./ClubsTabPanels').then(m => ({ default: m.AllGroupsTab })));
const SingleCategoryTab = lazy(() => import('./ClubsTabPanels').then(m => ({ default: m.SingleCategoryTab })));
const MyClubsTab = lazy(() => import('./ClubsTabPanels').then(m => ({ default: m.MyClubsTab })));

export function ClubsPage({ onNavigateToClub }: ClubsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'All Groups' | 'Orgs' | 'Journals' | 'SPOs' | 'My Clubs'>('All Groups');
  const [categoryFilter] = useState<string>('All');
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});

  // Joined clubs - will be populated from member_joins arrays
  const [joinedClubs, setJoinedClubs] = useState<Set<string>>(new Set());

  // Fetch clubs from database
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;

        const { data, error } = await supabase
          .from('club_accounts')
          .select('id, name, description, avatar_url, club_tag, member_joins');

        if (error) {
          console.error('Error fetching clubs:', error?.message || "Unknown error");
          return;
        }

        if (data) {
          // Determine which clubs the user has joined
          const joinedSet = new Set<string>();
          
          // Map database data to club format
          const mappedClubs = data.map((club: any) => {
            // Map club_tag to category (case-insensitive)
            const tag = club.club_tag?.toLowerCase().trim();
            let category = 'Other';
            if (tag === 'student practice organization') {
              category = 'SPOs';
            } else if (tag === 'student organization' || tag === 'student-org') {
              category = 'Orgs';
            } else if (tag === 'journal') {
              category = 'Journals';
            }

            // Count members from member_joins array
            const members = Array.isArray(club.member_joins) ? club.member_joins.length : 0;

            // Check if current user is in member_joins array
            if (currentUserId && Array.isArray(club.member_joins) && club.member_joins.includes(currentUserId)) {
              joinedSet.add(club.id);
            }

            return {
              id: club.id,
              name: club.name || '',
              description: club.description || '',
              category: category,
              members: members,
              avatar_url: club.avatar_url,
              club_tag: club.club_tag
            };
          });

          setClubs(mappedClubs);
          setJoinedClubs(joinedSet);

          // Fetch avatar URLs for all clubs
          const urlPromises = mappedClubs
            .filter((club: any) => club.avatar_url)
            .map(async (club: any) => {
              const url = await getStorageUrl(club.avatar_url, 'Avatar');
              return { id: club.id, url };
            });

          const urls = await Promise.all(urlPromises);
          const urlMap: Record<string, string> = {};
          urls.forEach(({ id, url }) => {
            if (url) urlMap[id] = url;
          });
          setAvatarUrls(urlMap);
        }
      } catch (err) {
        console.error('Error fetching clubs:', err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  const filteredClubs = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    return clubs.filter(club => {
      const matchesSearch = searchLower === '' || 
        (club.name && club.name.toLowerCase().includes(searchLower)) ||
        (club.description && club.description.toLowerCase().includes(searchLower));
      const matchesCategory = categoryFilter === 'All' || club.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [clubs, searchTerm, categoryFilter]);

  const allTopClubs = useMemo(() => {
    return [...filteredClubs].sort((a, b) => b.members - a.members);
  }, [filteredClubs]);

  const top8Clubs = useMemo(() => allTopClubs.slice(0, 8), [allTopClubs]);
  const top8ClubIds = useMemo(() => new Set(top8Clubs.map(club => club.id)), [top8Clubs]);

  const getSPOs = useCallback((excludeTop8: boolean = false) => {
    return filteredClubs.filter(club => {
      const tag = club.club_tag?.toLowerCase().trim();
      const matchesTag = tag === 'student practice organization';
      if (excludeTop8 && top8ClubIds.has(club.id)) return false;
      return matchesTag;
    });
  }, [filteredClubs, top8ClubIds]);
  
  const getAllOrgs = useCallback((excludeTop8: boolean = false) => {
    return filteredClubs.filter(club => {
      const tag = club.club_tag?.toLowerCase().trim();
      const matchesTag = tag === 'student organization' || tag === 'student-org';
      if (excludeTop8 && top8ClubIds.has(club.id)) return false;
      return matchesTag;
    });
  }, [filteredClubs, top8ClubIds]);
  
  const getAllJournals = useCallback((excludeTop8: boolean = false) => {
    return filteredClubs.filter(club => {
      const tag = club.club_tag?.toLowerCase().trim();
      const matchesTag = tag === 'journal';
      if (excludeTop8 && top8ClubIds.has(club.id)) return false;
      return matchesTag;
    });
  }, [filteredClubs, top8ClubIds]);

  const orgCount = useMemo(() => getAllOrgs().length, [getAllOrgs]);
  const journalCount = useMemo(() => getAllJournals().length, [getAllJournals]);
  const spoCount = useMemo(() => getSPOs().length, [getSPOs]);
  const orgsAll = useMemo(() => getAllOrgs(), [getAllOrgs]);
  const orgsExcludingTop = useMemo(() => getAllOrgs(true), [getAllOrgs]);
  const sposAll = useMemo(() => getSPOs(), [getSPOs]);
  const sposExcludingTop = useMemo(() => getSPOs(true), [getSPOs]);
  const journalsAll = useMemo(() => getAllJournals(), [getAllJournals]);
  const journalsExcludingTop = useMemo(() => getAllJournals(true), [getAllJournals]);
  const myClubs = useMemo(() => filteredClubs.filter(club => joinedClubs.has(club.id)), [filteredClubs, joinedClubs]);

  const getAccentColor = (index: number) => {
    return accentColors[index % accentColors.length];
  };

  const formatMemberCount = (count: number): string => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  const renderClubCard = useCallback((club: any, index: number) => {
    const isJoined = joinedClubs.has(club.id);
    const accentColor = getAccentColor(index);
    const avatarUrl = avatarUrls[club.id];
    
    return (
      <Card
        key={club.id}
        className="group cursor-pointer border-none shadow-sm hover:shadow-md transition-all duration-300"
        style={{ backgroundColor: 'white' }}
        onClick={() => {
          const slug = createSlug(club.name || '');
          onNavigateToClub?.(slug || club.id);
        }}
      >
        <CardContent className="p-6">
          <div className="flex gap-6">
            <div 
              className="flex-shrink-0 w-20 h-20 rounded-2xl flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-300"
              style={{ 
                background: `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}10 100%)`,
                border: `2px solid ${accentColor}40`,
                borderRadius: '1rem'
              }}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={club.name}
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <Users className="w-9 h-9 relative z-10" style={{ color: accentColor }} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                      {club.name}
                    </h3>
                    {isJoined && (
                      <Badge 
                        variant="secondary" 
                        className="text-xs px-2 py-0"
                        style={{ 
                          backgroundColor: '#752432', 
                          color: 'white' 
                        }}
                      >
                        Joined
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                    {club.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentColor}15`, borderRadius: '0.5rem' }}>
                    <Users className="w-4 h-4" style={{ color: accentColor }} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatMemberCount(club.members)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [avatarUrls, joinedClubs, onNavigateToClub]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center" style={{ backgroundColor: '#FAF5EF' }}>
        <div className="text-gray-600">Loading clubs...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full" style={{ backgroundColor: '#FAF5EF' }}>
      <div className="flex-1 overflow-y-auto">
        {/* Hero Header Section */}
        <div className="border-b border-gray-200" style={{ backgroundColor: '#FEFBF6' }}>
          <div className="max-w-7xl mx-auto px-8 py-12">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="mb-3">
                  <h1 className="text-4xl font-medium text-gray-900">
                    Clubs
                  </h1>
                </div>
                <p className="text-gray-600 text-lg max-w-2xl">
                  Join official Harvard Law School organizations and student groups
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-none shadow-sm" style={{ backgroundColor: 'white' }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">Student Organizations</p>
                      <p className="text-2xl font-medium text-gray-900">{orgCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0080BD15', borderRadius: '0.75rem' }}>
                      <Users className="w-6 h-6" style={{ color: '#0080BD' }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm" style={{ backgroundColor: 'white' }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">Student Journals</p>
                      <p className="text-2xl font-medium text-gray-900">{journalCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#04913A15', borderRadius: '0.75rem' }}>
                      <Activity className="w-6 h-6" style={{ color: '#04913A' }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm" style={{ backgroundColor: 'white' }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">SPOs</p>
                      <p className="text-2xl font-medium text-gray-900">{spoCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFBB0615', borderRadius: '0.75rem' }}>
                      <Star className="w-6 h-6" style={{ color: '#FFBB06' }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm" style={{ backgroundColor: 'white' }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1">Your Groups</p>
                      <p className="text-2xl font-medium text-gray-900">{joinedClubs.size}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F22F2115', borderRadius: '0.75rem' }}>
                      <Zap className="w-6 h-6" style={{ color: '#F22F21' }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Search and Filter Bar */}
          <div className="flex gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10 pointer-events-none" />
              <Input
                placeholder="Search clubs by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base border-gray-200 rounded-xl shadow-sm bg-white"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center mb-8">
            <div className="p-1 border border-gray-200 shadow-sm inline-flex rounded-lg gap-0.5" style={{ backgroundColor: 'white' }}>
              <button
                onClick={() => setActiveTab('All Groups')}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === 'All Groups' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Globe2 className="w-4 h-4" />
                All Groups
              </button>
              <button
                onClick={() => setActiveTab('Orgs')}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === 'Orgs' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Users className="w-4 h-4" />
                Orgs
              </button>
              <button
                onClick={() => setActiveTab('Journals')}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === 'Journals' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Journals
              </button>
              <button
                onClick={() => setActiveTab('SPOs')}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === 'SPOs' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Gavel className="w-4 h-4" />
                SPOs
              </button>
              <button
                onClick={() => setActiveTab('My Clubs')}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === 'My Clubs' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                My Clubs ({joinedClubs.size})
              </button>
            </div>
          </div>

          <Suspense
            fallback={
              <div className="py-12 text-center text-gray-500">
                <div className="mx-auto max-w-4xl space-y-3">
                  <Skeleton className="h-10 w-48 mx-auto" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </div>
            }
          >
            {activeTab === 'All Groups' && (
              <AllGroupsTab
                top8={top8Clubs}
                orgsExcludingTop={orgsExcludingTop}
                sposExcludingTop={sposExcludingTop}
                journalsExcludingTop={journalsExcludingTop}
                renderCard={renderClubCard}
              />
            )}

            {activeTab === 'Orgs' && (
              <SingleCategoryTab
                items={orgsAll}
                emptyLabel="No organizations found."
                icon={Users}
                renderCard={renderClubCard}
              />
            )}

            {activeTab === 'Journals' && (
              <SingleCategoryTab
                items={journalsAll}
                emptyLabel="No journals found."
                icon={BookOpen}
                renderCard={renderClubCard}
              />
            )}

            {activeTab === 'SPOs' && (
              <SingleCategoryTab items={sposAll} emptyLabel="No SPOs found." icon={Gavel} renderCard={renderClubCard} />
            )}

            {activeTab === 'My Clubs' && <MyClubsTab items={myClubs} renderCard={renderClubCard} />}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
