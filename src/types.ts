export type EntryType = 'journal' | 'reflection' | 'brainstorm' | 'synthesis';

export interface JournalMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  type: EntryType;
  messages: JournalMessage[];
  summary?: string;
  tags: string[];
  mood?: string;
  classifierRationale?: string;
  classificationStatus?: 'pending' | 'complete' | 'failed';
  userEntry?: string;
  reflectorOutput?: string;
  detectedEmotion?: string;
  detectedLanguage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AggregateStats {
  totalEntries: number;
  totalHighStress: number;
  lastUpdated?: string;
}

export interface ThreatModelItem {
  zone: string;
  risk: string;
  mitigation: string;
  status: 'Enforced' | 'Active';
}
