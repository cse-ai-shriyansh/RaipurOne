export const USER_ROLES = {
  USER: 'user',
  WORKER: 'worker',
};

export const CREDENTIALS = {
  user: {
    email: 'user',
    password: 'user',
    role: USER_ROLES.USER,
  },
  worker: {
    email: 'worker',
    password: 'worker',
    role: USER_ROLES.WORKER,
  },
};

export const URGENCY_TYPES = [
  { id: 'urgent', label: 'Urgent', color: '#E74C3C' },
  { id: 'criminal', label: 'Criminal Offense', color: '#8E44AD' },
  { id: 'public', label: 'Public Safety', color: '#3498DB' },
  { id: 'normal', label: 'Normal', color: '#95A5A6' },
];

export const COMPLAINT_STATUS = {
  PENDING: 'pending',
  INITIATED: 'initiated',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
};
