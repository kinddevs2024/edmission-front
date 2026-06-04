export type FieldOfStudyCategory = {
  /** Stored value in DB (stable key) */
  id: string
  /** i18n key with namespace, e.g. common:fieldBusinessManagementEconomics */
  titleKey: string
  items: string[]
}

export const FIELD_OF_STUDY: FieldOfStudyCategory[] = [
  {
    id: 'business_management_economics',
    titleKey: 'common:fieldBusinessManagementEconomics',
    items: [
      'Accounting',
      'Banking and Finance',
      'Business Administration',
      'Business Analytics',
      'Economics',
      'Finance',
      'Global Business',
      'Human Resource Management',
      'International Business',
      'Logistics and Supply Chain Management',
      'Management',
      'Marketing',
      'Project Management',
    ],
  },
  {
    id: 'engineering_technology',
    titleKey: 'common:fieldEngineeringTechnology',
    items: [
      'Aerospace Engineering',
      'Biomedical Engineering',
      'Chemical Engineering',
      'Civil Engineering',
      'Computer Engineering',
      'Electrical Engineering',
      'Mechanical Engineering',
      'Software Engineering',
    ],
  },
  {
    id: 'computer_science_digital_technologies',
    titleKey: 'common:fieldComputerScienceDigitalTechnologies',
    items: [
      'Artificial Intelligence',
      'Computer Science',
      'Cybersecurity',
      'Data Analytics',
      'Data Science',
      'Information Systems',
      'Information Technology',
    ],
  },
  {
    id: 'natural_sciences',
    titleKey: 'common:fieldNaturalSciences',
    items: [
      'Biochemistry',
      'Biology',
      'Chemistry',
      'Genetics',
      'Mathematics',
      'Physics',
      'Statistics',
    ],
  },
  {
    id: 'health_medical_sciences',
    titleKey: 'common:fieldHealthMedicalSciences',
    items: [
      'Medicine',
      'Health Sciences',
      'Nursing',
      'Pharmacy',
      'Dentistry',
    ],
  },
  {
    id: 'social_sciences_humanities',
    titleKey: 'common:fieldSocialSciencesHumanities',
    items: [
      'International Relations',
      'Philosophy',
      'Political Science',
      'Psychology',
      'Sociology',
    ],
  },
  {
    id: 'creative_arts_media_design',
    titleKey: 'common:fieldCreativeArtsMediaDesign',
    items: [
      'Architecture',
      'Digital Media',
      'Game Design',
      'Graphic Design',
      'Journalism',
      'Media Studies',
    ],
  },
  {
    id: 'education',
    titleKey: 'common:fieldEducation',
    items: [
      'Education',
      'Primary Education',
      'Pre-school education',
      'Education technology',
    ],
  },
  {
    id: 'environment_agriculture_sustainability',
    titleKey: 'common:fieldEnvironmentAgricultureSustainability',
    items: [
      'Agriculture',
      'Environmental Science',
      'Urban Planning',
    ],
  },
  {
    id: 'hospitality_tourism_service',
    titleKey: 'common:fieldHospitalityTourismService',
    items: [
      'Hospitality Management',
      'Tourism Management',
      'Food Science',
    ],
  },
  {
    id: 'law_legal_studies',
    titleKey: 'common:fieldLawLegalStudies',
    items: [
      'Law',
      'Forensic Science',
    ],
  },
  {
    id: 'medicine_clinical',
    titleKey: 'common:fieldMedicineClinical',
    items: [
      'General Medicine',
      'Dentistry',
      'Veterinary Medicine',
      'Public Health',
      'Medical Laboratory Science',
    ],
  },
  {
    id: 'linguistics_foreign_languages',
    titleKey: 'common:fieldLinguisticsForeignLanguages',
    items: [
      'English Language & Literature',
      'Translation & Interpretation',
      'Applied Linguistics',
      'Foreign Languages',
      'TEFL / TESOL',
    ],
  },
  {
    id: 'sports_physical_education',
    titleKey: 'common:fieldSportsPhysicalEducation',
    items: [
      'Sports Science',
      'Physical Education',
      'Kinesiology',
      'Coaching',
      'Rehabilitation',
    ],
  },
  {
    id: 'performing_arts_music',
    titleKey: 'common:fieldPerformingArtsMusic',
    items: [
      'Music',
      'Theatre & Drama',
      'Dance',
      'Film & Television',
      'Fine Arts',
    ],
  },
]

