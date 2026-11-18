export const claimRole = claims => claims?.owner === true ? 'owner' : claims?.staff === true ? 'staff' : null;
export const activeMember = member => member?.status === 'active' && member.accessPending !== true;
export function matchesMember(claims, member) {
  return activeMember(member) && claimRole(claims) === member.role
    && Number.isInteger(member.accessVersion) && member.accessVersion > 0 && claims.staffVersion === member.accessVersion;
}
