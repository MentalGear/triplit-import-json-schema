import * as v from 'valibot';
import { toJsonSchema } from '@valibot/to-json-schema';
import { ValidationLibAdapter } from './ValidationLibAdapter';

export const valibotAdapter: ValidationLibAdapter = {
  idMapping: {
    nanoid: function () {
      // TODO: fill in validation lib function to generate nanoid ?
      return function () {};
    },
  },
  // TODO: make valibot
  typeMapping: {
    Boolean: 'ZodBoolean',
    String: 'ZodString',
    Number: 'ZodNumber',
    Date: 'ZodDate',
    Set: 'ZodSet',
    Nullable: 'ZodNullable',
    Optional: 'ZodOptional',
    Record: 'ZodRecord',
    // Object: 'ZodObject',
  },
  // ========================================================================
  wrapInContainer: function (obj: any) {
    return v.object(obj);
  },
  isOwnContainer: function (obj: any) {
    const isValibotObjectType =
      obj?.expects === 'Object' && obj?.entries != null;
    return isValibotObjectType;
  },
  isOwnType: function (obj: any) {
    const isValibotType = obj?.async != null && obj?._run != null;
    return isValibotType;
  },
  jsonSchemaFrom: function (validationLibSchema: any) {
    return toJsonSchema(validationLibSchema);
  },
};
