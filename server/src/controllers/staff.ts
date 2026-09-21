import type { NextFunction, Request, Response } from 'express';
import {
  getStaffQuerySchema,
  type CreateStaffQuery,
  type UpdateStaffQuery,
} from 'shared';
import * as StaffModel from '@/model/staff';
import { ConflictError } from '@/errors';
import { auth } from '@/lib/auth';
import pool from '@/db';
import { fromNodeHeaders } from 'better-auth/node';
import { upsertAccess } from '@/model/access';
import { type ValueOf, isObjectEmpty } from 'shared/utils';

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
    const email = parsed.email ?? `${username}@staff.internal`;

    const staff = await auth.api.createUser({
      body: {
        email: email,
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

// TODO: Rollback if any failure happens on any of the three calls.
/**
 * @remarks
 * Fields split across three backends: `role`/`password` go through
 * better-auth's admin API; plain columns go through `auth.api.updateUser`'s
 * `data` bag. `access` is a plain upsert. These are three separate calls,
 * not one transaction — a failure partway through can leave them out of sync.
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

    const headers = fromNodeHeaders(req.headers);

    if (parsed.role && parsed.role !== existing.role)
      await auth.api.setRole({
        body: {
          userId: id,
          role: parsed.role,
        },
        headers,
      });

    if (parsed.password)
      await auth.api.setUserPassword({
        body: {
          userId: id,
          newPassword: parsed.password,
        },
        headers,
      });

    // To prevent adminUpdateUser complaining of same fields or no data, we only
    // add what changed to payload:
    const fields: (keyof Omit<
      Omit<Omit<UpdateStaffQuery, 'role'>, 'password'>,
      'access'
    >)[] = [
      'firstName',
      'middleName',
      'lastName',
      'isActive',
      'jobRole',
      'email',
      'contactNumber',
      'username',
    ];
    const payload: Partial<
      Record<(typeof fields)[number] | 'name', ValueOf<typeof parsed>>
    > = {};
    for (const field of fields) {
      if (parsed[field] !== existing[field]) {
        payload[field] = parsed[field];
      }
    }
    const name = `${nextFirstName} ${nextLastName}`;
    if (name !== existing.name) payload.name = name;

    if (!isObjectEmpty(payload))
      await auth.api.adminUpdateUser({
        body: {
          userId: id,
          data: payload,
        },
        headers,
      });

    await upsertAccess(id, parsed.access);

    res.locals.auditAction = `${
      res.locals.session.user.name
    } updated the staff account for ${nextFirstName} ${nextLastName}`;

    const updatedResult = await pool.query(
      'SELECT * FROM staff WHERE id = $1',
      [id],
    );

    res.json({
      data: {
        ...updatedResult.rows[0],
        access: parsed.access,
      },
    });
  } catch (error) {
    next(error);
  }
};
