import {
  FileText,
  Users,
  ClipboardList,
  Heart,
  Shield,
  Activity,
  Baby,
  Stethoscope,
  Pill,
  Eye,
  Brain,
} from 'lucide-react';

export const getIconForProgram = (programName: string) => {
  const name = programName.toLowerCase();
  if (name.includes('child') || name.includes('baby')) return Baby;
  if (name.includes('malaria') || name.includes('disease')) return Shield;
  if (name.includes('health') || name.includes('medical')) return Stethoscope;
  if (name.includes('staff') || name.includes('user')) return Users;
  if (name.includes('asset') || name.includes('audit')) return ClipboardList;
  if (name.includes('heart') || name.includes('cardiac')) return Heart;
  if (name.includes('surveillance') || name.includes('monitor')) return Eye;
  if (name.includes('mental') || name.includes('brain')) return Brain;
  if (name.includes('drug') || name.includes('medicine')) return Pill;
  if (name.includes('activity') || name.includes('exercise')) return Activity;
  return FileText; // default
};
