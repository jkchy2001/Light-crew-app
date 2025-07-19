
// This file contains mock data to simulate what would be stored in Firebase Firestore.
// In a real application, you would fetch this data from Firestore instead of having it hardcoded.

import type { CrewMember, Shift, Project, DOP, Gaffer } from "./types";


export const crew: CrewMember[] = [
  { id: 'crew-1', name: "Ravi Kumar", designation: "Gaffer", mobile: "9876543213", dailyWage: 5000, avatar: "https://placehold.co/100x100.png" },
  { id: 'crew-2', name: "Priya Singh", designation: "DOP", mobile: "9876543212", dailyWage: 15000, avatar: "https://placehold.co/100x100.png" },
  { id: 'crew-3', name: "Anil Sharma", designation: "Best Boy", mobile: "9876543210", dailyWage: 3500, avatar: "https://placehold.co/100x100.png" },
  { id: 'crew-4', name: "Sunita Verma", designation: "Asst. Cameraman", mobile: "9876543214", dailyWage: 2500, avatar: "https://placehold.co/100x100.png" },
  { id: 'crew-5', name: "Manoj Patel", designation: "Grip", mobile: "9876543211", dailyWage: 2000, avatar: "https://placehold.co/100x100.png" },
].sort((a, b) => a.name.localeCompare(b.name));

export const projects: Project[] = [
  { id: 'proj-1', name: "Project Alpha", client: "Global Brands Inc.", description: "A high-profile campaign for a new product launch.", status: "Ongoing", location: "Mumbai", startDate: "2024-07-01", endDate: "2024-08-15", dop: "Priya Singh", gaffer: "Ravi Kumar", crewIds: ['crew-1', 'crew-2', 'crew-3', 'crew-4', 'crew-5'] },
  { id: 'proj-2', name: "Ad Film - E-commerce", client: "Fashionista Online", description: "A vibrant ad film for a new clothing line.", status: "Completed", location: "Delhi", startDate: "2024-05-20", endDate: "2024-05-25", dop: "Amit Shah", gaffer: "Ravi Kumar", crewIds: ['crew-1', 'crew-4'] },
  { id: 'proj-3', name: "Web Series - Season 2", client: "OTT Platform", description: "Second season of the popular thriller series.", status: "Upcoming", location: "Goa", startDate: "2024-09-01", endDate: "2024-11-30", dop: "Priya Singh", gaffer: "Suresh Patil", crewIds: ['crew-1', 'crew-2', 'crew-5'] },
  { id: 'proj-4', name: "Corporate Video", client: "Tech Solutions Ltd.", description: "Internal corporate video for the annual meeting.", status: "Completed", location: "Bangalore", startDate: "2024-06-10", endDate: "2024-06-12", dop: "Priya Singh", gaffer: "Ravi Kumar", crewIds: ['crew-3', 'crew-4'] },
];

// The `shifts` collection is the core of the data logic.
// It links crew members to projects for specific dates and tracks their earnings.
export const shifts: Shift[] = [
  // Shifts for Ravi Kumar (crew-1)
  { id: 'shift-1', crewId: 'crew-1', projectId: 'proj-1', date: '2024-07-15', shiftDuration: 1, earnedAmount: 5000, paidAmount: 5000, paymentStatus: 'Paid' },
  { id: 'shift-2', crewId: 'crew-1', projectId: 'proj-2', date: '2024-05-21', shiftDuration: 1, earnedAmount: 5500, paidAmount: 5500, paymentStatus: 'Paid' },
  { id: 'shift-3', crewId: 'crew-1', projectId: 'proj-3', date: '2024-09-05', shiftDuration: 1, earnedAmount: 5000, paidAmount: 0, paymentStatus: 'Not Paid' },

  // Shifts for Priya Singh (crew-2)
  { id: 'shift-4', crewId: 'crew-2', projectId: 'proj-1', date: '2024-07-15', shiftDuration: 1, earnedAmount: 15000, paidAmount: 15000, paymentStatus: 'Paid' },

  // Shifts for Anil Sharma (crew-3) on Project Alpha
  { id: 'shift-5', crewId: 'crew-3', projectId: 'proj-1', date: '2024-07-15', shiftDuration: 1, earnedAmount: 3500, paidAmount: 2000, paymentStatus: 'Partially Paid' },
  { id: 'shift-6', crewId: 'crew-3', projectId: 'proj-1', date: '2024-07-16', shiftDuration: 1, earnedAmount: 3500, paidAmount: 0, paymentStatus: 'Not Paid' },
  
  // Shifts for Sunita Verma (crew-4)
  { id: 'shift-7', crewId: 'crew-4', projectId: 'proj-1', date: '2024-07-15', shiftDuration: 0.5, earnedAmount: 1250, paidAmount: 0, paymentStatus: 'Not Paid' },

  // ... more shift data would go here
];

// Master Lists Data
export const dops: DOP[] = [
    { id: 'dop-1', name: 'Priya Singh', mobile: '9876543212', email: 'priya@example.com', address: 'Mumbai, India' },
    { id: 'dop-2', name: 'Amit Shah', mobile: '9876543211', email: 'amit@example.com', address: 'Delhi, India' },
];

export const gaffers: Gaffer[] = [
    { id: 'gaffer-1', name: 'Ravi Kumar', mobile: '9876543213', email: 'ravi@example.com', address: 'Mumbai, India' },
    { id: 'gaffer-2', name: 'Suresh Patil', mobile: '9876543214', email: 'suresh@example.com', address: 'Pune, India' },
];
