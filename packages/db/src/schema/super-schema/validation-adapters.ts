// import { JSONSchema7 } from 'json-schema';
// import { z } from 'zod';
// import * as v from 'valibot';
// import { toJsonSchema } from '@valibot/to-json-schema';
// import { zodToJsonSchema } from 'zod-to-json-schema';

// /**
//  * Description
//  * @param transforms only use if the schema needs modifications for proper json output, but this could also be done in toJsonSchema !
//  **/
// export type ValidationLibAdapter = {
//   wrapInContainer: (obj: any) => any;
//   isOwnContainer: (obj: any) => boolean;
//   isOwnType: (obj: any) => boolean;
//   transformations?: (obj: any) => any;
//   toJsonSchema: (obj: any) => JSONSchema7;
// };

// const valibotAdapter: ValidationLibAdapter = {
//   wrapInContainer: function (obj: any) {
//     return v.object(obj);
//   },
//   isOwnContainer: function (obj: any) {
//     const isValibotObjectType =
//       obj?.expects === 'Object' && obj?.entries != null;
//     return isValibotObjectType;
//   },
//   isOwnType: function (obj: any) {
//     const isValibotType = obj?.async != null && obj?._run != null;
//     return isValibotType;
//   },
//   toJsonSchema: function (validationLibSchema: any) {
//     return toJsonSchema(validationLibSchema);
//   },
// };

// const zodAdapter: ValidationLibAdapter = {
//   wrapInContainer: function (obj: any) {
//     return z.object(obj);
//   },
//   transformations(obj) {
//     // all arrays need to be unique (triplit only supports sets)
//     // but only zod v.4 (not released) will add z.object({ id: z.string() }).array().unique()
//     // so we can transform all arrays to sets ... but this would collide
//     // with zod validation on the frontend
//     // it's up to the user to decide whether they want to use this
//     // Solution: use valibot instead (aligns quite well to zod's API)
//     // TODO: add uniqueItems:true to all object.type: "array"s
//   },
//   isOwnContainer: function (obj: any) {
//     const itemConstructorName = obj?.constructor?.name;
//     return itemConstructorName.startsWith('ZodObject');
//   },
//   isOwnType: function (obj: any) {
//     const itemConstructorName = obj?.constructor?.name;
//     return itemConstructorName.startsWith('Zod');
//   },
//   toJsonSchema: function (validationLibSchema: any) {
//     return zodToJsonSchema(validationLibSchema) as JSONSchema7;
//   },
// };

// export const validationAdapters: Record<string, ValidationLibAdapter> = {
//   zod: zodAdapter,
//   valibot: valibotAdapter,
// };
