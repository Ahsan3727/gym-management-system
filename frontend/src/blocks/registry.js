// Member blocks
import WelcomeBlock from './member/WelcomeBlock.jsx';
import StreakBlock from './member/StreakBlock.jsx';
import LongestStreakBlock from './member/LongestStreakBlock.jsx';
import LatestWeightBlock from './member/LatestWeightBlock.jsx';
import MembershipBlock from './member/MembershipBlock.jsx';
import CheckinBlock from './member/CheckinBlock.jsx';
import CoachingSessionsBlock from './member/CoachingSessionsBlock.jsx';
import BadgesBlock from './member/BadgesBlock.jsx';
import QuickActionsBlock from './member/QuickActionsBlock.jsx';

// Admin blocks
import HeaderBlock from './admin/HeaderBlock.jsx';
import BillingBannerBlock from './admin/BillingBannerBlock.jsx';
import ActiveMembersBlock from './admin/ActiveMembersBlock.jsx';
import TotalMembersBlock from './admin/TotalMembersBlock.jsx';
import RevenueBlock from './admin/RevenueBlock.jsx';
import PendingRevenueBlock from './admin/PendingRevenueBlock.jsx';
import RevenueChartBlock from './admin/RevenueChartBlock.jsx';
import MemberGrowthBlock from './admin/MemberGrowthBlock.jsx';
import PlanDistributionBlock from './admin/PlanDistributionBlock.jsx';
import AnnouncementBlock from './admin/AnnouncementBlock.jsx';

export const MEMBER_BLOCKS = {
  welcome: WelcomeBlock,
  streak: StreakBlock,
  longestStreak: LongestStreakBlock,
  latestWeight: LatestWeightBlock,
  membership: MembershipBlock,
  checkin: CheckinBlock,
  sessions: CoachingSessionsBlock,
  badges: BadgesBlock,
  quickActions: QuickActionsBlock,
};

export const ADMIN_BLOCKS = {
  header: HeaderBlock,
  billingBanner: BillingBannerBlock,
  activeMembers: ActiveMembersBlock,
  totalMembers: TotalMembersBlock,
  revenue: RevenueBlock,
  pendingRevenue: PendingRevenueBlock,
  revenueChart: RevenueChartBlock,
  memberGrowth: MemberGrowthBlock,
  planDistribution: PlanDistributionBlock,
  announcement: AnnouncementBlock,
};
