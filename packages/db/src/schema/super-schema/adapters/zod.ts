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

  wrapInContainer: (obj: any) => {
    return z.object(obj);
  },
  isOwnContainer: (obj: any) => {
    const itemConstructorName = obj?.constructor?.name;
    return itemConstructorName.startsWith('ZodObject');
  },
  isOwnType: (obj: any) => {
    const typeName = obj?._def?.typeName ?? '';
    return typeName.startsWith('Zod');
    // not working
    // const isZodType = obj instanceof z.ZodType;
  },

  generateStringType: (defaultFunc, validationFunc) => {
    // NOTE: used to translate special id values like "nanoid" for validation
    const validationString = z
      .string()
      .default(defaultFunc)
      .refine(validationFunc);
    return validationString;
  },

  // TODO: delete unnecessary old code

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
