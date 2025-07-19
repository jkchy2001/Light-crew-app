

export type CrewMember = {
  id: string; // Firestore document ID (unique for each role profile)
  mid: string; // Custom Member ID (e.g., rame9876) - identifies the person
  name: string;
  designation: string; // The specific designation for this profile/role
  mobile: string;
  email?: string;
  address?: string;
  avatar: string;
  notes?: string;
  dailyWage?: number; // Base wage for this role, can be overridden by project
};

// This represents a specific role assignment for a crew member on a project.
export type ProjectCrewAssignment = {
  crewId: string; // The Firestore document ID of the specific crew profile
  mid: string; // The Member ID of the person
  designation: string;
  dailyWage: number;
};

export type Project = {
  id: string;
  name: string;
  status: string;
  location: string;
  startDate: string;
  endDate: string;
  dop: string;
  gaffer: string;
  bestBoy?: string;
  crew: ProjectCrewAssignment[]; 
  client?: string;
  description?: string;
  notes?: string;
};

export type Shift = {
    id: string;
    crewId: string; // This is the Firestore document ID of the specific CrewMember profile
    mid: string; // The stable Member ID of the person
    mobile: string; // The mobile number of the person
    projectId: string;
    designation: string; // The designation for this specific shift
    dailyWage: number; // The wage for this specific shift
    date: string; // Stored as 'YYYY-MM-DD', represents Shift In Date
    day?: string;
    callTime?: string; // Stored as 'HH:mm'
    shiftInTime?: string; // Stored as 'HH:mm'
    shiftOutTime?: string; // Stored as 'HH:mm'
    shiftOutDate?: string; // Stored as 'YYYY-MM-DD'
    shiftDuration: number; // e.g., 1, 1.25, 1.5
    earnedAmount: number;
    paidAmount: number;
    paymentStatus: 'Paid' | 'Partially Paid' | 'Not Paid';
    notes?: string;
};

export type Payment = {
    id: string;
    crewId: string; // The document ID of the CrewMember role profile
    mid: string;
    projectId: string;
    amount: number;
    date: string; // Stored as 'YYYY-MM-DD HH:mm:ss'
};

export type DOP = {
    id: string;
    name: string;
    mobile: string;
    email?: string;
    address?: string;
    projectIds?: string[];
};

export type Gaffer = {
    id: string;
    name: string;
    mobile: string;
    email?: string;
    address?: string;
    projectIds?: string[];
};

export type Designation = {
    id: string;
    title: string;
};

// This was a typo, correcting to use CrewMember
export type Crew = CrewMember;

export type UserProfile = {
    name: string;
    email: string;
    mobile: string;
};
