import type { NextFunction, Request, Response } from 'express';
import {
  getStaffQuerySchema,
  type Staff,
  type CreateStaffQuery,
  type UpdateStaffQuery,
} from 'shared';
import * as StaffModel from '@/model/staff';
import { ConflictError, NotFoundError } from '@/errors';
import { auth } from '@/lib/auth';
import { upsertAccess } from '@/model/access';
import { withTransaction } from '@/util/with-transaction';

export const getStaff = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = getStaffQuerySchema.parse(req.query);
    const { dataResult, countResult } = await StaffModel.getStaff(parsed);
    const totalRecords = parseInt(countResult.rows[0].total, 10);

    res.json({
      data: dataResult.rows,
      meta: {
        total: totalRecords,
        page: parsed.page,
        limit: parsed.limit,
        totalPages: Math.ceil(totalRecords / parsed.limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

async function makeUsernameUnique(username: string): Promise<string> {
  let currentUsername = username;

  while (await StaffModel.doesUsernameExist(currentUsername)) {
    const randomSuffix = Math.floor(Math.random() * 1000);
    currentUsername = `${username}${randomSuffix}`;
  }

  return currentUsername;
}

export const createStaff = async (
  req: Request<{}, {}, CreateStaffQuery>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = req.body;
    const isExisting = await StaffModel.doesNameExist(
      parsed.firstName,
      parsed.lastName,
    );
    if (isExisting)
      throw new ConflictError(
        'A staff member with the same first and last name already exists.',
      );

    const username = await makeUsernameUnique(
      `${parsed.firstName.toLowerCase()[0]}${
        parsed.middleName?.toLowerCase()[0] || ''
      }${parsed.lastName.toLowerCase()}`,
    );

    const staff = await auth.api.createUser({
      body: {
        email: `${username}@staff.internal`,
        password: parsed.password,
        name: `${parsed.firstName} ${parsed.lastName}`,
        role: parsed.role,
        data: {
          firstName: parsed.firstName,
          middleName: parsed.middleName,
          lastName: parsed.lastName,
          isActive: parsed.isActive,
          jobRole: parsed.jobRole || 'staff',
          contactNumber: parsed.contactNumber,
          username: username,
        },
      },
    });

    await upsertAccess(staff.user.id, parsed.access);

    res.locals.auditAction = `${
      res.locals.session.user.name
    } created a new staff account for ${
      parsed.firstName
    } ${parsed.lastName} (${username})`;

    res.status(201).json({ data: staff });
  } catch (error) {
    next(error);
  }
};

/**
 * @remarks
 * All-or-nothing: every write happens inside one Postgres transaction, so a
 * failure at any step rolls back the whole update.
 *
 * This deliberately bypasses better-auth's `setRole`, `adminUpdateUser` and
 * `setUserPassword`. Those run on better-auth's own connections and can't
 * join our transaction. Authorization is already enforced by `requireAdmin`
 * on the route. The password is hashed with better-auth's own hasher and
 * written to its `account` table, so logins keep working.
 */
export const updateStaff = async (
  req: Request<{ id: string }, {}, UpdateStaffQuery>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const parsed = req.body;

    const existing = await StaffModel.getStaffById(id);

    const nextFirstName = parsed.firstName ?? existing.firstName;
    const nextLastName = parsed.lastName ?? existing.lastName;
    if (
      nextFirstName !== existing.firstName ||
      nextLastName !== existing.lastName
    ) {
      const isExisting = await StaffModel.doesNameExist(
        nextFirstName,
        nextLastName,
        id,
      );
      if (isExisting)
        throw new ConflictError(
          'A staff member with the same first and last name already exists.',
        );
    }

    if (
      parsed.username !== undefined &&
      parsed.username !== existing.username &&
      (await StaffModel.doesUsernameExist(parsed.username, id))
    )
      throw new ConflictError('That username is already taken.');

    // Hash before opening the transaction so we don't hold it during the
    // (deliberately slow) hash.
    const passwordHash = parsed.password
      ? await (await auth.$context).password.hash(parsed.password)
      : null;

    // Only send columns that were provided and actually changed.
    const fields: Exclude<keyof UpdateStaffQuery, 'access' | 'password'>[] = [
      'firstName',
      'middleName',
      'lastName',
      'isActive',
      'jobRole',
      'contactNumber',
      'username',
      'role',
    ];
    const changes: Partial<
      Record<
        (typeof fields)[number] | 'email' | 'displayUsername' | 'name',
        unknown
      >
    > = {};
    for (const field of fields) {
      if (parsed[field] !== undefined && parsed[field] !== existing[field])
        changes[field] = parsed[field];
    }

    // Set fields that is dervied from other fields.
    if (changes.username !== undefined) {
      changes.email = `${changes.username}@staff.internal`;
      changes.displayUsername = changes.username;
    }
    const name = `${nextFirstName} ${nextLastName}`;
    if (name !== existing.name) changes.name = name;

    const updatedRow = await withTransaction(async (client) => {
      const entries = Object.entries(changes);
      if (entries.length > 0) {
        // Column names come from the fixed lists above, never from user input.
        const setClause = entries
          .map(([key], i) => `"${key}" = $${i + 1}`)
          .join(', ');
        await client.query(
          `UPDATE staff SET ${setClause}, "updatedAt" = NOW()
            WHERE id = $${entries.length + 1}`,
          [...entries.map(([, value]) => value), id],
        );
      }

      if (passwordHash) {
        const result = await client.query(
          `UPDATE account SET password = $1, "updatedAt" = NOW()
           WHERE "userId" = $2 AND "providerId" = 'credential'`,
          [passwordHash, id],
        );
        if (result.rowCount === 0)
          throw new NotFoundError('This account has no password login.');
      }

      if (parsed.access !== undefined)
        await upsertAccess(id, parsed.access, client);

      const result = await client.query<Staff>(
        'SELECT * FROM staff WHERE id = $1',
        [id],
      );
      return result.rows[0];
    });

    res.locals.auditAction = `${
      res.locals.session.user.name
    } updated the staff account for ${nextFirstName} ${nextLastName}`;

    res.json({
      data: {
        ...updatedRow,
        access: parsed.access,
      },
    });
  } catch (error) {
    next(error);
  }
};
