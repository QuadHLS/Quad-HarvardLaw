import React, { useState } from 'react';
import { Search, MapPin, Clock, Star, Phone, Globe, Utensils, Coffee, Book, Shirt, Home, Calendar, MessageSquare, ExternalLink, Gift, Newspaper, Building2, Wifi, Car, HeartHandshake, GraduationCap, TreePine, Music, Dumbbell, Gamepad2, ShoppingBag, DollarSign, User, Package } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Mock data for nearby restaurants
const nearbyRestaurants = [
  {
    id: '1',
    name: 'Bartley\'s Burger Cottage',
    category: 'American',
    address: '1246 Massachusetts Ave, Cambridge, MA',
    distance: '0.3 miles',
    rating: 4.2,
    priceRange: '$$',
    hours: '11:30 AM - 9:00 PM',
    phone: '(617) 354-6559',
    description: 'Famous Harvard Square burger joint known for creative burgers named after political figures.',
    image: '🍔'
  },
  {
    id: '2',
    name: 'Grendel\'s Den',
    category: 'American/International',
    address: '89 Winthrop St, Cambridge, MA',
    distance: '0.2 miles',
    rating: 4.1,
    priceRange: '$$',
    hours: '11:00 AM - 12:00 AM',
    phone: '(617) 491-1160',
    description: 'Casual restaurant and bar with eclectic menu and Harvard Square atmosphere.',
    image: '🍽️'
  },
  {
    id: '3',
    name: 'Felipe\'s Taqueria',
    category: 'Mexican',
    address: '21 Brattle St, Cambridge, MA',
    distance: '0.1 miles',
    rating: 4.3,
    priceRange: '$',
    hours: '11:00 AM - 11:00 PM',
    phone: '(617) 354-9944',
    description: 'Popular burrito spot with fresh ingredients and generous portions.',
    image: '🌯'
  },
  {
    id: '4',
    name: 'Clover Food Lab',
    category: 'Vegetarian',
    address: '7 Holyoke St, Cambridge, MA',
    distance: '0.1 miles',
    rating: 4.0,
    priceRange: '$',
    hours: '8:00 AM - 10:00 PM',
    phone: '(617) 945-0637',
    description: 'Fast-casual vegetarian restaurant with fresh, local ingredients.',
    image: '🥗'
  },
  {
    id: '5',
    name: 'Pinocchio\'s Pizza',
    category: 'Pizza',
    address: '74 Winthrop St, Cambridge, MA',
    distance: '0.2 miles',
    rating: 3.9,
    priceRange: '$',
    hours: '11:00 AM - 2:00 AM',
    phone: '(617) 876-4897',
    description: 'Late-night pizza favorite among Harvard students since 1965.',
    image: '🍕'
  },
  {
    id: '6',
    name: 'Sandrine\'s Bistro',
    category: 'French',
    address: '8 Holyoke St, Cambridge, MA',
    distance: '0.1 miles',
    rating: 4.4,
    priceRange: '$$$',
    hours: '5:30 PM - 10:00 PM',
    phone: '(617) 497-5300',
    description: 'Upscale French bistro perfect for special occasions or date nights.',
    image: '🇫🇷'
  }
];

// Mock data for local vendors
const localVendors = [
  {
    id: '1',
    name: 'Harvard Coop',
    category: 'Books & Merchandise',
    address: '1400 Massachusetts Ave, Cambridge, MA',
    distance: '0.1 miles',
    hours: '9:00 AM - 11:00 PM',
    phone: '(617) 499-2000',
    description: 'Official Harvard bookstore with textbooks, merchandise, and school supplies.',
    image: '📚'
  },
  {
    id: '2',
    name: 'CVS Pharmacy',
    category: 'Pharmacy/Convenience',
    address: '36 JFK St, Cambridge, MA',
    distance: '0.1 miles',
    hours: '7:00 AM - 12:00 AM',
    phone: '(617) 876-6519',
    description: 'Pharmacy and convenience store for everyday essentials.',
    image: '💊'
  },
  {
    id: '3',
    name: 'Urban Outfitters',
    category: 'Clothing',
    address: '11 JFK St, Cambridge, MA',
    distance: '0.1 miles',
    hours: '10:00 AM - 9:00 PM',
    phone: '(617) 864-0070',
    description: 'Trendy clothing and lifestyle brand popular with college students.',
    image: '👕'
  },
  {
    id: '4',
    name: 'Bank of America',
    category: 'Banking',
    address: '1414 Massachusetts Ave, Cambridge, MA',
    distance: '0.1 miles',
    hours: '9:00 AM - 5:00 PM',
    phone: '(617) 225-2045',
    description: 'Full-service bank with ATMs and student banking services.',
    image: '🏦'
  },
  {
    id: '5',
    name: 'Crimson Corner',
    category: 'Convenience',
    address: '59 JFK St, Cambridge, MA',
    distance: '0.2 miles',
    hours: '6:00 AM - 2:00 AM',
    phone: '(617) 547-2255',
    description: 'Late-night convenience store and deli with snacks and essentials.',
    image: '🏪'
  }
];

// Mock data for free stuff around campus
const freeStuff = [
  {
    id: '1',
    title: 'Widener Library WiFi',
    category: 'Internet',
    location: 'Widener Library',
    description: 'Free high-speed WiFi available throughout the library with Harvard ID.',
    available: '24/7',
    icon: Wifi
  },
  {
    id: '2',
    title: 'Student Organization Events',
    category: 'Food & Entertainment',
    location: 'Various Campus Locations',
    description: 'Many student orgs host free events with food, speakers, and networking.',
    available: 'Check student calendar',
    icon: HeartHandshake
  },
  {
    id: '3',
    title: 'Hark Box Free Meals',
    category: 'Food',
    location: 'Student Center',
    description: 'Free meals available for students in need through the Hark Box program.',
    available: 'Daily during meal hours',
    icon: Gift
  },
  {
    id: '4',
    title: 'Lamont Library Study Spaces',
    category: 'Study',
    location: 'Lamont Library',
    description: 'Free quiet study spaces, group rooms, and computer access.',
    available: '24/7 with ID',
    icon: Book
  },
  {
    id: '5',
    title: 'Campus Shuttle Service',
    category: 'Transportation',
    location: 'Various Campus Stops',
    description: 'Free shuttle service connecting different parts of campus.',
    available: 'Daily 7AM-7PM',
    icon: Car
  },
  {
    id: '6',
    title: 'Recreational Sports',
    category: 'Fitness',
    location: 'Malkin Athletic Center',
    description: 'Free access to recreational sports facilities and group fitness classes.',
    available: 'Daily 6AM-11PM',
    icon: Dumbbell
  }
];

// Mock data for campus news
const campusNews = [
  {
    id: '1',
    title: 'HLS Launches New Public Interest Fellowship Program',
    date: '2024-03-10',
    category: 'Academic',
    summary: 'The fellowship will provide funding for 20 students to work at public interest organizations this summer.',
    readTime: '3 min read'
  },
  {
    id: '2',
    title: 'Spring Break Pro Bono Trip to Immigration Courts',
    date: '2024-03-08',
    category: 'Student Life',
    summary: 'Students will travel to Texas border to provide legal assistance to asylum seekers.',
    readTime: '4 min read'
  },
  {
    id: '3',
    title: 'New Dining Options Coming to Langdell Library',
    date: '2024-03-05',
    category: 'Campus Life',
    summary: 'Construction begins this summer on a new café and study space in the library.',
    readTime: '2 min read'
  },
  {
    id: '4',
    title: 'Harvard Law Review Announces New Editorial Board',
    date: '2024-03-03',
    category: 'Academic',
    summary: 'The prestigious law review has selected its new student leadership for the coming year.',
    readTime: '3 min read'
  },
  {
    id: '5',
    title: 'Mental Health Resources Expanded for Students',
    date: '2024-03-01',
    category: 'Student Services',
    summary: 'New counseling services and wellness programs launched to support student mental health.',
    readTime: '4 min read'
  }
];

// Mock data for dorms and housing
const dormInfo = [
  {
    id: '1',
    name: 'Gropius Complex',
    type: 'Graduate Housing',
    address: '24 Oxford St, Cambridge, MA',
    description: 'Modern apartment-style housing for graduate students with kitchen facilities.',
    amenities: ['Kitchen', 'Laundry', 'Study Room', 'Parking'],
    updates: [
      { date: '2024-03-08', message: 'New laundry machines installed in basement' },
      { date: '2024-02-15', message: 'Heating system maintenance completed' }
    ]
  },
  {
    id: '2',
    name: 'Child Hall',
    type: 'Law Student Housing',
    address: '1441 Massachusetts Ave, Cambridge, MA',
    description: 'Traditional dormitory housing specifically for law students.',
    amenities: ['Common Kitchen', 'Study Lounge', 'Bike Storage'],
    updates: [
      { date: '2024-03-10', message: 'WiFi upgrade completed in all rooms' },
      { date: '2024-02-28', message: 'New security system installed' }
    ]
  },
  {
    id: '3',
    name: 'Hastings Hall',
    type: 'Graduate Housing',
    address: '65 Prescott St, Cambridge, MA',
    description: 'Suite-style housing with shared common areas and study spaces.',
    amenities: ['Fitness Room', 'Piano Room', 'Rooftop Deck', 'Computer Lab'],
    updates: [
      { date: '2024-03-05', message: 'Rooftop deck reopened after winter maintenance' },
      { date: '2024-02-20', message: 'New fitness equipment added to gym' }
    ]
  },
  {
    id: '4',
    name: 'Botanic Gardens Apartments',
    type: 'Family Housing',
    address: '100 Botanic Gardens Rd, Cambridge, MA',
    description: 'Family-friendly housing with 1-3 bedroom apartments and playground.',
    amenities: ['Playground', 'Community Garden', 'Parking', 'Pet-Friendly'],
    updates: [
      { date: '2024-03-07', message: 'Spring community garden planning meeting scheduled' },
      { date: '2024-02-25', message: 'Playground equipment inspection completed' }
    ]
  }
];

// Mock data for marketplace listings
const marketplaceListings = [
  {
    id: '1',
    title: 'Constitutional Law Casebook (8th Edition)',
    price: 120,
    originalPrice: 350,
    category: 'Textbooks',
    condition: 'Like New',
    seller: 'Sarah M.',
    sellerYear: '2L',
    location: 'Gropius Complex',
    postedDate: '2024-03-10',
    description: 'Barely used constitutional law casebook. Only minor highlighting. Perfect for 1L year.',
    images: ['📚'],
    tags: ['Constitutional Law', '1L', 'Casebook']
  },
  {
    id: '2',
    title: 'IKEA Desk Lamp - White',
    price: 15,
    originalPrice: 25,
    category: 'Furniture',
    condition: 'Good',
    seller: 'Mike R.',
    sellerYear: '3L',
    location: 'Child Hall',
    postedDate: '2024-03-09',
    description: 'Great desk lamp for studying. Moving out so need to sell quickly.',
    images: ['💡'],
    tags: ['Study', 'Lighting', 'Dorm']
  },
  {
    id: '3',
    title: 'Coffee Maker - Single Serve',
    price: 35,
    originalPrice: 80,
    category: 'Appliances',
    condition: 'Excellent',
    seller: 'Emma T.',
    sellerYear: '1L',
    location: 'Hastings Hall',
    postedDate: '2024-03-08',
    description: 'Perfect for dorm life. Makes excellent coffee for those late study nights.',
    images: ['☕'],
    tags: ['Coffee', 'Appliances', 'Study']
  },
  {
    id: '4',
    title: 'Contracts Outline Bundle (3 Outlines)',
    price: 40,
    originalPrice: 60,
    category: 'Study Materials',
    condition: 'New',
    seller: 'David K.',
    sellerYear: '2L',
    location: 'Cambridge',
    postedDate: '2024-03-07',
    description: 'Comprehensive contract law outlines from top students. Includes attack outlines.',
    images: ['📄'],
    tags: ['Contracts', 'Outlines', '1L']
  },
  {
    id: '5',
    title: 'Mini Fridge - Perfect for Dorms',
    price: 80,
    originalPrice: 150,
    category: 'Appliances',
    condition: 'Good',
    seller: 'Jessica L.',
    sellerYear: '3L',
    location: 'Botanic Gardens',
    postedDate: '2024-03-06',
    description: 'Compact refrigerator perfect for storing snacks and drinks. Graduating soon!',
    images: ['❄️'],
    tags: ['Dorm', 'Appliances', 'Storage']
  },
  {
    id: '6',
    title: 'Professional Blazer - Navy Blue (Size M)',
    price: 45,
    originalPrice: 120,
    category: 'Clothing',
    condition: 'Like New',
    seller: 'Rachel P.',
    sellerYear: '2L',
    location: 'Child Hall',
    postedDate: '2024-03-05',
    description: 'Professional blazer worn only twice. Perfect for interviews and networking events.',
    images: ['👔'],
    tags: ['Professional', 'Interviews', 'Business Attire']
  },
  {
    id: '7',
    title: 'Torts Textbook + Study Guide',
    price: 90,
    originalPrice: 280,
    category: 'Textbooks',
    condition: 'Good',
    seller: 'Alex C.',
    sellerYear: '2L',
    location: 'Gropius Complex',
    postedDate: '2024-03-04',
    description: 'Torts textbook with companion study guide. Some highlighting but still in great shape.',
    images: ['📖'],
    tags: ['Torts', '1L', 'Study Guide']
  },
  {
    id: '8',
    title: 'Desk Chair - Ergonomic Office Chair',
    price: 60,
    originalPrice: 180,
    category: 'Furniture',
    condition: 'Good',
    seller: 'Tom W.',
    sellerYear: '3L',
    location: 'Hastings Hall',
    postedDate: '2024-03-03',
    description: 'Comfortable desk chair that got me through law school. Minor wear but very functional.',
    images: ['🪑'],
    tags: ['Furniture', 'Study', 'Comfort']
  },
  {
    id: '9',
    title: 'Legal Writing Supplies Bundle',
    price: 25,
    originalPrice: 45,
    category: 'School Supplies',
    condition: 'New',
    seller: 'Lisa H.',
    sellerYear: '1L',
    location: 'Cambridge',
    postedDate: '2024-03-02',
    description: 'Complete set of legal writing supplies including bluebook, legal pads, and highlighters.',
    images: ['✏️'],
    tags: ['Legal Writing', 'Supplies', 'Bluebook']
  },
  {
    id: '10',
    title: 'Property Law Flash Cards (500 cards)',
    price: 20,
    originalPrice: 35,
    category: 'Study Materials',
    condition: 'Like New',
    seller: 'James B.',
    sellerYear: '2L',
    location: 'Child Hall',
    postedDate: '2024-03-01',
    description: 'Comprehensive property law flash cards. Never used, bought but used different study method.',
    images: ['🃏'],
    tags: ['Property Law', 'Flash Cards', 'Study']
  },
  {
    id: '11',
    title: 'Bookshelf - 5 Shelf Unit',
    price: 40,
    originalPrice: 85,
    category: 'Furniture',
    condition: 'Good',
    seller: 'Maya S.',
    sellerYear: '3L',
    location: 'Botanic Gardens',
    postedDate: '2024-02-28',
    description: 'Sturdy bookshelf perfect for storing casebooks and study materials. Easy to assemble.',
    images: ['📚'],
    tags: ['Storage', 'Books', 'Organization']
  },
  {
    id: '12',
    title: 'Printer + Scanner Combo',
    price: 75,
    originalPrice: 150,
    category: 'Electronics',
    condition: 'Excellent',
    seller: 'Kevin D.',
    sellerYear: '2L',
    location: 'Gropius Complex',
    postedDate: '2024-02-27',
    description: 'All-in-one printer perfect for printing outlines, cases, and assignments. Includes extra ink.',
    images: ['🖨️'],
    tags: ['Printer', 'Study', 'Office']
  }
];

export function ExplorePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Restaurants', 'Vendors', 'Marketplace', 'Free Stuff', 'News', 'Housing'];

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: any } = {
      'Restaurants': Utensils,
      'Vendors': Building2,
      'Marketplace': ShoppingBag,
      'Free Stuff': Gift,
      'News': Newspaper,
      'Housing': Home
    };
    return icons[category] || Compass;
  };

  return (
    <div className="h-full style={{ backgroundColor: '#f9f5f0' }} overflow-y-auto">
      {/* Header */}
      <div className="style={{ backgroundColor: '#f9f5f0' }} border-b border-gray-200 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Campus</h1>
          <p className="text-gray-600">Discover everything Harvard Law School and Cambridge have to offer</p>
          
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search restaurants, vendors, news, and more..."
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

      {/* Content */}
      <div className="px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="restaurants">
            <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6">
              <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              <TabsTrigger value="freestuff">Free Stuff</TabsTrigger>
              <TabsTrigger value="news">Campus News</TabsTrigger>
              <TabsTrigger value="housing">Housing</TabsTrigger>
            </TabsList>

            <TabsContent value="restaurants" className="mt-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Nearby Restaurants</h2>
                <p className="text-gray-600">Great dining options within walking distance of HLS</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nearbyRestaurants.map(restaurant => (
                  <Card key={restaurant.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-3xl">{restaurant.image}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{restaurant.name}</h3>
                          <Badge variant="outline" className="text-xs mb-2">{restaurant.category}</Badge>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{restaurant.rating}</span>
                            <span>•</span>
                            <span>{restaurant.priceRange}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <MapPin className="w-3 h-3" />
                            <span>{restaurant.distance}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">{restaurant.description}</p>
                      
                      <div className="space-y-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{restaurant.hours}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{restaurant.phone}</span>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="w-full mt-4"
                        style={{ backgroundColor: '#752432' }}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="vendors" className="mt-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Local Vendors & Services</h2>
                <p className="text-gray-600">Essential services and shopping near campus</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {localVendors.map(vendor => (
                  <Card key={vendor.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="text-3xl">{vendor.image}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{vendor.name}</h3>
                          <Badge variant="outline" className="text-xs mb-2">{vendor.category}</Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <MapPin className="w-3 h-3" />
                            <span>{vendor.distance}</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">{vendor.description}</p>
                      
                      <div className="space-y-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{vendor.hours}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{vendor.phone}</span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-4"
                        style={{ borderColor: '#752432', color: '#752432' }}
                      >
                        Get Directions
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="marketplace" className="mt-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Student Marketplace</h2>
                <p className="text-gray-600">Buy and sell textbooks, furniture, and supplies with fellow students</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {marketplaceListings.map(listing => (
                  <Card key={listing.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="mb-3">
                        <div className="text-4xl mb-2 text-center">{listing.images[0]}</div>
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{listing.title}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-bold" style={{ color: '#752432' }}>
                            ${listing.price}
                          </span>
                          {listing.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ${listing.originalPrice}
                            </span>
                          )}
                        </div>
                        <Badge 
                          variant="outline" 
                          className="text-xs mb-2"
                          style={{ borderColor: '#752432', color: '#752432' }}
                        >
                          {listing.category}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{listing.description}</p>
                      
                      <div className="space-y-2 text-xs text-gray-500 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Condition:</span>
                          <span>{listing.condition}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{listing.seller} ({listing.sellerYear})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{listing.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(listing.postedDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {listing.tags.slice(0, 2).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs rounded-full"
                            style={{ backgroundColor: '#f5f1f2', color: '#752432' }}
                          >
                            {tag}
                          </span>
                        ))}
                        {listing.tags.length > 2 && (
                          <span className="px-2 py-1 text-xs text-gray-500 rounded-full style={{ backgroundColor: '#f9f5f0' }}">
                            +{listing.tags.length - 2}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          style={{ backgroundColor: '#752432' }}
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Message
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          style={{ borderColor: '#752432', color: '#752432' }}
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Call to Action */}
              <div className="mt-8 text-center">
                <div className="style={{ backgroundColor: '#f9f5f0' }} rounded-lg shadow-sm p-6 max-w-md mx-auto">
                  <Package className="w-12 h-12 mx-auto mb-3" style={{ color: '#752432' }} />
                  <h3 className="font-semibold text-gray-900 mb-2">Have something to sell?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Post your textbooks, furniture, or supplies to reach fellow HLS students.
                  </p>
                  <Button 
                    className="w-full"
                    style={{ backgroundColor: '#752432' }}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Create Listing
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="freestuff" className="mt-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Free Resources Around Campus</h2>
                <p className="text-gray-600">Take advantage of these free services and amenities</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {freeStuff.map(item => {
                  const IconComponent = item.icon;
                  return (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div 
                            className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: '#f5f1f2' }}
                          >
                            <IconComponent className="w-6 h-6" style={{ color: '#752432' }} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                            <Badge 
                              className="text-xs mb-3"
                              style={{ backgroundColor: '#f5f1f2', color: '#752432' }}
                            >
                              {item.category}
                            </Badge>
                            <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                            <div className="text-xs text-gray-500">
                              <div className="flex items-center gap-1 mb-1">
                                <MapPin className="w-3 h-3" />
                                <span>{item.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{item.available}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="news" className="mt-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Campus News & Updates</h2>
                <p className="text-gray-600">Stay informed about what's happening at HLS</p>
              </div>
              
              <div className="space-y-6">
                {campusNews.map(article => (
                  <Card key={article.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{article.title}</h3>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                            <span>{new Date(article.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}</span>
                            <Badge variant="outline" className="text-xs">{article.category}</Badge>
                            <span>{article.readTime}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{article.summary}</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            style={{ borderColor: '#752432', color: '#752432' }}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Read Full Article
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="housing" className="mt-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Housing & Dorm Updates</h2>
                <p className="text-gray-600">Information about student housing and recent updates</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {dormInfo.map(dorm => (
                  <Card key={dorm.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Home className="w-5 h-5" style={{ color: '#752432' }} />
                        {dorm.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs w-fit">{dorm.type}</Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{dorm.address}</span>
                        </div>
                        <p className="text-sm text-gray-600">{dorm.description}</p>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Amenities</h4>
                        <div className="flex flex-wrap gap-1">
                          {dorm.amenities.map(amenity => (
                            <span
                              key={amenity}
                              className="px-2 py-1 text-xs rounded-full"
                              style={{ backgroundColor: '#f5f1f2', color: '#752432' }}
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Recent Updates</h4>
                        <div className="space-y-2">
                          {dorm.updates.map((update, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              <span className="font-medium">{new Date(update.date).toLocaleDateString()}</span>
                              <span className="ml-2">{update.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="w-full mt-4"
                        style={{ backgroundColor: '#752432' }}
                      >
                        View Housing Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}