import React, { useState } from 'react';
import { Search, Users, Calendar, Award, Gavel, Scale, Globe2, Heart, Briefcase, BookOpen, Camera, Music, TreePine, Utensils, Gamepad2, UserCheck, Zap, Shield, Building, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

// Mock data for Harvard Law School clubs
export const harvardLawClubs = [
  {
    id: 'hls-student-government',
    name: 'Harvard Law School Student Government',
    category: 'Student Government',
    description: 'The representative body for all HLS students, advocating for student interests and organizing campus-wide events.',
    members: 156,
    founded: 1817,
    icon: Users,
    tags: ['Leadership', 'Advocacy', 'Events']
  },
  {
    id: 'harvard-law-review',
    name: 'Harvard Law Review',
    category: 'Academic',
    description: 'The most prestigious law journal in the United States, publishing scholarship by legal academics and practitioners.',
    members: 90,
    founded: 1887,
    icon: BookOpen,
    tags: ['Publishing', 'Scholarship', 'Writing']
  },
  {
    id: 'black-law-students-association',
    name: 'Black Law Students Association',
    category: 'Diversity & Identity',
    description: 'Supporting Black law students through mentorship, networking, and advocacy for diversity in the legal profession.',
    members: 234,
    founded: 1968,
    icon: Users,
    tags: ['Diversity', 'Mentorship', 'Networking']
  },
  {
    id: 'asian-pacific-american-law-students',
    name: 'Asian Pacific American Law Students Association',
    category: 'Diversity & Identity',
    description: 'Promoting the interests of Asian Pacific American law students and attorneys in the legal community.',
    members: 198,
    founded: 1975,
    icon: Globe2,
    tags: ['Diversity', 'Cultural', 'Professional']
  },
  {
    id: 'lambda',
    name: 'Lambda (LGBTQ+ Law Students)',
    category: 'Diversity & Identity',
    description: 'Supporting LGBTQ+ students and promoting equality and justice in the legal profession.',
    members: 145,
    founded: 1972,
    icon: Heart,
    tags: ['LGBTQ+', 'Equality', 'Justice']
  },
  {
    id: 'harvard-legal-aid-bureau',
    name: 'Harvard Legal Aid Bureau',
    category: 'Public Interest',
    description: 'The oldest student-run legal services office in the country, providing free legal assistance to low-income clients.',
    members: 167,
    founded: 1913,
    icon: Scale,
    tags: ['Pro Bono', 'Legal Aid', 'Community Service']
  },
  {
    id: 'environmental-law-society',
    name: 'Environmental Law Society',
    category: 'Public Interest',
    description: 'Promoting environmental awareness and connecting students with environmental law opportunities.',
    members: 189,
    founded: 1970,
    icon: TreePine,
    tags: ['Environment', 'Sustainability', 'Policy']
  },
  {
    id: 'international-law-society',
    name: 'International Law Society',
    category: 'Academic',
    description: 'Fostering interest in international law through speakers, conferences, and career development.',
    members: 223,
    founded: 1965,
    icon: Globe2,
    tags: ['International', 'Global', 'Diplomacy']
  },
  {
    id: 'criminal-justice-institute',
    name: 'Criminal Justice Institute',
    category: 'Public Interest',
    description: 'Advancing criminal justice reform through research, advocacy, and practical experience.',
    members: 134,
    founded: 1988,
    icon: Shield,
    tags: ['Criminal Justice', 'Reform', 'Advocacy']
  },
  {
    id: 'business-law-association',
    name: 'Business Law Association',
    category: 'Professional',
    description: 'Connecting students interested in corporate law with practitioners and career opportunities.',
    members: 267,
    founded: 1985,
    icon: Briefcase,
    tags: ['Corporate Law', 'Business', 'Networking']
  },
  {
    id: 'intellectual-property-law-society',
    name: 'Intellectual Property Law Society',
    category: 'Professional',
    description: 'Exploring IP law through speakers, competitions, and industry connections.',
    members: 156,
    founded: 1995,
    icon: Zap,
    tags: ['IP Law', 'Technology', 'Innovation']
  },
  {
    id: 'health-law-society',
    name: 'Health Law Society',
    category: 'Professional',
    description: 'Addressing legal issues in healthcare, bioethics, and health policy.',
    members: 178,
    founded: 1980,
    icon: Heart,
    tags: ['Health Law', 'Healthcare', 'Policy']
  },
  {
    id: 'sports-entertainment-law',
    name: 'Sports & Entertainment Law Society',
    category: 'Professional',
    description: 'Exploring legal issues in sports, entertainment, and media industries.',
    members: 145,
    founded: 1992,
    icon: Star,
    tags: ['Sports Law', 'Entertainment', 'Media']
  },
  {
    id: 'real-estate-law-society',
    name: 'Real Estate Law Society',
    category: 'Professional',
    description: 'Connecting students with real estate law practice and development opportunities.',
    members: 123,
    founded: 1998,
    icon: Building,
    tags: ['Real Estate', 'Property Law', 'Development']
  },
  {
    id: 'food-law-society',
    name: 'Food Law Society',
    category: 'Professional',
    description: 'Examining legal issues in food policy, regulation, and agricultural law.',
    members: 89,
    founded: 2010,
    icon: Utensils,
    tags: ['Food Law', 'Agriculture', 'Policy']
  },
  {
    id: 'negotiation-mediation-clinical',
    name: 'Negotiation & Mediation Clinical Program',
    category: 'Academic',
    description: 'Developing skills in alternative dispute resolution and negotiation techniques.',
    members: 67,
    founded: 1983,
    icon: UserCheck,
    tags: ['Negotiation', 'Mediation', 'ADR']
  },
  {
    id: 'moot-court',
    name: 'Board of Student Advisors (Moot Court)',
    category: 'Academic',
    description: 'Training first-year students in legal research, writing, and oral advocacy.',
    members: 156,
    founded: 1910,
    icon: Gavel,
    tags: ['Advocacy', 'Research', 'Teaching']
  },
  {
    id: 'mock-trial',
    name: 'Harvard Law School Mock Trial',
    category: 'Academic',
    description: 'Competing in intercollegiate mock trial competitions and developing trial advocacy skills.',
    members: 89,
    founded: 1995,
    icon: Scale,
    tags: ['Trial Advocacy', 'Competition', 'Litigation']
  },
  {
    id: 'law-school-democrats',
    name: 'Harvard Law School Democrats',
    category: 'Political',
    description: 'Promoting Democratic values and engaging in political advocacy and campaigns.',
    members: 234,
    founded: 1960,
    icon: Users,
    tags: ['Politics', 'Democratic Party', 'Advocacy']
  },
  {
    id: 'law-school-republicans',
    name: 'Harvard Law School Republicans',
    category: 'Political',
    description: 'Advancing conservative principles and Republican ideals within the law school community.',
    members: 167,
    founded: 1962,
    icon: Users,
    tags: ['Politics', 'Republican Party', 'Conservative']
  },
  {
    id: 'federalist-society',
    name: 'Harvard Federalist Society',
    category: 'Political',
    description: 'Promoting conservative and libertarian legal principles through debate and discussion.',
    members: 189,
    founded: 1982,
    icon: Scale,
    tags: ['Conservative', 'Constitutional Law', 'Debate']
  },
  {
    id: 'american-constitution-society',
    name: 'American Constitution Society',
    category: 'Political',
    description: 'Advancing progressive constitutional values and legal scholarship.',
    members: 201,
    founded: 2001,
    icon: BookOpen,
    tags: ['Progressive', 'Constitutional Law', 'Scholarship']
  },
  {
    id: 'womens-law-association',
    name: 'Women\'s Law Association',
    category: 'Diversity & Identity',
    description: 'Supporting women in law through mentorship, networking, and advocacy for gender equality.',
    members: 298,
    founded: 1972,
    icon: Users,
    tags: ['Gender Equality', 'Women', 'Mentorship']
  },
  {
    id: 'native-american-law-students',
    name: 'Native American Law Students Association',
    category: 'Diversity & Identity',  
    description: 'Promoting Native American legal issues and supporting indigenous law students.',
    members: 67,
    founded: 1985,
    icon: Users,
    tags: ['Indigenous Rights', 'Native American', 'Legal Issues']
  },
  {
    id: 'christian-fellowship',
    name: 'Christian Fellowship',
    category: 'Religious',
    description: 'Providing spiritual community and exploring the intersection of faith and law.',
    members: 123,
    founded: 1970,
    icon: Heart,
    tags: ['Christian', 'Faith', 'Community']
  },
  {
    id: 'jewish-law-students',
    name: 'Jewish Law Students Association',
    category: 'Religious',
    description: 'Celebrating Jewish culture and examining Jewish law and ethics.',
    members: 156,
    founded: 1968,
    icon: BookOpen,
    tags: ['Jewish', 'Culture', 'Ethics']
  },
  {
    id: 'muslim-law-students',
    name: 'Muslim Law Students Association',
    category: 'Religious',
    description: 'Supporting Muslim students and exploring Islamic legal principles.',
    members: 89,
    founded: 1995,
    icon: Users,
    tags: ['Muslim', 'Islamic Law', 'Community']
  },
  {
    id: 'photography-club',
    name: 'Harvard Law School Photography Club',
    category: 'Social',
    description: 'Capturing law school life through photography and organizing photo walks around campus.',
    members: 78,
    founded: 2005,
    icon: Camera,
    tags: ['Photography', 'Creative', 'Campus Life']
  },
  {
    id: 'music-society',
    name: 'Harvard Law School Music Society',
    category: 'Social',
    description: 'Bringing together law students who share a passion for music and performance.',
    members: 94,
    founded: 1998,
    icon: Music,
    tags: ['Music', 'Performance', 'Arts']
  },
  {
    id: 'gaming-society',
    name: 'Harvard Law School Gaming Society',
    category: 'Social',
    description: 'Connecting students through board games, video games, and gaming tournaments.',
    members: 112,
    founded: 2012,
    icon: Gamepad2,
    tags: ['Gaming', 'Board Games', 'Social']
  }
];

interface ClubsPageProps {
  onNavigateToClub: (clubId: string) => void;
}

export function ClubsPage({ onNavigateToClub }: ClubsPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Academic', 'Professional', 'Public Interest', 'Diversity & Identity', 'Political', 'Religious', 'Social', 'Student Government'];

  const filteredClubs = harvardLawClubs.filter(club => {
    const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         club.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         club.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Academic': 'bg-blue-100 text-blue-800',
      'Professional': 'bg-green-100 text-green-800',
      'Public Interest': 'bg-purple-100 text-purple-800',
      'Diversity & Identity': 'bg-orange-100 text-orange-800',
      'Political': 'bg-red-100 text-red-800',
      'Religious': 'bg-yellow-100 text-yellow-800',
      'Social': 'bg-pink-100 text-pink-800',
      'Student Government': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} text-gray-800';
  };

  return (
    <div className="h-full" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
      {/* Header */}
      <div className="style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Organizations</h1>
          <p className="text-gray-600">Discover and join student organizations at Harvard Law School</p>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                  style={{ 
                    backgroundColor: selectedCategory === category ? '#752432' : 'transparent',
                    borderColor: '#752432',
                    color: selectedCategory === category ? 'white' : '#752432'
                  }}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="px-8 py-4" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-gray-600">
            Showing {filteredClubs.length} organization{filteredClubs.length !== 1 ? 's' : ''}
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          </p>
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map(club => {
              const IconComponent = club.icon;
              return (
                <div
                  key={club.id}
                  className="style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }} rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onNavigateToClub(club.id)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div 
                      className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: '#f5f1f2' }}
                    >
                      <IconComponent className="w-6 h-6" style={{ color: '#752432' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{club.name}</h3>
                      <Badge className={`text-xs ${getCategoryColor(club.category)}`}>
                        {club.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{club.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {club.members} members
                    </span>
                    <span>Founded {club.founded}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {club.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs rounded-full"
                        style={{ backgroundColor: '#f5f1f2', color: '#752432' }}
                      >
                        {tag}
                      </span>
                    ))}
                    {club.tags.length > 3 && (
                      <span className="px-2 py-1 text-xs text-gray-500 rounded-full style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}">
                        +{club.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}