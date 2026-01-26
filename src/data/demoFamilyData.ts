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
// JOHNSON FAMILY - Positive Recovery Journey (125 days sober)
// 30 days inpatient treatment + 90 days sober living + 5 days aftercare
// ============================================================================

export const JOHNSON_MEMBERS = [
  { id: '0', name: 'Matt Brown', role: 'moderator', relationship: 'Case Manager', initials: 'MB', providerRole: 'case_manager' },
  { id: '1', name: 'Sarah Johnson', role: 'admin', relationship: 'Parent (Mom)', initials: 'SJ' },
  { 
    id: '2', 
    name: 'Michael Johnson', 
    role: 'recovering', 
    relationship: 'Person in Recovery', 
    initials: 'MJ',
    paymentInfo: {
      paypal: 'michael.johnson@email.com',
      venmo: '@MichaelJ-Recovery',
      cashapp: '$MichaelJohnson125'
    }
  },
  { id: '3', name: 'David Johnson', role: 'member', relationship: 'Brother', initials: 'DJ' },
  { id: '4', name: 'Emily Johnson', role: 'member', relationship: 'Wife', initials: 'EJ' },
  { id: '5', name: 'Robert Johnson', role: 'member', relationship: 'Grandfather', initials: 'RJ' },
  { id: '6', name: 'Dr. Sarah Thompson', role: 'provider', relationship: 'Therapist', initials: 'ST', providerRole: 'therapist' },
];

// 10 days of messages for Johnson family (125 days sober - post treatment + sober living)
export const JOHNSON_MESSAGES = [
  // Day 10 ago
  { id: '1', sender: 'Michael Johnson', senderId: '2', content: 'Day 115 today. Can\'t believe how far we\'ve come as a family. 🙏', time: formatTime(subDays(now, 10)), date: formatRelativeDate(subDays(now, 10)) },
  { id: '2', sender: 'Sarah Johnson', senderId: '1', content: 'So proud of you, son! The hard work in treatment and sober living really paid off.', time: formatTime(subDays(now, 10)), date: formatRelativeDate(subDays(now, 10)) },
  
  // Day 9 ago
  { id: '3', sender: 'Michael Johnson', senderId: '2', content: '🙏 **Checked into Recovery Meeting**\n\nI\'m attending: AA - Morning Serenity Group\n📍 St. Mark\'s Church, 123 Main St\n⏰ Checkout expected at 9:00 AM', time: '7:45 AM', date: formatRelativeDate(subDays(now, 9)) },
  { id: '4', sender: 'Emily Johnson', senderId: '4', content: 'Great way to start the day, Michael!', time: '7:50 AM', date: formatRelativeDate(subDays(now, 9)) },
  { id: '5', sender: 'Michael Johnson', senderId: '2', content: '✅ **Checked out of Meeting**\n\nCompleted: AA - Morning Serenity Group\nDuration: 1 hour 15 minutes', time: '9:00 AM', date: formatRelativeDate(subDays(now, 9)) },
  
  // Day 8 ago
  { id: '6', sender: 'Michael Johnson', senderId: '2', content: '💰 **Financial Request** from Michael Johnson\n\n**Amount:** $67.89\n**Reason:** Water bill - Metro Water Services\n\nPlease vote on this request!', time: '10:30 AM', date: formatRelativeDate(subDays(now, 8)) },
  { id: '7', sender: 'David Johnson', senderId: '3', content: 'Voted to approve. Essential bill with documentation.', time: '11:00 AM', date: formatRelativeDate(subDays(now, 8)) },
  { id: '8', sender: 'Robert Johnson', senderId: '5', content: 'I\'ll pledge $35 towards this.', time: '11:15 AM', date: formatRelativeDate(subDays(now, 8)) },
  
  // Day 7 ago  
  { id: '9', sender: 'Matt Brown', senderId: '0', content: 'Family, Michael just passed 4 months! This is a huge milestone. The transition from sober living has been smooth.', time: '3:00 PM', date: formatRelativeDate(subDays(now, 7)) },
  { id: '10', sender: 'Sarah Johnson', senderId: '1', content: 'Thank you Matt. Having you guide us through the treatment and sober living phases made such a difference.', time: '3:15 PM', date: formatRelativeDate(subDays(now, 7)) },
  
  // Day 6 ago
  { id: '11', sender: 'Michael Johnson', senderId: '2', content: '🙏 **Checked into Therapy**\n\nI\'m attending: Therapy Session with Dr. Smith\n📍 Wellness Center, Suite 200\n⏰ Checkout expected at 11:00 AM', time: '10:00 AM', date: formatRelativeDate(subDays(now, 6)) },
  { id: '12', sender: 'Michael Johnson', senderId: '2', content: '✅ **Checked out of Therapy**\n\nCompleted: Therapy Session\nDuration: 58 minutes', time: '10:58 AM', date: formatRelativeDate(subDays(now, 6)) },
  { id: '13', sender: 'Michael Johnson', senderId: '2', content: 'Good session today. Dr. Smith said my progress since leaving sober living has been really strong.', time: '11:05 AM', date: formatRelativeDate(subDays(now, 6)) },
  { id: '14', sender: 'Emily Johnson', senderId: '4', content: '❤️ You\'ve worked so hard for this. We\'re all so proud.', time: '11:20 AM', date: formatRelativeDate(subDays(now, 6)) },
  
  // Day 5 ago
  { id: '15', sender: 'Michael Johnson', senderId: '2', content: '🙏 **Checked into Recovery Meeting**\n\nI\'m attending: AA - Evening Serenity Group\n📍 St. Mark\'s Church, 123 Main St\n⏰ Checkout expected at 8:00 PM', time: '6:45 PM', date: formatRelativeDate(subDays(now, 5)) },
  { id: '16', sender: 'Michael Johnson', senderId: '2', content: '✅ **Checked out of Meeting**\n\nCompleted: AA - Evening Serenity Group\nDuration: 1 hour 20 minutes', time: '8:05 PM', date: formatRelativeDate(subDays(now, 5)) },
  { id: '17', sender: 'Robert Johnson', senderId: '5', content: 'Day 120! Four months strong. Very proud, grandson.', time: '8:30 PM', date: formatRelativeDate(subDays(now, 5)) },
  
  // Day 4 ago
  { id: '18', sender: 'Michael Johnson', senderId: '2', content: '💰 **Financial Request** from Michael Johnson\n\n**Amount:** $25.00\n**Reason:** Prescription pickup - anxiety medication\n\nPlease vote on this request!', time: '2:00 PM', date: formatRelativeDate(subDays(now, 4)) },
  { id: '19', sender: 'Sarah Johnson', senderId: '1', content: 'Approved. Medical expenses are essential. I\'ll cover this one entirely.', time: '2:15 PM', date: formatRelativeDate(subDays(now, 4)) },
  { id: '20', sender: 'Michael Johnson', senderId: '2', content: 'Thanks mom. I uploaded the pharmacy receipt.', time: '2:20 PM', date: formatRelativeDate(subDays(now, 4)) },
  
  // Day 3 ago
  { id: '21', sender: 'David Johnson', senderId: '3', content: 'Hey Michael, want to grab coffee this weekend? Like we used to before everything.', time: '9:00 AM', date: formatRelativeDate(subDays(now, 3)) },
  { id: '22', sender: 'Michael Johnson', senderId: '2', content: 'I\'d love that, bro. It\'s been amazing rebuilding our relationship over these past 4 months.', time: '9:15 AM', date: formatRelativeDate(subDays(now, 3)) },
  { id: '23', sender: 'Michael Johnson', senderId: '2', content: '🙏 **Checked into Recovery Meeting**\n\nI\'m attending: AA - Morning Serenity Group\n📍 St. Mark\'s Church, 123 Main St\n⏰ Checkout expected at 9:00 AM', time: '7:45 AM', date: formatRelativeDate(subDays(now, 3)) },
  
  // Day 2 ago
  { id: '24', sender: 'Michael Johnson', senderId: '2', content: 'Day 123! 🎉 Still going strong. The foundation from treatment and sober living really helped.', time: '8:00 AM', date: formatRelativeDate(subDays(now, 2)) },
  { id: '25', sender: 'Matt Brown', senderId: '0', content: 'Michael, your consistency since completing sober living has been exceptional. You\'re building real, sustainable recovery.', time: '8:30 AM', date: formatRelativeDate(subDays(now, 2)) },
  { id: '26', sender: 'Michael Johnson', senderId: '2', content: '🙏 **Checked into Therapy**\n\nI\'m attending: Group Therapy Session\n📍 Recovery Center, Room 3\n⏰ Checkout expected at 3:00 PM', time: '1:45 PM', date: formatRelativeDate(subDays(now, 2)) },
  
  // Yesterday
  { id: '27', sender: 'Michael Johnson', senderId: '2', content: '💰 **Financial Request** from Michael Johnson\n\n**Amount:** $147.23\n**Reason:** Electric bill - City Power & Light (Account #4521-7890-3336)\n\nPlease vote on this request and pledge to help if you can!', time: '2:30 PM', date: 'Yesterday' },
  { id: '28', sender: 'Sarah Johnson', senderId: '1', content: 'Approved. I\'ll pledge $75.', time: '2:45 PM', date: 'Yesterday' },
  { id: '29', sender: 'Robert Johnson', senderId: '5', content: 'I\'ll cover the remaining $72.23.', time: '3:00 PM', date: 'Yesterday' },
  { id: '30', sender: 'Emily Johnson', senderId: '4', content: '124 days! Over 4 months! You\'re doing amazing! 💪', time: '6:00 PM', date: 'Yesterday' },
  
  // Today
  { id: '31', sender: 'Michael Johnson', senderId: '2', content: 'Good morning everyone! Day 125 today. Going to my morning meeting.', time: '7:00 AM', date: 'Today' },
  { id: '32', sender: 'Michael Johnson', senderId: '2', content: '🙏 **Checked into Recovery Meeting**\n\nI\'m attending: AA - Morning Serenity Group\n📍 St. Mark\'s Church, 123 Main St\n⏰ Checkout expected at 9:00 AM', time: '7:45 AM', date: 'Today' },
  { id: '33', sender: 'Sarah Johnson', senderId: '1', content: 'Have a great meeting, sweetie! 125 days! ❤️', time: '7:50 AM', date: 'Today' },
  { id: '34', sender: 'David Johnson', senderId: '3', content: 'Proud of you bro! 4 months and counting!', time: '8:00 AM', date: 'Today' },
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
  startDate: subDays(now, 125),
  daysCount: 125,
  isActive: true,
  resetCount: 0,
  milestones: [
    { days: 1, achieved: true, celebratedByFamily: true },
    { days: 7, achieved: true, celebratedByFamily: true },
    { days: 14, achieved: true, celebratedByFamily: true },
    { days: 30, achieved: true, celebratedByFamily: true },
    { days: 60, achieved: true, celebratedByFamily: true },
    { days: 90, achieved: true, celebratedByFamily: true },
  ],
  nextMilestone: 180
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

// FIIS Analysis for Johnson Family - Positive Recovery at 125 Days (post treatment + sober living)
export const JOHNSON_FIIS_ANALYSIS = {
  what_seeing: "I'm observing a family system that has successfully navigated the critical early recovery period and is now thriving at Day 125. Michael completed a 30-day inpatient treatment program followed by 90 days of sober living, and has now been maintaining his recovery independently for 5 days. The family has maintained unified support throughout this entire journey. The presence of a professional moderator (Matt Brown) has been instrumental in guiding the family through treatment, sober living transitions, and now the aftercare phase. The family's chosen values of Honesty & Transparency and Accountability Without Shame are deeply embedded in their interactions.",
  pattern_signals: [
    {
      signal_type: 'progress',
      description: 'Michael has maintained 125 consecutive days of sobriety through treatment, sober living, and now independent living. His meeting attendance remains consistent (averaging 4-5 meetings per week). Therapy sessions continue regularly. This stability at the 4-month mark indicates strong foundation for long-term recovery.',
      confidence: 'very_high',
      one_year_impact: 'supports_goal' as const
    },
    {
      signal_type: 'family_unity',
      description: 'All family members have acknowledged and are honoring the established boundaries throughout the entire treatment journey. Financial requests align with agreed-upon guidelines (essential bills only). No evidence of secret communications or boundary violations.',
      confidence: 'very_high',
      one_year_impact: 'supports_goal' as const
    },
    {
      signal_type: 'healthy_communication',
      description: 'Chat messages show supportive, encouraging language without enabling. Family celebrates milestones (30 days, 60 days, 90 days, 120 days) while maintaining realistic expectations. Communication has matured over 4 months.',
      confidence: 'very_high',
      one_year_impact: 'supports_goal' as const
    },
    {
      signal_type: 'accountability_working',
      description: 'Michael has transitioned from structured sober living to independent living while maintaining all accountability practices. Financial requests include proper documentation. The aftercare plan is being followed diligently.',
      confidence: 'very_high',
      one_year_impact: 'supports_goal' as const
    },
    {
      signal_type: 'attention_needed',
      description: 'Family has not logged a support group meeting (Al-Anon, etc.) this week. The family commitment was that ALL members would attend weekly meetings alongside Michael. This is worth addressing.',
      confidence: 'moderate',
      one_year_impact: 'neutral' as const
    },
  ],
  contextual_framing: "Day 125 represents a major achievement. Michael has successfully completed the structured phases of recovery (treatment + sober living) and is now in the aftercare phase. Research shows that individuals who complete this full continuum of care have significantly better outcomes. The Johnson family is a model example of how to support recovery: unified approach, professional support, clear boundaries, and values-driven decisions throughout the journey.",
  // One-Year Goal Tracking
  one_year_goal: {
    current_days: 125,
    days_remaining: 240,
    progress_percentage: 34,
    current_phase: 'Building Resilience',
    likelihood_assessment: 'very_likely',
    likelihood_reasoning: 'Strong compliance, family unity, and professional support indicate high probability of achieving the one-year milestone.'
  },
  predictive_indicators: [
    {
      indicator_type: 'positive' as const,
      indicator: 'Completed full continuum of care (treatment + sober living)',
      impact_level: 'significant' as const,
      recommendation: 'Continue following aftercare plan recommendations'
    },
    {
      indicator_type: 'positive' as const,
      indicator: 'Professional moderator actively engaged',
      impact_level: 'significant' as const,
      recommendation: 'Maintain regular check-ins with care team'
    },
    {
      indicator_type: 'positive' as const,
      indicator: 'Meeting attendance 4-5x weekly for 125 days',
      impact_level: 'significant' as const,
      recommendation: 'Continue current meeting schedule'
    },
    {
      indicator_type: 'neutral' as const,
      indicator: 'Family support group attendance declined this week',
      impact_level: 'minor' as const,
      recommendation: 'Schedule family Al-Anon meeting together'
    }
  ],
  risk_trajectory: {
    direction: 'improving' as const,
    trend_description: 'Consistent improvement over 4 months with successful care phase transitions',
    contributing_factors: ['Strong family support', 'Professional guidance', 'Regular therapy', 'Meeting attendance'],
    projected_outcome: 'High likelihood of sustained recovery and successful one-year milestone achievement'
  },
  compliance_trends: {
    overall_compliance: 'excellent' as const,
    meeting_attendance: 'consistent' as const,
    check_in_reliability: 'reliable' as const,
    boundary_adherence: 'strong' as const,
    financial_transparency: 'transparent' as const,
    trend_direction: 'stable' as const,
    compliance_notes: 'Michael has maintained exemplary compliance throughout treatment, sober living, and independent living phases.'
  },
  transition_readiness: {
    readiness_level: 'ready' as const,
    current_phase_mastery: 95,
    strengths_demonstrated: ['Consistent meeting attendance', 'Financial transparency', 'Open communication', 'Therapy engagement'],
    areas_needing_development: ['Family support group participation'],
    recommended_focus: ['Maintain current routines', 'Plan for 6-month celebration'],
    estimated_readiness_timeline: 'Currently in independent living - transitioned successfully'
  },
  // Provider Clinical Alerts (for moderators/admins)
  provider_clinical_alerts: [
    {
      alert_category: 'boundary_consistency' as const,
      metric_description: 'Family boundary adherence maintained at 100%',
      trend_direction: 'stable' as const,
      percentage_change: 0,
      time_period: '30 days',
      clinical_implication: 'Strong family unity indicates healthy recovery environment',
      suggested_intervention: 'Continue current approach; acknowledge family effort',
      urgency: 'routine_review' as const
    },
    {
      alert_category: 'engagement_pattern' as const,
      metric_description: 'Family support group attendance dropped from weekly to none',
      trend_direction: 'declining' as const,
      percentage_change: -100,
      time_period: '7 days',
      clinical_implication: 'Family may be becoming complacent after successful transition',
      suggested_intervention: 'Remind family of importance of their own recovery work',
      urgency: 'attention_needed' as const
    },
    {
      alert_category: 'accountability_trend' as const,
      metric_description: 'Check-in reliability at 98% over past month',
      trend_direction: 'stable' as const,
      percentage_change: 2,
      time_period: '30 days',
      clinical_implication: 'Strong accountability practices well-established',
      suggested_intervention: 'Begin discussing graduated independence at 6-month mark',
      urgency: 'routine_review' as const
    }
  ],
  recommendations: [
    {
      title: "Celebrate This Major Transition",
      description: "Michael has successfully completed sober living and transitioned to independent living. This is a huge accomplishment. Consider planning a meaningful family celebration for the 6-month milestone coming up.",
      related_to: "Values: Accountability and Repair Without Shame"
    },
    {
      title: "Family Meeting Check-In This Week",
      description: "Your family goal states that supporters will attend weekly Al-Anon or similar meetings. This hasn't happened this week. Consider scheduling a group Al-Anon meeting together.",
      related_to: "Goal: Attend Support Groups"
    },
    {
      title: "Plan for 6-Month Milestone",
      description: "The 180-day milestone is approaching. Begin discussing as a family how you'll celebrate this significant achievement in healthy ways.",
      related_to: "Boundary: 3 meetings per week"
    }
  ],
  clarifying_questions: [
    "How is Michael adjusting to independent living after the structure of sober living?",
    "Are family members noticing any changes in Michael's routine or mood since the transition?",
    "Has the family discussed the aftercare plan and everyone's role in supporting it?"
  ],
  what_to_watch: [
    "Family support group attendance - this week's missed meeting shouldn't become a pattern",
    "Any signs of complacency now that the 'structured' phase is complete",
    "Michael's stress levels as he adjusts to fully independent living"
  ],
  strengths: [
    { area: 'Completed Continuum of Care', detail: 'Treatment + sober living + aftercare' },
    { area: 'Professional Moderation', detail: 'Matt Brown provides objective oversight' },
    { area: 'Unified Family Response', detail: 'All family members aligned on boundaries for 4+ months' },
    { area: 'Transparent Finances', detail: 'Requests include documentation' },
    { area: 'Consistent Recovery Work', detail: 'Michael averaging 4-5 meetings per week for 125 days' }
  ]
};

// Johnson family FIIS observations for Recovery Trajectory Panel
export const JOHNSON_FIIS_OBSERVATIONS = [
  {
    id: 'obs-j1',
    user_id: '2',
    observation_type: 'calm_period',
    content: 'Family dinner went smoothly. Michael shared about his progress in therapy. Everyone was supportive.',
    occurred_at: format(subDays(now, 8), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    created_at: format(subDays(now, 8), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Sarah Johnson'
  },
  {
    id: 'obs-j2',
    user_id: '2',
    observation_type: 'boundary',
    content: 'Michael respected the boundary about checking in before going to new locations. No issues.',
    occurred_at: format(subDays(now, 6), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    created_at: format(subDays(now, 6), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'David Johnson'
  },
  {
    id: 'obs-j3',
    user_id: '2',
    observation_type: 'decision',
    content: 'Michael made a healthy decision to skip a party where there would be drinking. Called his sponsor instead.',
    occurred_at: format(subDays(now, 4), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    created_at: format(subDays(now, 4), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Emily Johnson'
  },
  {
    id: 'obs-j4',
    user_id: '2',
    observation_type: 'calm_period',
    content: 'Great week overall. Michael has been consistent with meetings and therapy.',
    occurred_at: format(subDays(now, 2), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    created_at: format(subDays(now, 2), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Matt Brown'
  },
];

// Johnson family auto events for Recovery Trajectory Panel
export const JOHNSON_FIIS_AUTO_EVENTS = [
  {
    id: 'event-j1',
    user_id: '2',
    event_type: 'meeting_checkin',
    event_data: { meeting_type: 'AA', meeting_name: 'Morning Serenity Group' },
    occurred_at: format(subDays(now, 9), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Michael Johnson'
  },
  {
    id: 'event-j2',
    user_id: '2',
    event_type: 'meeting_checkout',
    event_data: { meeting_type: 'AA', meeting_name: 'Morning Serenity Group', duration_minutes: 75 },
    occurred_at: format(subDays(now, 9), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Michael Johnson'
  },
  {
    id: 'event-j3',
    user_id: '2',
    event_type: 'meeting_checkin',
    event_data: { meeting_type: 'Therapy', meeting_name: 'Individual Session' },
    occurred_at: format(subDays(now, 6), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Michael Johnson'
  },
  {
    id: 'event-j4',
    user_id: '2',
    event_type: 'meeting_checkout',
    event_data: { meeting_type: 'Therapy', meeting_name: 'Individual Session', duration_minutes: 58 },
    occurred_at: format(subDays(now, 6), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Michael Johnson'
  },
  {
    id: 'event-j5',
    user_id: '2',
    event_type: 'meeting_checkin',
    event_data: { meeting_type: 'AA', meeting_name: 'Evening Serenity Group' },
    occurred_at: format(subDays(now, 5), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Michael Johnson'
  },
  {
    id: 'event-j6',
    user_id: '2',
    event_type: 'meeting_checkout',
    event_data: { meeting_type: 'AA', meeting_name: 'Evening Serenity Group', duration_minutes: 80 },
    occurred_at: format(subDays(now, 5), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Michael Johnson'
  },
  {
    id: 'event-j7',
    user_id: '2',
    event_type: 'financial_approved',
    event_data: { amount: 147.23, reason: 'Electric bill' },
    occurred_at: format(subDays(now, 1), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Michael Johnson'
  },
  {
    id: 'event-j8',
    user_id: '2',
    event_type: 'meeting_checkin',
    event_data: { meeting_type: 'AA', meeting_name: 'Morning Serenity Group' },
    occurred_at: format(subHours(now, 2), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Michael Johnson'
  },
];


// ============================================================================
// DAVIS FAMILY - Active Addiction Crisis (3 days since last meeting)
// ============================================================================

export const DAVIS_MEMBERS = [
  { id: '1', name: 'Richard Davis', role: 'admin', relationship: 'Dad', initials: 'RD' },
  { id: '2', name: 'Karen Davis', role: 'member', relationship: 'Mom', initials: 'KD' },
  { 
    id: '3', 
    name: 'Ashley Davis', 
    role: 'recovering', 
    relationship: 'Person in Recovery', 
    initials: 'AD',
    paymentInfo: {
      paypal: 'ashley.davis@email.com',
      venmo: '@AshleyD-22',
      cashapp: '$AshleyDavis22'
    }
  },
  { id: '4', name: 'Brandon Davis', role: 'member', relationship: 'Brother', initials: 'BD' },
  { id: '5', name: 'Grandma Rose', role: 'member', relationship: 'Grandmother', initials: 'GR' },
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
      confidence: 'very_high',
      one_year_impact: 'threatens_goal' as const
    },
    {
      signal_type: 'escalation',
      description: 'Financial requests increasing in frequency (6 in past month) with increasingly creative justifications. Each denial leads to emotional manipulation attempts.',
      confidence: 'high',
      one_year_impact: 'threatens_goal' as const
    },
    {
      signal_type: 'enabling',
      description: 'Richard (Dad) has voted to approve 100% of requests despite family consensus to deny. Evidence of $400 given outside the app. Pattern indicates codependency.',
      confidence: 'very_high',
      one_year_impact: 'threatens_goal' as const
    },
    {
      signal_type: 'manipulation',
      description: 'Ashley uses guilt ("I haven\'t eaten"), victimhood ("everyone is against me"), and triangulation (going to Dad privately) to circumvent boundaries.',
      confidence: 'high',
      one_year_impact: 'threatens_goal' as const
    },
    {
      signal_type: 'regression',
      description: 'No legitimate meeting attendance in 3 weeks. Therapy sessions missed. The only "check-in" was at a bar. Recovery trajectory is severely negative.',
      confidence: 'very_high',
      one_year_impact: 'threatens_goal' as const
    },
  ],
  contextual_framing: "This family is at a critical juncture. The enabling pattern from Richard is preventing the natural consequences that often motivate change. The recent liquor license warning is a serious red flag that should not be ignored. Without unified family action, Ashley has no incentive to engage in recovery.",
  // One-Year Goal Tracking
  one_year_goal: {
    current_days: 3,
    days_remaining: 362,
    progress_percentage: 1,
    current_phase: 'Pre-Recovery Crisis',
    likelihood_assessment: 'at_risk',
    likelihood_reasoning: 'Multiple critical indicators suggest active use. Without intervention, one-year goal is not achievable on current trajectory.'
  },
  predictive_indicators: [
    {
      indicator_type: 'negative' as const,
      indicator: 'Fake meeting check-in at bar location',
      impact_level: 'significant' as const,
      recommendation: 'Address liquor license violation immediately with family'
    },
    {
      indicator_type: 'negative' as const,
      indicator: 'Family member (Richard) actively enabling outside app',
      impact_level: 'significant' as const,
      recommendation: 'Richard must attend Al-Anon and commit to unified approach'
    },
    {
      indicator_type: 'negative' as const,
      indicator: 'No legitimate meeting attendance in 3 weeks',
      impact_level: 'significant' as const,
      recommendation: 'Higher level of care likely needed'
    },
    {
      indicator_type: 'negative' as const,
      indicator: 'Escalating manipulation patterns',
      impact_level: 'moderate' as const,
      recommendation: 'Consider professional intervention'
    }
  ],
  risk_trajectory: {
    direction: 'declining' as const,
    trend_description: 'Rapid decline over past 3 weeks with evidence of active use',
    contributing_factors: ['Enabling parent', 'Fake check-ins', 'Boundary violations', 'No professional support'],
    projected_outcome: 'Without intervention, likely escalation to health or legal crisis'
  },
  compliance_trends: {
    overall_compliance: 'critical' as const,
    meeting_attendance: 'absent' as const,
    check_in_reliability: 'unreliable' as const,
    boundary_adherence: 'none' as const,
    financial_transparency: 'opaque' as const,
    trend_direction: 'declining' as const,
    compliance_notes: 'Ashley has not demonstrated genuine recovery engagement in 3 weeks. Check-ins are falsified.'
  },
  transition_readiness: {
    readiness_level: 'not_ready' as const,
    current_phase_mastery: 5,
    strengths_demonstrated: [],
    areas_needing_development: ['Honest engagement', 'Meeting attendance', 'Financial transparency', 'Accepting accountability'],
    recommended_focus: ['Professional intervention', 'Higher level of care evaluation', 'Family unification'],
    estimated_readiness_timeline: 'Not applicable until genuine recovery engagement begins',
    transition_risks: ['Active use', 'Enabling system', 'No professional support']
  },
  // Provider Clinical Alerts
  provider_clinical_alerts: [
    {
      alert_category: 'boundary_consistency' as const,
      metric_description: 'Boundary adherence dropped to 25% (1 of 4 family members compliant)',
      trend_direction: 'declining' as const,
      percentage_change: -75,
      time_period: '30 days',
      clinical_implication: 'Fractured family system is enabling continued use',
      suggested_intervention: 'Family intervention to address enabling; may need professional interventionist',
      urgency: 'priority_action' as const
    },
    {
      alert_category: 'help_seeking_latency' as const,
      metric_description: 'No genuine help-seeking behavior observed in 21 days',
      trend_direction: 'declining' as const,
      percentage_change: -100,
      time_period: '21 days',
      clinical_implication: 'Individual is not in recovery mode; likely in active use',
      suggested_intervention: 'Evaluate for higher level of care; potential crisis intervention needed',
      urgency: 'priority_action' as const
    },
    {
      alert_category: 'intervention_pressure' as const,
      metric_description: 'Family conflict increasing as enabling continues',
      trend_direction: 'declining' as const,
      percentage_change: 40,
      time_period: '14 days',
      clinical_implication: 'Family system is fracturing; Richard vs rest of family',
      suggested_intervention: 'Unified family meeting with professional facilitator',
      urgency: 'priority_action' as const
    },
    {
      alert_category: 'accountability_trend' as const,
      metric_description: 'Check-in reliability at 0% (fake check-ins detected)',
      trend_direction: 'declining' as const,
      percentage_change: -100,
      time_period: '21 days',
      clinical_implication: 'Complete lack of accountability; active deception',
      suggested_intervention: 'Address fake check-in directly; consider supervised living',
      urgency: 'priority_action' as const
    }
  ],
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
      title: "Connect with a Professional Interventionist",
      description: "Based on the patterns observed—inconsistent meeting attendance, fake check-ins, active use at a bar, and a fractured family response—Ashley's current level of care is not meeting her needs. A professional interventionist can help unite the family (especially addressing Richard's enabling) and facilitate Ashley's transition to a higher level of care such as inpatient treatment or a structured sober living environment. The current approach of outpatient meetings is insufficient given the severity of the situation.",
      related_to: "Higher Level of Care Needed"
    },
    {
      title: "Establish Unified Consequences",
      description: "The family must agree on clear consequences if Ashley continues to fake check-ins or if Richard continues enabling outside the app. Without unified action, recovery cannot progress.",
      related_to: "Family Unity"
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

// Davis family FIIS observations for Recovery Trajectory Panel
export const DAVIS_FIIS_OBSERVATIONS = [
  {
    id: 'obs-d1',
    user_id: '3',
    observation_type: 'concern',
    content: 'Ashley missed therapy again. Third time this month. Making excuses about phone chargers.',
    occurred_at: format(subDays(now, 10), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    created_at: format(subDays(now, 10), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Karen Davis'
  },
  {
    id: 'obs-d2',
    user_id: '3',
    observation_type: 'boundary_failure',
    content: 'Richard gave Ashley $400 outside the app despite family agreement.',
    occurred_at: format(subDays(now, 7), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    created_at: format(subDays(now, 7), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Brandon Davis'
  },
  {
    id: 'obs-d3',
    user_id: '3',
    observation_type: 'concern',
    content: 'Ashley checked into what she claimed was an NA meeting but location was The Oak Tavern.',
    occurred_at: format(subDays(now, 5), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    created_at: format(subDays(now, 5), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Brandon Davis'
  },
  {
    id: 'obs-d4',
    user_id: '3',
    observation_type: 'consequence',
    content: 'Family confronted Ashley about bar check-in. She became defensive and blamed everyone.',
    occurred_at: format(subDays(now, 4), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    created_at: format(subDays(now, 4), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Grandma Rose'
  },
];

// Davis family auto events for Recovery Trajectory Panel
export const DAVIS_FIIS_AUTO_EVENTS = [
  {
    id: 'event-d1',
    user_id: '3',
    event_type: 'financial_rejected',
    event_data: { amount: 300, reason: 'Pay back friend' },
    occurred_at: format(subDays(now, 9), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Ashley Davis'
  },
  {
    id: 'event-d2',
    user_id: '3',
    event_type: 'meeting_checkin',
    event_data: { meeting_type: 'NA', meeting_name: 'Evening Hope Group' },
    occurred_at: format(subDays(now, 5), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Ashley Davis'
  },
  {
    id: 'event-d3',
    user_id: '3',
    event_type: 'overdue_checkout',
    event_data: { meeting_type: 'NA', meeting_name: 'Evening Hope Group', location: 'The Oak Tavern' },
    occurred_at: format(subDays(now, 5), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Ashley Davis'
  },
  {
    id: 'event-d4',
    user_id: '3',
    event_type: 'financial_rejected',
    event_data: { amount: 85, reason: 'Gas for friend car' },
    occurred_at: format(subDays(now, 7), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Ashley Davis'
  },
  {
    id: 'event-d5',
    user_id: '3',
    event_type: 'boundary_violation',
    event_data: { description: 'Father gave money outside app' },
    occurred_at: format(subDays(now, 7), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Richard Davis'
  },
  {
    id: 'event-d6',
    user_id: '3',
    event_type: 'location_declined',
    event_data: { reason: 'Did not respond to location request' },
    occurred_at: format(subDays(now, 3), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Ashley Davis'
  },
];

// ============================================================================
// AFTERCARE PLANS
// ============================================================================

export const JOHNSON_AFTERCARE_PLAN = {
  id: 'demo-johnson-plan-1',
  targetUser: 'Michael Johnson',
  targetUserId: '2',
  createdBy: 'Matt Brown',
  createdAt: format(subDays(now, 14), 'MMM d, yyyy'),
  isActive: true,
  notes: 'Discharge recommendations from Serenity Springs Treatment Center. Michael completed 28-day inpatient program and is transitioning to outpatient care. Strong foundation established - focus on maintaining structure and building community support.',
  recommendations: [
    {
      id: 'rec-1',
      type: 'sober_living',
      title: 'Sober Living Residence',
      description: 'Transitional housing with 24/7 support and structured environment',
      facilityName: 'New Beginnings Sober Living',
      duration: '90 days',
      frequency: null,
      therapyType: null,
      isCompleted: true,
      completedAt: format(subDays(now, 7), 'MMM d'),
    },
    {
      id: 'rec-2',
      type: 'iop',
      title: 'Intensive Outpatient Program (IOP)',
      description: '3-hour group sessions with individual counseling',
      facilityName: 'Recovery Solutions Center',
      duration: '60 days',
      frequency: '3x per week',
      therapyType: null,
      isCompleted: false,
      completedAt: null,
    },
    {
      id: 'rec-3',
      type: 'meeting_attendance',
      title: 'AA Meeting Attendance',
      description: '12-step recovery meetings with sponsor connection',
      facilityName: null,
      duration: 'Ongoing',
      frequency: 'Daily for 90 days',
      therapyType: null,
      isCompleted: false,
      completedAt: null,
    },
    {
      id: 'rec-4',
      type: 'individual_therapy',
      title: 'Individual Therapy - Michael',
      description: 'Weekly sessions to address underlying trauma and develop coping strategies',
      facilityName: 'Dr. Sarah Thompson, LCSW',
      duration: '6 months',
      frequency: 'Weekly',
      therapyType: 'CBT (Cognitive Behavioral Therapy)',
      isCompleted: false,
      completedAt: null,
    },
    {
      id: 'rec-5',
      type: 'family_therapy',
      title: 'Family Therapy Sessions',
      description: 'Whole family sessions to rebuild trust and improve communication',
      facilityName: 'Family Healing Center',
      duration: '3 months',
      frequency: 'Bi-weekly',
      therapyType: 'Structural Family Therapy',
      isCompleted: false,
      completedAt: null,
    },
    {
      id: 'rec-6',
      type: 'medication_compliance',
      title: 'Medication Management',
      description: 'Continue prescribed anxiety medication with regular psychiatric check-ins',
      facilityName: 'Dr. Michael Chen, MD',
      duration: 'Ongoing',
      frequency: 'Monthly check-ins',
      therapyType: null,
      isCompleted: false,
      completedAt: null,
    },
  ]
};

// Davis family has no aftercare plan (showing empty state)
export const DAVIS_AFTERCARE_PLAN = null;

// ============================================================================
// CARE PHASES - Tracking treatment progression
// ============================================================================

export const JOHNSON_CARE_PHASES = [
  {
    id: 'phase-1',
    phase_type: 'detox',
    facility_name: 'Serenity Springs Detox Center',
    started_at: format(subDays(now, 130), 'yyyy-MM-dd'),
    ended_at: format(subDays(now, 125), 'yyyy-MM-dd'),
    is_current: false,
    notes: 'Medical detox completed successfully. No complications.',
    days_in_phase: 5
  },
  {
    id: 'phase-2',
    phase_type: 'treatment',
    facility_name: 'Serenity Springs Treatment Center',
    started_at: format(subDays(now, 125), 'yyyy-MM-dd'),
    ended_at: format(subDays(now, 97), 'yyyy-MM-dd'),
    is_current: false,
    notes: 'Completed 28-day inpatient program. Engaged well in group therapy and individual sessions.',
    days_in_phase: 28
  },
  {
    id: 'phase-3',
    phase_type: 'sober_living',
    facility_name: 'New Beginnings Sober Living',
    started_at: format(subDays(now, 97), 'yyyy-MM-dd'),
    ended_at: format(subDays(now, 7), 'yyyy-MM-dd'),
    is_current: false,
    notes: 'Excellent progress in structured environment. Built strong foundation for independent living.',
    days_in_phase: 90
  },
  {
    id: 'phase-4',
    phase_type: 'independent',
    facility_name: null,
    started_at: format(subDays(now, 7), 'yyyy-MM-dd'),
    ended_at: null,
    is_current: true,
    notes: 'Transitioned to independent living. Following aftercare plan with continued meeting attendance and therapy.',
    days_in_phase: 7
  }
];

// Davis family has no care phases - not in structured treatment
export const DAVIS_CARE_PHASES: typeof JOHNSON_CARE_PHASES = [];

// ============================================================================
// MITCHELL FAMILY - Currently in Treatment (26 days sober, 20 days into 45-day stay)
// Intervention by Freedom Interventions, handoff to Recovery Partners
// ============================================================================

export const MITCHELL_MEMBERS = [
  { id: '0', name: 'Matt Sullivan', role: 'moderator', relationship: 'Interventionist', initials: 'MS', providerRole: 'interventionist' },
  { id: '1', name: 'Patricia Mitchell', role: 'admin', relationship: 'Parent (Mom)', initials: 'PM' },
  { id: '2', name: 'Robert Mitchell', role: 'member', relationship: 'Parent (Dad)', initials: 'RM' },
  { 
    id: '3', 
    name: 'Tyler Mitchell', 
    role: 'recovering', 
    relationship: 'Person in Recovery', 
    initials: 'TM',
    age: 27,
    paymentInfo: {
      paypal: 'tyler.mitchell@email.com',
      venmo: '@TylerM-Recovery',
      cashapp: '$TylerMitchell27'
    }
  },
  { id: '4', name: 'Jessica Mitchell', role: 'member', relationship: 'Older Sister', initials: 'JM' },
  { id: '5', name: 'Kevin Mitchell', role: 'member', relationship: 'Older Brother', initials: 'KM' },
  { id: '6', name: 'Dr. Amanda Chen', role: 'provider', relationship: 'Therapist', initials: 'AC', providerRole: 'therapist' },
];

// Timeline: 
// Day 30 ago - Intervention
// Day 26 ago - Tyler agrees to treatment (4 days after intervention)
// Day 26 ago - Started detox at Recovery Partners
// Day 20 ago - Completed detox, started residential treatment (6 days detox)
// Currently - Day 20 of 45-day residential treatment

export const MITCHELL_MESSAGES = [
  // Day 30 ago - Intervention Day
  { id: '1', sender: 'Matt Sullivan', senderId: '0', content: '📢 **Welcome to FamilyBridge**\n\nPatricia and Robert, thank you for reaching out to Freedom Interventions. This platform will help us coordinate as a unified family. I\'ve added everyone to the group. Remember - Tyler will only see messages after he joins, and blocked on other channels, this becomes his only way to communicate with the family.', time: '9:00 AM', date: formatRelativeDate(subDays(now, 30)) },
  { id: '2', sender: 'Patricia Mitchell', senderId: '1', content: 'Thank you Matt. This is the hardest thing we\'ve ever had to do. I blocked Tyler on my phone, Facebook, and email like you asked. It felt horrible.', time: '9:15 AM', date: formatRelativeDate(subDays(now, 30)) },
  { id: '3', sender: 'Robert Mitchell', senderId: '2', content: 'I did the same. Changed the garage code too since he has a key. Matt, are we really doing the right thing?', time: '9:20 AM', date: formatRelativeDate(subDays(now, 30)) },
  { id: '4', sender: 'Matt Sullivan', senderId: '0', content: 'This is exactly right. By consolidating all communication here, Tyler will understand the family is unified. He can\'t go around to different people to get different answers. This IS love - the hardest kind.', time: '9:25 AM', date: formatRelativeDate(subDays(now, 30)) },
  { id: '5', sender: 'Jessica Mitchell', senderId: '4', content: 'I blocked him too. He\'s going to be so angry. He already texted me 5 times this morning.', time: '10:00 AM', date: formatRelativeDate(subDays(now, 30)) },
  { id: '6', sender: 'Kevin Mitchell', senderId: '5', content: 'Same here. He called me looking for money. I didn\'t answer. I feel sick about this but I know it\'s necessary.', time: '10:30 AM', date: formatRelativeDate(subDays(now, 30)) },
  { id: '7', sender: 'Matt Sullivan', senderId: '0', content: 'The intervention is set for 2PM today. Everyone please be at Robert and Patricia\'s house by 1:30PM. We\'ll go over the final script together.', time: '11:00 AM', date: formatRelativeDate(subDays(now, 30)) },
  { id: '8', sender: 'Patricia Mitchell', senderId: '1', content: 'We told Tyler we\'re having a family lunch. He said he\'d come.', time: '11:15 AM', date: formatRelativeDate(subDays(now, 30)) },
  { id: '9', sender: 'Matt Sullivan', senderId: '0', content: '📢 **Intervention Update**\n\nThe intervention was conducted. Tyler is very angry but is staying at the house tonight. He has not agreed to treatment yet. Keep communication through this app only. If he reaches out on blocked channels, do not respond.', time: '5:00 PM', date: formatRelativeDate(subDays(now, 30)) },
  { id: '10', sender: 'Jessica Mitchell', senderId: '4', content: 'He\'s been trying to call me from the house phone. It\'s so hard not to answer.', time: '6:30 PM', date: formatRelativeDate(subDays(now, 30)) },
  { id: '11', sender: 'Matt Sullivan', senderId: '0', content: 'Don\'t answer. He needs to understand that THIS app is the only channel for family communication now. If you give him an alternative, he\'ll exploit it.', time: '6:35 PM', date: formatRelativeDate(subDays(now, 30)) },

  // Day 29 ago - Day 1 after intervention
  { id: '12', sender: 'Tyler Mitchell', senderId: '3', content: 'I can\'t believe you\'re all doing this to me. I don\'t have a problem. Why won\'t anyone answer my calls?!', time: '8:00 AM', date: formatRelativeDate(subDays(now, 29)) },
  { id: '13', sender: 'Matt Sullivan', senderId: '0', content: 'Tyler, welcome to the app. The family is here because they love you. We\'re all ready to listen.', time: '8:05 AM', date: formatRelativeDate(subDays(now, 29)) },
  { id: '14', sender: 'Tyler Mitchell', senderId: '3', content: 'This is insane. You\'ve all blocked me everywhere. This is the only way I can even talk to my own family!', time: '8:10 AM', date: formatRelativeDate(subDays(now, 29)) },
  { id: '15', sender: 'Patricia Mitchell', senderId: '1', content: 'Tyler, we love you. But we can\'t watch you kill yourself anymore. This app keeps us all on the same page.', time: '8:30 AM', date: formatRelativeDate(subDays(now, 29)) },
  { id: '16', sender: 'Robert Mitchell', senderId: '2', content: 'Son, we\'re unified on this. The treatment bed at Recovery Partners is still available.', time: '8:45 AM', date: formatRelativeDate(subDays(now, 29)) },
  { id: '17', sender: 'Tyler Mitchell', senderId: '3', content: 'I don\'t need treatment! I just need you all to stop ganging up on me!', time: '9:00 AM', date: formatRelativeDate(subDays(now, 29)) },
  { id: '18', sender: 'Kevin Mitchell', senderId: '5', content: 'Tyler, I love you bro. But I can\'t keep lending you money that never comes back. Mom found needles in your old room.', time: '10:00 AM', date: formatRelativeDate(subDays(now, 29)) },
  { id: '19', sender: 'Tyler Mitchell', senderId: '3', content: '💰 **Financial Request** from Tyler Mitchell\n\n**Amount:** $200\n**Reason:** I need to pay rent or I\'ll be homeless\n\nPlease vote on this request!', time: '2:00 PM', date: formatRelativeDate(subDays(now, 29)) },
  { id: '20', sender: 'Matt Sullivan', senderId: '0', content: 'Tyler, the family has agreed that financial support is available - for treatment only. If you go to treatment today, all your expenses will be covered.', time: '2:10 PM', date: formatRelativeDate(subDays(now, 29)) },
  { id: '21', sender: 'Tyler Mitchell', senderId: '3', content: 'So you\'ll let me be homeless? Some family you are.', time: '2:30 PM', date: formatRelativeDate(subDays(now, 29)) },
  { id: '22', sender: 'Jessica Mitchell', senderId: '4', content: 'Tyler, your landlord called Mom. You haven\'t lived there in 3 months. Where is the money really going?', time: '3:00 PM', date: formatRelativeDate(subDays(now, 29)) },

  // Day 28 ago - Day 2 after intervention  
  { id: '23', sender: 'Tyler Mitchell', senderId: '3', content: 'I\'m staying with a friend. I don\'t need your help.', time: '10:00 AM', date: formatRelativeDate(subDays(now, 28)) },
  { id: '24', sender: 'Patricia Mitchell', senderId: '1', content: 'We love you Tyler. The offer for treatment is still open. Matt is here if you want to talk.', time: '10:30 AM', date: formatRelativeDate(subDays(now, 28)) },
  { id: '25', sender: 'Tyler Mitchell', senderId: '3', content: '💰 **Financial Request** from Tyler Mitchell\n\n**Amount:** $50\n**Reason:** Need gas to get to a job interview\n\nPlease vote on this request!', time: '4:00 PM', date: formatRelativeDate(subDays(now, 28)) },
  { id: '26', sender: 'Robert Mitchell', senderId: '2', content: 'I voted to deny. Tyler, we\'re not funding anything except recovery. That\'s the boundary.', time: '4:15 PM', date: formatRelativeDate(subDays(now, 28)) },
  { id: '27', sender: 'Kevin Mitchell', senderId: '5', content: 'Denied. Same reason. We love you but we can\'t enable this anymore.', time: '4:30 PM', date: formatRelativeDate(subDays(now, 28)) },

  // Day 27 ago - Day 3 after intervention
  { id: '28', sender: 'Tyler Mitchell', senderId: '3', content: 'Mom, please. I know you understand. Can you just send me $100? Just between us?', time: '8:00 AM', date: formatRelativeDate(subDays(now, 27)) },
  { id: '29', sender: 'Patricia Mitchell', senderId: '1', content: 'Tyler, there is no "just between us" anymore. Everything is here in the app where everyone can see it. That\'s the new rule. I love you, but no.', time: '8:30 AM', date: formatRelativeDate(subDays(now, 27)) },
  { id: '30', sender: 'Matt Sullivan', senderId: '0', content: 'Tyler, you\'re trying to triangulate - going to different family members hoping for different answers. That\'s why we\'re all here together. The answer is unified: treatment, or nothing.', time: '9:00 AM', date: formatRelativeDate(subDays(now, 27)) },
  { id: '31', sender: 'Tyler Mitchell', senderId: '3', content: 'This is so messed up. You\'re all ganging up on me.', time: '9:30 AM', date: formatRelativeDate(subDays(now, 27)) },
  { id: '32', sender: 'Jessica Mitchell', senderId: '4', content: 'Tyler, remember when you missed my wedding because you were too high? I still forgave you. That\'s how much we love you. Please get help.', time: '11:00 AM', date: formatRelativeDate(subDays(now, 27)) },
  { id: '33', sender: 'Kevin Mitchell', senderId: '5', content: 'And when you sold Dad\'s tools? He didn\'t call the police. We\'re not your enemies. We\'re the only ones who haven\'t given up.', time: '11:30 AM', date: formatRelativeDate(subDays(now, 27)) },

  // Day 26 ago - Day 4 after intervention - TYLER AGREES
  { id: '34', sender: 'Tyler Mitchell', senderId: '3', content: 'I can\'t do this anymore. I\'m sick. I feel terrible. Is the treatment offer still there?', time: '6:00 AM', date: formatRelativeDate(subDays(now, 26)) },
  { id: '35', sender: 'Matt Sullivan', senderId: '0', content: 'Yes Tyler. The bed at Recovery Partners is ready. I\'ll pick you up in an hour. This is the bravest thing you\'ve ever done.', time: '6:05 AM', date: formatRelativeDate(subDays(now, 26)) },
  { id: '36', sender: 'Patricia Mitchell', senderId: '1', content: 'Tyler, I\'m crying reading this. We love you so much. Thank you for choosing life. 🙏', time: '6:15 AM', date: formatRelativeDate(subDays(now, 26)) },
  { id: '37', sender: 'Robert Mitchell', senderId: '2', content: 'Son, I\'m proud of you. This took real courage.', time: '6:20 AM', date: formatRelativeDate(subDays(now, 26)) },
  { id: '38', sender: 'Jessica Mitchell', senderId: '4', content: 'Tyler! ❤️ We\'re all here for you. Every step of the way.', time: '6:30 AM', date: formatRelativeDate(subDays(now, 26)) },
  { id: '39', sender: 'Kevin Mitchell', senderId: '5', content: 'Love you bro. You got this. 💪', time: '6:45 AM', date: formatRelativeDate(subDays(now, 26)) },
  { id: '40', sender: 'Matt Sullivan', senderId: '0', content: '📢 **Treatment Admission Update**\n\nTyler has been admitted to Recovery Partners. He\'s in detox and won\'t have phone access for the first few days. I\'ll coordinate with their clinical team and keep you updated here.\n\nThis is a handoff moment - Recovery Partners will become the primary care provider. I\'ll remain on the case in a consulting role through FamilyBridge.', time: '10:00 AM', date: formatRelativeDate(subDays(now, 26)) },
  { id: '41', sender: 'Dr. Amanda Chen', senderId: '6', content: 'Hello everyone, I\'m Dr. Chen, Tyler\'s primary therapist at Recovery Partners. Matt from Freedom Interventions briefed me on the situation. Tyler is doing well in detox - he\'s uncomfortable but safe. We\'ll start individual therapy sessions once he\'s stabilized.', time: '3:00 PM', date: formatRelativeDate(subDays(now, 26)) },

  // Day 20 ago - Completed Detox
  { id: '42', sender: 'Dr. Amanda Chen', senderId: '6', content: '📢 **Detox Completion Update**\n\nTyler has completed medical detox. He\'s physically stable and ready to begin the residential treatment phase. He\'s been sober for 6 days now. We\'ll start intensive therapy tomorrow.', time: '9:00 AM', date: formatRelativeDate(subDays(now, 20)) },
  { id: '43', sender: 'Tyler Mitchell', senderId: '3', content: 'Hey everyone. They gave me back my phone. I feel... different. Like I can actually think clearly for the first time in years. I\'m sorry for what I said during the intervention.', time: '10:00 AM', date: formatRelativeDate(subDays(now, 20)) },
  { id: '44', sender: 'Patricia Mitchell', senderId: '1', content: 'Tyler! It\'s so good to hear from you. We forgive you. We\'re just happy you\'re safe and getting help. ❤️', time: '10:15 AM', date: formatRelativeDate(subDays(now, 20)) },

  // Day 15 ago - Progress in treatment
  { id: '45', sender: 'Dr. Amanda Chen', senderId: '6', content: 'Quick update: Tyler has been actively participating in group therapy. He\'s starting to open up about some underlying trauma. This is very positive progress.', time: '2:00 PM', date: formatRelativeDate(subDays(now, 15)) },
  { id: '46', sender: 'Tyler Mitchell', senderId: '3', content: 'Had a really hard therapy session today. I never realized how much anger I was carrying from when you and Dad split up, Mom. I took it out on everyone with drugs.', time: '5:00 PM', date: formatRelativeDate(subDays(now, 15)) },
  { id: '47', sender: 'Patricia Mitchell', senderId: '1', content: 'Oh honey. The divorce was hard on all of us. I\'m so sorry you carried that alone. We should have gotten you help back then.', time: '5:30 PM', date: formatRelativeDate(subDays(now, 15)) },
  { id: '48', sender: 'Robert Mitchell', senderId: '2', content: 'I wish I\'d been more present for you kids after that. I was dealing with my own stuff and I failed you.', time: '6:00 PM', date: formatRelativeDate(subDays(now, 15)) },
  { id: '49', sender: 'Tyler Mitchell', senderId: '3', content: 'Dr. Chen says the family is going to heal together. That\'s what this is about.', time: '6:30 PM', date: formatRelativeDate(subDays(now, 15)) },

  // Day 10 ago - Location check-in
  { id: '50', sender: 'Tyler Mitchell', senderId: '3', content: '🙏 **Checked into Recovery Meeting**\n\nI\'m attending: NA - In-House Meeting\n📍 Recovery Partners, Group Room B\n⏰ Checkout expected at 9:00 PM', time: '7:30 PM', date: formatRelativeDate(subDays(now, 10)) },
  { id: '51', sender: 'Kevin Mitchell', senderId: '5', content: 'Keep it up Tyler! You\'re building something real.', time: '7:45 PM', date: formatRelativeDate(subDays(now, 10)) },
  { id: '52', sender: 'Tyler Mitchell', senderId: '3', content: '✅ **Checked out of Meeting**\n\nCompleted: NA - In-House Meeting\nDuration: 1 hour 25 minutes', time: '8:55 PM', date: formatRelativeDate(subDays(now, 10)) },

  // Day 7 ago - Starting to discuss aftercare
  { id: '53', sender: 'Dr. Amanda Chen', senderId: '6', content: 'Family, Tyler is now halfway through his 45-day program. We\'re starting to discuss aftercare planning. I\'d like to schedule a family session next week to discuss options.', time: '11:00 AM', date: formatRelativeDate(subDays(now, 7)) },
  { id: '54', sender: 'Matt Sullivan', senderId: '0', content: 'Excellent timing Dr. Chen. Based on my experience with the Mitchell family, I recommend we look at sober living options. Tyler will need structure after treatment.', time: '11:30 AM', date: formatRelativeDate(subDays(now, 7)) },
  { id: '55', sender: 'Tyler Mitchell', senderId: '3', content: 'I was thinking I could just come home after treatment? I feel so much better now.', time: '12:00 PM', date: formatRelativeDate(subDays(now, 7)) },
  { id: '56', sender: 'Dr. Amanda Chen', senderId: '6', content: 'Tyler, that feeling is wonderful, but research shows that going directly home without a step-down phase has a much higher relapse rate. We should discuss structured options.', time: '12:30 PM', date: formatRelativeDate(subDays(now, 7)) },
  { id: '57', sender: 'Patricia Mitchell', senderId: '1', content: 'I agree with Dr. Chen. Tyler, we love you and want you home eventually, but we need to do this right.', time: '1:00 PM', date: formatRelativeDate(subDays(now, 7)) },

  // Day 5 ago
  { id: '58', sender: 'Tyler Mitchell', senderId: '3', content: '🙏 **Checked into Recovery Meeting**\n\nI\'m attending: AA - Morning Meditation Group\n📍 Recovery Partners, Chapel\n⏰ Checkout expected at 8:30 AM', time: '7:00 AM', date: formatRelativeDate(subDays(now, 5)) },
  { id: '59', sender: 'Tyler Mitchell', senderId: '3', content: '✅ **Checked out of Meeting**\n\nCompleted: AA - Morning Meditation Group\nDuration: 1 hour 28 minutes', time: '8:28 AM', date: formatRelativeDate(subDays(now, 5)) },
  { id: '60', sender: 'Tyler Mitchell', senderId: '3', content: 'Day 21! Three weeks sober. I actually feel things again - like real emotions, not just numbness or chaos.', time: '9:00 AM', date: formatRelativeDate(subDays(now, 5)) },
  { id: '61', sender: 'Jessica Mitchell', senderId: '4', content: 'That\'s amazing Tyler! The old you is coming back. 💕', time: '9:30 AM', date: formatRelativeDate(subDays(now, 5)) },

  // Day 3 ago - More boundary reinforcement  
  { id: '62', sender: 'Tyler Mitchell', senderId: '3', content: 'I\'ve been thinking about after treatment. Can I stay with you Jess? Just for a month until I get on my feet?', time: '2:00 PM', date: formatRelativeDate(subDays(now, 3)) },
  { id: '63', sender: 'Jessica Mitchell', senderId: '4', content: 'Tyler, I love you but we agreed as a family - sober living first. That\'s the boundary. It\'s not about trust, it\'s about giving you the best chance.', time: '2:30 PM', date: formatRelativeDate(subDays(now, 3)) },
  { id: '64', sender: 'Matt Sullivan', senderId: '0', content: 'Jessica handled that perfectly. Tyler, the boundaries we set during the intervention are about love, not punishment. Sober living gives you a safety net.', time: '3:00 PM', date: formatRelativeDate(subDays(now, 3)) },
  { id: '65', sender: 'Dr. Amanda Chen', senderId: '6', content: 'Tyler, we discussed this in session. The urge to "just go home" is normal, but your family is showing real love by holding the boundary.', time: '3:30 PM', date: formatRelativeDate(subDays(now, 3)) },
  { id: '66', sender: 'Tyler Mitchell', senderId: '3', content: 'I know. You\'re all right. I just... miss normal life. But I guess I never had "normal" - I had chaos I was used to.', time: '4:00 PM', date: formatRelativeDate(subDays(now, 3)) },

  // Yesterday
  { id: '67', sender: 'Tyler Mitchell', senderId: '3', content: '🙏 **Checked into Recovery Meeting**\n\nI\'m attending: NA - Evening Group\n📍 Recovery Partners, Main Hall\n⏰ Checkout expected at 8:30 PM', time: '7:00 PM', date: 'Yesterday' },
  { id: '68', sender: 'Tyler Mitchell', senderId: '3', content: '✅ **Checked out of Meeting**\n\nCompleted: NA - Evening Group\nDuration: 1 hour 32 minutes', time: '8:32 PM', date: 'Yesterday' },
  { id: '69', sender: 'Robert Mitchell', senderId: '2', content: 'Consistent check-ins Tyler. I\'m impressed. This is the follow-through I\'ve been waiting to see from you.', time: '8:45 PM', date: 'Yesterday' },
  { id: '70', sender: 'Tyler Mitchell', senderId: '3', content: 'Thanks Dad. I know I have a lot to prove. But I\'m actually doing it this time, not just talking about it.', time: '9:00 PM', date: 'Yesterday' },

  // Today
  { id: '71', sender: 'Tyler Mitchell', senderId: '3', content: 'Good morning everyone! Day 26 sober today. Day 20 in treatment. More than halfway through! 🙏', time: '7:00 AM', date: 'Today' },
  { id: '72', sender: 'Patricia Mitchell', senderId: '1', content: 'So proud of you Tyler! Every day is a gift. ❤️', time: '7:15 AM', date: 'Today' },
  { id: '73', sender: 'Tyler Mitchell', senderId: '3', content: '🙏 **Checked into Recovery Meeting**\n\nI\'m attending: AA - Morning Serenity\n📍 Recovery Partners, Chapel\n⏰ Checkout expected at 9:00 AM', time: '7:30 AM', date: 'Today' },
  { id: '74', sender: 'Dr. Amanda Chen', senderId: '6', content: 'Family session scheduled for this Friday at 2PM to finalize aftercare planning. Tyler is ready to discuss sober living options constructively.', time: '10:00 AM', date: 'Today' },
  { id: '75', sender: 'Matt Sullivan', senderId: '0', content: 'I\'ll join virtually. Great progress everyone. The work you did before Tyler agreed to treatment - the boundaries, the blocking, the unified front - that\'s what made this possible.', time: '10:30 AM', date: 'Today' },
];

export const MITCHELL_FINANCIAL_REQUESTS = [
  { 
    id: '1', 
    requester: 'Tyler Mitchell', 
    amount: 200, 
    reason: 'I need to pay rent or I\'ll be homeless', 
    status: 'denied',
    attachmentUrl: null,
    votes: { approve: 0, deny: 5 },
    pledges: [],
    createdAt: formatDateTime(subDays(now, 29)),
    denialReason: 'Family agreed: financial support only for treatment. Tyler admitted to treatment 4 days later.'
  },
  { 
    id: '2', 
    requester: 'Tyler Mitchell', 
    amount: 50, 
    reason: 'Need gas to get to a job interview', 
    status: 'denied',
    attachmentUrl: null,
    votes: { approve: 0, deny: 5 },
    pledges: [],
    createdAt: formatDateTime(subDays(now, 28)),
    denialReason: 'Boundary enforced - funds only available for recovery path.'
  },
];

export const MITCHELL_CHECKINS = [
  // Today
  { 
    id: '1', 
    user: 'Tyler Mitchell', 
    type: 'AA', 
    name: 'Morning Serenity',
    location: 'Recovery Partners, Chapel',
    checkinTime: '7:30 AM',
    checkoutDue: '9:00 AM',
    status: 'active',
    date: 'Today'
  },
  // Yesterday
  { 
    id: '2', 
    user: 'Tyler Mitchell', 
    type: 'NA', 
    name: 'Evening Group',
    location: 'Recovery Partners, Main Hall',
    checkinTime: '7:00 PM',
    checkoutTime: '8:32 PM',
    status: 'completed',
    date: 'Yesterday'
  },
  // 5 days ago
  { 
    id: '3', 
    user: 'Tyler Mitchell', 
    type: 'AA', 
    name: 'Morning Meditation Group',
    location: 'Recovery Partners, Chapel',
    checkinTime: '7:00 AM',
    checkoutTime: '8:28 AM',
    status: 'completed',
    date: formatRelativeDate(subDays(now, 5))
  },
  // 10 days ago
  { 
    id: '4', 
    user: 'Tyler Mitchell', 
    type: 'NA', 
    name: 'In-House Meeting',
    location: 'Recovery Partners, Group Room B',
    checkinTime: '7:30 PM',
    checkoutTime: '8:55 PM',
    status: 'completed',
    date: formatRelativeDate(subDays(now, 10))
  },
  // 12 days ago
  { 
    id: '5', 
    user: 'Tyler Mitchell', 
    type: 'AA', 
    name: 'Morning Group',
    location: 'Recovery Partners, Chapel',
    checkinTime: '7:00 AM',
    checkoutTime: '8:30 AM',
    status: 'completed',
    date: formatRelativeDate(subDays(now, 12))
  },
  // 14 days ago
  { 
    id: '6', 
    user: 'Tyler Mitchell', 
    type: 'NA', 
    name: 'Evening Reflection',
    location: 'Recovery Partners, Main Hall',
    checkinTime: '7:00 PM',
    checkoutTime: '8:25 PM',
    status: 'completed',
    date: formatRelativeDate(subDays(now, 14))
  },
];

export const MITCHELL_LOCATION_REQUESTS = [
  {
    id: '1',
    requesterId: '1',
    requesterName: 'Patricia Mitchell',
    targetUserId: '3',
    targetUserName: 'Tyler Mitchell',
    status: 'completed',
    requestedAt: formatDateTime(subDays(now, 8)),
    respondedAt: formatDateTime(subDays(now, 8)),
    latitude: 33.4484,
    longitude: -112.0740,
    locationAddress: 'Recovery Partners Treatment Center, 2500 E Camelback Rd, Phoenix, AZ',
    requesterNote: 'Just checking in - making sure you\'re safe at treatment',
    responseNote: 'Here at the center, just finished lunch!'
  },
  {
    id: '2',
    requesterId: '5',
    requesterName: 'Kevin Mitchell',
    targetUserId: '3',
    targetUserName: 'Tyler Mitchell',
    status: 'completed',
    requestedAt: formatDateTime(subDays(now, 4)),
    respondedAt: formatDateTime(subDays(now, 4)),
    latitude: 33.4484,
    longitude: -112.0740,
    locationAddress: 'Recovery Partners Treatment Center, 2500 E Camelback Rd, Phoenix, AZ',
    requesterNote: 'Hey bro - sending some love, wanted to see you\'re still there',
    responseNote: 'Still here! About to go to group therapy'
  },
];

export const MITCHELL_SOBRIETY = {
  userId: '3',
  userName: 'Tyler Mitchell',
  startDate: subDays(now, 26),
  daysCount: 26,
  isActive: true,
  resetCount: 0,
  milestones: [
    { days: 1, achieved: true, celebratedByFamily: true },
    { days: 7, achieved: true, celebratedByFamily: true },
    { days: 14, achieved: true, celebratedByFamily: true },
  ],
  nextMilestone: 30
};

export const MITCHELL_EMOTIONAL_CHECKINS = [
  { date: 'Today', feeling: 'hopeful', user: 'Tyler Mitchell' },
  { date: 'Yesterday', feeling: 'grateful', user: 'Tyler Mitchell' },
  { date: formatRelativeDate(subDays(now, 2)), feeling: 'calm', user: 'Tyler Mitchell' },
  { date: formatRelativeDate(subDays(now, 3)), feeling: 'anxious', user: 'Tyler Mitchell' }, // When asking to stay with Jess
  { date: formatRelativeDate(subDays(now, 4)), feeling: 'hopeful', user: 'Tyler Mitchell' },
  { date: formatRelativeDate(subDays(now, 5)), feeling: 'grateful', user: 'Tyler Mitchell' },
  { date: formatRelativeDate(subDays(now, 6)), feeling: 'calm', user: 'Tyler Mitchell' },
  { date: formatRelativeDate(subDays(now, 7)), feeling: 'motivated', user: 'Tyler Mitchell' },
];

export const MITCHELL_BOUNDARIES = [
  {
    id: '1',
    content: 'Financial support is ONLY available for treatment and recovery-related expenses',
    consequence: 'If Tyler requests money for anything else, we will all vote NO - no exceptions, no private arrangements.',
    createdBy: 'Patricia Mitchell',
    status: 'approved',
    acknowledgments: ['Patricia Mitchell', 'Robert Mitchell', 'Jessica Mitchell', 'Kevin Mitchell', 'Tyler Mitchell'],
  },
  {
    id: '2',
    content: 'All family communication must happen through FamilyBridge - no private channels',
    consequence: 'If Tyler tries to contact us outside the app, we will not respond. This prevents manipulation through triangulation.',
    createdBy: 'Matt Sullivan',
    status: 'approved',
    acknowledgments: ['Patricia Mitchell', 'Robert Mitchell', 'Jessica Mitchell', 'Kevin Mitchell', 'Tyler Mitchell'],
  },
  {
    id: '3',
    content: 'Tyler must complete sober living after residential treatment before living with any family member',
    consequence: 'If Tyler does not complete sober living, he cannot stay at any family member\'s home. This is non-negotiable for his safety.',
    createdBy: 'Robert Mitchell',
    targetUser: 'Tyler Mitchell',
    status: 'approved',
    acknowledgments: ['Patricia Mitchell', 'Robert Mitchell', 'Jessica Mitchell', 'Kevin Mitchell', 'Tyler Mitchell'],
  },
  {
    id: '4',
    content: 'Tyler must attend at least one recovery meeting per day while in treatment and aftercare',
    consequence: 'If meeting attendance drops below daily, we will have a family meeting to discuss increased support or higher level of care.',
    createdBy: 'Dr. Amanda Chen',
    targetUser: 'Tyler Mitchell',
    status: 'approved',
    acknowledgments: ['Patricia Mitchell', 'Robert Mitchell', 'Jessica Mitchell', 'Kevin Mitchell', 'Tyler Mitchell'],
  },
];

export const MITCHELL_VALUES = [
  { key: 'unity', name: 'Family Unity & Unified Response' },
  { key: 'tough_love', name: 'Tough Love with Clear Consequences' },
  { key: 'transparency', name: 'Complete Transparency (No Secrets)' },
];

export const MITCHELL_COMMON_GOALS = [
  { key: 'complete_treatment', name: 'Tyler completes 45-day residential program', completed: false },
  { key: 'sober_living', name: 'Tyler transitions to sober living after treatment', completed: false },
  { key: 'maintain_boundaries', name: 'All family members maintain unified boundaries', completed: true },
  { key: 'family_therapy', name: 'Participate in family therapy sessions', completed: false },
];

// FIIS Analysis for Mitchell Family - In Treatment, Positive Trajectory
export const MITCHELL_FIIS_ANALYSIS = {
  what_seeing: "I'm observing a family system that successfully executed a professional intervention and is now 26 days into recovery. Tyler resisted for 4 days post-intervention but the family held their unified boundaries - refusing all communication outside the app, denying financial requests, and maintaining the treatment-or-nothing stance. This unified approach, supported by professional interventionist Matt Sullivan, created the conditions for Tyler's eventual decision to enter treatment. The handoff from Freedom Interventions to Recovery Partners has been smooth, with Dr. Chen now providing primary clinical oversight while Matt remains as a consulting presence.",
  pattern_signals: [
    {
      signal_type: 'intervention_success',
      description: 'The intervention succeeded because the family maintained total unity. Tyler\'s attempts to triangulate (asking Mom privately, asking to stay with sister) were consistently redirected to the group. The strategy of blocking all other communication channels was critical.',
      confidence: 'very_high',
      one_year_impact: 'supports_goal' as const
    },
    {
      signal_type: 'treatment_engagement',
      description: 'Tyler is actively participating in treatment with 26 days sober. He\'s attending daily meetings (100% compliance since entering treatment), engaging in individual and group therapy, and starting to process underlying trauma from his parents\' divorce.',
      confidence: 'very_high',
      one_year_impact: 'supports_goal' as const
    },
    {
      signal_type: 'boundary_holding',
      description: 'When Tyler asked to skip sober living and stay with Jessica, the entire family held the boundary. This is a critical test that the family passed - maintaining structure even when Tyler is doing well.',
      confidence: 'very_high',
      one_year_impact: 'supports_goal' as const
    },
    {
      signal_type: 'provider_coordination',
      description: 'Excellent handoff between Freedom Interventions and Recovery Partners. Matt Sullivan remains engaged while Dr. Chen leads clinical care. The family benefits from both professional perspectives.',
      confidence: 'high',
      one_year_impact: 'supports_goal' as const
    },
    {
      signal_type: 'attention_needed',
      description: 'Tyler is beginning to show "pink cloud" thinking - believing he\'s ready to go home after feeling better. While normal, this requires continued boundary enforcement to prevent premature transition.',
      confidence: 'moderate',
      one_year_impact: 'neutral' as const
    },
  ],
  contextual_framing: "Day 26 in active treatment represents a critical period. The initial resistance (4 days post-intervention) was successfully overcome through family unity. Now the challenge shifts to maintaining boundaries while Tyler begins feeling better and may underestimate his need for continued structured care. The family's willingness to hold the sober living boundary, even when Tyler asked to skip it, is an excellent sign of their commitment to his long-term success rather than short-term comfort.",
  // One-Year Goal Tracking
  one_year_goal: {
    current_days: 26,
    days_remaining: 339,
    progress_percentage: 7,
    current_phase: 'Residential Treatment',
    likelihood_assessment: 'likely',
    likelihood_reasoning: 'Strong treatment engagement, unified family support, professional guidance from both interventionist and treatment team. Main risk is premature transition if boundaries aren\'t maintained.'
  },
  predictive_indicators: [
    {
      indicator_type: 'positive' as const,
      indicator: 'Professional intervention with experienced team',
      impact_level: 'significant' as const,
      recommendation: 'Continue Matt Sullivan\'s involvement through aftercare planning'
    },
    {
      indicator_type: 'positive' as const,
      indicator: 'Family maintained complete unity through resistance phase',
      impact_level: 'significant' as const,
      recommendation: 'Acknowledge and reinforce family\'s difficult work'
    },
    {
      indicator_type: 'positive' as const,
      indicator: 'Daily meeting attendance in treatment',
      impact_level: 'moderate' as const,
      recommendation: 'Build on this foundation for aftercare planning'
    },
    {
      indicator_type: 'neutral' as const,
      indicator: 'Tyler showing early "pink cloud" symptoms',
      impact_level: 'minor' as const,
      recommendation: 'Continue education about importance of sober living transition'
    }
  ],
  risk_trajectory: {
    direction: 'improving' as const,
    trend_description: 'Significant positive trajectory from active addiction to engaged treatment',
    contributing_factors: ['Professional intervention', 'Unified family response', 'Full communication block', 'Strong clinical support'],
    projected_outcome: 'High probability of completing treatment; aftercare compliance will determine long-term success'
  },
  compliance_trends: {
    overall_compliance: 'excellent' as const,
    meeting_attendance: 'consistent' as const,
    check_in_reliability: 'reliable' as const,
    boundary_adherence: 'strong' as const,
    financial_transparency: 'transparent' as const,
    trend_direction: 'improving' as const,
    compliance_notes: 'Tyler has gone from complete resistance to excellent compliance. The structured treatment environment has helped establish healthy routines.'
  },
  transition_readiness: {
    readiness_level: 'progressing' as const,
    current_phase_mastery: 65,
    strengths_demonstrated: ['Meeting attendance', 'Therapy engagement', 'Emotional processing', 'Accepting family boundaries'],
    areas_needing_development: ['Independent coping skills', 'Relapse prevention planning', 'Building sober support network outside treatment'],
    recommended_focus: ['Complete residential program', 'Identify sober living placement', 'Begin sponsor relationship'],
    estimated_readiness_timeline: '25 days until residential completion, recommend 90+ days sober living'
  },
  // Provider Clinical Alerts
  provider_clinical_alerts: [
    {
      alert_category: 'engagement_pattern' as const,
      metric_description: 'Tyler\'s treatment engagement at 95% participation rate',
      trend_direction: 'improving' as const,
      percentage_change: 95,
      time_period: '20 days in treatment',
      clinical_implication: 'Strong early engagement predicts better outcomes',
      suggested_intervention: 'Acknowledge progress while maintaining treatment structure',
      urgency: 'routine_review' as const
    },
    {
      alert_category: 'boundary_consistency' as const,
      metric_description: 'Family boundary adherence at 100% through intervention and treatment',
      trend_direction: 'stable' as const,
      percentage_change: 0,
      time_period: '26 days',
      clinical_implication: 'Excellent family cohesion - critical success factor',
      suggested_intervention: 'Prepare family for continued boundary work during transition',
      urgency: 'routine_review' as const
    },
    {
      alert_category: 'intervention_pressure' as const,
      metric_description: 'Tyler testing sober living boundary ("Can I stay with Jess?")',
      trend_direction: 'stable' as const,
      percentage_change: 0,
      time_period: '3 days ago',
      clinical_implication: 'Normal boundary testing - family handled appropriately',
      suggested_intervention: 'Reinforce in family session why sober living is non-negotiable',
      urgency: 'attention_needed' as const
    }
  ],
  recommendations: [
    {
      title: "Celebrate the Intervention Success",
      description: "The family's unified approach during the intervention was textbook. The 4-day resistance period before Tyler agreed to treatment is actually typical - many interventions take days or weeks. Acknowledge how hard it was to block Tyler on all channels and hold firm.",
      related_to: "Values: Family Unity"
    },
    {
      title: "Continue Aftercare Planning",
      description: "The family session scheduled for Friday is critical. Tyler is starting to hint at wanting to skip sober living. The family must present a unified front: completing sober living is the agreed boundary, and it's about giving him the best chance at long-term success.",
      related_to: "Boundary: Sober living after treatment"
    },
    {
      title: "Address Pink Cloud Gently",
      description: "Tyler feeling 'so much better' at day 26 is wonderful but also dangerous. Gently remind him that the real test comes when he leaves the structured environment. Sober living provides that critical transition.",
      related_to: "Goal: Complete 45-day program"
    },
    {
      title: "Plan for 30-Day Milestone",
      description: "The 30-day milestone is coming in 4 days. Plan a meaningful but recovery-focused celebration. This is a big moment for Tyler and the family.",
      related_to: "Milestone: 30 days"
    }
  ],
  clarifying_questions: [
    "Has Tyler been connected with potential sponsors in the AA/NA community?",
    "What sober living facilities are being considered for after treatment?",
    "How are family members doing with their own self-care and Al-Anon attendance?",
    "Is there a relapse prevention plan being developed with Dr. Chen?"
  ],
  what_to_watch: [
    "Tyler's continued engagement as he approaches the end of residential treatment",
    "Any attempts to negotiate around the sober living boundary",
    "Family maintaining their own support (Al-Anon, etc.) to prevent burnout",
    "Transition planning - ensuring placement is secured before discharge"
  ],
  strengths: [
    { area: 'Professional Intervention', detail: 'Matt Sullivan guided family through textbook intervention' },
    { area: 'Complete Communication Block', detail: 'All channels blocked - forced Tyler to engage through app only' },
    { area: 'Unified Financial Boundary', detail: 'All requests denied except for treatment - no exceptions' },
    { area: 'Smooth Provider Handoff', detail: 'Freedom Interventions to Recovery Partners transition well-coordinated' },
    { area: 'Active Treatment Engagement', detail: 'Tyler at 95% participation, daily meetings, therapy engagement' }
  ]
};

// Care Phases for Mitchell Family
export const MITCHELL_CARE_PHASES = [
  {
    id: 'phase-1',
    phase_type: 'detox',
    facility_name: 'Recovery Partners - Detox Unit',
    organization_name: 'Recovery Partners',
    started_at: format(subDays(now, 26), 'yyyy-MM-dd'),
    ended_at: format(subDays(now, 20), 'yyyy-MM-dd'),
    is_current: false,
    notes: 'Medical detox completed successfully. Tyler was uncomfortable but compliant. No medical complications.',
    days_in_phase: 6
  },
  {
    id: 'phase-2',
    phase_type: 'residential_treatment',
    facility_name: 'Recovery Partners - Residential',
    organization_name: 'Recovery Partners',
    started_at: format(subDays(now, 20), 'yyyy-MM-dd'),
    ended_at: null,
    is_current: true,
    notes: 'Currently day 20 of 45-day residential program. Active participant in individual and group therapy. Processing childhood trauma related to parents\' divorce.',
    days_in_phase: 20,
    expected_completion: format(subDays(now, -25), 'yyyy-MM-dd') // 25 days remaining
  }
];

// Provider Handoff record for Mitchell Family
export const MITCHELL_PROVIDER_HANDOFF = {
  id: 'handoff-1',
  from_organization: 'Freedom Interventions',
  to_organization: 'Recovery Partners',
  status: 'completed',
  initiated_at: format(subDays(now, 26), 'yyyy-MM-dd'),
  completed_at: format(subDays(now, 26), 'yyyy-MM-dd'),
  handoff_notes: 'Tyler Mitchell admitted following intervention. Family has been using FamilyBridge throughout - all members are aligned on boundaries. Tyler was resistant for 4 days post-intervention but agreed to treatment after family maintained unified front. Recommend continued professional moderation presence.',
  sobriety_days_at_handoff: 0
};

// Aftercare Plan for Mitchell (being developed)
export const MITCHELL_AFTERCARE_PLAN = {
  id: 'demo-mitchell-plan-1',
  targetUser: 'Tyler Mitchell',
  targetUserId: '3',
  createdBy: 'Dr. Amanda Chen',
  createdAt: format(subDays(now, 7), 'MMM d, yyyy'),
  isActive: true,
  notes: 'Aftercare planning in progress. Tyler initially resisted sober living idea but family is holding boundary. Family session scheduled to finalize plan.',
  recommendations: [
    {
      id: 'rec-1',
      type: 'sober_living',
      title: 'Sober Living Residence (PENDING SELECTION)',
      description: 'Structured transitional housing with accountability and peer support',
      facilityName: 'To be determined at family session',
      duration: '90 days minimum',
      frequency: null,
      therapyType: null,
      isCompleted: false,
      completedAt: null,
    },
    {
      id: 'rec-2',
      type: 'iop',
      title: 'Intensive Outpatient Program',
      description: 'Step-down care after residential, 3-hour sessions with individual counseling',
      facilityName: 'Recovery Partners Outpatient',
      duration: '60-90 days',
      frequency: '3x per week',
      therapyType: null,
      isCompleted: false,
      completedAt: null,
    },
    {
      id: 'rec-3',
      type: 'meeting_attendance',
      title: 'AA/NA Meeting Attendance',
      description: 'Daily meetings during first 90 days of sober living, then weekly minimum',
      facilityName: null,
      duration: 'Ongoing',
      frequency: 'Daily for 90 days, then 4x weekly',
      therapyType: null,
      isCompleted: false,
      completedAt: null,
    },
    {
      id: 'rec-4',
      type: 'individual_therapy',
      title: 'Individual Therapy',
      description: 'Continue processing childhood trauma and developing coping skills',
      facilityName: 'Dr. Amanda Chen or community referral',
      duration: '12 months minimum',
      frequency: 'Weekly',
      therapyType: 'Trauma-Focused CBT',
      isCompleted: false,
      completedAt: null,
    },
    {
      id: 'rec-5',
      type: 'family_therapy',
      title: 'Family Therapy Sessions',
      description: 'Heal family relationships and address divorce trauma impact on all members',
      facilityName: 'Recovery Partners Family Services',
      duration: '6 months',
      frequency: 'Bi-weekly',
      therapyType: 'Structural Family Therapy',
      isCompleted: false,
      completedAt: null,
    },
  ]
};

// FIIS Observations for Mitchell - showing the trajectory
export const MITCHELL_FIIS_OBSERVATIONS = [
  {
    id: 'obs-1',
    user_id: '3',
    observation_type: 'positive_behavior',
    content: 'Tyler opened up in group therapy about how his parents\' divorce affected him. First time he\'s talked about this.',
    occurred_at: format(subDays(now, 15), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    created_at: format(subDays(now, 15), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Dr. Amanda Chen'
  },
  {
    id: 'obs-2',
    user_id: '3',
    observation_type: 'boundary_test',
    content: 'Tyler asked Jessica if he could skip sober living and stay with her. Family held boundary together.',
    occurred_at: format(subDays(now, 3), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    created_at: format(subDays(now, 3), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Matt Sullivan'
  },
  {
    id: 'obs-3',
    user_id: '3',
    observation_type: 'progress_milestone',
    content: 'Tyler acknowledged in session that blocking all communication channels was what finally made him realize the family was serious.',
    occurred_at: format(subDays(now, 10), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    created_at: format(subDays(now, 10), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Dr. Amanda Chen'
  },
];

// FIIS Auto Events for Mitchell
export const MITCHELL_FIIS_AUTO_EVENTS = [
  {
    id: 'event-1',
    user_id: '3',
    event_type: 'meeting_checkin',
    event_data: { meeting_type: 'AA', meeting_name: 'Morning Serenity' },
    occurred_at: format(subHours(now, 3), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Tyler Mitchell'
  },
  {
    id: 'event-2',
    user_id: '3',
    event_type: 'meeting_checkout',
    event_data: { meeting_type: 'NA', meeting_name: 'Evening Group', duration_minutes: 92 },
    occurred_at: format(subDays(now, 1), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Tyler Mitchell'
  },
  {
    id: 'event-3',
    user_id: '3',
    event_type: 'financial_request_denied',
    event_data: { amount: 200, reason: 'rent' },
    occurred_at: format(subDays(now, 29), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Tyler Mitchell'
  },
  {
    id: 'event-4',
    user_id: '3',
    event_type: 'financial_request_denied',
    event_data: { amount: 50, reason: 'gas' },
    occurred_at: format(subDays(now, 28), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Tyler Mitchell'
  },
  {
    id: 'event-5',
    user_id: '3',
    event_type: 'location_request_completed',
    event_data: { requester: 'Patricia Mitchell', location: 'Recovery Partners' },
    occurred_at: format(subDays(now, 8), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Tyler Mitchell'
  },
  {
    id: 'event-6',
    user_id: '3',
    event_type: 'location_request_completed',
    event_data: { requester: 'Kevin Mitchell', location: 'Recovery Partners' },
    occurred_at: format(subDays(now, 4), 'yyyy-MM-dd\'T\'HH:mm:ss'),
    user_name: 'Tyler Mitchell'
  },
];
