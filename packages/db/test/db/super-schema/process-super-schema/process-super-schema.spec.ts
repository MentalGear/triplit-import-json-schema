import { describe, expect, test } from 'vitest';

import { z, ZodAny } from 'zod';

import { zodAdapter } from '../../../../src/schema/super-schema/adapters/zod';

import {
  superSchemaComplexZodValid,
  superSchemaComplexZodValidWithUnknowns,
  superSchemaFlatZodValid,
  superSchemaFlatZodValid_noId,
  superSchemaFlatZodValid_NoRoles,
  superSchemaFlatZodValid_wrongId,
} from '../example-data/zod-example-super-schema';
import { processSuperSchema } from '../../../../src/schema/super-schema/process-super-schema';

describe('Super Schema Artifacts', () => {
  test('all output properties are present', () => {
    const output = processSuperSchema(superSchemaFlatZodValid, zodAdapter);

    expect(output).toHaveProperty('roles');
    expect(output).toHaveProperty('validationSchema');
    expect(output).toHaveProperty('triplitJsonSchema');
  });

  test('all output properties are present, even if roles are not defined', () => {
    const output = processSuperSchema(
      superSchemaFlatZodValid_NoRoles,
      zodAdapter
    );

    expect(output).toHaveProperty('roles');
    expect(output).toHaveProperty('validationSchema');
    expect(output).toHaveProperty('triplitJsonSchema');
  });

  test('has expected roles', () => {
    const output = processSuperSchema(superSchemaFlatZodValid, zodAdapter);

    const expectedKeys = ['user'];

    const roles = output.roles;

    expect(Object.keys(roles)).toHaveLength(expectedKeys.length);
    expect(Object.keys(roles).sort()).toEqual(expectedKeys.sort());
  });

  test('has expected validation keys', () => {
    const output = processSuperSchema(superSchemaFlatZodValid, zodAdapter);

    const exampleInputKeys = Object.keys(
      superSchemaFlatZodValid.collections.exampleCollection.schema
    ).sort();

    const keysExpected = exampleInputKeys.filter((item) => item !== 'relation');
    const shape = output.validationSchema.exampleCollection?.shape;
    const shapeKeys = Object.keys(shape).sort();

    expect(shapeKeys).toHaveLength(keysExpected.length);
    expect(shapeKeys).toEqual(keysExpected);
  });

  test('has expected relations', () => {
    const output = processSuperSchema(superSchemaFlatZodValid, zodAdapter);
    // debugger;
    expect(
      output.triplitJsonSchema.collections.exampleCollection.schema.properties
        ?.relation
    ).toEqual({
      type: 'query',
      options: {},
      query: {
        collectionName: 'linkedCollection',
        where: [['id', '=', '$root_node_id']],
      },
      cardinality: 'one',
    });
  });

  test('has expected permissions', () => {
    const output = processSuperSchema(superSchemaFlatZodValid, zodAdapter);

    expect(
      output.triplitJsonSchema?.collections?.exampleCollection.permissions
    ).toEqual({
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
    });
  });

  test('has expected output', () => {
    const output = processSuperSchema(superSchemaFlatZodValid, zodAdapter);

    expect(output.triplitJsonSchema).toEqual({
      collections: {
        exampleCollection: {
          permissions: {
            admin: {
              insert: {
                filter: [true],
              },
            },
            user: {
              insert: {
                filter: [['authorId', '=', '$role.userId']],
              },
            },
          },
          schema: {
            type: 'record',
            properties: {
              id: {
                type: 'string',
                options: {
                  default: {
                    args: null,
                    func: 'uuid',
                  },
                  nullable: false,
                },
              },
              boolean: {
                type: 'boolean',
                options: {},
              },
              number: {
                type: 'number',
                options: {},
              },
              string: {
                type: 'string',
                options: {},
              },
              stringDefault: {
                type: 'string',
                options: {
                  default: 'default string',
                },
              },
              stringEnum: {
                type: 'string',
                options: {
                  enum: ['1', '2'],
                },
              },
              date: {
                options: {},
                type: 'date',
              },
              setString: {
                type: 'set',
                items: {
                  type: 'string',
                  options: {},
                },
                options: {},
              },
              setNumber: {
                type: 'set',
                items: {
                  type: 'number',
                  options: {},
                },
                options: {},
              },
              setBoolean: {
                type: 'set',
                items: {
                  type: 'boolean',
                  options: {},
                },
                options: {},
              },
              setDate: {
                type: 'set',
                items: {
                  type: 'date',
                  options: {},
                },
                options: {},
              },
              setStringEnum: {
                type: 'set',
                items: {
                  type: 'string',
                  options: {
                    enum: ['a', 'b'],
                  },
                },
                options: {},
              },
              relation: {
                type: 'query',
                query: {
                  collectionName: 'linkedCollection',
                  where: [['id', '=', '$root_node_id']],
                },
                cardinality: 'one',
                options: {},
              },
            },
            additionalProperties: false,
            $schema: 'http://json-schema.org/draft-07/schema#',
            optional: ['id', 'stringDefault'],
          },
        },
      },
      version: 0,
    });
  });
});

// ========================================================================

import { TriplitClient } from '../../../../../client/src/client/triplit-client';
import { JSONToSchema } from '../../../../src/schema/schema';
import { SuperSchema } from '../../../../src/schema/super-schema/SuperSchema';
import { Schema as S } from '../../../../src/schema/builder';

describe('ids requirements', () => {
  test('all top level schemas must have an id field', () => {
    expect(() => {
      processSuperSchema(superSchemaFlatZodValid_noId, zodAdapter);
    }).toThrowError(
      "Triplit requires an id for each top-level schema - please add an 'id' field of type 'nanoid' or uuidV4"
      // `Triplit requires an id for each schema - please add an 'id' field of type string to your schemas. \n Example: \n- id: z.string().uuid()  \nor \n- id:z.string().nonoid()`
    );
  });

  test('top level ids must be of predefined enum', () => {
    const schema: SuperSchema = {
      version: 0.1,

      collections: {
        exampleCollection: { schema: { id: 'not_nanoid' } },
      },
    };

    expect(() => {
      processSuperSchema(schema, zodAdapter);
    }).toThrowError('Top-level id fields can only be set to nanoid');
  });

  test('id: "nanoid" converts to correct Triplit and Validation schema value', () => {
    const idTestSchema: SuperSchema = {
      collections: {
        exampleCollection: {
          schema: {
            // validation lib types
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
        },
      },
    };

    const res = processSuperSchema(idTestSchema, zodAdapter);

    expect(() => {
      processSuperSchema(idTestSchema, zodAdapter);
    }).not.toThrowError();

    expect(res.validationSchema.exampleCollection.shape.id).toBeDefined();
  });

  // test('root level id have to be of type string', () => {
  //   expect(() => {
  //     processSuperSchema(superSchemaFlatZodValid_wrongId, zodAdapter);
  //   }).toThrowError('ids must be of type string');
  // });

  // test('root level id must not be nullable', () => {
  //   expect(() => {
  //     processSuperSchema(superSchemaFlatZodValid_wrongId, zodAdapter);
  //   }).toThrowError('ids must be set as not nullable');
  // });

  // test('root level id must have a default function', () => {
  //   expect(() => {
  //     processSuperSchema(superSchemaFlatZodValid_wrongId, zodAdapter);
  //   }).toThrowError(
  //     'ids must have a function as default, e.g.: nanoid, uuidv4 or z.string().uuid().default( () => uuidv4() )'
  //   );
  // });
});

describe('Integration tests', () => {
  describe('flat structures', () => {
    test('generated Triplit Schema accepted by Triplit Client', () => {
      const idTestSchema: SuperSchema = {
        collections: {
          exampleCollection: {
            schema: {
              // validation lib types
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
          },
        },
      };

      // const output = processSuperSchema(idTestSchema, zodAdapter);
      const output = processSuperSchema(superSchemaFlatZodValid, zodAdapter);

      const triplitSchemaJSONGenerated = output.triplitJsonSchema;

      const triplitSchemaJsObject = JSONToSchema(triplitSchemaJSONGenerated);

      expect(() => {
        const client = new TriplitClient({
          schema: triplitSchemaJsObject?.collections,
        });
        // debugger;
      }).not.toThrow();
    });

    test('generated Zod Schema accepted/parse-able by Zod', () => {
      const output = processSuperSchema(superSchemaFlatZodValid, zodAdapter);

      const zodSchema: Record<string, ZodAny> = output.validationSchema;
      const validationResult = zodSchema.exampleCollection.safeParse({
        id: 'lfNZluvAxMkf7Q8C5H-QS',
        boolean: true,
        number: 42,
        string: 'Alhoa',
        stringDefault: undefined,
        stringEnum: '2',
        date: new Date(),

        setString: new Set(['1', '2']),
        setNumber: new Set([1, 2]),
        setBoolean: new Set([true, false]),
        setDate: new Set([new Date(), new Date()]),
        setStringEnum: new Set(['a', 'b']),
      });
      expect(validationResult.success).toBe(true);
    });
  });

  describe('complex n>1 level structures', () => {
    test('generated Triplit Schema accepted by Triplit Client', () => {
      // debugger;
      const output = processSuperSchema(superSchemaComplexZodValid, zodAdapter);

      const triplitSchemaJSONGenerated = output.triplitJsonSchema;

      const triplitSchemaJsObject = JSONToSchema(triplitSchemaJSONGenerated);

      expect(() => {
        const client = new TriplitClient({
          schema: triplitSchemaJsObject?.collections,
        });
        // debugger;
      }).not.toThrow();

      // TODO: run query and check result
    });

    test('generated Zod Schema accepted/parse-able by Zod', () => {
      const output = processSuperSchema(superSchemaComplexZodValid, zodAdapter);

      const zodSchema: Record<string, ZodAny> = output.validationSchema;

      const exampleDataFlat = {
        id: 'lfNZluvAxMkf7Q8C5H-QS',
        boolean: true,
        number: 42,
        string: 'Alhoa',
        stringDefault: undefined,
        stringEnum: '2',
        date: new Date(),

        setString: new Set(['1', '2']),
        setNumber: new Set([1, 2]),
        setBoolean: new Set([true, false]),
        setDate: new Set([new Date(), new Date()]),
        setStringEnum: new Set(['a', 'b']),
      };

      const exampleDataComplex = {
        ...exampleDataFlat,
        level_2: {
          ...exampleDataFlat,
          level_3: { ...exampleDataFlat },
        },
      };

      const validationResult =
        zodSchema.exampleCollection.safeParse(exampleDataComplex);

      expect(validationResult.success).toBe(true);

      // TODO: compare parsed result, default fill in?
    });

    test('error out if unknown properties found', () => {
      expect(function () {
        const output = processSuperSchema(
          superSchemaComplexZodValidWithUnknowns,
          zodAdapter
        );
      }).toThrowError();
    });
  });
});
