import { z, ZodType } from 'zod';

import { Roles, type ClientSchema } from '../../../../../../client/src/index';

import { Schema as S } from '../../../../../src';
import { SuperSchemaCollection } from '../../../../../src/schema/super-schema/SuperSchema';

export const schemaFlatZodValid_noId: SuperSchemaCollection = {
  schema: {
    // validation lib types
    boolean: z.boolean(),
    number: z.number(),
    string: z.string(),
    stringDefault: z.string().default('default string'),
    stringEnum: z.enum(['1', '2']),
    date: z.date(),

    setString: z.set(z.string()),
    setNumber: z.set(z.number()),
    setBoolean: z.set(z.boolean()),
    setDate: z.set(z.date()),
    setStringEnum: z.set(z.enum(['a', 'b'])),

    // Triplit-only types
    relation: S.RelationById('linkedCollection', '$root_node_id'),
  },

  permissions: {
    admin: {
      insert: {
        // Allow all inserts
        filter: [true],
      },
    },
    user: {
      insert: {
        // Allow inserts where authorId is the user's id
        filter: [['authorId', '=', '$role.userId']],
      },
    },
  },
};

export const schemaFlatZodValid_wrongId: SuperSchemaCollection = {
  schema: {
    id: z.number(),
    boolean: z.boolean(),
    number: z.number(),
    string: z.string(),
    stringDefault: z.string().default('default string'),
    stringEnum: z.enum(['1', '2']),
    date: z.date(),

    setString: z.set(z.string()),
    setNumber: z.set(z.number()),
    setBoolean: z.set(z.boolean()),
    setDate: z.set(z.date()),
    setStringEnum: z.set(z.enum(['a', 'b'])),

    // Triplit-only types
    relation: S.RelationById('linkedCollection', '$root_node_id'),
  },

  permissions: {
    admin: {
      insert: {
        // Allow all inserts
        filter: [true],
      },
    },
    user: {
      insert: {
        // Allow inserts where authorId is the user's id
        filter: [['authorId', '=', '$role.userId']],
      },
    },
  },
};

export const schemaFlatZodValid: SuperSchemaCollection = {
  schema: {
    // validation lib types
    // prev: id: z.string().nanoid(),
    id: 'nanoid',
    boolean: z.boolean(),
    number: z.number(),
    string: z.string(),
    stringDefault: z.string().default('default string'),
    stringEnum: z.enum(['1', '2']),
    date: z.date(),

    setString: z.set(z.string()),
    setNumber: z.set(z.number()),
    setBoolean: z.set(z.boolean()),
    setDate: z.set(z.date()),
    setStringEnum: z.set(z.enum(['a', 'b'])),

    // Triplit-only types
    relation: S.RelationById('linkedCollection', '$root_node_id'),
  },

  permissions: {
    admin: {
      insert: {
        // Allow all inserts
        filter: [true],
      },
    },
    user: {
      insert: {
        // Allow inserts where authorId is the user's id
        filter: [['authorId', '=', '$role.userId']],
      },
    },
  },
};

export const schemaFlatZod: SuperSchemaCollection = {
  schema: {
    ...schemaFlatZodValid.schema,
    // fake relation
    relationFake: { cardinality: 'many' },

    // unknowns (no validation or triplit type item)
    somethingUnknown: new Date(),
  },

  permissions: {
    admin: {
      insert: {
        // Allow all inserts
        filter: [true],
      },
    },
    user: {
      insert: {
        // Allow inserts where authorId is the user's id
        filter: [['authorId', '=', '$role.userId']],
      },
    },
  },
};

export const schemaComplexZodValid: SuperSchemaCollection = {
  schema: {
    ...schemaFlatZodValid.schema,

    level_2: {
      ...schemaFlatZodValid.schema,
      level_3: {
        ...schemaFlatZodValid.schema,
      },
    },
  },

  permissions: {
    admin: {
      insert: {
        // Allow all inserts
        filter: [true],
      },
    },
    user: {
      insert: {
        // Allow inserts where authorId is the user's id
        filter: [['authorId', '=', '$role.userId']],
      },
    },
  },
};

export const schemaComplexZodWithUnknowns: SuperSchemaCollection = {
  schema: {
    ...schemaFlatZod.schema,

    level_2: {
      ...schemaFlatZod.schema,
      level_3: {
        ...schemaFlatZod.schema,
      },
    },
  },

  permissions: {
    admin: {
      insert: {
        // Allow all inserts
        filter: [true],
      },
    },
    user: {
      insert: {
        // Allow inserts where authorId is the user's id
        filter: [['authorId', '=', '$role.userId']],
      },
    },
  },
};
