import { format, subDays, subHours, subMinutes } from 'date-fns';
import demoElectricBill from '@/assets/demo-electric-bill.png';
import demoGasReceipt from '@/assets/demo-gas-receipt.png';
import demoWaterBill from '@/assets/demo-water-bill.png';
import demoPrescriptionReceipt from '@/assets/demo-prescription-receipt.png';
import demoGroceryReceipt from '@/assets/demo-grocery-receipt.png';
import demoBusPass from '@/assets/demo-bus-pass.png';

// Helper to format relative dates
const formatRelativeDate = (date: Date) => format(date, 'MMM d');
const formatTime = (date: Date) => format(date, 'h:mm a');
const formatDateTime = (date: Date) => format(date, 'MMM d \'at\' h:mm a');

const now = new Date();

// ============================================================================
// JOHNSON FAMILY - Positive Recovery Journey (47 days sober)
// ============================================================================

export const JOHNSON_MEMBERS = [
  { id: '0', name: 'Matt Brown', role: 'moderator', relationship: 'Case Manager', initials: 'MB' },
  { id: '1', name: 'Sarah Johnson', role: 'admin', relationship: 'Parent', initials: 'SJ' },
  { 
    id: '2', 
    name: 'Michael Johnson', 
    role: 'recovering', 
    relationship: 'Recovering', 
    initials: 'MJ',
    paymentInfo: {
      paypal: 'michael.johnson@email.com',
      venmo: '@MichaelJ-Recovery',
      cashapp: '$MichaelJohnson47'
    }
  },
  { id: '3', name: 'David Johnson', role: 'member', relationship: 'Sibling', initials: 'DJ' },
  { id: '4', name: 'Emily Johnson', role: 'member', relationship: 'Spouse', initials: 'EJ' },
  { id: '5', name: 'Robert Johnson', role: 'member', relationship: 'Grandparent', initials: 'RJ' },
];

// 10 days of messages for Johnson family
export const JOHNSON_MESSAGES = [
  // Day 10 ago
  { id: '1', sender: 'Michael Johnson', senderId: '2', content: 'Day 37 today. Feeling grateful for all of you. 🙏', time: formatTime(subDays(now, 10)), date: formatRelativeDate(subDays(now, 10)) },
  { id: '2', sender: 'Sarah Johnson', senderId: '1', content: 'So proud of you, son! One day at a time.', time: formatTime(subDays(now, 10)), date: formatRelativeDate(subDays(now, 10)) },
  
  // Day 9 ago
  { id: '3', sender: 'Michael Johnson', senderId: '2', content: '🙏 **Checked into Recovery Meeting**\n\nI\'m attending: AA - Morning Serenity Group\n📍 St. Mark\'s Church, 123 Main St\n⏰ Checkout expected at 9:00 AM', time: '7:45 AM', date: formatRelativeDate(subDays(now, 9)) },
  { id: '4', sender: 'Emily Johnson', senderId: '4', content: 'Great way to start the day, Michael!', time: '7:50 AM', date: formatRelativeDate(subDays(now, 9)) },
  { id: '5', sender: 'Michael Johnson', senderId: '2', content: '✅ **Checked out of Meeting**\n\nCompleted: AA - Morning Serenity Group\nDuration: 1 hour 15 minutes', time: '9:00 AM', date: formatRelativeDate(subDays(now, 9)) },
  
  // Day 8 ago
  { id: '6', sender: 'Michael Johnson', senderId: '2', content: '💰 **Financial Request** from Michael Johnson\n\n**Amount:** $67.89\n**Reason:** Water bill - Metro Water Services\n\nPlease vote on this request!', time: '10:30 AM', date: formatRelativeDate(subDays(now, 8)) },
  { id: '7', sender: 'David Johnson', senderId: '3', content: 'Voted to approve. Essential bill with documentation.', time: '11:00 AM', date: formatRelativeDate(subDays(now, 8)) },
  { id: '8', sender: 'Robert Johnson', senderId: '5', content: 'I\'ll pledge $35 towards this.', time: '11:15 AM', date: formatRelativeDate(subDays(now, 8)) },
  
  // Day 7 ago  
  { id: '9', sender: 'Matt Brown', senderId: '0', content: 'Family, great work this week! Michael is showing consistent progress. Let\'s keep supporting each other.', time: '3:00 PM', date: formatRelativeDate(subDays(now, 7)) },
  { id: '10', sender: 'Sarah Johnson', senderId: '1', content: 'Thank you Matt. Having you as our moderator has made such a difference.', time: '3:15 PM', date: formatRelativeDate(subDays(now, 7)) },
  
  // Day 6 ago
  { id: '11', sender: 'Michael Johnson', senderId: '2', content: '🙏 **Checked into Therapy**\n\nI\'m attending: Therapy Session with Dr. Smith\n📍 Wellness Center, Suite 200\n⏰ Checkout expected at 11:00 AM', time: '10:00 AM', date: formatRelativeDate(subDays(now, 6)) },
  { id: '12', sender: 'Michael Johnson', senderId: '2', content: '✅ **Checked out of Therapy**\n\nCompleted: Therapy Session\nDuration: 58 minutes', time: '10:58 AM', date: formatRelativeDate(subDays(now, 6)) },
  { id: '13', sender: 'Michael Johnson', senderId: '2', content: 'Good session today. Working through some stuff about trust and rebuilding relationships.', time: '11:05 AM', date: formatRelativeDate(subDays(now, 6)) },
  { id: '14', sender: 'Emily Johnson', senderId: '4', content: '❤️ That takes courage. We\'re here for you.', time: '11:20 AM', date: formatRelativeDate(subDays(now, 6)) },
  
  // Day 5 ago
  { id: '15', sender: 'Michael Johnson', senderId: '2', content: '🙏 **Checked into Recovery Meeting**\n\nI\'m attending: AA - Evening Serenity Group\n📍 St. Mark\'s Church, 123 Main St\n⏰ Checkout expected at 8:00 PM', time: '6:45 PM', date: formatRelativeDate(subDays(now, 5)) },
  { id: '16', sender: 'Michael Johnson', senderId: '2', content: '✅ **Checked out of Meeting**\n\nCompleted: AA - Evening Serenity Group\nDuration: 1 hour 20 minutes', time: '8:05 PM', date: formatRelativeDate(subDays(now, 5)) },
  { id: '17', sender: 'Robert Johnson', senderId: '5', content: 'Day 42! Almost to 6 weeks. Very proud, grandson.', time: '8:30 PM', date: formatRelativeDate(subDays(now, 5)) },
  
  // Day 4 ago
  { id: '18', sender: 'Michael Johnson', senderId: '2', content: '💰 **Financial Request** from Michael Johnson\n\n**Amount:** $25.00\n**Reason:** Prescription pickup - anxiety medication\n\nPlease vote on this request!', time: '2:00 PM', date: formatRelativeDate(subDays(now, 4)) },
  { id: '19', sender: 'Sarah Johnson', senderId: '1', content: 'Approved. Medical expenses are essential. I\'ll cover this one entirely.', time: '2:15 PM', date: formatRelativeDate(subDays(now, 4)) },
  { id: '20', sender: 'Michael Johnson', senderId: '2', content: 'Thanks mom. I uploaded the pharmacy receipt.', time: '2:20 PM', date: formatRelativeDate(subDays(now, 4)) },
  
  // Day 3 ago
  { id: '21', sender: 'David Johnson', senderId: '3', content: 'Hey Michael, want to grab coffee this weekend? Just hang out like old times.', time: '9:00 AM', date: formatRelativeDate(subDays(now, 3)) },
  { id: '22', sender: 'Michael Johnson', senderId: '2', content: 'I\'d love that, bro. It means a lot that you\'re reaching out.', time: '9:15 AM', date: formatRelativeDate(subDays(now, 3)) },
  { id: '23', sender: 'Michael Johnson', senderId: '2', content: '🙏 **Checked into Recovery Meeting**\n\nI\'m attending: AA - Morning Serenity Group\n📍 St. Mark\'s Church, 123 Main St\n⏰ Checkout expected at 9:00 AM', time: '7:45 AM', date: formatRelativeDate(subDays(now, 3)) },
  
  // Day 2 ago
  { id: '24', sender: 'Michael Johnson', senderId: '2', content: 'Day 45! 🎉 Feeling stronger every day.', time: '8:00 AM', date: formatRelativeDate(subDays(now, 2)) },
  { id: '25', sender: 'Matt Brown', senderId: '0', content: 'Congratulations Michael! The consistency you\'re showing is exactly what builds long-term recovery. Keep it up!', time: '8:30 AM', date: formatRelativeDate(subDays(now, 2)) },
  { id: '26', sender: 'Michael Johnson', senderId: '2', content: '🙏 **Checked into Therapy**\n\nI\'m attending: Group Therapy Session\n📍 Recovery Center, Room 3\n⏰ Checkout expected at 3:00 PM', time: '1:45 PM', date: formatRelativeDate(subDays(now, 2)) },
  
  // Yesterday
  { id: '27', sender: 'Michael Johnson', senderId: '2', content: '💰 **Financial Request** from Michael Johnson\n\n**Amount:** $147.23\n**Reason:** Electric bill - City Power & Light (Account #4521-7890-3336)\n\nPlease vote on this request and pledge to help if you can!', time: '2:30 PM', date: 'Yesterday' },
  { id: '28', sender: 'Sarah Johnson', senderId: '1', content: 'Approved. I\'ll pledge $75.', time: '2:45 PM', date: 'Yesterday' },
  { id: '29', sender: 'Robert Johnson', senderId: '5', content: 'I\'ll cover the remaining $72.23.', time: '3:00 PM', date: 'Yesterday' },
  { id: '30', sender: 'Emily Johnson', senderId: '4', content: '46 days! You\'re doing amazing! 💪', time: '6:00 PM', date: 'Yesterday' },
  
  // Today
  { id: '31', sender: 'Michael Johnson', senderId: '2', content: 'Good morning everyone! Day 47 today. Going to my morning meeting.', time: '7:00 AM', date: 'Today' },
  { id: '32', sender: 'Michael Johnson', senderId: '2', content: '🙏 **Checked into Recovery Meeting**\n\nI\'m attending: AA - Morning Serenity Group\n📍 St. Mark\'s Church, 123 Main St\n⏰ Checkout expected at 9:00 AM', time: '7:45 AM', date: 'Today' },
  { id: '33', sender: 'Sarah Johnson', senderId: '1', content: 'Have a great meeting, sweetie! ❤️', time: '7:50 AM', date: 'Today' },
  { id: '34', sender: 'David Johnson', senderId: '3', content: 'Proud of you bro!', time: '8:00 AM', date: 'Today' },
];

export const JOHNSON_FINANCIAL_REQUESTS = [
  { 
    id: '1', 
    requester: 'Michael Johnson', 
    amount: 147.23, 
    reason: 'Electric bill - City Power & Light (Account #4521-7890-3336)', 
    status: 'pending',
    attachmentUrl: demoElectricBill,
    attachmentCaption: 'Electric bill for Michael Johnson • Account #4521-7890-3336 • Amount: $147.23',
    votes: { approve: 4, deny: 0 },
    pledges: [
      { name: 'Sarah Johnson', amount: 75 },
      { name: 'Robert Johnson', amount: 72.23 },
    ],
    createdAt: 'Yesterday at 2:30 PM'
  },
  { 
    id: '2', 
    requester: 'Michael Johnson', 
    amount: 25, 
    reason: 'Prescription pickup - anxiety medication', 
    status: 'completed',
    attachmentUrl: demoPrescriptionReceipt,
    attachmentCaption: 'Pharmacy receipt • Total: $25.00',
    fundsReceived: true,
    fundsReceivedAt: '4 days ago',
    paymentConfirmed: true,
    paymentConfirmedAt: '4 days ago',
    votes: { approve: 5, deny: 0 },
    pledges: [
      { name: 'Sarah Johnson', amount: 25 },
    ],
    createdAt: formatDateTime(subDays(now, 4))
  },
  { 
    id: '3', 
    requester: 'Michael Johnson', 
    amount: 67.89, 
    reason: 'Water bill - Metro Water Services', 
    status: 'completed',
    attachmentUrl: demoWaterBill,
    attachmentCaption: 'Water bill • Account #1201-822 • Amount: $67.89',
    fundsReceived: true,
    fundsReceivedAt: '7 days ago',
    paymentConfirmed: true,
    paymentConfirmedAt: '7 days ago',
    votes: { approve: 5, deny: 0 },
    pledges: [
      { name: 'Robert Johnson', amount: 35 },
      { name: 'David Johnson', amount: 32.89 },
    ],
    createdAt: formatDateTime(subDays(now, 8))
  },
  { 
    id: '4', 
    requester: 'Michael Johnson', 
    amount: 50, 
    reason: 'Gas for work commute', 
    status: 'completed',
    attachmentUrl: demoGasReceipt,
    attachmentCaption: 'Gas station receipt • Total: $50.00',
    fundsReceived: true,
    fundsReceivedAt: '9 days ago',
    paymentConfirmed: true,
    paymentConfirmedAt: '9 days ago',
    votes: { approve: 5, deny: 0 },
    pledges: [
      { name: 'Emily Johnson', amount: 50 },
    ],
    createdAt: formatDateTime(subDays(now, 10))
  },
];

// 10 days of check-ins for Johnson family
export const JOHNSON_CHECKINS = [
  // Today
  { 
    id: '1', 
    user: 'Michael Johnson', 
    type: 'AA', 
    name: 'Morning Serenity Group',
    location: 'St. Mark\'s Church, 123 Main St',
    checkinTime: '7:45 AM',
    checkoutDue: '9:00 AM',
    status: 'active',
    date: 'Today'
  },
  // Yesterday
  { 
    id: '2', 
    user: 'Michael Johnson', 
    type: 'AA', 
    name: 'Evening Serenity Group',
    location: 'St. Mark\'s Church, 123 Main St',
    checkinTime: '6:45 PM',
    checkoutTime: '8:05 PM',
    status: 'completed',
    date: 'Yesterday'
  },
  // 2 days ago
  { 
    id: '3', 
    user: 'Michael Johnson', 
    type: 'Therapy', 
    name: 'Group Therapy Session',
    location: 'Recovery Center, Room 3',
    checkinTime: '1:45 PM',
    checkoutTime: '3:02 PM',
    status: 'completed',
    date: formatRelativeDate(subDays(now, 2))
  },
  // 3 days ago
  { 
    id: '4', 
    user: 'Michael Johnson', 
    type: 'AA', 
    name: 'Morning Serenity Group',
    location: 'St. Mark\'s Church, 123 Main St',
    checkinTime: '7:45 AM',
    checkoutTime: '9:00 AM',
    status: 'completed',
    date: formatRelativeDate(subDays(now, 3))
  },
  // 5 days ago
  { 
    id: '5', 
    user: 'Michael Johnson', 
    type: 'AA', 
    name: 'Evening Serenity Group',
    location: 'St. Mark\'s Church, 123 Main St',
    checkinTime: '6:45 PM',
    checkoutTime: '8:05 PM',
    status: 'completed',
    date: formatRelativeDate(subDays(now, 5))
  },
  // 6 days ago
  { 
    id: '6', 
    user: 'Michael Johnson', 
    type: 'Therapy', 
    name: 'Dr. Smith',
    location: 'Wellness Center, Suite 200',
    checkinTime: '10:00 AM',
    checkoutTime: '10:58 AM',
    status: 'completed',
    date: formatRelativeDate(subDays(now, 6))
  },
  // 7 days ago
  { 
    id: '7', 
    user: 'Michael Johnson', 
    type: 'AA', 
    name: 'Morning Serenity Group',
    location: 'St. Mark\'s Church, 123 Main St',
    checkinTime: '7:45 AM',
    checkoutTime: '9:05 AM',
    status: 'completed',
    date: formatRelativeDate(subDays(now, 7))
  },
  // 8 days ago
  { 
    id: '8', 
    user: 'Michael Johnson', 
    type: 'AA', 
    name: 'Evening Serenity Group',
    location: 'St. Mark\'s Church, 123 Main St',
    checkinTime: '6:45 PM',
    checkoutTime: '8:00 PM',
    status: 'completed',
    date: formatRelativeDate(subDays(now, 8))
  },
  // 9 days ago
  { 
    id: '9', 
    user: 'Michael Johnson', 
    type: 'AA', 
    name: 'Morning Serenity Group',
    location: 'St. Mark\'s Church, 123 Main St',
    checkinTime: '7:45 AM',
    checkoutTime: '9:00 AM',
    status: 'completed',
    date: formatRelativeDate(subDays(now, 9))
  },
];

export const JOHNSON_SOBRIETY = {
  userId: '2',
  userName: 'Michael Johnson',
  startDate: subDays(now, 47),
  daysCount: 47,
  isActive: true,
  resetCount: 0,
  milestones: [
    { days: 1, achieved: true, celebratedByFamily: true },
    { days: 7, achieved: true, celebratedByFamily: true },
    { days: 14, achieved: true, celebratedByFamily: true },
    { days: 30, achieved: true, celebratedByFamily: true },
  ],
  nextMilestone: 60
};

export const JOHNSON_EMOTIONAL_CHECKINS = [
  { date: 'Today', feeling: 'hopeful', user: 'Michael Johnson' },
  { date: 'Yesterday', feeling: 'grateful', user: 'Michael Johnson' },
  { date: formatRelativeDate(subDays(now, 2)), feeling: 'calm', user: 'Michael Johnson' },
  { date: formatRelativeDate(subDays(now, 3)), feeling: 'motivated', user: 'Michael Johnson' },
  { date: formatRelativeDate(subDays(now, 4)), feeling: 'anxious', user: 'Michael Johnson' },
  { date: formatRelativeDate(subDays(now, 5)), feeling: 'hopeful', user: 'Michael Johnson' },
  { date: formatRelativeDate(subDays(now, 6)), feeling: 'grateful', user: 'Michael Johnson' },
  { date: formatRelativeDate(subDays(now, 7)), feeling: 'calm', user: 'Michael Johnson' },
];

export const JOHNSON_BOUNDARIES = [
  {
    id: '1',
    content: 'No financial assistance for anything other than essential bills (rent, utilities, food)',
    createdBy: 'Sarah Johnson',
    status: 'approved',
    acknowledgments: ['Sarah Johnson', 'David Johnson', 'Emily Johnson', 'Robert Johnson', 'Michael Johnson'],
  },
  {
    id: '2',
    content: 'Michael must check in to at least 3 meetings per week',
    createdBy: 'Sarah Johnson',
    targetUser: 'Michael Johnson',
    status: 'approved',
    acknowledgments: ['Sarah Johnson', 'Michael Johnson', 'David Johnson', 'Emily Johnson', 'Robert Johnson'],
  },
];

export const JOHNSON_VALUES = [
  { key: 'honesty', name: 'Honesty & Transparency' },
  { key: 'accountability', name: 'Accountability and Repair Without Shame' },
];

export const JOHNSON_COMMON_GOALS = [
  { key: 'weekly_meetings', name: 'Attend Weekly Family Meetings', completed: false },
  { key: 'attend_support', name: 'Attend Support Groups (Al-Anon, etc.)', completed: false },
];

// FIIS Analysis for Johnson Family - Positive Recovery at 47 Days
export const JOHNSON_FIIS_ANALYSIS = {
  what_seeing: "I'm observing a family system that is showing strong signs of early recovery stability at Day 47. Michael is demonstrating consistent engagement with his recovery program, and the family is maintaining unified support. The presence of a professional moderator (Matt Brown) is helping keep communication healthy and boundaries clear. I see evidence that the family's chosen values of Honesty & Transparency and Accountability Without Shame are being lived out in daily interactions.",
  pattern_signals: [
    {
      signal_type: 'progress',
      description: 'Michael has maintained 47 consecutive days of sobriety with consistent meeting attendance (averaging 4-5 meetings per week). Therapy sessions are being attended regularly. This consistency at the 6-week mark is a positive indicator of emerging stability.',
      confidence: 'high'
    },
    {
      signal_type: 'family_unity',
      description: 'All family members have acknowledged and are honoring the established boundaries. Financial requests align with agreed-upon guidelines (essential bills only). No evidence of secret communications or boundary violations.',
      confidence: 'very_high'
    },
    {
      signal_type: 'healthy_communication',
      description: 'Chat messages show supportive, encouraging language without enabling. Family celebrates milestones while maintaining realistic expectations. No toxic positivity or minimizing of the recovery journey.',
      confidence: 'high'
    },
    {
      signal_type: 'accountability_working',
      description: 'Michael is proactively checking in to meetings and communicating his plans. Financial requests include proper documentation. The family is practicing accountability without shame, per their stated values.',
      confidence: 'high'
    },
    {
      signal_type: 'attention_needed',
      description: 'Family has not logged a support group meeting (Al-Anon, etc.) this week. The family commitment was that ALL members would attend weekly meetings alongside Michael. This is worth addressing.',
      confidence: 'moderate'
    },
  ],
  contextual_framing: "Day 47 represents a significant milestone. Research shows that the 30-90 day window is critical for establishing new patterns. The Johnson family is doing many things right: unified approach, professional support, clear boundaries, and values-driven decisions. The one area needing attention is the family's own recovery work through Al-Anon or similar support groups.",
  recommendations: [
    {
      title: "Maintain the Winning Formula",
      description: "Continue the current approach: consistent meeting attendance, transparent financial requests with documentation, and open family communication. What you're doing is working.",
      related_to: "Values: Honesty & Transparency"
    },
    {
      title: "Family Meeting Check-In This Week",
      description: "Your family goal states that supporters will attend weekly Al-Anon or similar meetings. This hasn't happened this week. Consider scheduling a group Al-Anon meeting together.",
      related_to: "Goal: Attend Support Groups"
    },
    {
      title: "Plan for Day 60 Milestone",
      description: "Begin discussing as a family how you'll celebrate the upcoming 60-day milestone in healthy ways. Having something to look forward to supports motivation.",
      related_to: "Boundary: 3 meetings per week"
    }
  ],
  clarifying_questions: [
    "Has the family discussed what healthy celebration looks like for the upcoming 60-day milestone?",
    "Are family members experiencing any compassion fatigue or feeling like they need additional support?",
    "Has Michael shared what aspects of his recovery program are feeling most helpful right now?"
  ],
  what_to_watch: [
    "Family support group attendance - this week's missed meeting shouldn't become a pattern",
    "Signs of complacency around Day 60-90",
    "Michael's stress levels as he takes on more responsibilities"
  ],
  strengths: [
    { area: 'Professional Moderation', detail: 'Matt Brown provides objective oversight' },
    { area: 'Unified Family Response', detail: 'All family members aligned on boundaries' },
    { area: 'Transparent Finances', detail: 'Requests include documentation' },
    { area: 'Consistent Recovery Work', detail: 'Michael averaging 4-5 meetings per week' }
  ]
};


// ============================================================================
// DAVIS FAMILY - Active Addiction Crisis (3 days since last meeting)
// ============================================================================

export const DAVIS_MEMBERS = [
  { id: '1', name: 'Richard Davis', role: 'admin', relationship: 'Parent (Dad)', initials: 'RD' },
  { id: '2', name: 'Karen Davis', role: 'member', relationship: 'Parent (Mom)', initials: 'KD' },
  { 
    id: '3', 
    name: 'Ashley Davis', 
    role: 'recovering', 
    relationship: 'Recovering (Daughter)', 
    initials: 'AD',
    paymentInfo: {
      paypal: 'ashley.davis@email.com',
      venmo: '@AshleyD-22',
      cashapp: '$AshleyDavis22'
    }
  },
  { id: '4', name: 'Brandon Davis', role: 'member', relationship: 'Sibling (Brother)', initials: 'BD' },
  { id: '5', name: 'Grandma Rose', role: 'member', relationship: 'Grandparent', initials: 'GR' },
];

// 10 days of messages for Davis family showing dysfunction
export const DAVIS_MESSAGES = [
  // Day 10 ago
  { id: '1', sender: 'Karen Davis', senderId: '2', content: 'Ashley, you missed therapy again yesterday. What happened?', time: '9:00 AM', date: formatRelativeDate(subDays(now, 10)) },
  { id: '2', sender: 'Ashley Davis', senderId: '3', content: 'My phone died and I couldn\'t set an alarm. It\'s not my fault.', time: '10:30 AM', date: formatRelativeDate(subDays(now, 10)) },
  { id: '3', sender: 'Richard Davis', senderId: '1', content: 'We can get you a new charger, sweetie. Don\'t worry about it.', time: '10:45 AM', date: formatRelativeDate(subDays(now, 10)) },
  { id: '4', sender: 'Brandon Davis', senderId: '4', content: 'Dad, she has 3 chargers. This is the fifth time she\'s "missed" something this month.', time: '11:00 AM', date: formatRelativeDate(subDays(now, 10)) },
  
  // Day 9 ago
  { id: '5', sender: 'Ashley Davis', senderId: '3', content: '💰 **Financial Request** from Ashley Davis\n\n**Amount:** $300\n**Reason:** Need to pay friend back who helped me\n\nPlease vote on this request!', time: '2:00 PM', date: formatRelativeDate(subDays(now, 9)) },
  { id: '6', sender: 'Karen Davis', senderId: '2', content: 'What friend? What help? We need details.', time: '2:30 PM', date: formatRelativeDate(subDays(now, 9)) },
  { id: '7', sender: 'Ashley Davis', senderId: '3', content: 'Just a friend! Why do I have to explain everything?', time: '2:45 PM', date: formatRelativeDate(subDays(now, 9)) },
  { id: '8', sender: 'Richard Davis', senderId: '1', content: 'I voted to approve. Ashley shouldn\'t owe people money.', time: '3:00 PM', date: formatRelativeDate(subDays(now, 9)) },
  
  // Day 8 ago
  { id: '9', sender: 'Grandma Rose', senderId: '5', content: 'Ashley dear, I love you, but we all agreed - no money unless you\'re attending meetings. Have you been to any this week?', time: '9:00 AM', date: formatRelativeDate(subDays(now, 8)) },
  { id: '10', sender: 'Ashley Davis', senderId: '3', content: 'I\'ve been busy trying to find a job! You all said I need to work!', time: '9:30 AM', date: formatRelativeDate(subDays(now, 8)) },
  
  // Day 7 ago
  { id: '11', sender: 'Ashley Davis', senderId: '3', content: '💰 **Financial Request** from Ashley Davis\n\n**Amount:** $85\n**Reason:** Gas for car\n\nPlease vote on this request!', time: '11:00 AM', date: formatRelativeDate(subDays(now, 7)) },
  { id: '12', sender: 'Brandon Davis', senderId: '4', content: 'Ashley, your car was impounded 2 weeks ago. You don\'t have a car.', time: '11:15 AM', date: formatRelativeDate(subDays(now, 7)) },
  { id: '13', sender: 'Ashley Davis', senderId: '3', content: 'I meant gas for my friend\'s car. They\'re helping me get around.', time: '11:20 AM', date: formatRelativeDate(subDays(now, 7)) },
  { id: '14', sender: 'Richard Davis', senderId: '1', content: 'She still needs to get around. I\'ll give her the money.', time: '11:30 AM', date: formatRelativeDate(subDays(now, 7)) },
  { id: '15', sender: 'Karen Davis', senderId: '2', content: 'Richard, NO. We agreed - all money through the app. That\'s a boundary!', time: '11:35 AM', date: formatRelativeDate(subDays(now, 7)) },
  
  // Day 6 ago
  { id: '16', sender: 'Ashley Davis', senderId: '3', content: '💰 **Financial Request** from Ashley Davis\n\n**Amount:** $150\n**Reason:** Phone bill - need phone for job search\n\nPlease vote on this request!', time: '3:00 PM', date: formatRelativeDate(subDays(now, 6)) },
  { id: '17', sender: 'Karen Davis', senderId: '2', content: 'Your previous phone was sold. What happened to that money?', time: '3:30 PM', date: formatRelativeDate(subDays(now, 6)) },
  { id: '18', sender: 'Ashley Davis', senderId: '3', content: 'I used it for food! Why are you always attacking me?', time: '3:45 PM', date: formatRelativeDate(subDays(now, 6)) },
  
  // Day 5 ago - LIQUOR LICENSE WARNING DAY
  { id: '19', sender: 'Ashley Davis', senderId: '3', content: '🙏 **Checked into Recovery Meeting**\n\nI\'m attending: NA - Evening Hope Group\n📍 Community Center, 456 Oak Ave\n⏰ Checkout expected at 8:00 PM', time: '6:30 PM', date: formatRelativeDate(subDays(now, 5)) },
  { id: '20', sender: 'Richard Davis', senderId: '1', content: 'So proud of you sweetie! See everyone, she IS going to meetings!', time: '6:35 PM', date: formatRelativeDate(subDays(now, 5)) },
  { id: '21', sender: 'System Alert', senderId: 'system', content: '⚠️ **LIQUOR LICENSE WARNING**\n\n🍺 Ashley Davis checked into a location that may have an active liquor license.\n\n**Location:** 456 Oak Ave\n**Business:** The Oak Tavern (Bar & Grill)\n**License Type:** Full Liquor License\n\nThis automated alert is triggered when a check-in occurs at a location with an active liquor license. Family members should verify this is the intended meeting location.', time: '6:32 PM', date: formatRelativeDate(subDays(now, 5)), isSystemAlert: true },
  { id: '22', sender: 'Brandon Davis', senderId: '4', content: 'Wait - that address is The Oak Tavern. That\'s a BAR, not a community center!', time: '6:40 PM', date: formatRelativeDate(subDays(now, 5)) },
  { id: '23', sender: 'Karen Davis', senderId: '2', content: 'Ashley, what is going on? The app flagged a liquor license at that location!', time: '6:42 PM', date: formatRelativeDate(subDays(now, 5)) },
  { id: '24', sender: 'Ashley Davis', senderId: '3', content: 'The meeting is in the back room! Some community centers are attached to businesses!', time: '6:50 PM', date: formatRelativeDate(subDays(now, 5)) },
  { id: '25', sender: 'Brandon Davis', senderId: '4', content: 'I just looked it up. There\'s no NA meeting at that address. The Oak Tavern is just a bar.', time: '6:55 PM', date: formatRelativeDate(subDays(now, 5)) },
  { id: '26', sender: 'Richard Davis', senderId: '1', content: 'Maybe she made a mistake with the address? Let\'s not jump to conclusions.', time: '7:00 PM', date: formatRelativeDate(subDays(now, 5)) },
  { id: '27', sender: 'Ashley Davis', senderId: '3', content: '✅ **Checked out of Meeting**\n\nDuration: 15 minutes\n\n*Note: User checked out early*', time: '6:45 PM', date: formatRelativeDate(subDays(now, 5)) },
  { id: '28', sender: 'Karen Davis', senderId: '2', content: '15 minutes? Ashley, meetings are at least an hour. What really happened?', time: '7:05 PM', date: formatRelativeDate(subDays(now, 5)) },
  
  // Day 4 ago
  { id: '29', sender: 'Ashley Davis', senderId: '3', content: 'I\'m so done with this family. You\'re all against me.', time: '10:00 AM', date: formatRelativeDate(subDays(now, 4)) },
  { id: '30', sender: 'Grandma Rose', senderId: '5', content: 'Honey, we love you. That\'s why we\'re concerned. The app showed you at a bar.', time: '10:30 AM', date: formatRelativeDate(subDays(now, 4)) },
  { id: '31', sender: 'Richard Davis', senderId: '1', content: 'Everyone makes mistakes. Let\'s move forward.', time: '11:00 AM', date: formatRelativeDate(subDays(now, 4)) },
  
  // Day 3 ago
  { id: '32', sender: 'Ashley Davis', senderId: '3', content: '💰 **Financial Request** from Ashley Davis\n\n**Amount:** $200\n**Reason:** Groceries - haven\'t eaten in 2 days\n\nPlease vote on this request!', time: '8:00 AM', date: formatRelativeDate(subDays(now, 3)) },
  { id: '33', sender: 'Karen Davis', senderId: '2', content: 'You said the same thing last week and the week before. What happened to the food stamps?', time: '8:30 AM', date: formatRelativeDate(subDays(now, 3)) },
  
  // Day 2 ago
  { id: '34', sender: 'Brandon Davis', senderId: '4', content: 'Dad, I found out you gave Ashley $400 last week outside the app. This is exactly what we agreed NOT to do.', time: '2:00 PM', date: formatRelativeDate(subDays(now, 2)) },
  { id: '35', sender: 'Richard Davis', senderId: '1', content: 'She\'s my daughter! I\'m not going to let her starve on the street!', time: '2:15 PM', date: formatRelativeDate(subDays(now, 2)) },
  { id: '36', sender: 'Karen Davis', senderId: '2', content: 'Richard, you\'re enabling her. This is why nothing changes. We agreed to unified boundaries.', time: '2:30 PM', date: formatRelativeDate(subDays(now, 2)) },
  { id: '37', sender: 'Ashley Davis', senderId: '3', content: 'At least DAD understands. The rest of you just want me to suffer.', time: '3:00 PM', date: formatRelativeDate(subDays(now, 2)) },
  
  // Yesterday
  { id: '38', sender: 'Ashley Davis', senderId: '3', content: 'I need $200 for groceries. I haven\'t eaten in 2 days.', time: '8:15 AM', date: 'Yesterday' },
  { id: '39', sender: 'Karen Davis', senderId: '2', content: 'Ashley, you said the same thing last week. What happened to the food stamps?', time: '8:22 AM', date: 'Yesterday' },
  { id: '40', sender: 'Richard Davis', senderId: '1', content: 'Karen, don\'t be so harsh. She\'s our daughter. Ashley, sweetie, I can help you with groceries.', time: '8:28 AM', date: 'Yesterday' },
  { id: '41', sender: 'Brandon Davis', senderId: '4', content: 'Dad, stop! This is exactly what we talked about. You keep bailing her out and nothing changes.', time: '8:32 AM', date: 'Yesterday' },
  
  // Today
  { id: '42', sender: 'Ashley Davis', senderId: '3', content: '💰 **Financial Request** from Ashley Davis\n\n**Amount:** $75\n**Reason:** Need cash for bus pass to get to job interview\n\nPlease vote on this request!', time: '11:30 AM', date: 'Today' },
  { id: '43', sender: 'Richard Davis', senderId: '1', content: 'I voted to approve. She needs to get to work interviews!', time: '11:45 AM', date: 'Today' },
  { id: '44', sender: 'Brandon Davis', senderId: '4', content: 'A bus pass is $30, not $75. And what job interview? Ashley, can you provide details?', time: '11:52 AM', date: 'Today' },
  { id: '45', sender: 'Grandma Rose', senderId: '5', content: 'I love you Ashley, but I can\'t vote to approve this. Please go to a meeting first.', time: '12:00 PM', date: 'Today' },
];

export const DAVIS_FINANCIAL_REQUESTS = [
  { 
    id: '1', 
    requester: 'Ashley Davis', 
    amount: 75, 
    reason: 'Need cash for bus pass to get to job interview', 
    status: 'pending',
    votes: { approve: 1, deny: 3 },
    voterDetails: [
      { name: 'Richard Davis', approved: true },
      { name: 'Karen Davis', approved: false },
      { name: 'Brandon Davis', approved: false },
      { name: 'Grandma Rose', approved: false },
    ],
    pledges: [
      { name: 'Richard Davis', amount: 75 },
    ],
    denialReasons: ['Amount inconsistent with stated need (bus pass is $30)', 'No documentation provided', 'No meetings attended in 3 weeks'],
    createdAt: 'Today at 11:30 AM'
  },
  { 
    id: '2', 
    requester: 'Ashley Davis', 
    amount: 200, 
    reason: 'Groceries - haven\'t eaten in 2 days', 
    status: 'denied',
    votes: { approve: 1, deny: 4 },
    voterDetails: [
      { name: 'Richard Davis', approved: true },
      { name: 'Karen Davis', approved: false },
      { name: 'Brandon Davis', approved: false },
      { name: 'Grandma Rose', approved: false },
    ],
    pledges: [],
    denialReasons: ['Similar request last week was misused', 'Food stamps not accounted for', 'Violates boundary: must demonstrate recovery compliance first'],
    createdAt: 'Yesterday at 3:15 PM'
  },
  { 
    id: '3', 
    requester: 'Ashley Davis', 
    amount: 150, 
    reason: 'Phone bill - need phone for job search', 
    status: 'denied',
    votes: { approve: 1, deny: 3 },
    voterDetails: [
      { name: 'Richard Davis', approved: true },
      { name: 'Karen Davis', approved: false },
      { name: 'Brandon Davis', approved: false },
    ],
    pledges: [],
    denialReasons: ['Previous phone was sold - unclear what happened', 'Has not attended meetings as required'],
    createdAt: formatDateTime(subDays(now, 6))
  },
  { 
    id: '4', 
    requester: 'Ashley Davis', 
    amount: 300, 
    reason: 'Need to pay friend back who helped me', 
    status: 'denied',
    votes: { approve: 1, deny: 4 },
    pledges: [],
    denialReasons: ['Not an essential expense', 'Unclear who friend is or what help was provided', 'Does not align with family values: transparency'],
    createdAt: formatDateTime(subDays(now, 9))
  },
  { 
    id: '5', 
    requester: 'Ashley Davis', 
    amount: 85, 
    reason: 'Gas for car', 
    status: 'denied',
    votes: { approve: 1, deny: 3 },
    pledges: [],
    denialReasons: ['Car was impounded 2 weeks ago - no longer has vehicle', 'Request not aligned with reality'],
    createdAt: formatDateTime(subDays(now, 7))
  },
];

export const DAVIS_CHECKINS = [
  // The bar incident
  { 
    id: '1', 
    user: 'Ashley Davis', 
    type: 'NA', 
    name: 'Evening Hope Group',
    location: '456 Oak Ave',
    actualLocation: 'The Oak Tavern (Bar & Grill)',
    checkinTime: '6:30 PM',
    checkoutTime: '6:45 PM',
    status: 'incomplete',
    date: formatRelativeDate(subDays(now, 5)),
    notes: 'Left after 15 minutes',
    liquorLicenseWarning: true,
    licenseType: 'Full Liquor License',
    warningDetails: 'Location has active liquor license - The Oak Tavern is a bar, not a community center.'
  },
  // Older incomplete check-in
  { 
    id: '2', 
    user: 'Ashley Davis', 
    type: 'NA', 
    name: 'Daily Hope Group',
    location: 'Community Center',
    checkinTime: '7:00 PM',
    checkoutTime: '7:15 PM',
    status: 'incomplete',
    date: formatRelativeDate(subDays(now, 12)),
    notes: 'Left after 15 minutes'
  },
];

export const DAVIS_SOBRIETY = {
  userId: '3',
  userName: 'Ashley Davis',
  startDate: subDays(now, 3),
  daysCount: 3,
  isActive: false, // Suspected active use
  resetCount: 8, // Multiple resets
  milestones: [],
  nextMilestone: 7,
  warning: 'Sobriety counter may not reflect actual status - no verified meeting attendance in 3 weeks'
};

export const DAVIS_EMOTIONAL_CHECKINS = [
  { date: 'Today', feeling: 'frustrated', user: 'Ashley Davis' },
  { date: 'Yesterday', feeling: 'angry', user: 'Ashley Davis' },
  { date: formatRelativeDate(subDays(now, 2)), feeling: 'anxious', user: 'Ashley Davis' },
  { date: formatRelativeDate(subDays(now, 3)), feeling: 'defensive', user: 'Ashley Davis', bypassed: true },
  { date: formatRelativeDate(subDays(now, 4)), feeling: 'victimized', user: 'Ashley Davis' },
  { date: formatRelativeDate(subDays(now, 5)), feeling: null, user: 'Ashley Davis', skipped: true },
  { date: formatRelativeDate(subDays(now, 6)), feeling: null, user: 'Ashley Davis', skipped: true },
];

export const DAVIS_BOUNDARIES = [
  {
    id: '1',
    content: 'No financial assistance until 3 consecutive meetings are attended',
    createdBy: 'Karen Davis',
    status: 'approved',
    acknowledgments: ['Karen Davis', 'Brandon Davis', 'Grandma Rose'],
    notAcknowledged: ['Richard Davis', 'Ashley Davis'],
  },
  {
    id: '2',
    content: 'All requests for money must include documentation or receipts',
    createdBy: 'Brandon Davis',
    status: 'approved',
    acknowledgments: ['Karen Davis', 'Brandon Davis', 'Grandma Rose'],
    notAcknowledged: ['Richard Davis'],
  },
  {
    id: '3',
    content: 'No private conversations about finances - all discussions in the app',
    createdBy: 'Karen Davis',
    status: 'approved',
    acknowledgments: ['Karen Davis', 'Brandon Davis', 'Grandma Rose'],
    notAcknowledged: ['Richard Davis'],
  },
];

export const DAVIS_VALUES = [
  { key: 'tough_love', name: 'Tough Love & Clear Consequences' },
  { key: 'transparency', name: 'Honesty & Transparency' },
];

export const DAVIS_COMMON_GOALS = [
  { key: 'weekly_meetings', name: 'Ashley attends 3+ meetings per week', completed: false },
  { key: 'family_alignment', name: 'All family members follow agreed boundaries', completed: false, warning: 'Richard consistently breaking this' },
];

export const DAVIS_LIQUOR_LICENSE_WARNINGS = [
  {
    id: '1',
    userId: '3',
    userName: 'Ashley Davis',
    checkinId: '1',
    locationAddress: '456 Oak Ave',
    businessName: 'The Oak Tavern',
    licenseType: 'Full Liquor License',
    warnedAt: formatDateTime(subDays(now, 5)),
    acknowledged: false,
    details: 'User checked into what was claimed to be "NA - Evening Hope Group at Community Center" but the GPS coordinates matched The Oak Tavern, a bar with an active liquor license. User checked out after only 15 minutes.'
  }
];

// FIIS Analysis for Davis Family
export const DAVIS_FIIS_ANALYSIS = {
  what_seeing: "I'm observing a family in active crisis with significant dysfunction in the support system. The recovering person (Ashley) is showing classic manipulation patterns and the support system is fractured, with one family member (Richard/Dad) consistently undermining agreed-upon boundaries. A recent check-in at a location with a liquor license (The Oak Tavern) was flagged, raising serious concerns about active use. This creates a dangerous enabling dynamic that is actively working against recovery.",
  pattern_signals: [
    {
      signal_type: 'liquor_license_violation',
      description: 'CRITICAL: Ashley checked into a "meeting" at 456 Oak Ave, which the system identified as The Oak Tavern - a bar with an active liquor license. She checked out after only 15 minutes. This strongly suggests active use, not meeting attendance.',
      confidence: 'very_high'
    },
    {
      signal_type: 'escalation',
      description: 'Financial requests increasing in frequency (6 in past month) with increasingly creative justifications. Each denial leads to emotional manipulation attempts.',
      confidence: 'high'
    },
    {
      signal_type: 'enabling',
      description: 'Richard (Dad) has voted to approve 100% of requests despite family consensus to deny. Evidence of $400 given outside the app. Pattern indicates codependency.',
      confidence: 'very_high'
    },
    {
      signal_type: 'manipulation',
      description: 'Ashley uses guilt ("I haven\'t eaten"), victimhood ("everyone is against me"), and triangulation (going to Dad privately) to circumvent boundaries.',
      confidence: 'high'
    },
    {
      signal_type: 'regression',
      description: 'No legitimate meeting attendance in 3 weeks. Therapy sessions missed. The only "check-in" was at a bar. Recovery trajectory is severely negative.',
      confidence: 'very_high'
    },
  ],
  contextual_framing: "This family is at a critical juncture. The enabling pattern from Richard is preventing the natural consequences that often motivate change. The recent liquor license warning is a serious red flag that should not be ignored. Without unified family action, Ashley has no incentive to engage in recovery.",
  recommendations: [
    {
      title: "Address the Bar Incident Directly",
      description: "The family needs to discuss the liquor license warning openly. Ashley claimed to be at a meeting but the GPS showed a bar. This cannot be explained away.",
      related_to: "Liquor License Warning"
    },
    {
      title: "Richard Needs Al-Anon Support",
      description: "Richard's enabling behavior is as dangerous as Ashley's addiction. He should attend Al-Anon meetings to understand how his 'help' is hurting.",
      related_to: "Enabling Pattern"
    },
    {
      title: "Consider Professional Intervention",
      description: "Given the severity of the situation - fake check-ins, active use, fractured family response - a professional intervention may be necessary.",
      related_to: "Family Crisis"
    }
  ],
  clarifying_questions: [
    "Has Richard attended Al-Anon or received education about codependency and enabling?",
    "What was the $400 Richard gave Ashley outside the app used for?",
    "Has the family discussed what will happen if Richard continues to break boundaries?",
    "Is Ashley safe? Are there signs of escalating substance use or crisis?"
  ],
  what_to_watch: [
    "Richard's behavior - is he still giving money outside the app?",
    "Ashley's escalation tactics - when manipulation fails, what comes next?",
    "Signs of crisis - verbal threats, health emergencies, or legal issues",
    "Any legitimate meeting attendance verified by proper check-in/check-out"
  ],
  risk_alerts: [
    {
      level: 'critical',
      person: 'Ashley Davis',
      issue: 'Suspected Active Use - Bar Check-In',
      details: 'Ashley checked into a location claiming it was an NA meeting, but the GPS and liquor license database identified it as The Oak Tavern, a bar. She checked out after 15 minutes. This strongly indicates active use rather than recovery activity.'
    },
    {
      level: 'critical',
      person: 'Richard Davis',
      issue: 'High Risk for Enabling',
      details: 'Richard has approved 100% of Ashley\'s requests despite family consensus. Evidence shows he gave $400 outside the app. His comments show classic codependent patterns: "I can\'t just let her starve" and defending Ashley\'s bar check-in as a "mistake."'
    },
    {
      level: 'high',
      person: 'Ashley Davis',
      issue: 'Manipulation & Deception',
      details: 'Multiple red flags: fake meeting check-ins, escalating financial requests with inconsistent explanations, manipulative language patterns, and emotional escalation when boundaries are enforced.'
    },
    {
      level: 'moderate',
      person: 'Family System',
      issue: 'Boundary Inconsistency',
      details: 'The family has good boundaries on paper but Richard\'s non-compliance creates an unstable recovery environment. Ashley knows she can bypass the system through Dad.'
    }
  ],
  strengths: [
    { area: 'Most Family United', detail: 'Karen, Brandon, and Grandma Rose are aligned on boundaries' },
    { area: 'Good Documentation', detail: 'Family is using the app to track patterns' },
    { area: 'FIIS Alerts Working', detail: 'Liquor license detection caught the bar check-in' }
  ]
};
