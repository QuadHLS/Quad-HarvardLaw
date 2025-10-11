import { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Clock, MapPin, Trash2, Calendar, Download, Save, FileText, ChevronDown, ChevronUp, Share, FolderOpen, Grid, List, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { toast } from 'sonner';

// Course color mapping based on type
const courseColors = {
  'Course': '#0080BD',      // Blue
  'Seminar': '#04913A',     // Green
  'Reading Group': '#F22F21', // Red
  'Clinic': '#FFBB06'       // Yellow
};

// Helper function to get course color based on type
const getCourseColor = (courseType: string): string => {
  return courseColors[courseType as keyof typeof courseColors] || courseColors['Course'];
};

// Helper function to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Mock course data for the planner
interface PlannerCourse {
  id: string;
  code: string;
  name: string;
  instructor: string;
  credits: number;
  days: string[];
  startTime: string;
  endTime: string;
  location: string;
  requirements: string[];
  description: string;
  semester: 'Fall' | 'Spring' | 'Summer' | 'Winter';
  year: string;
  capacity: number;
  enrolled: number;
  prerequisites?: string[];
  areaOfInterest: string;
  type: 'Clinic' | 'Course' | 'Reading Group' | 'Seminar';
  fulfillsRequirements: string[];
  exam: 'No Exam' | 'One-Day Take-Home' | 'Any Day Take-Home' | 'In Class';
}

interface ScheduledCourse extends PlannerCourse {
  scheduledId: string;
}

const mockCourses: PlannerCourse[] = [
  // Fall Courses
  {
    id: '1',
    code: 'LAW 101',
    name: 'Contract Law',
    instructor: 'Professor Michael Chen',
    credits: 4,
    days: ['Monday', 'Wednesday', 'Friday'],
    startTime: '9:00 AM',
    endTime: '10:15 AM',
    location: 'Room 203',
    requirements: ['1L Core', 'JD Requirement'],
    description: 'This course provides a comprehensive examination of the fundamental principles governing contract formation, performance, and breach. Students will explore the essential elements of valid contracts, including offer, acceptance, and consideration, while analyzing landmark cases that have shaped modern contract law. The curriculum covers both common law principles and the Uniform Commercial Code, preparing students for real-world contract negotiations and disputes.',
    semester: 'Fall',
    year: '2025',
    capacity: 100,
    enrolled: 87,
    prerequisites: [],
    areaOfInterest: 'Business Law',
    type: 'Course',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'In Class'
  },
  {
    id: '2',
    code: 'LAW 102',
    name: 'Torts',
    instructor: 'Professor Sarah Moore',
    credits: 4,
    days: ['Tuesday', 'Thursday'],
    startTime: '10:30 AM',
    endTime: '12:00 PM',
    location: 'Room 150',
    requirements: ['1L Core', 'JD Requirement'],
    description: 'An in-depth study of civil wrongs and the legal theories underlying liability in tort law. This course examines intentional torts, negligence, and strict liability, with particular emphasis on causation, damages, and defenses. Students will analyze complex fact patterns involving personal injury, property damage, and economic harm while developing critical thinking skills essential for litigation practice.',
    semester: 'Fall',
    year: '2025',
    capacity: 100,
    enrolled: 92,
    prerequisites: [],
    areaOfInterest: 'Personal Injury',
    type: 'Course',
    fulfillsRequirements: ['Analytical Paper'],
    exam: 'In Class'
  },
  {
    id: '3',
    code: 'LAW 103',
    name: 'Civil Procedure',
    instructor: 'Professor David Johnson',
    credits: 4,
    days: ['Monday', 'Wednesday'],
    startTime: '1:00 PM',
    endTime: '2:30 PM',
    location: 'Room 301',
    requirements: ['1L Core', 'JD Requirement'],
    description: 'This foundational course explores the rules and procedures that govern civil litigation in federal and state courts. Students will master the intricacies of pleadings, discovery, motions practice, and trial procedures while examining jurisdictional concepts and due process requirements. The course emphasizes practical skills development through drafting exercises and procedural analysis of complex litigation scenarios.',
    semester: 'Fall',
    year: '2025',
    capacity: 100,
    enrolled: 89,
    prerequisites: [],
    areaOfInterest: 'Litigation',
    type: 'Course',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'One-Day Take-Home'
  },
  {
    id: '4',
    code: 'LAW 104',
    name: 'Property Law',
    instructor: 'Professor Jennifer Stewart',
    credits: 3,
    days: ['Tuesday', 'Thursday'],
    startTime: '2:45 PM',
    endTime: '4:00 PM',
    location: 'Room 205',
    requirements: ['1L Core', 'JD Requirement'],
    description: 'A comprehensive examination of property rights in both real and personal property, covering acquisition, transfer, and protection of property interests. The course explores traditional property concepts including estates in land, future interests, and concurrent ownership, while also addressing modern developments in intellectual property and regulatory takings. Students will analyze the intersection of property law with constitutional principles and public policy considerations.',
    semester: 'Fall',
    year: '2025',
    capacity: 100,
    enrolled: 85,
    prerequisites: [],
    areaOfInterest: 'Real Estate',
    type: 'Course',
    fulfillsRequirements: ['Analytical Paper'],
    exam: 'In Class'
  },
  {
    id: '13',
    code: 'LAW 105',
    name: 'Environmental Law Seminar',
    instructor: 'Professor Robert Phillips',
    credits: 2,
    days: ['Wednesday'],
    startTime: '4:30 PM',
    endTime: '6:30 PM',
    location: 'Room 208',
    requirements: ['Upper Level', 'Environmental'],
    description: 'An advanced seminar examining cutting-edge issues in environmental law and policy, including climate change litigation, environmental justice, and emerging regulatory frameworks. Students will engage in intensive research and discussion of current environmental challenges while developing expertise in environmental advocacy and policy analysis. The seminar emphasizes interdisciplinary approaches to environmental problem-solving.',
    semester: 'Fall',
    year: '2025',
    capacity: 15,
    enrolled: 12,
    prerequisites: [],
    areaOfInterest: 'Environmental',
    type: 'Seminar',
    fulfillsRequirements: ['Analytical Paper'],
    exam: 'Any Day Take-Home'
  },
  {
    id: '14',
    code: 'LAW 106',
    name: 'Corporate Finance Reading Group',
    instructor: 'Professor Elena Martinez',
    credits: 1,
    days: ['Friday'],
    startTime: '12:00 PM',
    endTime: '1:30 PM',
    location: 'Room 105',
    requirements: ['Upper Level', 'Business Law'],
    description: 'A focused reading group examining current literature and developments in corporate finance law. Students will engage in critical analysis of scholarly articles, recent court decisions, and emerging trends in corporate financing structures. The group emphasizes collaborative learning and in-depth discussion of complex financial instruments and regulatory frameworks governing corporate transactions.',
    semester: 'Fall',
    year: '2025',
    capacity: 12,
    enrolled: 8,
    prerequisites: [],
    areaOfInterest: 'Business Law',
    type: 'Reading Group',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'No Exam'
  },
  {
    id: '15',
    code: 'LAW 107',
    name: 'Legal Aid Clinic',
    instructor: 'Professor Carlos Garcia',
    credits: 3,
    days: ['Tuesday', 'Thursday'],
    startTime: '9:00 AM',
    endTime: '11:00 AM',
    location: 'Legal Aid Office',
    requirements: ['Upper Level', 'Clinical'],
    description: 'A hands-on clinical experience providing essential legal services to low-income clients in the community. Students will handle real cases under faculty supervision, developing practical skills in client interviewing, case preparation, and courtroom advocacy. The clinic emphasizes social justice principles while building professional competence in areas such as housing law, family law, and consumer protection.',
    semester: 'Fall',
    year: '2025',
    capacity: 16,
    enrolled: 14,
    prerequisites: [],
    areaOfInterest: 'Civil Rights',
    type: 'Clinic',
    fulfillsRequirements: ['Experiential Learning'],
    exam: 'No Exam'
  },
  // Additional Fall Courses (20 new courses)
  {
    id: '22',
    code: 'LAW 108',
    name: 'Securities Regulation',
    instructor: 'Professor Amanda White',
    credits: 3,
    days: ['Monday', 'Wednesday'],
    startTime: '11:00 AM',
    endTime: '12:30 PM',
    location: 'Room 210',
    requirements: ['Upper Level', 'Business Law'],
    description: 'Federal and state securities laws and regulations.',
    semester: 'Fall',
    year: '2025',
    capacity: 60,
    enrolled: 45,
    prerequisites: ['Corporate Law'],
    areaOfInterest: 'Business Law',
    type: 'Course',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'One-Day Take-Home'
  },
  {
    id: '23',
    code: 'LAW 109',
    name: 'International Trade Law Seminar',
    instructor: 'Professor Thomas Jackson',
    credits: 2,
    days: ['Thursday'],
    startTime: '3:00 PM',
    endTime: '5:00 PM',
    location: 'Room 115',
    requirements: ['Upper Level', 'International'],
    description: 'Advanced seminar on international trade agreements.',
    semester: 'Fall',
    year: '2025',
    capacity: 18,
    enrolled: 14,
    prerequisites: [],
    areaOfInterest: 'Business Law',
    type: 'Seminar',
    fulfillsRequirements: ['International/Comparative'],
    exam: 'Any Day Take-Home'
  },
  {
    id: '24',
    code: 'LAW 110',
    name: 'Immigration Law',
    instructor: 'Professor Lisa King',
    credits: 3,
    days: ['Tuesday', 'Thursday'],
    startTime: '9:30 AM',
    endTime: '11:00 AM',
    location: 'Room 155',
    requirements: ['Upper Level', 'Immigration'],
    description: 'Comprehensive study of immigration law and policy.',
    semester: 'Fall',
    year: '2025',
    capacity: 50,
    enrolled: 38,
    prerequisites: [],
    areaOfInterest: 'Immigration',
    type: 'Course',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'One-Day Take-Home'
  },
  {
    id: '25',
    code: 'LAW 111',
    name: 'Health Law',
    instructor: 'Professor Daniel Harris',
    credits: 3,
    days: ['Monday', 'Wednesday', 'Friday'],
    startTime: '2:00 PM',
    endTime: '3:15 PM',
    location: 'Room 225',
    requirements: ['Upper Level', 'Health'],
    description: 'Legal issues in healthcare delivery and regulation.',
    semester: 'Fall',
    year: '2025',
    capacity: 40,
    enrolled: 32,
    prerequisites: [],
    areaOfInterest: 'Civil Rights',
    type: 'Course',
    fulfillsRequirements: ['Analytical Paper'],
    exam: 'In Class'
  },
  {
    id: '26',
    code: 'LAW 112',
    name: 'Family Law Clinic',
    instructor: 'Professor Patricia Wright',
    credits: 4,
    days: ['Tuesday', 'Thursday'],
    startTime: '1:00 PM',
    endTime: '3:00 PM',
    location: 'Family Law Clinic',
    requirements: ['Upper Level', 'Clinical'],
    description: 'Provide legal services in family law matters.',
    semester: 'Fall',
    year: '2025',
    capacity: 16,
    enrolled: 15,
    prerequisites: [],
    areaOfInterest: 'Personal Injury',
    type: 'Clinic',
    fulfillsRequirements: ['Experiential Learning'],
    exam: 'No Exam'
  },
  {
    id: '27',
    code: 'LAW 113',
    name: 'Employment Law',
    instructor: 'Professor Maria Lopez',
    credits: 3,
    days: ['Monday', 'Wednesday'],
    startTime: '3:30 PM',
    endTime: '5:00 PM',
    location: 'Room 180',
    requirements: ['Upper Level', 'Labor'],
    description: 'Workplace law including discrimination and wages.',
    semester: 'Fall',
    year: '2025',
    capacity: 55,
    enrolled: 42,
    prerequisites: [],
    areaOfInterest: 'Civil Rights',
    type: 'Course',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'In Class'
  },
  {
    id: '28',
    code: 'LAW 114',
    name: 'Antitrust Law Seminar',
    instructor: 'Professor James Clark',
    credits: 2,
    days: ['Friday'],
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    location: 'Room 120',
    requirements: ['Upper Level', 'Business Law'],
    description: 'Advanced study of antitrust and competition law.',
    semester: 'Fall',
    year: '2025',
    capacity: 20,
    enrolled: 16,
    prerequisites: ['Corporate Law'],
    areaOfInterest: 'Business Law',
    type: 'Seminar',
    fulfillsRequirements: ['Analytical Paper'],
    exam: 'Any Day Take-Home'
  },
  {
    id: '29',
    code: 'LAW 115',
    name: 'Tax Law',
    instructor: 'Professor Wilson',
    credits: 4,
    days: ['Tuesday', 'Thursday'],
    startTime: '11:30 AM',
    endTime: '1:00 PM',
    location: 'Room 305',
    requirements: ['Upper Level', 'Tax'],
    description: 'Federal income taxation of individuals.',
    semester: 'Fall',
    year: '2025',
    capacity: 70,
    enrolled: 58,
    prerequisites: [],
    areaOfInterest: 'Finance',
    type: 'Course',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'In Class'
  },
  {
    id: '30',
    code: 'LAW 116',
    name: 'Real Estate Law',
    instructor: 'Professor Anderson',
    credits: 3,
    days: ['Monday', 'Wednesday'],
    startTime: '10:30 AM',
    endTime: '12:00 PM',
    location: 'Room 165',
    requirements: ['Upper Level', 'Real Estate'],
    description: 'Real estate transactions and property development.',
    semester: 'Fall',
    year: '2025',
    capacity: 45,
    enrolled: 39,
    prerequisites: ['Property Law'],
    areaOfInterest: 'Real Estate',
    type: 'Course',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'In Class'
  },
  {
    id: '31',
    code: 'LAW 117',
    name: 'Criminal Defense Reading Group',
    instructor: 'Professor Turner',
    credits: 1,
    days: ['Monday'],
    startTime: '5:00 PM',
    endTime: '6:30 PM',
    location: 'Room 135',
    requirements: ['Upper Level'],
    description: 'Reading group on criminal defense strategies.',
    semester: 'Fall',
    year: '2025',
    capacity: 12,
    enrolled: 9,
    prerequisites: ['Criminal Law'],
    areaOfInterest: 'Litigation',
    type: 'Reading Group',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'No Exam'
  },
  {
    id: '32',
    code: 'LAW 118',
    name: 'Intellectual Property Law',
    instructor: 'Professor Davis',
    credits: 3,
    days: ['Tuesday', 'Thursday'],
    startTime: '2:30 PM',
    endTime: '4:00 PM',
    location: 'Room 190',
    requirements: ['Upper Level', 'IP'],
    description: 'Patents, trademarks, copyrights, and trade secrets.',
    semester: 'Fall',
    year: '2025',
    capacity: 50,
    enrolled: 44,
    prerequisites: [],
    areaOfInterest: 'Business Law',
    type: 'Course',
    fulfillsRequirements: ['Analytical Paper'],
    exam: 'In Class'
  },
  {
    id: '33',
    code: 'LAW 119',
    name: 'Bankruptcy Law',
    instructor: 'Professor Mitchell',
    credits: 3,
    days: ['Monday', 'Wednesday', 'Friday'],
    startTime: '11:00 AM',
    endTime: '12:15 PM',
    location: 'Room 175',
    requirements: ['Upper Level', 'Business Law'],
    description: 'Federal bankruptcy law and procedure.',
    semester: 'Fall',
    year: '2025',
    capacity: 40,
    enrolled: 35,
    prerequisites: [],
    areaOfInterest: 'Business Law',
    type: 'Course',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'In Class'
  },
  {
    id: '34',
    code: 'LAW 120',
    name: 'Environmental Justice Seminar',
    instructor: 'Professor Williams',
    credits: 2,
    days: ['Wednesday'],
    startTime: '6:00 PM',
    endTime: '8:00 PM',
    location: 'Room 125',
    requirements: ['Upper Level', 'Environmental'],
    description: 'Environmental law and social justice intersections.',
    semester: 'Fall',
    year: '2025',
    capacity: 15,
    enrolled: 13,
    prerequisites: [],
    areaOfInterest: 'Environmental',
    type: 'Seminar',
    fulfillsRequirements: ['Analytical Paper'],
    exam: 'In Class'
  },
  {
    id: '35',
    code: 'LAW 121',
    name: 'Corporate Governance Reading Group',
    instructor: 'Professor Collins',
    credits: 1,
    days: ['Friday'],
    startTime: '3:00 PM',
    endTime: '4:30 PM',
    location: 'Room 145',
    requirements: ['Upper Level', 'Business Law'],
    description: 'Reading group on corporate governance trends.',
    semester: 'Fall',
    year: '2025',
    capacity: 10,
    enrolled: 8,
    prerequisites: ['Corporate Law'],
    areaOfInterest: 'Business Law',
    type: 'Reading Group',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'In Class'
  },
  {
    id: '36',
    code: 'LAW 122',
    name: 'Veterans Legal Clinic',
    instructor: 'Professor Miller',
    credits: 3,
    days: ['Monday', 'Wednesday'],
    startTime: '9:00 AM',
    endTime: '11:00 AM',
    location: 'Veterans Clinic',
    requirements: ['Upper Level', 'Clinical'],
    description: 'Legal services for military veterans.',
    semester: 'Fall',
    year: '2025',
    capacity: 14,
    enrolled: 12,
    prerequisites: [],
    areaOfInterest: 'Civil Rights',
    type: 'Clinic',
    fulfillsRequirements: ['Experiential Learning'],
    exam: 'No Exam'
  },
  {
    id: '37',
    code: 'LAW 123',
    name: 'Sports Law',
    instructor: 'Professor Taylor',
    credits: 2,
    days: ['Thursday'],
    startTime: '4:30 PM',
    endTime: '6:30 PM',
    location: 'Room 195',
    requirements: ['Upper Level', 'Entertainment'],
    description: 'Legal issues in professional and amateur sports.',
    semester: 'Fall',
    year: '2025',
    capacity: 35,
    enrolled: 28,
    prerequisites: [],
    areaOfInterest: 'Business Law',
    type: 'Course',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'In Class'
  },
  {
    id: '38',
    code: 'LAW 124',
    name: 'Energy Law',
    instructor: 'Professor Hall',
    credits: 3,
    days: ['Tuesday', 'Thursday'],
    startTime: '8:00 AM',
    endTime: '9:30 AM',
    location: 'Room 185',
    requirements: ['Upper Level', 'Energy'],
    description: 'Oil, gas, renewable energy, and regulatory law.',
    semester: 'Fall',
    year: '2025',
    capacity: 30,
    enrolled: 24,
    prerequisites: [],
    areaOfInterest: 'Environmental',
    type: 'Course',
    fulfillsRequirements: ['Analytical Paper'],
    exam: 'In Class'
  },
  {
    id: '39',
    code: 'LAW 125',
    name: 'Elder Law Seminar',
    instructor: 'Professor Allen',
    credits: 2,
    days: ['Tuesday'],
    startTime: '5:30 PM',
    endTime: '7:30 PM',
    location: 'Room 140',
    requirements: ['Upper Level', 'Elder Law'],
    description: 'Legal issues affecting older adults.',
    semester: 'Fall',
    year: '2025',
    capacity: 20,
    enrolled: 17,
    prerequisites: [],
    areaOfInterest: 'Personal Injury',
    type: 'Seminar',
    fulfillsRequirements: ['Analytical Paper'],
    exam: 'In Class'
  },
  {
    id: '40',
    code: 'LAW 126',
    name: 'Mediation and Arbitration Reading Group',
    instructor: 'Professor Nelson',
    credits: 1,
    days: ['Wednesday'],
    startTime: '12:30 PM',
    endTime: '2:00 PM',
    location: 'Room 130',
    requirements: ['Upper Level'],
    description: 'Alternative dispute resolution methods.',
    semester: 'Fall',
    year: '2025',
    capacity: 15,
    enrolled: 11,
    prerequisites: [],
    areaOfInterest: 'Litigation',
    type: 'Reading Group',
    fulfillsRequirements: ['Negotiation/Leadership'],
    exam: 'No Exam'
  },
  {
    id: '41',
    code: 'LAW 127',
    name: 'Consumer Protection Clinic',
    instructor: 'Professor Young',
    credits: 4,
    days: ['Monday', 'Friday'],
    startTime: '1:30 PM',
    endTime: '3:30 PM',
    location: 'Consumer Clinic',
    requirements: ['Upper Level', 'Clinical'],
    description: 'Represent consumers in fraud and debt cases.',
    semester: 'Fall',
    year: '2025',
    capacity: 12,
    enrolled: 10,
    prerequisites: [],
    areaOfInterest: 'Civil Rights',
    type: 'Clinic',
    fulfillsRequirements: ['Experiential Learning'],
    exam: 'No Exam'
  },
  
  // Winter Courses
  {
    id: '5',
    code: 'LAW 201',
    name: 'Constitutional Law',
    instructor: 'Professor Rodriguez',
    credits: 4,
    days: ['Monday', 'Wednesday', 'Friday'],
    startTime: '9:00 AM',
    endTime: '10:15 AM',
    location: 'Room 204',
    requirements: ['1L Core', 'JD Requirement'],
    description: 'Constitutional principles and interpretation.',
    semester: 'Winter',
    year: '2026',
    capacity: 100,
    enrolled: 78,
    prerequisites: [],
    areaOfInterest: 'Civil Rights',
    type: 'Course',
    fulfillsRequirements: ['Analytical Paper'],
    exam: 'In Class'
  },
  {
    id: '6',
    code: 'LAW 202',
    name: 'Criminal Law',
    instructor: 'Professor Thompson',
    credits: 3,
    days: ['Tuesday', 'Thursday'],
    startTime: '11:00 AM',
    endTime: '12:30 PM',
    location: 'Room 151',
    requirements: ['1L Core', 'JD Requirement'],
    description: 'Elements of crimes and criminal responsibility.',
    semester: 'Winter',
    year: '2026',
    capacity: 100,
    enrolled: 85,
    prerequisites: [],
    areaOfInterest: 'Litigation',
    type: 'Course',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'In Class'
  },
  {
    id: '7',
    code: 'LAW 203',
    name: 'Corporate Law',
    instructor: 'Professor Collins',
    credits: 3,
    days: ['Monday', 'Wednesday'],
    startTime: '2:00 PM',
    endTime: '3:30 PM',
    location: 'Room 302',
    requirements: ['Upper Level', 'Business Law'],
    description: 'Corporate governance and business organizations.',
    semester: 'Winter',
    year: '2026',
    capacity: 80,
    enrolled: 65,
    prerequisites: ['Contract Law'],
    areaOfInterest: 'Business Law',
    type: 'Course',
    fulfillsRequirements: ['Experiential Learning'],
    exam: 'No Exam'
  },
  {
    id: '8',
    code: 'LAW 204',
    name: 'Evidence',
    instructor: 'Professor Taylor',
    credits: 4,
    days: ['Tuesday', 'Thursday'],
    startTime: '3:45 PM',
    endTime: '5:15 PM',
    location: 'Room 206',
    requirements: ['Upper Level', 'Trial Practice'],
    description: 'Rules of evidence in civil and criminal proceedings.',
    semester: 'Winter',
    year: '2026',
    capacity: 90,
    enrolled: 72,
    prerequisites: ['Civil Procedure'],
    areaOfInterest: 'Litigation',
    type: 'Course',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'In Class'
  },
  {
    id: '16',
    code: 'LAW 205',
    name: 'Intellectual Property Seminar',
    instructor: 'Professor Davis',
    credits: 3,
    days: ['Monday'],
    startTime: '6:00 PM',
    endTime: '9:00 PM',
    location: 'Room 107',
    requirements: ['Upper Level', 'IP'],
    description: 'Advanced seminar on intellectual property law.',
    semester: 'Winter',
    year: '2026',
    capacity: 18,
    enrolled: 15,
    prerequisites: [],
    areaOfInterest: 'Business Law',
    type: 'Seminar',
    fulfillsRequirements: ['Analytical Paper'],
    exam: 'In Class'
  },
  {
    id: '17',
    code: 'LAW 206',
    name: 'Criminal Justice Reform Reading Group',
    instructor: 'Professor Turner',
    credits: 1,
    days: ['Friday'],
    startTime: '2:00 PM',
    endTime: '3:30 PM',
    location: 'Room 109',
    requirements: ['Upper Level'],
    description: 'Reading group examining criminal justice reform.',
    semester: 'Winter',
    year: '2026',
    capacity: 10,
    enrolled: 7,
    prerequisites: [],
    areaOfInterest: 'Civil Rights',
    type: 'Reading Group',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'In Class'
  },
  {
    id: '18',
    code: 'LAW 207',
    name: 'Housing Law Clinic',
    instructor: 'Professor Brown',
    credits: 4,
    days: ['Wednesday', 'Friday'],
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    location: 'Housing Clinic',
    requirements: ['Upper Level', 'Clinical'],
    description: 'Represent tenants in housing disputes.',
    semester: 'Winter',
    year: '2026',
    capacity: 12,
    enrolled: 11,
    prerequisites: [],
    areaOfInterest: 'Real Estate',
    type: 'Clinic',
    fulfillsRequirements: ['Experiential Learning'],
    exam: 'No Exam'
  },
  
  // Spring Courses
  {
    id: '9',
    code: 'LAW 301',
    name: 'International Law',
    instructor: 'Professor Thomas Jackson',
    credits: 3,
    days: ['Monday', 'Wednesday', 'Friday'],
    startTime: '10:30 AM',
    endTime: '11:45 AM',
    location: 'Room 205',
    requirements: ['Upper Level', 'International'],
    description: 'Public international law and global governance.',
    semester: 'Spring',
    year: '2026',
    capacity: 70,
    enrolled: 54,
    prerequisites: [],
    areaOfInterest: 'Immigration',
    type: 'Seminar',
    fulfillsRequirements: ['International/Comparative'],
    exam: 'Any Day Take-Home'
  },
  {
    id: '10',
    code: 'LAW 302',
    name: 'Environmental Law',
    instructor: 'Professor Williams',
    credits: 3,
    days: ['Tuesday', 'Thursday'],
    startTime: '9:00 AM',
    endTime: '10:30 AM',
    location: 'Room 152',
    requirements: ['Upper Level', 'Environmental'],
    description: 'Environmental regulations and policy.',
    semester: 'Spring',
    year: '2026',
    capacity: 60,
    enrolled: 42,
    prerequisites: [],
    areaOfInterest: 'Environmental',
    type: 'Course',
    fulfillsRequirements: ['Analytical Paper'],
    exam: 'In Class'
  },
  {
    id: '11',
    code: 'LAW 303',
    name: 'Tax Law',
    instructor: 'Professor Wilson',
    credits: 4,
    days: ['Monday', 'Wednesday'],
    startTime: '1:00 PM',
    endTime: '2:30 PM',
    location: 'Room 303',
    requirements: ['Upper Level', 'Tax'],
    description: 'Federal income tax principles.',
    semester: 'Spring',
    year: '2026',
    capacity: 75,
    enrolled: 61,
    prerequisites: [],
    areaOfInterest: 'Finance',
    type: 'Course',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'In Class'
  },
  {
    id: '12',
    code: 'LAW 304',
    name: 'Immigration Law Clinic',
    instructor: 'Professor Lisa King',
    credits: 4,
    days: ['Tuesday', 'Thursday'],
    startTime: '2:00 PM',
    endTime: '4:00 PM',
    location: 'Clinic Building',
    requirements: ['Upper Level', 'Clinical'],
    description: 'Hands-on immigration law practice.',
    semester: 'Spring',
    year: '2026',
    capacity: 20,
    enrolled: 18,
    prerequisites: [],
    areaOfInterest: 'Immigration',
    type: 'Clinic',
    fulfillsRequirements: ['Experiential Learning'],
    exam: 'No Exam'
  },
  {
    id: '19',
    code: 'LAW 305',
    name: 'Securities Regulation Seminar',
    instructor: 'Professor Amanda White',
    credits: 2,
    days: ['Thursday'],
    startTime: '5:00 PM',
    endTime: '7:00 PM',
    location: 'Room 110',
    requirements: ['Upper Level', 'Securities'],
    description: 'Advanced seminar on securities regulation.',
    semester: 'Spring',
    year: '2026',
    capacity: 20,
    enrolled: 16,
    prerequisites: ['Corporate Law'],
    areaOfInterest: 'Business Law',
    type: 'Seminar',
    fulfillsRequirements: ['Analytical Paper'],
    exam: 'In Class'
  },
  {
    id: '20',
    code: 'LAW 306',
    name: 'Constitutional Theory Reading Group',
    instructor: 'Professor Rodriguez',
    credits: 1,
    days: ['Monday'],
    startTime: '12:00 PM',
    endTime: '1:30 PM',
    location: 'Faculty Lounge',
    requirements: ['Upper Level'],
    description: 'Reading group on constitutional theory and philosophy.',
    semester: 'Spring',
    year: '2026',
    capacity: 8,
    enrolled: 6,
    prerequisites: ['Constitutional Law'],
    areaOfInterest: 'Civil Rights',
    type: 'Reading Group',
    fulfillsRequirements: ['Professional Writing'],
    exam: 'In Class'
  },
  {
    id: '21',
    code: 'LAW 307',
    name: 'Small Business Clinic',
    instructor: 'Professor Lee',
    credits: 3,
    days: ['Monday', 'Wednesday'],
    startTime: '3:00 PM',
    endTime: '5:00 PM',
    location: 'Business Clinic',
    requirements: ['Upper Level', 'Clinical'],
    description: 'Provide legal services to small businesses.',
    semester: 'Spring',
    year: '2026',
    capacity: 14,
    enrolled: 12,
    prerequisites: [],
    areaOfInterest: 'Business Law',
    type: 'Clinic',
    fulfillsRequirements: ['Experiential Learning'],
    exam: 'No Exam'
  }
];

const timeSlots = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', 
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const areasOfInterest = [
  'Business Law',
  'Civil Rights',
  'Environmental',
  'Finance',
  'Immigration',
  'Litigation',
  'Personal Injury',
  'Real Estate'
];

const courseTypes = ['Clinic', 'Course', 'Reading Group', 'Seminar'];

const fulfillsRequirementOptions = [
  'Analytical Paper',
  'Experiential Learning',
  'International/Comparative',
  'Negotiation/Leadership',
  'Professional Responsibility',
  'Professional Writing'
];

// Interface for saved schedules
interface SavedSchedule {
  id: string;
  name: string;
  createdAt: string;
  semesters: ('Fall' | 'Winter' | 'Spring' | 'Summer')[];
  courses: ScheduledCourse[];
}

interface PlannerPageProps {
  onNavigateToReviews?: (professorName?: string) => void;
}

export function PlannerPage({ onNavigateToReviews }: PlannerPageProps = {}) {
  const [scheduledCourses, setScheduledCourses] = useState<ScheduledCourse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<'Fall' | 'Winter' | 'Spring'>('Fall');
  const [selectedAreaOfInterest, setSelectedAreaOfInterest] = useState<string>('all-areas');
  const [selectedType, setSelectedType] = useState<string>('all-types');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedFulfillsRequirements, setSelectedFulfillsRequirements] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const requirementsRef = useRef<HTMLDivElement>(null);

  // Dialog states
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showSavedSchedulesDialog, setShowSavedSchedulesDialog] = useState(false);
  const [showCourseDetailDialog, setShowCourseDetailDialog] = useState(false);
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<PlannerCourse | null>(null);
  const [saveScheduleName, setSaveScheduleName] = useState('');
  const [selectedSemestersForSave, setSelectedSemestersForSave] = useState<('Fall' | 'Winter' | 'Spring' | 'Summer')[]>([]);
  const [selectedSemestersForDownload, setSelectedSemestersForDownload] = useState<('Fall' | 'Winter' | 'Spring' | 'Summer')[]>([]);
  
  // AI Chatbot states
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<{id: string, type: 'user' | 'ai', content: string, timestamp: Date}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Saved schedules state with mock data
  const [savedSchedules, setSavedSchedules] = useState<SavedSchedule[]>([]);

  // Close requirements dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (requirementsRef.current && !requirementsRef.current.contains(event.target as Node)) {
        setShowRequirements(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  // Helper function to clean course name by removing redundant words
  const getCleanCourseName = (name: string, type: string) => {
    if (type === 'Seminar' && name.includes('Seminar')) {
      return name.replace(/\s*Seminar\s*/g, ' ').trim();
    }
    if (type === 'Reading Group' && name.includes('Reading Group')) {
      return name.replace(/\s*Reading Group\s*/g, ' ').trim();
    }
    if (type === 'Clinic' && name.includes('Clinic')) {
      return name.replace(/\s*Clinic\s*/g, ' ').trim();
    }
    return name;
  };

  // Helper function to convert days to single letters (T for Tuesday, Th for Thursday)
  const getDaySingleLetter = (day: string) => {
    switch (day) {
      case 'Monday': return 'M';
      case 'Tuesday': return 'T';
      case 'Wednesday': return 'W';
      case 'Thursday': return 'Th';
      case 'Friday': return 'F';
      default: return day.charAt(0);
    }
  };

  // Filter courses based on search and filters
  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = searchTerm === '' || 
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Primary filter: only show courses for the selected semester
    const matchesTerm = course.semester === selectedTerm;
    
    const matchesAreaOfInterest = selectedAreaOfInterest === 'all-areas' ||
      course.areaOfInterest === selectedAreaOfInterest;

    const matchesType = selectedType === 'all-types' ||
      course.type === selectedType;

    const matchesDays = selectedDays.length === 0 ||
      course.days.every(day => selectedDays.includes(day));

    const matchesFulfillsRequirements = selectedFulfillsRequirements.length === 0 ||
      selectedFulfillsRequirements.some(req => course.fulfillsRequirements.includes(req));
    
    // Don't show courses that are already scheduled
    const notScheduled = !scheduledCourses.some(scheduled => scheduled.id === course.id);
    
    return matchesSearch && matchesTerm && matchesAreaOfInterest && 
           matchesType && matchesDays && matchesFulfillsRequirements && notScheduled;
  }).sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by course name

  // Calculate totals
  const totalCredits = scheduledCourses.reduce((sum, course) => sum + course.credits, 0);
  const semesterCredits = scheduledCourses
    .filter(course => course.semester === selectedTerm)
    .reduce((sum, course) => sum + course.credits, 0);

  // Get time slot index for positioning
  const getTimeSlotIndex = (time: string) => {
    const exactMatch = timeSlots.indexOf(time);
    if (exactMatch !== -1) {
      return exactMatch;
    }
    
    // For times not in the exact slots, calculate fractional position
    const timeInMinutes = timeToMinutes(time);
    const startTimeInMinutes = timeToMinutes('8:00 AM'); // First slot
    const minutesFromStart = timeInMinutes - startTimeInMinutes;
    const slotIndex = minutesFromStart / 60; // Each slot is 1 hour
    
    return Math.max(0, slotIndex);
  };

  // Show course detail popup
  const showCourseDetail = (course: PlannerCourse) => {
    setSelectedCourseForDetail(course);
    setShowCourseDetailDialog(true);
  };

  // Check if a course is already scheduled
  const isCourseScheduled = (course: PlannerCourse) => {
    return scheduledCourses.some(scheduled => scheduled.id === course.id);
  };

  // Get scheduled course by original course id
  const getScheduledCourse = (course: PlannerCourse) => {
    return scheduledCourses.find(scheduled => scheduled.id === course.id);
  };

  // Add course to schedule
  const addCourseToSchedule = (course: PlannerCourse, fromPopup: boolean = false) => {
    // Check for conflicts and show warning but still allow adding
    if (hasTimeConflict(course)) {
      const conflictDetails = getConflictDetails(course);
      if (conflictDetails) {
        // Time conflict detected but course will still be added
      }
    }

    const scheduledId = `${course.id}_${Date.now()}`;
    const scheduledCourse: ScheduledCourse = {
      ...course,
      scheduledId
    };
    setScheduledCourses(prev => [...prev, scheduledCourse]);
    
    // Close popup if adding from popup
    if (fromPopup) {
      setShowCourseDetailDialog(false);
    }
  };

  // Remove course from schedule
  const removeCourseFromSchedule = (scheduledId: string) => {
    const courseToRemove = scheduledCourses.find(course => course.scheduledId === scheduledId);
    setScheduledCourses(prev => prev.filter(course => course.scheduledId !== scheduledId));
    if (courseToRemove) {
      // Course removed from calendar
    }
  };

  // Check for time conflicts
  const hasTimeConflict = (newCourse: PlannerCourse) => {
    const newStartMinutes = timeToMinutes(newCourse.startTime);
    const newEndMinutes = timeToMinutes(newCourse.endTime);
    
    return scheduledCourses.some(scheduled => {
      const scheduledStartMinutes = timeToMinutes(scheduled.startTime);
      const scheduledEndMinutes = timeToMinutes(scheduled.endTime);
      
      // Only check for conflicts if courses are in the same semester
      const sameSemester = newCourse.semester === scheduled.semester;
      const sharedDays = newCourse.days.some(day => scheduled.days.includes(day));
      const timeOverlap = (newStartMinutes < scheduledEndMinutes && newEndMinutes > scheduledStartMinutes);
      
      return sameSemester && sharedDays && timeOverlap;
    });
  };

  // Get specific conflict details
  const getConflictDetails = (newCourse: PlannerCourse) => {
    const newStartMinutes = timeToMinutes(newCourse.startTime);
    const newEndMinutes = timeToMinutes(newCourse.endTime);
    
    const conflictingCourse = scheduledCourses.find(scheduled => {
      const scheduledStartMinutes = timeToMinutes(scheduled.startTime);
      const scheduledEndMinutes = timeToMinutes(scheduled.endTime);
      
      // Only check for conflicts if courses are in the same semester
      const sameSemester = newCourse.semester === scheduled.semester;
      const sharedDays = newCourse.days.some(day => scheduled.days.includes(day));
      const timeOverlap = (newStartMinutes < scheduledEndMinutes && newEndMinutes > scheduledStartMinutes);
      
      return sameSemester && sharedDays && timeOverlap;
    });
    
    if (conflictingCourse) {
      const sharedDays = newCourse.days.filter(day => conflictingCourse.days.includes(day));
      return {
        course: conflictingCourse,
        days: sharedDays,
        time: `${conflictingCourse.startTime} - ${conflictingCourse.endTime}`
      };
    }
    
    return null;
  };

  // Extract last name from instructor
  const getLastName = (fullName: string) => {
    const parts = fullName.replace('Professor ', '').split(' ');
    return parts[parts.length - 1];
  };

  // Get full instructor name without "Professor" prefix
  const getFullInstructorName = (fullName: string) => {
    return fullName.replace('Professor ', '');
  };

  // Handle professor name click to navigate to reviews
  const handleProfessorClick = (instructorName: string) => {
    if (onNavigateToReviews) {
      const fullName = getFullInstructorName(instructorName);
      onNavigateToReviews(fullName);
    }
  };


  // Convert time to minutes for better calculation
  const timeToMinutes = (time: string): number => {
    const [timePart, period] = time.split(' ');
    const [hours, minutes = 0] = timePart.split(':').map(Number);
    const adjustedHours = period === 'PM' && hours !== 12 ? hours + 12 : 
                         period === 'AM' && hours === 12 ? 0 : hours;
    return adjustedHours * 60 + minutes;
  };

  // Calculate course height based on duration
  const getCourseHeight = (startTime: string, endTime: string): number => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const durationMinutes = endMinutes - startMinutes;
    // Each hour slot is 64px high, so calculate proportionally
    return Math.max(64, (durationMinutes / 60) * 64);
  };

  // Calculate course top position
  const getCourseTopPosition = (startTime: string): number => {
    const startIndex = getTimeSlotIndex(startTime);
    return startIndex * 64; // 64px per hour slot
  };

  // Save schedule functionality
  const handleSaveSchedule = () => {
    if (!saveScheduleName.trim()) {
      return;
    }

    if (selectedSemestersForSave.length === 0) {
      return;
    }

    const coursesToSave = scheduledCourses.filter(course => 
      selectedSemestersForSave.includes(course.semester)
    );

    if (coursesToSave.length === 0) {
      return;
    }

    const newSavedSchedule: SavedSchedule = {
      id: `schedule_${Date.now()}`,
      name: saveScheduleName.trim(),
      createdAt: new Date().toISOString(),
      semesters: selectedSemestersForSave,
      courses: coursesToSave
    };

    setSavedSchedules(prev => [...prev, newSavedSchedule]);
    setSaveScheduleName('');
    setSelectedSemestersForSave([]);
    setShowSaveDialog(false);
    
    toast.success(`Schedule "${newSavedSchedule.name}" saved successfully`);
  };

  // Download schedule functionality
  const handleDownloadSchedule = () => {
    if (selectedSemestersForDownload.length === 0) {
      toast.error('Please select at least one semester to download');
      return;
    }

    const coursesToDownload = scheduledCourses.filter(course => 
      selectedSemestersForDownload.includes(course.semester)
    );

    if (coursesToDownload.length === 0) {
      toast.error('No courses found for the selected semesters');
      return;
    }

    // Simulate PDF download
    const semesterNames = selectedSemestersForDownload.join(', ');
    toast.success(`Downloading PDF for ${semesterNames} schedule...`);
    
    setSelectedSemestersForDownload([]);
    setShowDownloadDialog(false);
  };

  // Share schedule functionality
  const handleShareSchedule = () => {
    const coursesInCurrentSemester = scheduledCourses.filter(course => course.semester === selectedTerm);
    
    if (coursesInCurrentSemester.length === 0) {
      toast.error('No courses in current semester to share');
      return;
    }

    // Simulate sharing functionality
    navigator.clipboard.writeText(`My ${selectedTerm} Schedule:\n${coursesInCurrentSemester.map(course => 
      `${course.name} - ${course.days.join(', ')} ${course.startTime}-${course.endTime}`
    ).join('\n')}`);
    
    toast.success(`${selectedTerm} schedule copied to clipboard`);
  };

  // Load saved schedule
  const handleLoadSavedSchedule = (savedSchedule: SavedSchedule) => {
    // Clear current schedule and load the saved one
    setScheduledCourses(savedSchedule.courses);
    setShowSavedSchedulesDialog(false);
    toast.success(`Loaded schedule "${savedSchedule.name}"`);
  };

  // Delete saved schedule
  const handleDeleteSavedSchedule = (scheduleId: string) => {
    setSavedSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
    toast.success('Schedule deleted');
  };

  // Get available semesters that have courses
  const getAvailableSemesters = (): ('Fall' | 'Winter' | 'Spring' | 'Summer')[] => {
    const semesters = new Set<'Fall' | 'Winter' | 'Spring' | 'Summer'>();
    scheduledCourses.forEach(course => semesters.add(course.semester));
    return Array.from(semesters).sort((a, b) => {
      const order = { Fall: 0, Winter: 1, Spring: 2, Summer: 3 };
      return order[a] - order[b];
    });
  };

  // Handle opening the save dialog with pre-selected semesters
  const handleOpenSaveDialog = () => {
    const availableSemesters = getAvailableSemesters();
    setSelectedSemestersForSave(availableSemesters);
    setShowSaveDialog(true);
  };

  // Handle opening the download dialog with pre-selected semesters
  const handleOpenDownloadDialog = () => {
    const availableSemesters = getAvailableSemesters();
    setSelectedSemestersForDownload(availableSemesters);
    setShowDownloadDialog(true);
  };

  // AI Chatbot functionality
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: `msg_${Date.now()}`,
      type: 'user' as const,
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage.content);
      const aiMessage = {
        id: `msg_${Date.now() + 1}`,
        type: 'ai' as const,
        content: aiResponse,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Schedule-related queries
    if (input.includes('schedule') || input.includes('time') || input.includes('conflict')) {
      return "I can help you organize your schedule! I see you're looking at " + selectedTerm + " courses. Would you like me to recommend courses that fit specific time slots or help you avoid scheduling conflicts?";
    }
    
    // Interest-based queries
    if (input.includes('business') || input.includes('corporate')) {
      const businessCourses = filteredCourses.filter(c => c.areaOfInterest === 'Business Law').slice(0, 3);
      if (businessCourses.length > 0) {
        return `Great choice! I found ${businessCourses.length} business law courses for ${selectedTerm}: ${businessCourses.map(c => `${c.name} (${c.instructor.replace('Professor ', '')})`).join(', ')}. Would you like details about any of these?`;
      }
    }
    
    if (input.includes('environmental') || input.includes('green')) {
      const envCourses = filteredCourses.filter(c => c.areaOfInterest === 'Environmental').slice(0, 3);
      if (envCourses.length > 0) {
        return `Perfect! Environmental law is fascinating. I found ${envCourses.length} environmental courses: ${envCourses.map(c => `${c.name} (${c.instructor.replace('Professor ', '')})`).join(', ')}. These courses focus on sustainability and policy.`;
      }
    }
    
    if (input.includes('litigation') || input.includes('trial') || input.includes('court')) {
      const litigationCourses = filteredCourses.filter(c => c.areaOfInterest === 'Litigation').slice(0, 3);
      if (litigationCourses.length > 0) {
        return `Excellent! For litigation practice, I recommend: ${litigationCourses.map(c => `${c.name} (${c.instructor.replace('Professor ', '')})`).join(', ')}. These will give you great courtroom experience.`;
      }
    }
    
    // Credit-related queries
    if (input.includes('credit') || input.includes('load')) {
      const currentCredits = scheduledCourses.filter(c => c.semester === selectedTerm).reduce((sum, c) => sum + c.credits, 0);
      return `You currently have ${currentCredits} credits for ${selectedTerm}. The recommended range is 10-16 credits. ${currentCredits < 10 ? 'You might want to add more courses.' : currentCredits > 16 ? 'Consider reducing your course load.' : 'Your credit load looks good!'}`;
    }
    
    // Prerequisites
    if (input.includes('prerequisite') || input.includes('requirement')) {
      return "I can help you check prerequisites! Many upper-level courses require foundational courses like Contract Law, Torts, or Civil Procedure. What specific course are you interested in?";
    }
    
    // General recommendation
    if (input.includes('recommend') || input.includes('suggest') || input.includes('help')) {
      return `I'd be happy to help! I can recommend courses based on your interests, help avoid scheduling conflicts, or suggest courses that fulfill specific requirements. What area of law interests you most? (Business, Environmental, Litigation, Immigration, Civil Rights, etc.)`;
    }
    
    // Morning/afternoon preferences
    if (input.includes('morning') || input.includes('early')) {
      const morningCourses = filteredCourses.filter(c => {
        const startHour = parseInt(c.startTime.split(':')[0]);
        const isPM = c.startTime.includes('PM');
        return !isPM && startHour <= 11;
      }).slice(0, 4);
      return `Here are some great morning courses for ${selectedTerm}: ${morningCourses.map(c => `${c.name} (${c.startTime})`).join(', ')}. Early classes can help you maintain a good work-life balance!`;
    }
    
    if (input.includes('afternoon') || input.includes('later')) {
      const afternoonCourses = filteredCourses.filter(c => {
        const startHour = parseInt(c.startTime.split(':')[0]);
        const isPM = c.startTime.includes('PM');
        return isPM && startHour >= 2;
      }).slice(0, 4);
      return `Here are some excellent afternoon courses: ${afternoonCourses.map(c => `${c.name} (${c.startTime})`).join(', ')}. Afternoon classes can give you more flexibility in your morning routine!`;
    }
    
    // Default responses
    const defaultResponses = [
      `Hi there! I'm Quadly! 😊 I'm here to help you plan your perfect ${selectedTerm} schedule. I can recommend courses based on your interests, help you avoid conflicts, or suggest courses that meet specific requirements. What would you like to know?`,
      `Hello! I'm Quadly, and I can help you explore the ${filteredCourses.length} available courses for ${selectedTerm}! Tell me about your interests or scheduling preferences, and I'll suggest some great options.`,
      `Hey! Looking for course recommendations? I'm Quadly, and I can help you find courses in specific areas like Business Law, Environmental Law, Litigation, or Civil Rights. What interests you most?`,
      `Hi! I'm Quadly, your friendly course planning assistant! 🤖 I can help you build a balanced schedule, avoid time conflicts, and find courses that match your career goals. How can I help you today?`
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#FAF5EF' }}>
      {/* Header */}
      <div className="border-b border-gray-200 shadow-sm" style={{ backgroundColor: '#752432' }}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-white">Course Planner</h1>
              {/* Term Selector */}
              <div className="relative bg-white/10 rounded-lg p-1 backdrop-blur-sm border border-white/20">
                <div className="flex items-center">
                  {(['Fall', 'Winter', 'Spring'] as const).map((term) => (
                    <button
                      key={term}
                      onClick={() => setSelectedTerm(term)}
                      className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        selectedTerm === term
                          ? 'text-[#752432] shadow-sm'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                      style={selectedTerm === term ? {
                        backgroundColor: 'white',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      } : {}}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons - Only show when courses are scheduled */}
              {scheduledCourses.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenSaveDialog}
                    className="flex items-center gap-2 bg-white/10 border-white/30 text-white hover:bg-white hover:text-[#752432]"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenDownloadDialog}
                    className="flex items-center gap-2 bg-white/10 border-white/30 text-white hover:bg-white hover:text-[#752432]"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareSchedule}
                    className="flex items-center gap-2 bg-white/10 border-white/30 text-white hover:bg-white hover:text-[#752432]"
                  >
                    <Share className="w-4 h-4" />
                    Share
                  </Button>
                </div>
              )}
            </div>
            
            {/* Summary Stats and Actions */}
            <div className="flex items-center gap-6">
              <TooltipProvider>
                <div className="text-sm">
                  {(() => {
                    // For Fall/Spring semesters: show red for 1-9 credits and 16+ credits (with hover), white for 0 and 10-16 credits (no hover)
                    // For other semesters: always show white with no hover
                    const isFallOrSpring = selectedTerm === 'Fall' || selectedTerm === 'Spring';
                    const shouldShowRed = isFallOrSpring && ((semesterCredits >= 1 && semesterCredits <= 9) || semesterCredits > 16);
                    const shouldShowHover = isFallOrSpring && semesterCredits > 0 && ((semesterCredits >= 1 && semesterCredits <= 9) || semesterCredits > 16);
                    
                    if (shouldShowHover) {
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-pointer">
                              <span className="text-white/80">Semester Credits: </span>
                              <span className={`font-medium ${shouldShowRed ? 'text-red-500' : 'text-white'}`}>{semesterCredits}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Min 10 – Max 16</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    } else {
                      return (
                        <>
                          <span className="text-white/80">Semester Credits: </span>
                          <span className="font-medium text-white">{semesterCredits}</span>
                        </>
                      );
                    }
                  })()}
                </div>
              </TooltipProvider>
              <div className="text-sm">
                <span className="text-white/80">Total Credits: </span>
                <span className="font-medium text-white">{totalCredits}</span>
              </div>
              
              {scheduledCourses.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setScheduledCourses([])}
                  className="flex items-center gap-2 bg-white/10 border-white/30 text-white hover:bg-white hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </Button>
              )}
              
              {/* Saved Schedules Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSavedSchedulesDialog(true)}
                className="flex items-center gap-2 bg-white/10 border-white/30 text-white hover:bg-white hover:text-[#752432]"
              >
                <FolderOpen className="w-4 h-4" />
                Saved Schedules
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Course List Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col" style={{ backgroundColor: '#FEFBF6', height: 'calc(100vh - 73px)' }}>
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0 relative" style={{ backgroundColor: '#752432' }}>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 focus:border-white focus:ring-white"
                />
              </div>
              
              {showFilters && (
                <div className="space-y-3 pt-3 border-t border-white/20">
                  {/* Area of Interest */}
                  <div className="relative">
                    <Select value={selectedAreaOfInterest} onValueChange={setSelectedAreaOfInterest}>
                      <SelectTrigger className={`bg-white border-gray-300 ${selectedAreaOfInterest !== 'all-areas' ? 'pr-10' : 'pr-3'}`}>
                        <SelectValue placeholder="Area of Interest" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-areas">All Areas</SelectItem>
                        {areasOfInterest.map(area => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedAreaOfInterest !== 'all-areas' && (
                      <button
                        onClick={() => setSelectedAreaOfInterest('all-areas')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  
                  {/* Course Type */}
                  <div className="relative">
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className={`bg-white border-gray-300 ${selectedType !== 'all-types' ? 'pr-10' : 'pr-3'}`}>
                        <SelectValue placeholder="Course Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-types">All Types</SelectItem>
                        {courseTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedType !== 'all-types' && (
                      <button
                        onClick={() => setSelectedType('all-types')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Requirements - Multi-select dropdown */}
                  <div className="relative" ref={requirementsRef}>
                    <Select 
                      value={selectedFulfillsRequirements.length > 0 ? 'selected' : 'none'}
                      onValueChange={() => {}} // We'll handle this differently
                    >
                      <SelectTrigger 
                        className={`bg-white border-gray-300 ${selectedFulfillsRequirements.length > 0 ? 'pr-10' : 'pr-3'}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setShowRequirements(!showRequirements);
                        }}
                      >
                        <SelectValue>
                          {selectedFulfillsRequirements.length === 0 
                            ? 'Requirements' 
                            : `${selectedFulfillsRequirements.length} selected`
                          }
                        </SelectValue>
                      </SelectTrigger>
                      {showRequirements && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {fulfillsRequirementOptions.map(req => {
                            const isChecked = selectedFulfillsRequirements.includes(req);
                            return (
                              <div 
                                key={req} 
                                className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                  setSelectedFulfillsRequirements(prev => 
                                    isChecked
                                      ? prev.filter(r => r !== req)
                                      : [...prev, req]
                                  );
                                }}
                              >
                                <div
                                  className={`w-4 h-4 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                                    isChecked
                                      ? 'bg-[#752432] border-[#752432] shadow-sm'
                                      : 'bg-white border-gray-300'
                                  }`}
                                >
                                  {isChecked && (
                                    <svg
                                      className="w-2.5 h-2.5 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </div>
                                <label className="text-sm text-gray-700 cursor-pointer flex-1 select-none">
                                  {req}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Select>
                    {selectedFulfillsRequirements.length > 0 && (
                      <button
                        onClick={() => setSelectedFulfillsRequirements([])}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Days of Week Filter */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-white">Days of Week</label>
                    <div className="flex gap-2 items-center mt-3">
                      {['M', 'T', 'W', 'Th', 'F'].map((dayLetter, index) => {
                        const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                        const fullDay = fullDayNames[index];
                        const isSelected = selectedDays.includes(fullDay);
                        
                        return (
                          <button
                            key={dayLetter}
                            onClick={() => {
                              setSelectedDays(prev => 
                                isSelected
                                  ? prev.filter(day => day !== fullDay)
                                  : [...prev, fullDay]
                              );
                            }}
                            className={`w-7 h-7 text-xs font-medium rounded-full transition-all duration-200 flex items-center justify-center ${
                              isSelected
                                ? 'bg-white text-[#752432] shadow-sm border-2 border-white'
                                : 'text-white hover:bg-white/10 border border-white/30'
                            }`}
                          >
                            {dayLetter}
                          </button>
                        );
                      })}
                      {selectedDays.length > 0 && (
                        <button
                          onClick={() => setSelectedDays([])}
                          className="ml-2 p-1 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* View Mode Controls and Filter Toggle Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle Buttons */}
                  <div className="flex items-center bg-white/10 rounded-md p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-white text-[#752432]'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                      title="Grid view"
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white text-[#752432]'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                      title="List view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* AI Chatbot Robot Button */}
                  <button
                    onClick={() => setShowChatbot(true)}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors group"
                    title="Quadly - Your AI Course Assistant"
                  >
                    {/* Cute Pixel Art Robot - Quadly */}
                    <div className="w-4 h-4 relative">
                      <svg viewBox="0 0 16 16" className="w-full h-full">
                        {/* Robot head - rounder and cuter */}
                        <rect x="3" y="2" width="10" height="8" rx="2" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        <rect x="4" y="3" width="8" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white/60" />
                        
                        {/* Heart eyes for extra cuteness */}
                        <path d="M5.5 4.5 L6 4 L6.5 4.5 L6 5.5 Z" fill="currentColor" className="text-pink-400 group-hover:text-pink-300" />
                        <path d="M9.5 4.5 L10 4 L10.5 4.5 L10 5.5 Z" fill="currentColor" className="text-pink-400 group-hover:text-pink-300" />
                        
                        {/* Happy smile */}
                        <path d="M5.5 7 Q8 8.5 10.5 7" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-white/90" />
                        
                        {/* Cute antenna with sparkle */}
                        <rect x="7.5" y="0" width="1" height="2" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        <circle cx="8" cy="0.5" r="0.8" fill="currentColor" className="text-yellow-400 group-hover:text-yellow-200" />
                        <circle cx="8.3" cy="0.2" r="0.2" fill="currentColor" className="text-white" />
                        
                        {/* Round body */}
                        <rect x="4.5" y="10" width="7" height="4" rx="1.5" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        <circle cx="6.5" cy="11.5" r="0.3" fill="currentColor" className="text-green-400" />
                        <circle cx="9.5" cy="11.5" r="0.3" fill="currentColor" className="text-blue-400" />
                        
                        {/* Stubby arms */}
                        <rect x="1.5" y="11" width="3" height="1.5" rx="0.75" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        <rect x="11.5" y="11" width="3" height="1.5" rx="0.75" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        
                        {/* Little feet */}
                        <rect x="5.5" y="14" width="2" height="1.5" rx="0.5" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                        <rect x="8.5" y="14" width="2" height="1.5" rx="0.5" fill="currentColor" className="text-white group-hover:text-yellow-300 transition-colors" />
                      </svg>
                    </div>
                  </button>
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  {showFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Course List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {/* Semester Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">{selectedTerm} Courses</h3>
              <Badge variant="outline" className="text-sm bg-white">
                {filteredCourses.length} available
              </Badge>
            </div>
            
            {filteredCourses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium mb-1">No courses available</p>
                <p className="text-sm">Try adjusting your filters or select a different semester</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-3' : 'space-y-1'}>
                {filteredCourses.map(course => {
                  const hasConflict = hasTimeConflict(course);
                  const conflictDetails = hasConflict ? getConflictDetails(course) : null;
                  
                  if (viewMode === 'list') {

                    // List view - compact layout with course name, type, credits, professor, days and times
                    return (
                      <div 
                        key={course.id}
                        className={`group transition-all duration-200 cursor-pointer hover:bg-gray-50 bg-white border border-gray-200 ${
                          hasConflict ? 'opacity-60' : ''
                        }`}
                        onClick={() => showCourseDetail(course)}
                      >
                        <div className="px-3 py-1.5 relative">
                          {/* First line: Course Name (bold) on left, Credits on right */}
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="font-bold text-gray-900 text-xs leading-tight flex-1 pr-2 flex items-center gap-2">
                              <span className="group-hover:hidden">
                                {getCleanCourseName(course.name, course.type)}
                              </span>
                              <span className="hidden group-hover:inline">
                                {(() => {
                                  const cleanName = getCleanCourseName(course.name, course.type);
                                  // For Reading Groups only, truncate to 13 characters on hover
                                  if (course.type === 'Reading Group') {
                                    return cleanName.length > 13 ? cleanName.substring(0, 13) + '...' : cleanName;
                                  }
                                  // For all other course types, show full name on hover
                                  return cleanName;
                                })()}
                              </span>
                              
                              {/* Course Type badge appears next to name on hover */}
                              <Badge 
                                variant="outline"
                                className="px-1 py-0 h-auto leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                style={{ 
                                  borderColor: getCourseColor(course.type), 
                                  color: getCourseColor(course.type),
                                  fontSize: '9px'
                                }}
                              >
                                {course.type}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center flex-shrink-0">
                              {/* Credits badge */}
                              <div className="flex items-center gap-1">
                                <Badge 
                                  variant="outline" 
                                  className="px-1 py-0 h-auto leading-tight"
                                  style={{ 
                                    backgroundColor: getCourseColor(course.type), 
                                    borderColor: getCourseColor(course.type),
                                    color: 'white',
                                    fontSize: '9px'
                                  }}
                                >
                                  {course.credits}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {/* Second line: Days and Times on left, Professor Last Name on right */}
                          <div className="flex items-center justify-between text-2xs text-gray-600">
                            <div className="flex items-center gap-2">
                              <span className="leading-tight">{course.days.map(day => getDaySingleLetter(day)).join(' ')}</span>
                              <span className="leading-tight">{course.startTime} - {course.endTime}</span>
                            </div>
                            <span className="leading-tight">{getLastName(course.instructor)}</span>
                          </div>
                          
                          {/* Conflict warning if needed */}
                          {hasConflict && conflictDetails && (
                            <div className="text-2xs text-red-600 leading-tight mt-0.5">
                              Conflicts with: {getCleanCourseName(conflictDetails.course.name, conflictDetails.course.type)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    // Grid view - original card layout
                    return (
                      <Card 
                        key={course.id}
                        className={`group transition-all duration-200 border-2 cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] relative ${
                          hasConflict 
                            ? 'border-gray-200 opacity-60 bg-gray-100' 
                            : 'bg-white'
                        }`}
                        style={hasConflict ? {} : {
                          '--tw-border-opacity': '0.2',
                          borderColor: `${getCourseColor(course.type)}33`,
                          '--hover-border-color': `${getCourseColor(course.type)}80`,
                          '--hover-bg-color': `${getCourseColor(course.type)}08`
                        } as React.CSSProperties}
                        onMouseEnter={(e) => {
                          if (!hasConflict) {
                            e.currentTarget.style.borderColor = `${getCourseColor(course.type)}80`;
                            e.currentTarget.style.backgroundColor = `${getCourseColor(course.type)}08`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!hasConflict) {
                            e.currentTarget.style.borderColor = `${getCourseColor(course.type)}33`;
                            e.currentTarget.style.backgroundColor = 'white';
                          }
                        }}
                        onClick={() => showCourseDetail(course)}
                      >
                        <CardContent className="p-4 relative">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-1">{getCleanCourseName(course.name, course.type)}</h3>
                              <p className="text-sm text-gray-600 mb-2">{getLastName(course.instructor)}</p>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline"
                                  className="text-xs"
                                  style={{ borderColor: getCourseColor(course.type), color: getCourseColor(course.type) }}
                                >
                                  {course.type}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className="text-sm font-medium"
                                style={{ 
                                  backgroundColor: getCourseColor(course.type), 
                                  borderColor: getCourseColor(course.type),
                                  color: 'white'
                                }}
                              >
                                {course.credits}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{course.days.map(day => day.slice(0, 3)).join(', ')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{course.startTime} - {course.endTime}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{course.location}</span>
                            </div>
                            {hasConflict && conflictDetails && (
                              <div className="text-sm text-[rgba(219,6,6,1)] font-medium">
                                Conflicts with: {getCleanCourseName(conflictDetails.course.name, conflictDetails.course.type)}
                              </div>
                            )}
                          </div>
                          
                          {/* Add to Calendar Button - Bottom Right Corner */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addCourseToSchedule(course);
                            }}
                            className="absolute bottom-3 right-3 w-6 h-6 rounded-sm flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
                            style={{ 
                              backgroundColor: getCourseColor(course.type),
                              color: 'white'
                            }}
                            onMouseEnter={(e) => {
                              const currentBg = getCourseColor(course.type);
                              // Darken the color on hover
                              const rgb = hexToRgb(currentBg);
                              if (rgb) {
                                const darkerColor = `rgb(${Math.max(0, rgb.r - 30)}, ${Math.max(0, rgb.g - 30)}, ${Math.max(0, rgb.b - 30)})`;
                                e.currentTarget.style.backgroundColor = darkerColor;
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = getCourseColor(course.type);
                            }}
                            title="Add to calendar"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </CardContent>
                      </Card>
                    );
                  }
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col relative">
          {/* Calendar */}
          <div className="flex-1 p-6" style={{ backgroundColor: '#FAF5EF' }}>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 h-full">
              <div className="grid grid-cols-6 h-full">
                {/* Time column */}
                <div className="border-r border-gray-200">
                  {/* Header cell */}
                  <div 
                    className="h-12 flex items-center justify-center border-b border-gray-200"
                    style={{ backgroundColor: '#752432' }}
                  >
                    <span className="text-white font-medium text-sm">Time</span>
                  </div>
                  
                  {/* Time slots */}
                  {timeSlots.map((time, index) => (
                    <div 
                      key={time}
                      className={`h-16 flex items-center justify-center text-sm text-gray-600 border-b border-gray-200 ${
                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      {time}
                    </div>
                  ))}
                </div>
                
                {/* Day columns */}
                {daysOfWeek.map((day, dayIndex) => (
                  <div key={day} className={`relative ${dayIndex < 4 ? 'border-r border-gray-200' : ''}`}>
                    {/* Day header */}
                    <div 
                      className="h-12 flex items-center justify-center border-b border-gray-200"
                      style={{ backgroundColor: '#752432' }}
                    >
                      <span className="text-white font-medium text-sm">{day}</span>
                    </div>
                    
                    {/* Background time slots grid */}
                    <div className="relative">
                      {timeSlots.map((time, timeIndex) => (
                        <div 
                          key={`${day}-${time}-bg`}
                          className={`h-16 border-b border-gray-200 ${
                            timeIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                          }`}
                        />
                      ))}
                      
                      {/* Overlay courses */}
                      {(() => {
                        // Group courses by time slot to handle conflicts
                        const coursesInDay = scheduledCourses.filter(course => 
                          course.days.includes(day) && course.semester === selectedTerm
                        );
                        
                        // Create time slot groups
                        const timeSlotGroups = new Map();
                        coursesInDay.forEach(course => {
                          const startTime = course.startTime;
                          const endTime = course.endTime;
                          const key = `${startTime}-${endTime}`;
                          
                          if (!timeSlotGroups.has(key)) {
                            timeSlotGroups.set(key, []);
                          }
                          timeSlotGroups.get(key).push(course);
                        });
                        
                        return Array.from(timeSlotGroups.entries()).map(([_timeKey, courses]) => {
                          const firstCourse = courses[0];
                          const height = getCourseHeight(firstCourse.startTime, firstCourse.endTime);
                          const top = getCourseTopPosition(firstCourse.startTime);
                          
                          return courses.map((course: ScheduledCourse, index: number) => {
                            const courseColor = getCourseColor(course.type);
                            const isConflicted = courses.length > 1;
                            const courseWidth = isConflicted ? `calc(${100 / courses.length}% - 1px)` : '100%';
                            const leftOffset = isConflicted ? `calc(${(100 / courses.length) * index}% + ${index}px)` : '0px';
                            
                            return (
                              <div 
                                key={`${course.scheduledId}-${day}`}
                                className="absolute group p-2 rounded-sm shadow-sm border border-white/20 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                                style={{ 
                                  top: `${top}px`,
                                  height: `${height}px`,
                                  left: leftOffset,
                                  width: courseWidth,
                                  backgroundColor: `${courseColor}CC`, // Make courses slightly transparent (80% opacity)
                                  zIndex: 10 + index
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showCourseDetail(course);
                                }}
                              >
                                {/* Conflict overlay with diagonal lines */}
                                {isConflicted && (
                                  <div 
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                      backgroundColor: 'rgba(239, 68, 68, 0.3)', // Transparent red
                                      backgroundImage: `repeating-linear-gradient(
                                        45deg,
                                        transparent,
                                        transparent 4px,
                                        rgba(239, 68, 68, 0.4) 4px,
                                        rgba(239, 68, 68, 0.4) 8px
                                      )`,
                                      zIndex: 1
                                    }}
                                  />
                                )}
                                
                                <div className="relative z-10">
                                  <div className="text-white text-xs font-medium mb-0.5 leading-tight">
                                    {getCleanCourseName(course.name, course.type)}
                                  </div>
                                  <div className="text-white text-2xs opacity-90 mb-0.5">
                                    {course.credits} • {getLastName(course.instructor)}
                                  </div>
                                  <div className="text-white text-xs opacity-75 mb-1">
                                    {course.startTime} - {course.endTime}
                                  </div>
                                  <div className="text-white text-xs opacity-75 mb-1">
                                    {course.location}
                                  </div>
                                </div>
                                
                                {/* Remove button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeCourseFromSchedule(course.scheduledId);
                                  }}
                                  className="absolute top-1 right-1 w-5 h-5 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-white/30 z-20"
                                >
                                  <X className="w-3 h-3 text-white" />
                                </button>
                              </div>
                            );
                          });
                        }).flat();
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Empty state for calendar - Centered */}
          {scheduledCourses.filter(course => course.semester === selectedTerm).length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">Your schedule is empty</h3>
                <p className="text-gray-400">Click on courses from the left to add them to your calendar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Schedule Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Schedule</DialogTitle>
            <DialogDescription>
              Choose which semesters to include and name your schedule.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Schedule Name</label>
              <Input
                placeholder="Enter schedule name..."
                value={saveScheduleName}
                onChange={(e) => setSaveScheduleName(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Select Semesters to Save</label>
              <div className="space-y-2">
                {getAvailableSemesters().map((semester) => (
                  <div key={semester} className="flex items-center space-x-2">
                    <Checkbox
                      id={`save-${semester}`}
                      checked={selectedSemestersForSave.includes(semester)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSemestersForSave(prev => [...prev, semester]);
                        } else {
                          setSelectedSemestersForSave(prev => prev.filter(s => s !== semester));
                        }
                      }}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label htmlFor={`save-${semester}`} className="text-sm font-medium">
                            {semester} ({scheduledCourses.filter(c => c.semester === semester).reduce((sum, course) => sum + course.credits, 0)} credits) • {scheduledCourses.filter(c => c.semester === semester).length} courses
                          </label>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="max-w-xs">
                            {scheduledCourses.filter(c => c.semester === semester).map((course, _index) => (
                              <p key={course.scheduledId} className="text-2xs">
                                {course.name}
                              </p>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSchedule} style={{ backgroundColor: '#752432' }}>
                Save Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Download Schedule Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download Schedule PDF</DialogTitle>
            <DialogDescription>
              Select which semesters you'd like to download as PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Semesters to Download</label>
              <div className="space-y-2">
                {getAvailableSemesters().map((semester) => (
                  <div key={semester} className="flex items-center space-x-2">
                    <Checkbox
                      id={`download-${semester}`}
                      checked={selectedSemestersForDownload.includes(semester)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedSemestersForDownload(prev => [...prev, semester]);
                        } else {
                          setSelectedSemestersForDownload(prev => prev.filter(s => s !== semester));
                        }
                      }}
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label htmlFor={`download-${semester}`} className="text-sm font-medium">
                            {semester} ({scheduledCourses.filter(c => c.semester === semester).reduce((sum, course) => sum + course.credits, 0)} credits) • {scheduledCourses.filter(c => c.semester === semester).length} courses
                          </label>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="max-w-xs">
                            {scheduledCourses.filter(c => c.semester === semester).map((course, _index) => (
                              <p key={course.scheduledId} className="text-2xs">
                                {course.name}
                              </p>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDownloadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleDownloadSchedule} style={{ backgroundColor: '#752432' }}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Schedules Dialog */}
      <Dialog open={showSavedSchedulesDialog} onOpenChange={setShowSavedSchedulesDialog}>
        <DialogContent className="sm:max-w-2xl">
          <TooltipProvider>
            <DialogHeader>
              <DialogTitle>Saved Schedules</DialogTitle>
              <DialogDescription>
                Select a saved schedule to load onto the planner.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
            {savedSchedules.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">No saved schedules</h3>
                <p className="text-gray-400">Save a schedule to see it here.</p>
              </div>
            ) : (
              savedSchedules.map((schedule) => (
                <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{schedule.name}</h4>
                      <div className="text-sm text-gray-500 mt-1">
                        <span>{schedule.semesters.join(', ')}</span>
                        <span className="mx-2">•</span>
                        <span>{schedule.courses.length} courses</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <span>Saved {new Date(schedule.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {schedule.semesters.map((semester) => (
                          <Tooltip key={semester}>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-50 transition-colors">
                                  {semester} ({schedule.courses.filter(c => c.semester === semester).reduce((sum, course) => sum + course.credits, 0)} credits)
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" >
                                <div className="max-w-xs">
                                  {schedule.courses.filter(c => c.semester === semester).map((course, _index) => (
                                    <p key={course.scheduledId} className="text-2xs">
                                      • {getCleanCourseName(course.name, course.type)}
                                    </p>
                                  ))}
                                </div>
                              </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleLoadSavedSchedule(schedule)}
                        style={{ backgroundColor: '#752432' }}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSavedSchedule(schedule.id)}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSavedSchedulesDialog(false)}>
              Close
            </Button>
          </div>
          </TooltipProvider>
        </DialogContent>
      </Dialog>

      {/* Course Detail Dialog */}
      <Dialog open={showCourseDetailDialog} onOpenChange={setShowCourseDetailDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center">
              <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                {selectedCourseForDetail ? getCleanCourseName(selectedCourseForDetail.name, selectedCourseForDetail.type) : 'Course Details'}
                {selectedCourseForDetail && (
                  <Badge 
                    variant="outline" 
                    className="text-xs font-medium"
                    style={{ 
                      backgroundColor: getCourseColor(selectedCourseForDetail.type), 
                      borderColor: getCourseColor(selectedCourseForDetail.type),
                      color: 'white'
                    }}
                  >
                    {selectedCourseForDetail.credits}
                  </Badge>
                )}
              </DialogTitle>
            </div>
            <DialogDescription className="sr-only">
              View detailed information about this course including schedule, requirements, and enrollment details.
            </DialogDescription>
            <div className="flex items-center gap-3 mt-2">
              {selectedCourseForDetail && (
                <Badge 
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: getCourseColor(selectedCourseForDetail.type), color: getCourseColor(selectedCourseForDetail.type) }}
                >
                  {selectedCourseForDetail.type}
                </Badge>
              )}
            </div>
          </DialogHeader>
          
          {selectedCourseForDetail && (
            <div className="space-y-4">
              {/* Course Description */}
              <div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedCourseForDetail.description}
                </p>
              </div>
              
              {/* Course Information Grid */}
              <div className="space-y-4">
                {/* Days and Times row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Days</label>
                    <p className="text-sm text-gray-900">{selectedCourseForDetail.days.join(', ')}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Times</label>
                    <p className="text-sm text-gray-900">{selectedCourseForDetail.startTime} - {selectedCourseForDetail.endTime}</p>
                  </div>
                </div>
                
                {/* Professor and Location row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Professor</label>
                    <button
                      onClick={() => handleProfessorClick(selectedCourseForDetail.instructor)}
                      className="text-sm underline cursor-pointer bg-transparent border-none p-0 font-normal"
                      style={{ color: getCourseColor(selectedCourseForDetail.type) }}
                    >
                      {getFullInstructorName(selectedCourseForDetail.instructor)}
                    </button>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Location</label>
                    <p className="text-sm text-gray-900">{selectedCourseForDetail.location}</p>
                  </div>
                </div>
                
                {/* Prerequisites and Exam row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Prerequisites</label>
                    <p className="text-sm text-gray-900">
                      {selectedCourseForDetail.prerequisites && selectedCourseForDetail.prerequisites.length > 0 
                        ? selectedCourseForDetail.prerequisites.join(', ') 
                        : 'None'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Exam</label>
                    <p className="text-sm text-gray-900">
                      {selectedCourseForDetail.exam || 'No Exam'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Requirements - Only show if course fulfills any requirements */}
              {selectedCourseForDetail.fulfillsRequirements && selectedCourseForDetail.fulfillsRequirements.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Requirements Fulfilled</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCourseForDetail.fulfillsRequirements.map((req, index) => (
                      <Badge 
                        key={index}
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: getCourseColor(selectedCourseForDetail.type), color: getCourseColor(selectedCourseForDetail.type) }}
                      >
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCourseDetailDialog(false)}
                >
                  Close
                </Button>
{(() => {
                  const isScheduled = isCourseScheduled(selectedCourseForDetail);
                  const scheduledCourse = getScheduledCourse(selectedCourseForDetail);
                  
                  return (
                    <Button 
                      size="sm"
                      onClick={() => {
                        if (isScheduled && scheduledCourse) {
                          removeCourseFromSchedule(scheduledCourse.scheduledId);
                          setShowCourseDetailDialog(false);
                        } else {
                          addCourseToSchedule(selectedCourseForDetail, true);
                        }
                      }}
                      style={{ backgroundColor: getCourseColor(selectedCourseForDetail.type) }}
                      className="text-white"
                      onMouseEnter={(e) => {
                        const currentBg = getCourseColor(selectedCourseForDetail.type);
                        const rgb = hexToRgb(currentBg);
                        if (rgb) {
                          const darkerColor = `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`;
                          e.currentTarget.style.backgroundColor = darkerColor;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = getCourseColor(selectedCourseForDetail.type);
                      }}
                    >
                      {isScheduled ? (
                        <>
                          <X className="w-4 h-4 mr-1" />
                          Remove from Calendar
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Add to Calendar
                        </>
                      )}
                    </Button>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Chatbot Dialog */}
      <Dialog open={showChatbot} onOpenChange={setShowChatbot}>
        <DialogContent className="max-w-md h-[500px] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2" style={{ backgroundColor: '#752432' }}>
            <DialogTitle className="text-white flex items-center gap-2">
              {/* Quadly Robot Icon */}
              <div className="w-5 h-5 relative">
                <svg viewBox="0 0 16 16" className="w-full h-full">
                  {/* Quadly's head - rounder and cuter */}
                  <rect x="3" y="2" width="10" height="8" rx="2" fill="currentColor" className="text-yellow-300" />
                  <rect x="4" y="3" width="8" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white/60" />
                  
                  {/* Heart eyes for extra cuteness */}
                  <path d="M5.5 4.5 L6 4 L6.5 4.5 L6 5.5 Z" fill="currentColor" className="text-pink-400" />
                  <path d="M9.5 4.5 L10 4 L10.5 4.5 L10 5.5 Z" fill="currentColor" className="text-pink-400" />
                  
                  {/* Happy smile */}
                  <path d="M5.5 7 Q8 8.5 10.5 7" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-white/90" />
                  
                  {/* Cute antenna with sparkle */}
                  <rect x="7.5" y="0" width="1" height="2" fill="currentColor" className="text-yellow-300" />
                  <circle cx="8" cy="0.5" r="0.8" fill="currentColor" className="text-yellow-200" />
                  <circle cx="8.3" cy="0.2" r="0.2" fill="currentColor" className="text-white" />
                  
                  {/* Round body */}
                  <rect x="4.5" y="10" width="7" height="4" rx="1.5" fill="currentColor" className="text-yellow-300" />
                  <circle cx="6.5" cy="11.5" r="0.3" fill="currentColor" className="text-green-400" />
                  <circle cx="9.5" cy="11.5" r="0.3" fill="currentColor" className="text-blue-400" />
                  
                  {/* Stubby arms */}
                  <rect x="1.5" y="11" width="3" height="1.5" rx="0.75" fill="currentColor" className="text-yellow-300" />
                  <rect x="11.5" y="11" width="3" height="1.5" rx="0.75" fill="currentColor" className="text-yellow-300" />
                  
                  {/* Little feet */}
                  <rect x="5.5" y="14" width="2" height="1.5" rx="0.5" fill="currentColor" className="text-yellow-300" />
                  <rect x="8.5" y="14" width="2" height="1.5" rx="0.5" fill="currentColor" className="text-yellow-300" />
                </svg>
              </div>
              Quadly
            </DialogTitle>
            <DialogDescription className="text-white/80 text-sm">
              Your friendly AI course planning assistant is here to help!
            </DialogDescription>
          </DialogHeader>
          
          {/* Chat Messages */}
          <div 
            ref={chatMessagesRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
          >
            {chatMessages.length === 0 && (
              <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-[#752432]">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#752432] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-3 h-3">
                      <svg viewBox="0 0 16 16" className="w-full h-full">
                        <rect x="3" y="2" width="10" height="8" fill="currentColor" className="text-yellow-300" />
                        <rect x="5" y="4" width="2" height="2" fill="currentColor" className="text-blue-400" />
                        <rect x="9" y="4" width="2" height="2" fill="currentColor" className="text-blue-400" />
                        <rect x="6" y="7" width="4" height="1" fill="currentColor" className="text-white" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p>Hi! I'm Quadly, your friendly course planning assistant! 🤗 I can help you:</p>
                    <ul className="mt-2 space-y-1 text-xs text-gray-600">
                      <li>• Find courses that match your interests</li>
                      <li>• Avoid scheduling conflicts</li>
                      <li>• Balance your credit load</li>
                      <li>• Check prerequisites</li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-500">
                      Try asking: "I'm interested in business law" or "Show me morning courses"
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-[#752432] text-white'
                      : 'bg-white text-gray-700 shadow-sm border-l-4 border-[#752432]'
                  }`}
                >
                  {message.type === 'ai' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full bg-[#752432] flex items-center justify-center flex-shrink-0">
                        <div className="w-2.5 h-2.5">
                          <svg viewBox="0 0 16 16" className="w-full h-full">
                            <rect x="3" y="2" width="10" height="8" fill="currentColor" className="text-yellow-300" />
                            <rect x="5" y="4" width="2" height="2" fill="currentColor" className="text-blue-400" />
                            <rect x="9" y="4" width="2" height="2" fill="currentColor" className="text-blue-400" />
                            <rect x="6" y="7" width="4" height="1" fill="currentColor" className="text-white" />
                          </svg>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-[#752432]">Quadly</span>
                    </div>
                  )}
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Chat Input */}
          <div className="p-4 border-t bg-white">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask me about courses..."
                className="flex-1 text-sm"
                maxLength={500}
              />
              <Button
                type="submit"
                disabled={!chatInput.trim()}
                style={{ backgroundColor: '#752432' }}
                className="text-white hover:opacity-90 disabled:opacity-50"
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              You're viewing {selectedTerm} courses • {filteredCourses.length} available
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}