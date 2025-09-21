import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { NavigationSidebar } from './components/NavigationSidebar';
import { SearchSidebar } from './components/SearchSidebar';
import { OutlineViewer } from './components/OutlineViewer';
import { ReviewsPage } from './components/ReviewsPage';
import { HomePage } from './components/HomePage';
import { CoursePage } from './components/CoursePage';
import { BarReviewPage } from './components/BarReviewPage';
import { CalendarPage } from './components/CalendarPage';
import { ProfilePage } from './components/ProfilePage';
import { MessagingPage } from './components/MessagingPage';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import AccessCodeVerification from './components/AccessCodeVerification';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { supabase } from './lib/supabase';
import type { Outline, Instructor } from './types';

// Mock data
const mockOutlines: Outline[] = [
  // Administrative Law
  {
    id: '1',
    title: 'ObeseNosy',
    year: '2023',
    type: 'DS',
    rating: 5,
    ratingCount: 521,
    course: 'Administrative Law',
    instructor: 'Abel',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 127,
  },
  {
    id: '2',
    title: 'AdminLawGuide',
    year: '2024',
    type: 'DS',
    rating: 4,
    ratingCount: 387,
    course: 'Administrative Law',
    instructor: 'Barnes',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 89,
  },

  // Advanced Constitutional Law
  {
    id: '3',
    title: 'PeacefulNice',
    year: '2023',
    type: 'H',
    rating: 5,
    ratingCount: 521,
    course: 'Advanced Constitutional Law',
    instructor: "Di'Angelo",
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 156,
  },
  {
    id: '4',
    title: 'AdvancedConLaw',
    year: '2024',
    type: 'DS',
    rating: 4,
    ratingCount: 298,
    course: 'Advanced Constitutional Law',
    instructor: 'Foster',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 203,
  },

  // Antitrust Law
  {
    id: '5',
    title: 'AntitrustMaster',
    year: '2024',
    type: 'DS',
    rating: 5,
    ratingCount: 203,
    course: 'Antitrust Law',
    instructor: 'Clark',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 67,
  },
  {
    id: '6',
    title: 'CompetitionLawPro',
    year: '2023',
    type: 'P',
    rating: 4,
    ratingCount: 156,
    course: 'Antitrust Law',
    instructor: 'Kim',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 112,
  },

  // Bankruptcy
  {
    id: '7',
    title: 'StudyMaster',
    year: '2020',
    type: 'DS',
    rating: 4,
    ratingCount: 342,
    course: 'Bankruptcy',
    instructor: 'Zachariah',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 185,
  },
  {
    id: '8',
    title: 'BankruptcyExpert',
    year: '2024',
    type: 'H',
    rating: 5,
    ratingCount: 289,
    course: 'Bankruptcy',
    instructor: 'Mitchell',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 97,
  },

  // Business Taxation
  {
    id: '9',
    title: 'LegalEagle',
    year: '2019',
    type: 'DS',
    rating: 5,
    ratingCount: 678,
    course: 'Business Taxation',
    instructor: 'Abel',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 240,
  },
  {
    id: '10',
    title: 'TaxationGuide',
    year: '2024',
    type: 'DS',
    rating: 4,
    ratingCount: 234,
    course: 'Business Taxation',
    instructor: 'Perez',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 78,
  },

  // Civil Rights Law
  {
    id: '11',
    title: 'CivilRightsExpert',
    year: '2024',
    type: 'DS',
    rating: 5,
    ratingCount: 334,
    course: 'Civil Rights Law',
    instructor: 'Rodriguez',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 134,
  },
  {
    id: '12',
    title: 'RightsLawPro',
    year: '2023',
    type: 'P',
    rating: 4,
    ratingCount: 278,
    course: 'Civil Rights Law',
    instructor: 'Foster',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 167,
  },

  // Commercial Law
  {
    id: '13',
    title: 'CommercialLawPro',
    year: '2018',
    type: 'DS',
    rating: 4,
    ratingCount: 245,
    course: 'Commercial Law',
    instructor: 'Chen',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 45,
  },
  {
    id: '14',
    title: 'BusinessLawGuide',
    year: '2024',
    type: 'H',
    rating: 5,
    ratingCount: 367,
    course: 'Commercial Law',
    instructor: 'Lee',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 192,
  },

  // Competition Law
  {
    id: '15',
    title: 'CompetitionLawMaster',
    year: '2017',
    type: 'DS',
    rating: 4,
    ratingCount: 189,
    course: 'Competition Law',
    instructor: 'Garcia',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 73,
  },
  {
    id: '16',
    title: 'MarketLawGuide',
    year: '2024',
    type: 'P',
    rating: 5,
    ratingCount: 223,
    course: 'Competition Law',
    instructor: 'Clark',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 158,
  },

  // Constitutional Law
  {
    id: '17',
    title: 'ConstitutionalGuide',
    year: '2024',
    type: 'DS',
    rating: 4,
    ratingCount: 289,
    course: 'Constitutional Law',
    instructor: 'Rodriguez',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 91,
  },
  {
    id: '18',
    title: 'ConLawExpert',
    year: '2016',
    type: 'DS',
    rating: 5,
    ratingCount: 445,
    course: 'Constitutional Law',
    instructor: 'Morris',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 198,
  },

  // Contract Law
  {
    id: '19',
    title: 'ContractMaster',
    year: '2024',
    type: 'DS',
    rating: 5,
    ratingCount: 445,
    course: 'Contract Law',
    instructor: 'Chen',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 145,
  },
  {
    id: '20',
    title: 'ContractsGuide',
    year: '2023',
    type: 'H',
    rating: 4,
    ratingCount: 356,
    course: 'Contract Law',
    instructor: 'Edwards',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 87,
  },

  // Corporate Law
  {
    id: '21',
    title: 'CorporateLawPro',
    year: '2022',
    type: 'DS',
    rating: 4,
    ratingCount: 298,
    course: 'Corporate Law',
    instructor: 'Zachariah',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 123,
  },
  {
    id: '22',
    title: 'CorpLawMaster',
    year: '2024',
    type: 'P',
    rating: 5,
    ratingCount: 387,
    course: 'Corporate Law',
    instructor: 'Collins',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 176,
  },

  // Criminal Law
  {
    id: '23',
    title: 'CriminalLawPro',
    year: '2023',
    type: 'DS',
    rating: 4,
    ratingCount: 356,
    course: 'Criminal Law',
    instructor: 'Thompson',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 62,
  },
  {
    id: '24',
    title: 'CrimLawExpert',
    year: '2024',
    type: 'DS',
    rating: 5,
    ratingCount: 423,
    course: 'Criminal Law',
    instructor: 'Turner',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 154,
  },

  // Criminal Procedure
  {
    id: '25',
    title: 'CrimProcedureGuide',
    year: '2024',
    type: 'H',
    rating: 4,
    ratingCount: 167,
    course: 'Criminal Procedure',
    instructor: 'Thompson',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 95,
  },
  {
    id: '26',
    title: 'ProcedureMaster',
    year: '2023',
    type: 'DS',
    rating: 5,
    ratingCount: 289,
    course: 'Criminal Procedure',
    instructor: 'Brown',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 138,
  },

  // Domestic Relations
  {
    id: '27',
    title: 'DomesticRelationsGuide',
    year: '2023',
    type: 'DS',
    rating: 4,
    ratingCount: 234,
    course: 'Domestic Relations',
    instructor: 'Johnson',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 76,
  },
  {
    id: '28',
    title: 'FamilyRelationsPro',
    year: '2024',
    type: 'P',
    rating: 5,
    ratingCount: 312,
    course: 'Domestic Relations',
    instructor: 'Wright',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 115,
  },

  // Employment Law
  {
    id: '29',
    title: 'EmploymentLawMaster',
    year: '2023',
    type: 'DS',
    rating: 5,
    ratingCount: 298,
    course: 'Employment Law',
    instructor: 'Miller',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 167,
  },
  {
    id: '30',
    title: 'WorkplaceLawGuide',
    year: '2024',
    type: 'H',
    rating: 4,
    ratingCount: 267,
    course: 'Employment Law',
    instructor: 'Lopez',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 118,
  },

  // Energy Law
  {
    id: '31',
    title: 'EnergyLawExpert',
    year: '2023',
    type: 'DS',
    rating: 4,
    ratingCount: 178,
    course: 'Energy Law',
    instructor: 'Williams',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 141,
  },
  {
    id: '32',
    title: 'PowerLawGuide',
    year: '2024',
    type: 'DS',
    rating: 5,
    ratingCount: 198,
    course: 'Energy Law',
    instructor: 'Hall',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 69,
  },

  // Environmental Law
  {
    id: '33',
    title: 'EnviroLegal',
    year: '2024',
    type: 'DS',
    rating: 4,
    ratingCount: 145,
    course: 'Environmental Law',
    instructor: 'Williams',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 189,
  },
  {
    id: '34',
    title: 'EcoLawMaster',
    year: '2023',
    type: 'DS',
    rating: 5,
    ratingCount: 223,
    course: 'Environmental Law',
    instructor: 'Phillips',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 102,
  },

  // Estate Planning
  {
    id: '35',
    title: 'EstatePlanningPro',
    year: '2024',
    type: 'P',
    rating: 4,
    ratingCount: 178,
    course: 'Estate Planning',
    instructor: 'Wilson',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 84,
  },
  {
    id: '36',
    title: 'WillsAndEstates',
    year: '2023',
    type: 'DS',
    rating: 5,
    ratingCount: 256,
    course: 'Estate Planning',
    instructor: 'Allen',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 132,
  },

  // Evidence
  {
    id: '37',
    title: 'EvidenceGuide',
    year: '2024',
    type: 'DS',
    rating: 5,
    ratingCount: 398,
    course: 'Evidence',
    instructor: 'Taylor',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 159,
  },
  {
    id: '38',
    title: 'ProofAndEvidence',
    year: '2023',
    type: 'DS',
    rating: 4,
    ratingCount: 334,
    course: 'Evidence',
    instructor: 'Brown',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 174,
  },

  // Family Law
  {
    id: '39',
    title: 'FamilyLawGuide',
    year: '2023',
    type: 'DS',
    rating: 4,
    ratingCount: 312,
    course: 'Family Law',
    instructor: 'Johnson',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 122,
  },
  {
    id: '40',
    title: 'FamilyLawExpert',
    year: '2024',
    type: 'H',
    rating: 5,
    ratingCount: 278,
    course: 'Family Law',
    instructor: 'Wright',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 93,
  },

  // Financial Regulation
  {
    id: '41',
    title: 'FinancialRegPro',
    year: '2023',
    type: 'DS',
    rating: 4,
    ratingCount: 189,
    course: 'Financial Regulation',
    instructor: 'White',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 147,
  },
  {
    id: '42',
    title: 'BankingLawGuide',
    year: '2024',
    type: 'DS',
    rating: 5,
    ratingCount: 234,
    course: 'Financial Regulation',
    instructor: 'Young',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 71,
  },

  // Health Law
  {
    id: '43',
    title: 'HealthLawExpert',
    year: '2023',
    type: 'DS',
    rating: 4,
    ratingCount: 156,
    course: 'Health Law',
    instructor: 'Harris',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 183,
  },
  {
    id: '44',
    title: 'MedicalLawPro',
    year: '2024',
    type: 'DS',
    rating: 5,
    ratingCount: 198,
    course: 'Health Law',
    instructor: 'Campbell',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 85,
  },

  // Immigration Law
  {
    id: '45',
    title: 'ImmigrationLawGuide',
    year: '2023',
    type: 'DS',
    rating: 4,
    ratingCount: 167,
    course: 'Immigration Law',
    instructor: 'Jackson',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 108,
  },
  {
    id: '46',
    title: 'ImmigrationExpert',
    year: '2024',
    type: 'P',
    rating: 5,
    ratingCount: 223,
    course: 'Immigration Law',
    instructor: 'King',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 161,
  },

  // Intellectual Property Law
  {
    id: '47',
    title: 'IPLawMaster',
    year: '2023',
    type: 'DS',
    rating: 4,
    ratingCount: 189,
    course: 'Intellectual Property Law',
    instructor: 'Davis',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 194,
  },
  {
    id: '48',
    title: 'IPRightsGuide',
    year: '2024',
    type: 'H',
    rating: 5,
    ratingCount: 256,
    course: 'Intellectual Property Law',
    instructor: 'Green',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 99,
  },

  // International Law
  {
    id: '49',
    title: 'InternationalLawGuide',
    year: '2023',
    type: 'DS',
    rating: 4,
    ratingCount: 189,
    course: 'International Law',
    instructor: 'Jackson',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 149,
  },
  {
    id: '50',
    title: 'GlobalLawExpert',
    year: '2024',
    type: 'DS',
    rating: 5,
    ratingCount: 312,
    course: 'International Law',
    instructor: 'Sanchez',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 207,
  },

  // Labor Law
  {
    id: '51',
    title: 'LaborLawPro',
    year: '2024',
    type: 'DS',
    rating: 4,
    ratingCount: 234,
    course: 'Labor Law',
    instructor: 'Miller',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 111,
  },
  {
    id: '52',
    title: 'UnionLawGuide',
    year: '2023',
    type: 'P',
    rating: 5,
    ratingCount: 278,
    course: 'Labor Law',
    instructor: 'Lopez',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 179,
  },

  // Medical Malpractice
  {
    id: '53',
    title: 'MedMalpracticePro',
    year: '2023',
    type: 'DS',
    rating: 4,
    ratingCount: 145,
    course: 'Medical Malpractice',
    instructor: 'Harris',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 105,
  },
  {
    id: '54',
    title: 'MalpracticeExpert',
    year: '2024',
    type: 'H',
    rating: 5,
    ratingCount: 167,
    course: 'Medical Malpractice',
    instructor: 'Scott',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 136,
  },

  // Patent Law
  {
    id: '55',
    title: 'PatentLawMaster',
    year: '2023',
    type: 'DS',
    rating: 4,
    ratingCount: 178,
    course: 'Patent Law',
    instructor: 'Davis',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 81,
  },
  {
    id: '56',
    title: 'PatentGuide',
    year: '2024',
    type: 'P',
    rating: 5,
    ratingCount: 198,
    course: 'Patent Law',
    instructor: 'Green',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 129,
  },

  // Personal Injury Law
  {
    id: '57',
    title: 'PersonalInjuryPro',
    year: '2023',
    type: 'DS',
    rating: 4,
    ratingCount: 223,
    course: 'Personal Injury Law',
    instructor: 'Moore',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 214,
  },
  {
    id: '58',
    title: 'InjuryLawGuide',
    year: '2024',
    type: 'DS',
    rating: 5,
    ratingCount: 267,
    course: 'Personal Injury Law',
    instructor: 'Adams',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 56,
  },

  // Property Law
  {
    id: '59',
    title: 'PropertyRights',
    year: '2023',
    type: 'DS',
    rating: 4,
    ratingCount: 267,
    course: 'Property Law',
    instructor: 'Anderson',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 172,
  },
  {
    id: '60',
    title: 'PropertyLawExpert',
    year: '2024',
    type: 'H',
    rating: 5,
    ratingCount: 334,
    course: 'Property Law',
    instructor: 'Stewart',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 288,
  },

  // Real Estate Law
  {
    id: '61',
    title: 'RealEstatePro',
    year: '2023',
    type: 'DS',
    rating: 4,
    ratingCount: 198,
    course: 'Real Estate Law',
    instructor: 'Anderson',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 143,
  },
  {
    id: '62',
    title: 'RealtyLawGuide',
    year: '2024',
    type: 'DS',
    rating: 5,
    ratingCount: 245,
    course: 'Real Estate Law',
    instructor: 'Baker',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 327,
  },

  // Securities Law
  {
    id: '63',
    title: 'SecuritiesLawPro',
    year: '2024',
    type: 'DS',
    rating: 5,
    ratingCount: 278,
    course: 'Securities Law',
    instructor: 'White',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 89,
  },
  {
    id: '64',
    title: 'SecuritiesExpert',
    year: '2023',
    type: 'P',
    rating: 4,
    ratingCount: 234,
    course: 'Securities Law',
    instructor: 'Martinez',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 256,
  },

  // Tax Law
  {
    id: '65',
    title: 'TaxExpert',
    year: '2023',
    type: 'DS',
    rating: 5,
    ratingCount: 467,
    course: 'Tax Law',
    instructor: 'Wilson',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 467,
  },
  {
    id: '66',
    title: 'TaxLawMaster',
    year: '2024',
    type: 'DS',
    rating: 4,
    ratingCount: 389,
    course: 'Tax Law',
    instructor: 'Parker',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 112,
  },

  // Torts
  {
    id: '67',
    title: 'TortsExpert',
    year: '2024',
    type: 'DS',
    rating: 5,
    ratingCount: 512,
    course: 'Torts',
    instructor: 'Moore',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 378,
  },
  {
    id: '68',
    title: 'TortsGuide',
    year: '2023',
    type: 'H',
    rating: 4,
    ratingCount: 445,
    course: 'Torts',
    instructor: 'Evans',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 234,
  },

  // Trial Advocacy
  {
    id: '69',
    title: 'TrialAdvocacyPro',
    year: '2023',
    type: 'DS',
    rating: 4,
    ratingCount: 289,
    course: 'Trial Advocacy',
    instructor: 'Taylor',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 1,
  },
  {
    id: '70',
    title: 'CourtroomMaster',
    year: '2024',
    type: 'DS',
    rating: 5,
    ratingCount: 312,
    course: 'Trial Advocacy',
    instructor: 'Nelson',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 500,
  },

  // Additional Attack Outlines (25 pages or less) - One per course
  {
    id: '71',
    title: 'AdminLawQuick',
    year: '2022',
    type: 'H',
    rating: 4,
    ratingCount: 145,
    course: 'Administrative Law',
    instructor: 'Carter',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 18,
  },
  {
    id: '72',
    title: 'AdvConLawAttack',
    year: '2021',
    type: 'DS',
    rating: 5,
    ratingCount: 167,
    course: 'Advanced Constitutional Law',
    instructor: 'Foster',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 22,
  },
  {
    id: '73',
    title: 'AntitrustAttack',
    year: '2022',
    type: 'P',
    rating: 4,
    ratingCount: 134,
    course: 'Antitrust Law',
    instructor: 'Clark',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 16,
  },
  {
    id: '74',
    title: 'BankruptcyQuick',
    year: '2023',
    type: 'DS',
    rating: 5,
    ratingCount: 189,
    course: 'Bankruptcy',
    instructor: 'Mitchell',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 20,
  },
  {
    id: '75',
    title: 'BusTaxAttack',
    year: '2022',
    type: 'H',
    rating: 4,
    ratingCount: 156,
    course: 'Business Taxation',
    instructor: 'Perez',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 25,
  },
  {
    id: '76',
    title: 'CivRightsQuick',
    year: '2022',
    type: 'DS',
    rating: 5,
    ratingCount: 178,
    course: 'Civil Rights Law',
    instructor: 'Rodriguez',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 19,
  },
  {
    id: '77',
    title: 'CommercialQuick',
    year: '2023',
    type: 'P',
    rating: 4,
    ratingCount: 123,
    course: 'Commercial Law',
    instructor: 'Lee',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 14,
  },
  {
    id: '78',
    title: 'CompetitionAttack',
    year: '2023',
    type: 'DS',
    rating: 5,
    ratingCount: 145,
    course: 'Competition Law',
    instructor: 'Garcia',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 21,
  },
  {
    id: '79',
    title: 'ConLawAttack',
    year: '2023',
    type: 'H',
    rating: 4,
    ratingCount: 167,
    course: 'Constitutional Law',
    instructor: 'Morris',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 17,
  },
  {
    id: '80',
    title: 'ContractAttack',
    year: '2022',
    type: 'DS',
    rating: 5,
    ratingCount: 198,
    course: 'Contract Law',
    instructor: 'Edwards',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 23,
  },
  {
    id: '81',
    title: 'CorpLawQuick',
    year: '2023',
    type: 'P',
    rating: 4,
    ratingCount: 134,
    course: 'Corporate Law',
    instructor: 'Collins',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 15,
  },
  {
    id: '82',
    title: 'CrimLawAttack',
    year: '2022',
    type: 'DS',
    rating: 5,
    ratingCount: 189,
    course: 'Criminal Law',
    instructor: 'Turner',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 24,
  },
  {
    id: '83',
    title: 'CrimProcQuick',
    year: '2022',
    type: 'H',
    rating: 4,
    ratingCount: 156,
    course: 'Criminal Procedure',
    instructor: 'Brown',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 18,
  },
  {
    id: '84',
    title: 'DomRelAttack',
    year: '2022',
    type: 'DS',
    rating: 5,
    ratingCount: 145,
    course: 'Domestic Relations',
    instructor: 'Wright',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 13,
  },
  {
    id: '85',
    title: 'EmpLawQuick',
    year: '2022',
    type: 'P',
    rating: 4,
    ratingCount: 178,
    course: 'Employment Law',
    instructor: 'Lopez',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 22,
  },
  {
    id: '86',
    title: 'EnergyAttack',
    year: '2022',
    type: 'DS',
    rating: 5,
    ratingCount: 123,
    course: 'Energy Law',
    instructor: 'Hall',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 16,
  },
  {
    id: '87',
    title: 'EnviroQuick',
    year: '2022',
    type: 'H',
    rating: 4,
    ratingCount: 167,
    course: 'Environmental Law',
    instructor: 'Phillips',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 20,
  },
  {
    id: '88',
    title: 'EstateAttack',
    year: '2022',
    type: 'DS',
    rating: 5,
    ratingCount: 134,
    course: 'Estate Planning',
    instructor: 'Allen',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 19,
  },
  {
    id: '89',
    title: 'EvidenceQuick',
    year: '2022',
    type: 'P',
    rating: 4,
    ratingCount: 189,
    course: 'Evidence',
    instructor: 'Nelson',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 25,
  },
  {
    id: '90',
    title: 'FamilyAttack',
    year: '2022',
    type: 'DS',
    rating: 5,
    ratingCount: 156,
    course: 'Family Law',
    instructor: 'Johnson',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 17,
  },
  {
    id: '91',
    title: 'FinRegQuick',
    year: '2022',
    type: 'H',
    rating: 4,
    ratingCount: 145,
    course: 'Financial Regulation',
    instructor: 'Young',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 21,
  },
  {
    id: '92',
    title: 'HealthAttack',
    year: '2022',
    type: 'DS',
    rating: 5,
    ratingCount: 123,
    course: 'Health Law',
    instructor: 'Campbell',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 14,
  },
  {
    id: '93',
    title: 'ImmigrationQuick',
    year: '2022',
    type: 'P',
    rating: 4,
    ratingCount: 178,
    course: 'Immigration Law',
    instructor: 'King',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 23,
  },
  {
    id: '94',
    title: 'IPAttack',
    year: '2022',
    type: 'DS',
    rating: 5,
    ratingCount: 167,
    course: 'Intellectual Property Law',
    instructor: 'Green',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 18,
  },
  {
    id: '95',
    title: 'IntlLawQuick',
    year: '2022',
    type: 'H',
    rating: 4,
    ratingCount: 134,
    course: 'International Law',
    instructor: 'Sanchez',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 25,
  },
  {
    id: '96',
    title: 'LaborAttack',
    year: '2022',
    type: 'DS',
    rating: 5,
    ratingCount: 189,
    course: 'Labor Law',
    instructor: 'Miller',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 15,
  },
  {
    id: '97',
    title: 'MedMalQuick',
    year: '2022',
    type: 'P',
    rating: 4,
    ratingCount: 145,
    course: 'Medical Malpractice',
    instructor: 'Scott',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 22,
  },
  {
    id: '98',
    title: 'PatentAttack',
    year: '2022',
    type: 'DS',
    rating: 5,
    ratingCount: 156,
    course: 'Patent Law',
    instructor: 'Davis',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 19,
  },
  {
    id: '99',
    title: 'PersonalInjuryQuick',
    year: '2022',
    type: 'H',
    rating: 4,
    ratingCount: 167,
    course: 'Personal Injury Law',
    instructor: 'Adams',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 16,
  },
  {
    id: '100',
    title: 'PropertyAttack',
    year: '2022',
    type: 'DS',
    rating: 5,
    ratingCount: 178,
    course: 'Property Law',
    instructor: 'Stewart',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 24,
  },
  {
    id: '101',
    title: 'RealEstateQuick',
    year: '2022',
    type: 'P',
    rating: 4,
    ratingCount: 134,
    course: 'Real Estate Law',
    instructor: 'Baker',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 21,
  },
  {
    id: '102',
    title: 'SecuritiesAttack',
    year: '2022',
    type: 'DS',
    rating: 5,
    ratingCount: 189,
    course: 'Securities Law',
    instructor: 'Martinez',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 17,
  },
  {
    id: '103',
    title: 'TaxQuick',
    year: '2022',
    type: 'H',
    rating: 4,
    ratingCount: 145,
    course: 'Tax Law',
    instructor: 'Parker',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 20,
  },
  {
    id: '104',
    title: 'TortsAttack',
    year: '2022',
    type: 'DS',
    rating: 5,
    ratingCount: 234,
    course: 'Torts',
    instructor: 'Evans',
    fileType: 'PDF',
    fileUrl: '/sample-outline.pdf',
    pages: 13,
  },
  {
    id: '105',
    title: 'TrialQuick',
    year: '2022',
    type: 'P',
    rating: 4,
    ratingCount: 156,
    course: 'Trial Advocacy',
    instructor: 'Taylor',
    fileType: 'DOC',
    fileUrl: '/sample-outline.doc',
    pages: 12,
  },
];

const mockInstructors: Instructor[] = [
  {
    id: '1',
    name: 'Abel',
    courses: ['Administrative Law', 'Business Taxation'],
  },
  { id: '2', name: "Di'Angelo", courses: ['Advanced Constitutional Law'] },
  { id: '3', name: 'Zachariah', courses: ['Bankruptcy', 'Corporate Law'] },
  {
    id: '4',
    name: 'Rodriguez',
    courses: ['Constitutional Law', 'Civil Rights Law'],
  },
  { id: '5', name: 'Chen', courses: ['Contract Law', 'Commercial Law'] },
  {
    id: '6',
    name: 'Thompson',
    courses: ['Criminal Law', 'Criminal Procedure'],
  },
  { id: '7', name: 'Williams', courses: ['Environmental Law', 'Energy Law'] },
  { id: '8', name: 'Johnson', courses: ['Family Law', 'Domestic Relations'] },
  {
    id: '9',
    name: 'Davis',
    courses: ['Intellectual Property Law', 'Patent Law'],
  },
  { id: '10', name: 'Miller', courses: ['Labor Law', 'Employment Law'] },
  { id: '11', name: 'Wilson', courses: ['Tax Law', 'Estate Planning'] },
  { id: '12', name: 'Moore', courses: ['Torts', 'Personal Injury Law'] },
  { id: '13', name: 'Taylor', courses: ['Evidence', 'Trial Advocacy'] },
  { id: '14', name: 'Anderson', courses: ['Real Estate Law', 'Property Law'] },
  {
    id: '15',
    name: 'Jackson',
    courses: ['International Law', 'Immigration Law'],
  },
  {
    id: '16',
    name: 'White',
    courses: ['Securities Law', 'Financial Regulation'],
  },
  { id: '17', name: 'Harris', courses: ['Health Law', 'Medical Malpractice'] },
  { id: '18', name: 'Clark', courses: ['Antitrust Law', 'Competition Law'] },

  // Additional professors for comprehensive coverage
  {
    id: '19',
    name: 'Barnes',
    courses: ['Administrative Law', 'Constitutional Law'],
  },
  {
    id: '20',
    name: 'Foster',
    courses: ['Advanced Constitutional Law', 'Civil Rights Law'],
  },
  { id: '21', name: 'Kim', courses: ['Antitrust Law', 'Securities Law'] },
  { id: '22', name: 'Roberts', courses: ['Bankruptcy', 'Business Taxation'] },
  { id: '23', name: 'Lee', courses: ['Commercial Law', 'Contract Law'] },
  { id: '24', name: 'Garcia', courses: ['Competition Law', 'Antitrust Law'] },
  { id: '25', name: 'Martinez', courses: ['Corporate Law', 'Securities Law'] },
  { id: '26', name: 'Brown', courses: ['Criminal Procedure', 'Evidence'] },
  { id: '27', name: 'Wright', courses: ['Domestic Relations', 'Family Law'] },
  { id: '28', name: 'Lopez', courses: ['Employment Law', 'Labor Law'] },
  { id: '29', name: 'Hall', courses: ['Energy Law', 'Environmental Law'] },
  { id: '30', name: 'Allen', courses: ['Estate Planning', 'Tax Law'] },
  {
    id: '31',
    name: 'Young',
    courses: ['Financial Regulation', 'Securities Law'],
  },
  { id: '32', name: 'King', courses: ['Immigration Law', 'International Law'] },
  { id: '33', name: 'Scott', courses: ['Medical Malpractice', 'Health Law'] },
  {
    id: '34',
    name: 'Green',
    courses: ['Patent Law', 'Intellectual Property Law'],
  },
  { id: '35', name: 'Adams', courses: ['Personal Injury Law', 'Torts'] },
  { id: '36', name: 'Baker', courses: ['Property Law', 'Real Estate Law'] },
  { id: '37', name: 'Nelson', courses: ['Trial Advocacy', 'Evidence'] },
  { id: '38', name: 'Carter', courses: ['Administrative Law'] },
  { id: '39', name: 'Mitchell', courses: ['Bankruptcy'] },
  { id: '40', name: 'Perez', courses: ['Business Taxation'] },
  { id: '41', name: 'Turner', courses: ['Criminal Law'] },
  { id: '42', name: 'Phillips', courses: ['Environmental Law'] },
  { id: '43', name: 'Campbell', courses: ['Health Law'] },
  { id: '44', name: 'Parker', courses: ['Tax Law'] },
  { id: '45', name: 'Evans', courses: ['Torts'] },
  { id: '46', name: 'Edwards', courses: ['Contract Law'] },
  { id: '47', name: 'Collins', courses: ['Corporate Law'] },
  { id: '48', name: 'Stewart', courses: ['Property Law'] },
  { id: '49', name: 'Sanchez', courses: ['International Law'] },
  { id: '50', name: 'Morris', courses: ['Constitutional Law'] },
];

const courses = [
  'Administrative Law',
  'Advanced Constitutional Law',
  'Antitrust Law',
  'Bankruptcy',
  'Business Taxation',
  'Civil Rights Law',
  'Commercial Law',
  'Competition Law',
  'Constitutional Law',
  'Contract Law',
  'Corporate Law',
  'Criminal Law',
  'Criminal Procedure',
  'Domestic Relations',
  'Employment Law',
  'Energy Law',
  'Environmental Law',
  'Estate Planning',
  'Evidence',
  'Family Law',
  'Financial Regulation',
  'Health Law',
  'Immigration Law',
  'Intellectual Property Law',
  'International Law',
  'Labor Law',
  'Medical Malpractice',
  'Patent Law',
  'Personal Injury Law',
  'Property Law',
  'Real Estate Law',
  'Securities Law',
  'Tax Law',
  'Torts',
  'Trial Advocacy',
];

// Calendar Event Interface
interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'class' | 'exam' | 'assignment' | 'study' | 'meeting' | 'personal';
  course?: string;
  location?: string;
  description?: string;
}

// Main App Content Component
function AppContent({ user, loading }: { user: any; loading: boolean }) {
  // Local auth state: remove authGuard and check directly here
  const [authLoading, setAuthLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndProfile = async () => {
      try {
        // Determine current user
        let currentUser = user;
        if (!currentUser) {
          const { data } = await supabase.auth.getSession();
          currentUser = data.session?.user ?? null;
        }

        if (!currentUser) {
          if (isMounted) {
            setIsVerified(false);
            setAuthLoading(false);
            setHasCompletedOnboarding(false);
          }
          return;
        }

        // Always require onboarding - skip database check
        if (isMounted) {
          setHasCompletedOnboarding(false);
        }

        // Always require access code verification and onboarding every time
        // Reset both states when user changes
        if (isMounted) {
          setIsVerified(false);
          setHasCompletedOnboarding(false);
          setAuthLoading(false);
        }
      } catch (_err) {
        if (isMounted) {
          setIsVerified(false);
          setAuthLoading(false);
          setHasCompletedOnboarding(false);
        }
      }
    };

    checkAuthAndProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkAuthAndProfile();
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [user]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [selectedOutline, setSelectedOutline] = useState<Outline | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string | undefined>(
    undefined
  );
  const [selectedYear, setSelectedYear] = useState<string | undefined>(
    undefined
  );
  const [showOutlines, setShowOutlines] = useState(true);
  const [showAttacks, setShowAttacks] = useState(true);
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'upload'>(
    'search'
  );
  const [savedOutlines, setSavedOutlines] = useState<Outline[]>([]);
  const [hiddenOutlines, setHiddenOutlines] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedCourseForSearch, setSelectedCourseForSearch] =
    useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  const [sortBy, setSortBy] = useState('Highest Rated');

  // Shared calendar events state
  const [calendarEvents] = useState<CalendarEvent[]>([]);

  const handleNavigateToOutlines = (
    courseName: string,
    outlineName: string
  ) => {
    // Find the outline that matches the course and name
    const outline = mockOutlines.find(
      (o) => o.course === courseName && o.title === outlineName
    );

    if (outline) {
      // Set the course and instructor to show the outline
      setSelectedCourseForSearch(courseName);
      setSelectedInstructor(outline.instructor);
      setSelectedOutline(outline);

      // Switch to outlines section
      setActiveSection('outlines');
      setActiveTab('search');
    }
  };

  const handleNavigateToCourse = (courseName: string) => {
    setSelectedCourse(courseName);
    setActiveSection('course');
  };

  const handleBackFromCourse = () => {
    setSelectedCourse('');
    setActiveSection('home');
  };

  const handleNavigateToOutlinesPage = (courseName: string) => {
    // Set the course for the outlines search but don't select a specific outline
    setSelectedCourseForSearch(courseName);
    // Get any instructor for this course to enable the outline display
    const courseInstructors = mockInstructors.filter((instructor) =>
      instructor.courses.includes(courseName)
    );
    if (courseInstructors.length > 0) {
      setSelectedInstructor(courseInstructors[0].name);
    }
    setSelectedOutline(null);
    setActiveSection('outlines');
    setActiveTab('search');
  };

  const handleNavigateToStudentProfile = (studentName: string) => {
    setSelectedStudent(studentName);
    setActiveSection('student-profile');
  };

  const handleBackFromStudentProfile = () => {
    setSelectedStudent('');
    setActiveSection('course');
  };

  // Filter outlines based on search criteria
  const filteredOutlines = mockOutlines.filter((outline) => {
    // Don't show any outlines unless BOTH a course AND instructor are selected
    if (selectedCourseForSearch === '' || selectedInstructor === '') {
      return false;
    }

    // Exclude hidden outlines
    if (hiddenOutlines.includes(outline.id)) {
      return false;
    }

    const matchesSearch =
      searchTerm === '' ||
      outline.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      outline.course.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = outline.course === selectedCourseForSearch;
    const matchesInstructor = outline.instructor === selectedInstructor;
    const matchesGrade = !selectedGrade || outline.type === selectedGrade;
    const matchesYear = !selectedYear || outline.year === selectedYear;

    // Filter by Outline/Attack type based on page count
    const isAttack = outline.pages <= 25;
    const isOutline = outline.pages > 25;
    const matchesType =
      (isAttack && showAttacks) || (isOutline && showOutlines);

    return (
      matchesSearch &&
      matchesCourse &&
      matchesInstructor &&
      matchesGrade &&
      matchesYear &&
      matchesType
    );
  });

  // Sort outlines
  const sortedOutlines = [...filteredOutlines].sort((a, b) => {
    if (sortBy === 'Highest Rated') {
      return b.rating - a.rating;
    }
    if (sortBy === 'Newest') {
      return parseInt(b.year) - parseInt(a.year);
    }
    return a.title.localeCompare(b.title);
  });

  const handleSaveOutline = (outline: Outline) => {
    setSavedOutlines((prev) => {
      // Check if outline is already saved
      if (prev.some((saved) => saved.id === outline.id)) {
        return prev; // Don't add duplicates
      }
      return [...prev, outline];
    });
  };

  const handleRemoveSavedOutline = (outlineId: string) => {
    setSavedOutlines((prev) =>
      prev.filter((outline) => outline.id !== outlineId)
    );
  };

  const handleToggleSaveOutline = (outline: Outline) => {
    setSavedOutlines((prev) => {
      const isAlreadySaved = prev.some((saved) => saved.id === outline.id);
      if (isAlreadySaved) {
        return prev.filter((saved) => saved.id !== outline.id);
      } else {
        return [...prev, outline];
      }
    });
  };

  const handleHideOutline = (outlineId: string) => {
    setHiddenOutlines((prev) => [...prev, outlineId]);
  };

  const handleUnhideAllOutlines = () => {
    setHiddenOutlines([]);
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setSidebarCollapsed(true); // Auto-collapse when changing sections
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  // Show loading state while checking authentication
  console.log('App state:', {
    loading,
    authLoading,
    isVerified,
    user,
  });
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
        <div className="text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 text-white rounded-full mb-4"
            style={{ backgroundColor: '#752432' }}
          >
            <span className="text-2xl font-semibold">HLS</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <AuthPage />;
  }

  // Always require access code verification
  if (!isVerified) {
    return (
      <AccessCodeVerification
        onVerified={async () => {
          // Mark verified locally; server-side already updated profile
          setIsVerified(true);
        }}
      />
    );
  }

  // Show onboarding flow if user hasn't completed onboarding
  if (!hasCompletedOnboarding) {
    return (
      <OnboardingFlow onComplete={() => setHasCompletedOnboarding(true)} />
    );
  }

  return (
    <div className="h-screen flex" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
      {/* Navigation Sidebar */}
      <NavigationSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        isCollapsed={sidebarCollapsed}
        onToggleCollapsed={handleToggleSidebar}
      />

      {/* Toast Notifications */}
      <Toaster position="top-right" />

      {/* Search Sidebar - Only show when in outlines or exams section */}
      {(activeSection === 'outlines' || activeSection === 'exams') && (
        <SearchSidebar
          outlines={sortedOutlines}
          allOutlines={mockOutlines}
          courses={courses}
          instructors={mockInstructors}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCourse={selectedCourseForSearch}
          setSelectedCourse={setSelectedCourseForSearch}
          selectedInstructor={selectedInstructor}
          setSelectedInstructor={setSelectedInstructor}
          selectedGrade={selectedGrade}
          setSelectedGrade={setSelectedGrade}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          sortBy={sortBy}
          setSortBy={setSortBy}
          showOutlines={showOutlines}
          setShowOutlines={setShowOutlines}
          showAttacks={showAttacks}
          setShowAttacks={setShowAttacks}
          selectedOutline={selectedOutline}
          onSelectOutline={setSelectedOutline}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          savedOutlines={savedOutlines}
          onRemoveSavedOutline={handleRemoveSavedOutline}
          onToggleSaveOutline={handleToggleSaveOutline}
          hiddenOutlines={hiddenOutlines}
          onHideOutline={handleHideOutline}
          onUnhideAllOutlines={handleUnhideAllOutlines}
        />
      )}

      {/* Main Content */}
      <div className="flex-1">
        {activeSection === 'outlines' ? (
          activeTab === 'upload' ? (
            <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
              <div className="text-center p-8">
                <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-medium text-gray-700 mb-4">
                  Upload Your Outline
                </h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  Use the upload form in the sidebar to share your study
                  materials with the community.
                </p>
                <div className="bg-white rounded-lg shadow-sm p-6 max-w-lg mx-auto">
                  <h3 className="font-medium text-gray-800 mb-3">
                    Upload Guidelines:
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-2 text-left">
                    <li>• Accepted formats: PDF, DOC, DOCX</li>
                    <li>• Maximum file size: 50MB</li>
                    <li>• Only upload your original work</li>
                    <li>
                      • Include accurate course and instructor information
                    </li>
                    <li>• Use descriptive titles for better discoverability</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <OutlineViewer
              outline={selectedOutline}
              onSaveOutline={handleSaveOutline}
              isSaved={
                selectedOutline
                  ? savedOutlines.some(
                      (saved) => saved.id === selectedOutline.id
                    )
                  : false
              }
            />
          )
        ) : activeSection === 'exams' ? (
          activeTab === 'upload' ? (
            <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
              <div className="text-center p-8">
                <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-medium text-gray-700 mb-4">
                  Upload Your Exam
                </h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  Use the upload form in the sidebar to share your exam
                  materials with the community.
                </p>
                <div className="bg-white rounded-lg shadow-sm p-6 max-w-lg mx-auto">
                  <h3 className="font-medium text-gray-800 mb-3">
                    Upload Guidelines:
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-2 text-left">
                    <li>• Accepted formats: PDF, DOC, DOCX</li>
                    <li>• Maximum file size: 50MB</li>
                    <li>• Only upload your original work</li>
                    <li>
                      • Include accurate course and instructor information
                    </li>
                    <li>• Use descriptive titles for better discoverability</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <OutlineViewer
              outline={selectedOutline}
              onSaveOutline={handleSaveOutline}
              isSaved={
                selectedOutline
                  ? savedOutlines.some(
                      (saved) => saved.id === selectedOutline.id
                    )
                  : false
              }
            />
          )
        ) : activeSection === 'reviews' ? (
          <ReviewsPage />
        ) : activeSection === 'home' ? (
          <HomePage
            onNavigateToOutlines={handleNavigateToOutlines}
            onNavigateToCourse={handleNavigateToCourse}
            user={user}
          />
        ) : activeSection === 'course' ? (
          <CoursePage
            courseName={selectedCourse}
            onBack={handleBackFromCourse}
            onNavigateToOutlines={handleNavigateToOutlines}
            onNavigateToOutlinesPage={handleNavigateToOutlinesPage}
            onNavigateToStudentProfile={handleNavigateToStudentProfile}
          />
        ) : activeSection === 'student-profile' ? (
          <ProfilePage
            studentName={selectedStudent}
            onBack={handleBackFromStudentProfile}
          />
        ) : activeSection === 'calendar' ? (
          <CalendarPage additionalEvents={calendarEvents} />
        ) : activeSection === 'barreview' ? (
          <BarReviewPage />
        ) : activeSection === 'profile' ? (
          <ProfilePage />
        ) : activeSection === 'messaging' ? (
          <MessagingPage />
        ) : (
          <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'var(--background-color, #f9f5f0)' }}>
            <div className="text-center p-8">
              <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl text-gray-600">📄</span>
              </div>
              <h2 className="text-2xl font-medium text-gray-700 mb-4">
                Coming Soon
              </h2>
              <p className="text-gray-600 max-w-md">
                This section is currently under development.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main App Component with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}

// App component that uses AuthContext
function AppWithAuth() {
  const { user, loading } = useAuth();

  return <AppContent user={user} loading={loading} />;
}
