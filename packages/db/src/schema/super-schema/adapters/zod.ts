import { JSONSchema7 } from 'json-schema';

import {
  ZodString,
  ZodBoolean,
  ZodNumber,
  ZodDate,
  ZodSet,
  ZodNullable,
  ZodOptional,
  ZodRecord,
  ZodDefault,
  ZodType,
  ZodTypeAny,
} from 'zod';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ValidationLibAdapter } from './ValidationLibAdapter.js';

//
export const zodAdapter: ValidationLibAdapter = {
  // only used for type-checking
  typeMapping: {
    Boolean: ZodBoolean,
    String: ZodString,
    Number: ZodNumber,
    Date: ZodDate,
    Set: ZodSet,
    Nullable: ZodNullable,
    Optional: ZodOptional,
    Record: ZodRecord,
    // Object: 'ZodObject',
  },

  // TODO: add default mapping ?
  // defaultOverwrites: {
  //  allow defaults like "now" to be transpiled to Triplit. Defaults are S.Default.Now() and S.uuid() nanoid()
  //   someDateWithNowDefault: 'now', // triplitSchemaToJsonSchema can take care, or is there a better solution?
  // },

  wrapInContainer: function (obj: any) {
    return z.object(obj);
  },
  isOwnContainer: function (obj: any) {
    const itemConstructorName = obj?.constructor?.name;
    return itemConstructorName.startsWith('ZodObject');
  },
  isOwnType: function (obj: any) {
    const itemConstructorName = obj?.constructor?.name;
    return itemConstructorName.startsWith('Zod');
  },

  // isStringType: function (obj: any) {
  //   return obj instanceof ZodString;
  // },
  // isNullable: function (zObj: ZodTypeAny) {
  //   // return obj instanceof ZodNullable;
  //   return zObj.isNullable();
  // },

  // -------

  // setDefaultFunction: function (
  //   zObj: ZodTypeAny,
  //   fnc: () => string
  // ): ZodTypeAny {
  //   return zObj.default(fnc);
  // },

  // setCustomValidationFunction: function (
  //   zObj: ZodTypeAny,
  //   validationFunction: (obj: any) => boolean
  // ): ZodTypeAny {
  //   // NOTE: used to add a test to the generated validation lib
  //   // setDefaultFunction to set validation lib independent random uuid as default
  //   // customValidationFunction is used to generate testing code if uuid/nanoid etc.
  //   return zObj.refine(validationFunction);
  // },

  generateStringType: function (
    defaultFunc: () => string,
    validationFunc: () => boolean
  ) {
    // NOTE: used to translate special id values like "nanoid" for validation
    const validationString = z
      .string()
      .default(defaultFunc)
      .refine(validationFunc);
    return validationString;
  },

  // isDefaultRandom: function (obj: ZodTypeAny) {
  //   // NOTE
  //   // since zod saves all defaults as functions internally, we cant simply use
  //   // typeof default === 'function'

  //   // instead, we run .default() twice and if the output is the same, we can
  //   // assume that it's not a function that randomly generates uuids
  //   try {
  //     const val1 = obj?._def?.default();
  //   } catch (err) {
  //   }
  //   const val2 = obj?._def?.default();
  //   if (val1 === val2) return false;
  //   return true;
  //   // return typeof obj.default != 'function';
  // },

  jsonSchemaFrom: function (validationLibSchema: any) {
    const jsonSchema = zodToJsonSchema(validationLibSchema, {
      // de-ref all external/local and bring them inline
      $refStrategy: 'none',
    });
    return jsonSchema as JSONSchema7;
  },
};

// corrections: [
//   {
//     purpose: 'transform arrays to sets',

//     validationSchema(obj: ZodType) {
//       if (obj instanceof z.ZodArray === false) return;
//       // simulate set type (all items are unique)
//       obj.refine((items) => new Set(items).size === items.length, {
//         message: 'All items must be unique, no duplicate values allowed',
//       });
//       // print a note to the user
//       console.warn(`
//       ------------------------------------
//       ALIGNMENT NOTICE:
//       - Zod (pre-v.4) does not have a native Set Type.
//       - Triplit's database schema only provides Set types for lists (for collaboration and distributed syncing).
//       AUTOMATIC RESOLUTION:
//       > To align validation and database schemas, a uniqueness check is added (using .refine) to any array type in the generated Zod schema.
//       ------------------------------------
//       `);
//     },

//     jsonSchema(obj) {
//       // set all arrays to sets
//       if (obj.type === 'array') obj.uniqueItems = true;
//     },
//   },
// ],
