import { createAccessControl } from 'better-auth/plugins/access';
import {
  defaultStatements,
  adminAc,
  userAc,
} from 'better-auth/plugins/admin/access';

export const ac = createAccessControl(defaultStatements);

export const user = ac.newRole({ ...userAc.statements });
export const admin = ac.newRole({ ...adminAc.statements });
export const superadmin = ac.newRole({ ...adminAc.statements });
export const lifeplanAgent = ac.newRole({ ...userAc.statements });
