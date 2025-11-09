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

import { useState, useEffect } from 'react';
import { Search, Users, Gavel, Scale, Globe2, Heart, Briefcase, BookOpen, Camera, Music, TreePine, Utensils, Gamepad2, UserCheck, Zap, Shield, Building, Star, TrendingUp, DollarSign, Landmark, Rocket, Activity } from 'lucide-react';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { supabase } from '../lib/supabase';
import { getStorageUrl } from '../utils/storage';

// Mock data for Harvard Law School clubs
export const harvardLawClubs = [
  {
    id: 'hls-student-government',
    name: 'Harvard Law School Student Government',
    category: 'Leadership',
    section: 'Top',
    description: 'The representative body for all HLS students, advocating for student interests and organizing campus-wide events.',
    members: 856,
    founded: 1817,
    icon: Users,
    tags: ['Leadership', 'Advocacy', 'Events']
  },
  {
    id: 'harvard-law-review',
    name: 'Harvard Law Review',
    category: 'Journals',
    section: 'Journals',
    description: 'The most prestigious law journal in the United States, publishing scholarship by legal academics and practitioners.',
    members: 590,
    founded: 1887,
    icon: BookOpen,
    tags: ['Publishing', 'Scholarship', 'Writing']
  },
  {
    id: 'harvard-business-law-review',
    name: 'Harvard Business Law Review',
    category: 'Journals',
    section: 'Journals',
    description: 'Publishing articles on business law, corporate governance, and commercial transactions.',
    members: 245,
    founded: 2012,
    icon: BookOpen,
    tags: ['Publishing', 'Business Law', 'Corporate']
  },
  {
    id: 'harvard-human-rights-journal',
    name: 'Harvard Human Rights Journal',
    category: 'Journals',
    section: 'Journals',
    description: 'Dedicated to promoting awareness of human rights issues through scholarly publication.',
    members: 312,
    founded: 1988,
    icon: BookOpen,
    tags: ['Human Rights', 'Publishing', 'Scholarship']
  },
  {
    id: 'harvard-environmental-law-review',
    name: 'Harvard Environmental Law Review',
    category: 'Journals',
    section: 'Journals',
    description: 'Publishing cutting-edge scholarship on environmental law and policy.',
    members: 278,
    founded: 1976,
    icon: BookOpen,
    tags: ['Environment', 'Publishing', 'Policy']
  },
  {
    id: 'harvard-international-law-journal',
    name: 'Harvard International Law Journal',
    category: 'Journals',
    section: 'Journals',
    description: 'Exploring international law, foreign relations, and global legal issues.',
    members: 334,
    founded: 1959,
    icon: BookOpen,
    tags: ['International', 'Publishing', 'Global']
  },
  {
    id: 'black-law-students-association',
    name: 'Black Law Students Association',
    category: 'Diversity',
    section: 'Diversity',
    description: 'Supporting Black law students through mentorship, networking, and advocacy for diversity in the legal profession.',
    members: 634,
    founded: 1968,
    icon: Users,
    tags: ['Diversity', 'Mentorship', 'Networking']
  },
  {
    id: 'asian-pacific-american-law-students',
    name: 'Asian Pacific American Law Students Association',
    category: 'Diversity',
    section: 'Diversity',
    description: 'Promoting the interests of Asian Pacific American law students and attorneys in the legal community.',
    members: 498,
    founded: 1975,
    icon: Globe2,
    tags: ['Diversity', 'Cultural', 'Professional']
  },
  {
    id: 'lambda',
    name: 'Lambda (LGBTQ+ Law Students)',
    category: 'Diversity',
    section: 'Diversity',
    description: 'Supporting LGBTQ+ students and promoting equality and justice in the legal profession.',
    members: 445,
    founded: 1972,
    icon: Heart,
    tags: ['LGBTQ+', 'Equality', 'Justice']
  },
  {
    id: 'womens-law-association',
    name: 'Women\'s Law Association',
    category: 'Diversity',
    section: 'Diversity',
    description: 'Supporting women in law through mentorship, networking, and advocacy for gender equality.',
    members: 798,
    founded: 1972,
    icon: Users,
    tags: ['Gender Equality', 'Women', 'Mentorship']
  },
  {
    id: 'harvard-legal-aid-bureau',
    name: 'Harvard Legal Aid Bureau',
    category: 'Public Interest',
    section: 'Public Interest',
    description: 'The oldest student-run legal services office in the country, providing free legal assistance to low-income clients.',
    members: 567,
    founded: 1913,
    icon: Scale,
    tags: ['Pro Bono', 'Legal Aid', 'Community Service']
  },
  {
    id: 'environmental-law-society',
    name: 'Environmental Law Society',
    category: 'Public Interest',
    section: 'Public Interest',
    description: 'Promoting environmental awareness and connecting students with environmental law opportunities.',
    members: 489,
    founded: 1970,
    icon: TreePine,
    tags: ['Environment', 'Sustainability', 'Policy']
  },
  {
    id: 'international-law-society',
    name: 'International Law Society',
    category: 'Academic',
    section: 'Academic',
    description: 'Fostering interest in international law through speakers, conferences, and career development.',
    members: 623,
    founded: 1965,
    icon: Globe2,
    tags: ['International', 'Global', 'Diplomacy']
  },
  {
    id: 'criminal-justice-institute',
    name: 'Criminal Justice Institute',
    category: 'Public Interest',
    section: 'Public Interest',
    description: 'Advancing criminal justice reform through research, advocacy, and practical experience.',
    members: 434,
    founded: 1988,
    icon: Shield,
    tags: ['Criminal Justice', 'Reform', 'Advocacy']
  },
  {
    id: 'business-law-association',
    name: 'Business Law Association',
    category: 'Business',
    section: 'Business',
    description: 'Connecting students interested in corporate law with practitioners and career opportunities.',
    members: 767,
    founded: 1985,
    icon: Briefcase,
    tags: ['Corporate Law', 'Business', 'Networking']
  },
  {
    id: 'venture-capital-private-equity',
    name: 'Venture Capital & Private Equity Club',
    category: 'Business',
    section: 'Business',
    description: 'Exploring investment law, deal structuring, and startup financing.',
    members: 423,
    founded: 2005,
    icon: Briefcase,
    tags: ['VC', 'PE', 'Startup Law']
  },
  {
    id: 'corporate-finance-club',
    name: 'Corporate Finance Club',
    category: 'Business',
    section: 'Business',
    description: 'Examining securities law, M&A, and financial regulations.',
    members: 389,
    founded: 1998,
    icon: Building,
    tags: ['Finance', 'Securities', 'M&A']
  },
  {
    id: 'intellectual-property-law-society',
    name: 'Intellectual Property Law Society',
    category: 'Business',
    section: 'Business',
    description: 'Exploring IP law through speakers, competitions, and industry connections.',
    members: 556,
    founded: 1995,
    icon: Zap,
    tags: ['IP Law', 'Technology', 'Innovation']
  },
  {
    id: 'health-law-society',
    name: 'Health Law Society',
    category: 'Professional',
    section: 'Professional',
    description: 'Addressing legal issues in healthcare, bioethics, and health policy.',
    members: 478,
    founded: 1980,
    icon: Heart,
    tags: ['Health Law', 'Healthcare', 'Policy']
  },
  {
    id: 'sports-entertainment-law',
    name: 'Sports & Entertainment Law Society',
    category: 'Sports',
    section: 'Sports',
    description: 'Exploring legal issues in sports, entertainment, and media industries.',
    members: 545,
    founded: 1992,
    icon: Star,
    tags: ['Sports Law', 'Entertainment', 'Media']
  },
  {
    id: 'real-estate-law-society',
    name: 'Real Estate Law Society',
    category: 'Business',
    section: 'Business',
    description: 'Connecting students with real estate law practice and development opportunities.',
    members: 323,
    founded: 1998,
    icon: Building,
    tags: ['Real Estate', 'Property Law', 'Development']
  },
  {
    id: 'blockchain-cryptocurrency-law',
    name: 'Blockchain & Cryptocurrency Law Society',
    category: 'Business',
    section: 'Business',
    description: 'Exploring legal frameworks for blockchain technology, cryptocurrency, and digital assets.',
    members: 412,
    founded: 2017,
    icon: Zap,
    tags: ['Blockchain', 'Cryptocurrency', 'Digital Assets']
  },
  {
    id: 'mergers-acquisitions-society',
    name: 'Mergers & Acquisitions Society',
    category: 'Business',
    section: 'Business',
    description: 'Deep dive into M&A transactions, deal structuring, and corporate restructuring strategies.',
    members: 456,
    founded: 2003,
    icon: TrendingUp,
    tags: ['M&A', 'Corporate', 'Transactions']
  },
  {
    id: 'tax-law-society',
    name: 'Tax Law Society',
    category: 'Business',
    section: 'Business',
    description: 'Examining federal and international tax law, tax policy, and strategic tax planning.',
    members: 378,
    founded: 1990,
    icon: DollarSign,
    tags: ['Tax Law', 'Tax Policy', 'Planning']
  },
  {
    id: 'banking-financial-regulations',
    name: 'Banking & Financial Regulations Club',
    category: 'Business',
    section: 'Business',
    description: 'Understanding banking law, financial services regulation, and compliance frameworks.',
    members: 367,
    founded: 2008,
    icon: Landmark,
    tags: ['Banking', 'Financial Services', 'Regulation']
  },
  {
    id: 'startup-law-clinic',
    name: 'Startup Law Clinic',
    category: 'Business',
    section: 'Business',
    description: 'Providing legal services to early-stage startups and learning entrepreneurial law hands-on.',
    members: 291,
    founded: 2014,
    icon: Rocket,
    tags: ['Startup Law', 'Entrepreneurship', 'Legal Clinic']
  },
  {
    id: 'international-business-transactions',
    name: 'International Business Transactions Society',
    category: 'Business',
    section: 'Business',
    description: 'Studying cross-border transactions, international trade law, and global business regulations.',
    members: 334,
    founded: 2001,
    icon: Globe2,
    tags: ['International', 'Trade Law', 'Cross-Border']
  },
  {
    id: 'food-law-society',
    name: 'Food Law Society',
    category: 'Professional',
    section: 'Professional',
    description: 'Examining legal issues in food policy, regulation, and agricultural law.',
    members: 189,
    founded: 2010,
    icon: Utensils,
    tags: ['Food Law', 'Agriculture', 'Policy']
  },
  {
    id: 'negotiation-mediation-clinical',
    name: 'Negotiation & Mediation Clinical Program',
    category: 'Academic',
    section: 'Academic',
    description: 'Developing skills in alternative dispute resolution and negotiation techniques.',
    members: 267,
    founded: 1983,
    icon: UserCheck,
    tags: ['Negotiation', 'Mediation', 'ADR']
  },
  {
    id: 'moot-court',
    name: 'Board of Student Advisors (Moot Court)',
    category: 'Academic',
    section: 'Academic',
    description: 'Training first-year students in legal research, writing, and oral advocacy.',
    members: 456,
    founded: 1910,
    icon: Gavel,
    tags: ['Advocacy', 'Research', 'Teaching']
  },
  {
    id: 'mock-trial',
    name: 'Harvard Law School Mock Trial',
    category: 'Academic',
    section: 'Academic',
    description: 'Competing in intercollegiate mock trial competitions and developing trial advocacy skills.',
    members: 289,
    founded: 1995,
    icon: Scale,
    tags: ['Trial Advocacy', 'Competition', 'Litigation']
  },
  {
    id: 'law-school-democrats',
    name: 'Harvard Law School Democrats',
    category: 'Political',
    section: 'Political',
    description: 'Promoting Democratic values and engaging in political advocacy and campaigns.',
    members: 534,
    founded: 1960,
    icon: Users,
    tags: ['Politics', 'Democratic Party', 'Advocacy']
  },
  {
    id: 'law-school-republicans',
    name: 'Harvard Law School Republicans',
    category: 'Political',
    section: 'Political',
    description: 'Advancing conservative principles and Republican ideals within the law school community.',
    members: 467,
    founded: 1962,
    icon: Users,
    tags: ['Politics', 'Republican Party', 'Conservative']
  },
  {
    id: 'federalist-society',
    name: 'Harvard Federalist Society',
    category: 'Political',
    section: 'Political',
    description: 'Promoting conservative and libertarian legal principles through debate and discussion.',
    members: 489,
    founded: 1982,
    icon: Scale,
    tags: ['Conservative', 'Constitutional Law', 'Debate']
  },
  {
    id: 'american-constitution-society',
    name: 'American Constitution Society',
    category: 'Political',
    section: 'Political',
    description: 'Advancing progressive constitutional values and legal scholarship.',
    members: 501,
    founded: 2001,
    icon: BookOpen,
    tags: ['Progressive', 'Constitutional Law', 'Scholarship']
  },
  {
    id: 'native-american-law-students',
    name: 'Native American Law Students Association',
    category: 'Diversity',
    section: 'Diversity',
    description: 'Promoting Native American legal issues and supporting indigenous law students.',
    members: 167,
    founded: 1985,
    icon: Users,
    tags: ['Indigenous Rights', 'Native American', 'Legal Issues']
  },
  {
    id: 'christian-fellowship',
    name: 'Christian Fellowship',
    category: 'Social',
    section: 'Social',
    description: 'Providing spiritual community and exploring the intersection of faith and law.',
    members: 323,
    founded: 1970,
    icon: Heart,
    tags: ['Christian', 'Faith', 'Community']
  },
  {
    id: 'jewish-law-students',
    name: 'Jewish Law Students Association',
    category: 'Social',
    section: 'Social',
    description: 'Celebrating Jewish culture and examining Jewish law and ethics.',
    members: 456,
    founded: 1968,
    icon: BookOpen,
    tags: ['Jewish', 'Culture', 'Ethics']
  },
  {
    id: 'muslim-law-students',
    name: 'Muslim Law Students Association',
    category: 'Social',
    section: 'Social',
    description: 'Supporting Muslim students and exploring Islamic legal principles.',
    members: 289,
    founded: 1995,
    icon: Users,
    tags: ['Muslim', 'Islamic Law', 'Community']
  },
  {
    id: 'photography-club',
    name: 'Harvard Law School Photography Club',
    category: 'Social',
    section: 'Social',
    description: 'Capturing law school life through photography and organizing photo walks around campus.',
    members: 178,
    founded: 2005,
    icon: Camera,
    tags: ['Photography', 'Creative', 'Campus Life']
  },
  {
    id: 'music-society',
    name: 'Harvard Law School Music Society',
    category: 'Social',
    section: 'Social',
    description: 'Bringing together law students who share a passion for music and performance.',
    members: 294,
    founded: 1998,
    icon: Music,
    tags: ['Music', 'Performance', 'Arts']
  },
  {
    id: 'gaming-society',
    name: 'Harvard Law School Gaming Society',
    category: 'Social',
    section: 'Social',
    description: 'Connecting students through board games, video games, and gaming tournaments.',
    members: 312,
    founded: 2012,
    icon: Gamepad2,
    tags: ['Gaming', 'Board Games', 'Social']
  }
];

interface ClubsPageProps {
  onNavigateToClub?: (clubId: string) => void;
}

// Helper function to create URL-friendly slug from club name
const createSlug = (name: string): string => {
  return encodeURIComponent(name.trim());
};

// Accent colors array for cycling through
const accentColors = ['#0080BD', '#04913A', '#FFBB06', '#F22F21'];

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
            } else if (tag === 'student organization') {
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

  // Filter clubs based on search and category
  const filteredClubs = clubs.filter(club => {
    // Search by name or description
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = searchLower === '' || 
                         (club.name && club.name.toLowerCase().includes(searchLower)) ||
                         (club.description && club.description.toLowerCase().includes(searchLower));
    
    // Category filter (not used in current UI but kept for compatibility)
    const matchesCategory = categoryFilter === 'All' || club.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get top clubs by member count (all clubs sorted by members)
  const topClubs = [...filteredClubs]
    .sort((a, b) => b.members - a.members);

  // Get all SPOs - using club_tag directly (case-insensitive)
  const getSPOs = () => {
    return filteredClubs.filter(club => {
      const tag = club.club_tag?.toLowerCase().trim();
      return tag === 'student practice organization';
    });
  };
  
  // Get all Orgs - using club_tag directly (case-insensitive)
  const getAllOrgs = () => {
    return filteredClubs.filter(club => {
      const tag = club.club_tag?.toLowerCase().trim();
      return tag === 'student organization';
    });
  };
  
  // Get all Journals - using club_tag directly (case-insensitive)
  const getAllJournals = () => {
    return filteredClubs.filter(club => {
      const tag = club.club_tag?.toLowerCase().trim();
      return tag === 'journal';
    });
  };

  const getAccentColor = (index: number) => {
    return accentColors[index % accentColors.length];
  };

  const formatMemberCount = (count: number): string => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  const renderClubCard = (club: any, index: number) => {
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
            {/* Avatar/Icon with gradient background */}
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

            {/* Content */}
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

              {/* Footer */}
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
  };

  const renderSectionWithPagination = (section: string, sectionClubs: any[], startIndex: number = 0) => {
    return (
      <div key={section} style={{ marginBottom: '2rem' }}>
        <div className="flex items-center mb-6">
          <h2 className="text-2xl font-medium text-gray-900">{section}</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sectionClubs.map((club, index) => renderClubCard(club, startIndex + index))}
        </div>
      </div>
    );
  };

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
                      <p className="text-2xl font-medium text-gray-900">{clubs.filter(c => {
                        const tag = c.club_tag?.toLowerCase().trim();
                        return tag === 'student organization';
                      }).length}</p>
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
                      <p className="text-2xl font-medium text-gray-900">{clubs.filter(c => {
                        const tag = c.club_tag?.toLowerCase().trim();
                        return tag === 'journal';
                      }).length}</p>
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
                      <p className="text-2xl font-medium text-gray-900">{clubs.filter(c => {
                        const tag = c.club_tag?.toLowerCase().trim();
                        return tag === 'student practice organization';
                      }).length}</p>
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

          {/* Tab Content */}
          {activeTab === 'All Groups' && (
            <div className="mt-0">
              <div>
                {/* Top Clubs */}
                {topClubs.length > 0 && renderSectionWithPagination('Top', topClubs, 0)}
                
                {/* Orgs */}
                {(() => {
                  const orgs = getAllOrgs();
                  if (orgs.length > 0) {
                    return renderSectionWithPagination('Orgs', orgs, topClubs.length);
                  }
                  return null;
                })()}
                
                {/* SPOs */}
                {(() => {
                  const spos = getSPOs();
                  if (spos.length > 0) {
                    const orgs = getAllOrgs();
                    return renderSectionWithPagination('SPOs', spos, topClubs.length + orgs.length);
                  }
                  return null;
                })()}
                
                {/* Journals */}
                {(() => {
                  const journals = getAllJournals();
                  if (journals.length > 0) {
                    const orgs = getAllOrgs();
                    const spos = getSPOs();
                    return renderSectionWithPagination('Journals', journals, topClubs.length + orgs.length + spos.length);
                  }
                  return null;
                })()}
              </div>
            </div>
          )}

          {/* Orgs Tab */}
          {activeTab === 'Orgs' && (
            <div className="mt-0">
              <div>
                {(() => {
                  const orgClubs = getAllOrgs();
                  if (orgClubs.length === 0) {
                    return (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#F8F4ED' }}>
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-lg">No organizations found.</p>
                      </div>
                    );
                  }
                  return renderSectionWithPagination('Orgs', orgClubs, 0);
                })()}
              </div>
            </div>
          )}

          {/* Journals Tab */}
          {activeTab === 'Journals' && (
            <div className="mt-0">
              <div>
                {(() => {
                  const journalClubs = getAllJournals();
                  if (journalClubs.length === 0) {
                    return (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#F8F4ED' }}>
                          <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-lg">No journals found.</p>
                      </div>
                    );
                  }
                  return renderSectionWithPagination('Journals', journalClubs, 0);
                })()}
              </div>
            </div>
          )}

          {/* SPOs Tab */}
          {activeTab === 'SPOs' && (
            <div className="mt-0">
              <div>
                {(() => {
                  const spoClubs = getSPOs();
                  if (spoClubs.length === 0) {
                    return (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#F8F4ED' }}>
                          <Gavel className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-lg">No SPOs found.</p>
                      </div>
                    );
                  }
                  return renderSectionWithPagination('SPOs', spoClubs, 0);
                })()}
              </div>
            </div>
          )}

          {/* My Clubs Tab */}
          {activeTab === 'My Clubs' && (
            <div className="mt-0">
              <div>
                {(() => {
                  const myClubs = filteredClubs.filter(club => joinedClubs.has(club.id));
                  if (myClubs.length === 0) {
                    return (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#F8F4ED' }}>
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-lg">You haven't joined any clubs yet.</p>
                        <p className="text-gray-400 text-sm mt-2">Explore clubs in the other tabs to get started!</p>
                      </div>
                    );
                  }
                  return renderSectionWithPagination('My Clubs', myClubs, 0);
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
