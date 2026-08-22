import z from 'zod';

const contactNumberSchema = z
  .string()
  .transform((val) => val.replace(/[\s\-()]/g, ''))
  .pipe(
    z
      .string()
      .regex(
        /^(09\d{9}|\+[1-9]\d{1,14})$/,
        'Must be a valid local number (e.g., 09123456789) or international format (e.g., +14155552671)',
      )
      .transform((val) => {
        if (val.startsWith('09')) return '+63' + val.substring(1);

        return val;
      }),
  );

export default contactNumberSchema;
