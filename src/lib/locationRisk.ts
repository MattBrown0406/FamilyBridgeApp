import { supabase } from '@/integrations/supabase/client';

export type LocationRiskCategory = 'bar' | 'liquor_store' | 'thc_dispensary' | 'adult_entertainment';

export interface LocationRiskPlace {
  name: string;
  type: string;
  reason: string;
  category?: LocationRiskCategory;
}

export interface LocationRiskResult {
  hasLiquorLicense: boolean;
  hasTHCDispensary?: boolean;
  hasLiquorStore?: boolean;
  hasBar?: boolean;
  hasAdultEntertainment?: boolean;
  confidence: string;
  places: LocationRiskPlace[];
  totalPlacesChecked?: number;
}

export async function checkLocationRisk(latitude: number, longitude: number, address?: string) {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-liquor-license`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ latitude, longitude, address }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to check location risk');
  }

  return response.json() as Promise<LocationRiskResult>;
}

export function getLocationRiskSummary(result: LocationRiskResult | null | undefined) {
  if (!result) return [] as Array<{ category: LocationRiskCategory; label: string; emoji: string; places: string[] }>;

  const defs: Array<{ category: LocationRiskCategory; label: string; emoji: string }> = [
    { category: 'adult_entertainment', label: 'Adult Entertainment', emoji: '🚨' },
    { category: 'thc_dispensary', label: 'THC Dispensary', emoji: '🌿' },
    { category: 'liquor_store', label: 'Liquor Store', emoji: '🍺' },
    { category: 'bar', label: 'Bar/Club', emoji: '🍸' },
  ];

  return defs
    .map((def) => ({
      ...def,
      places: result.places.filter((p) => p.category === def.category).map((p) => p.name),
    }))
    .filter((item) => item.places.length > 0);
}

export async function persistLocationRiskWarning(params: {
  familyId: string;
  checkinId: string;
  userId: string;
  locationAddress: string | null;
  result: LocationRiskResult;
}) {
  const primaryPlace = params.result.places[0];
  return supabase.from('liquor_license_warnings').insert({
    family_id: params.familyId,
    checkin_id: params.checkinId,
    user_id: params.userId,
    location_address: params.locationAddress,
    license_type: primaryPlace?.category || primaryPlace?.type || 'liquor_license',
  });
}

export async function notifyFamilyLocationRisk(params: {
  familyId: string;
  actorUserId: string;
  relatedId: string;
  result: LocationRiskResult;
  locationAddress: string;
  mode: 'notification' | 'message';
}) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', params.actorUserId)
    .single();

  const userName = profile?.full_name || 'A family member';
  const summary = getLocationRiskSummary(params.result);
  const placeNames = params.result.places.map((p) => p.name).join(', ');

  if (params.mode === 'notification') {
    const { data: moderators } = await supabase
      .from('family_members')
      .select('user_id')
      .eq('family_id', params.familyId)
      .eq('role', 'moderator');

    const notifications = moderators
      ?.filter((m) => m.user_id !== params.actorUserId)
      .map((moderator) => ({
        user_id: moderator.user_id,
        family_id: params.familyId,
        type: 'liquor_alert',
        title: '⚠️ Location Risk Alert',
        body: `${userName} checked in near: ${placeNames}`,
        related_id: params.relatedId,
      })) || [];

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }

    return;
  }

  const lines = summary.map((item) => `${item.emoji} ${item.label}: ${item.places.join(', ')}`);
  await supabase.from('messages').insert({
    family_id: params.familyId,
    sender_id: params.actorUserId,
    content: `⚠️ **Location Check-In Notice**\n\n${userName} shared a location near a place your family may want to review:\n📍 ${params.locationAddress || 'Location shared'}\n\n${lines.join('\n')}\n\n_This is an automated notice for human follow-up._`,
  });
}
