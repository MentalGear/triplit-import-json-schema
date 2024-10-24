// import { Roles, type ClientSchema } from '../../../../../../client/src/index';

// import * as v from 'valibot';

// import { Schema as S } from '../../../../../src';
// import { SuperSchemaCollection } from '../../../../../src/schema/super-schema/SuperSchema';

// const schemaFlatValibot: SuperSchemaCollection = {
//   schema: {
//     id: v.pipe(v.string(), v.nanoid('Wrong Nano ID format')),
//     boolean: v.boolean(),
//     number: v.number(),
//     string: v.string(),
//     stringDefault: v.optional(v.string(), 'default string'),
//     stringEnum: v.picklist(['1', '2']),
//     date: v.date(),

//     setString: v.set(v.string()),
//     setNumber: v.set(v.number()),
//     setBoolean: v.set(v.boolean()),
//     setDate: v.set(v.date()),
//     setStringEnum: v.set(v.picklist(['a', 'b'])),

//     // Triplit-only types
//     relation: S.RelationById('nodes', '$root_node_id'),
//     relationFake: { cardinality: 'many' },

//     // unknowns
//     somethingUnknown: new Date(),
//   },

//   permissions: {
//     admin: {
//       insert: {
//         // Allow all inserts
//         filter: [true],
//       },
//     },
//     user: {
//       insert: {
//         // Allow inserts where authorId is the user's id
//         filter: [['authorId', '=', '$role.userId']],
//       },
//     },
//   },
// };
