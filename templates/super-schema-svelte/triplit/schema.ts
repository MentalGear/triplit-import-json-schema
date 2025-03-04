import { Schema as S, type ClientSchema, type Entity } from '@triplit/client';
import { z } from 'zod';
import type { SuperSchema } from '@triplit/db';

// This is your schema definition.
//
// For all of the supported types and options, check the documentation:
//   https://triplit.com/docs/schemas/types
//
// Whenever you change your schema while the sync server is running
// you'll need to run
//
//   `triplit schema push`
//
// Read more about schema management:
//  https://www.triplit.dev/docs/schemas/updating

export const schema = {
  todos: {
    schema: S.Schema({
      id: S.Id(),
      text: S.String(),
      completed: S.Boolean({ default: false }),
      created_at: S.Date({ default: S.Default.now() }),
    }),
  },
} satisfies ClientSchema;

// Use the `Entity` type to extract clean types for your collections
export type Todo = Entity<typeof schema, 'todos'>;

// ----

export const superSchema: SuperSchema = {
  version: 0,

  roles: {
    user: {
      match: {
        sub: '$userId',
      },
    },
  },

  collections: {
    // Example
    list: {
      schema: {
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
        relation: S.RelationMany('listItem', '$id_new'),
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
    },

    listItem: {
      schema: {
        id: 'nanoid',
        boolean: z.boolean(),
        number: z.number(),
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
    },
  },
};

const roles = {
  user: {
    match: {
      sub: '$userId',
    },
  },
};

export const superSchemaCollections: SuperSchema = {
  collections: {
    // collections wrapper needed meanwhile
    todos: {
      schema: {
        id: 'nanoid',
        name: z.string().default('New NOC List'),
        completed: z.boolean().default(false),
        created_at: z.date(),
      },
    },
  },

  // lists: {
  //   schema: {
  //     id: 'nanoid',
  //     name: z.string().default('New NOC List'),
  //     date: z.date(),

  //     character: z.string(),
  //     // Triplit-only types
  //     relation: S.RelationMany('listItem', '$id'),
  //   },
  // },

  // characters: {
  //   schema: {
  //     id: 'nanoid',
  //     nameFirst: z.string(),
  //     nameLast: z.string(),
  //     catchphrase: z.set(z.string().max(200)),
  //     email: z.string().email(),
  //     isActive: z.boolean(),
  //     isRoque: z.boolean(),

  //     // media: S.RelationById('linkedCollection', '$root_node_id'),
  //   },

  //   // permissions: {
  //   //   admin: {
  //   //     insert: {
  //   //       // Allow all inserts
  //   //       filter: [true],
  //   //     },
  //   //   },
  //   //   user: {
  //   //     insert: {
  //   //       // Allow inserts where authorId is the user's id
  //   //       filter: [['authorId', '=', '$role.userId']],
  //   //     },
  //   //   },
  //   // },
  // },

  // media: {
  //   schema: {
  //     id: 'nanoid',
  //     name: z.string(),
  //     release: z.date(),
  //     rating: z.number().min(0).max(10).int(),
  //   },
  // },
};

// TODO: type infer
// export type Character = Entity<typeof superSchemaCollections, 'characters'>;
