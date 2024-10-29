import { describe, expect, test } from 'vitest';

import { splitSuperSchemaCollection } from '../../../../src/schema/super-schema/split-super-schema-collection';

import { zodAdapter } from '../../../../src/schema/super-schema/adapters/zod';
import { expectedJsonOutputComplex } from './expected-json-output-complex';
import { expectedJsonOutput } from './expected-json-output';
import {
  schemaComplexZodValid,
  schemaComplexZodWithUnknowns,
  schemaFlatZod,
  schemaFlatZodValid,
} from '../example-data/collection/zod-example-super-schema-collection';
import { ZodObject } from 'zod';
import { transformObjectDeeply } from '../../../../src/schema/export/json-schema/transform-object-deeply';
import { JSONSchema7 } from 'json-schema';

// ========================================================================
// Tests
// ========================================================================

describe('Flat Structure', () => {
  test('extract all validation items', () => {
    const output = splitSuperSchemaCollection(schemaFlatZod, zodAdapter);

    const expectedKeys = [
      'id',
      'boolean',
      'number',
      'string',
      'stringDefault',
      'stringEnum',
      'date',
      'setString',
      'setNumber',
      'setBoolean',
      'setDate',
      'setStringEnum',
    ];

    const validationObj = output.validationObj.shape;

    expect(Object.keys(validationObj)).toHaveLength(expectedKeys.length);
    expect(Object.keys(validationObj).sort()).toEqual(expectedKeys.sort());
  });

  test('extract all permission items', () => {
    const output = splitSuperSchemaCollection(schemaFlatZod, zodAdapter);

    const expectedKeys = ['admin', 'user'];

    const permissionsObj = output.permissionsObj;

    expect(Object.keys(permissionsObj)).toHaveLength(expectedKeys.length);
    expect(Object.keys(permissionsObj).sort()).toEqual(expectedKeys.sort());
  });

  test('extract all relation items', () => {
    const output = splitSuperSchemaCollection(schemaFlatZod, zodAdapter);

    const expectedKeys = ['relation'];

    const relationObj = output.relationObj;

    expect(Object.keys(relationObj)).toHaveLength(expectedKeys.length);
    expect(Object.keys(relationObj).sort()).toEqual(expectedKeys.sort());
  });

  test('extract all special id items', () => {
    // e.g. id = "nanoid"
    const output = splitSuperSchemaCollection(schemaFlatZodValid, zodAdapter);

    const expectedKeys = ['id'];

    const idsObj = output.idsObj;

    expect(Object.keys(idsObj)).toHaveLength(expectedKeys.length);
    expect(Object.keys(idsObj).sort()).toEqual(expectedKeys.sort());
  });

  test('extract all unknown items', () => {
    const output = splitSuperSchemaCollection(schemaFlatZod, zodAdapter);

    const expectedKeys = ['relationFake', 'somethingUnknown'];

    const unknownFields = output.unknownsObj;

    expect(Object.keys(unknownFields)).toHaveLength(expectedKeys.length);
    expect(Object.keys(unknownFields).sort()).toEqual(expectedKeys.sort());
  });

  test('has no roles defined in collection', () => {
    const output = splitSuperSchemaCollection(schemaFlatZodValid, zodAdapter);

    expect(output).not.toHaveProperty('roles');
  });

  test('throw if no validationAdapter provided', () => {
    // @ts-ignore
    expect(() => splitSuperSchemaCollection(schemaFlatZod)).toThrowError();
  });
});

describe('Complex Structures', () => {
  test('Schema with n>1 levels', () => {
    const output = splitSuperSchemaCollection(
      schemaComplexZodValid,
      zodAdapter
    );

    const validationObj = output.validationObj;

    const jsonSchema = zodAdapter.jsonSchemaFrom(validationObj);

    const jsonSchemaWithoutIdDefaults = removeIdDefault(jsonSchema);

    expect(jsonSchemaWithoutIdDefaults).toEqual(expectedJsonOutputComplex);
  });

  test('unknown items have same nested structure as original item', () => {
    const output = splitSuperSchemaCollection(
      schemaComplexZodWithUnknowns,
      zodAdapter
    );

    const expectedKeys = ['relationFake', 'somethingUnknown'];

    const unknownFields = output.unknownsObj;

    expect(unknownFields).toHaveProperty('level_2');
    expect(unknownFields.level_2).toHaveProperty('relationFake');
    expect(unknownFields.level_2).toHaveProperty('level_3');

    expect(Object.keys(unknownFields.level_2.level_3).sort()).toEqual(
      expectedKeys.sort()
    );
  });
});

describe('JSON conversion', () => {
  test('ZOD to JSON Schema', () => {
    const output = splitSuperSchemaCollection(schemaFlatZod, zodAdapter);

    const validationObj = output.validationObj;

    const jsonSchema = zodAdapter.jsonSchemaFrom(validationObj);

    const jsonSchemaWithoutIdDefaults = removeIdDefault(jsonSchema);

    expect(jsonSchemaWithoutIdDefaults).toEqual(expectedJsonOutput);
  });

  // test.todo('Valibot to JSON Schema', () => {
  //   const output = splitSuperSchema(schemaFlatValibot, valibotAdapter);

  //   const validationObj = output.validationObj;

  //   const jsonSchema = valibotAdapter.toJsonSchema(validationObj);
  //   // debugger;
  //   expect(jsonSchema).toEqual(expectedJsonOutput);
  // });
});

describe('Validation Lib Output', () => {
  test('works on jsonSchema from Zod', () => {
    const output = splitSuperSchemaCollection(schemaFlatZodValid, zodAdapter);
    const exampleInputKeys = Object.keys(schemaFlatZodValid.schema).sort();
    const keysExpected = exampleInputKeys.filter((item) => item !== 'relation');

    const shape = output.validationObj.shape;
    const shapeKeys = Object.keys(shape).sort();

    expect(shapeKeys).toHaveLength(keysExpected.length);
    expect(shapeKeys).toEqual(keysExpected);
  });

  test('validation lib obj is wrapped in validation lib container (ZodObject)', () => {
    const output = splitSuperSchemaCollection(schemaFlatZodValid, zodAdapter);

    expect(output.validationObj).toBeInstanceOf(ZodObject);
  });
});

function removeIdDefault(jsonSchema: JSONSchema7) {
  // in the actual implenetation jsonSchema id defaults are not relevant
  // since mergeIds func overwrites ids fields
  return transformObjectDeeply(
    structuredClone(jsonSchema),
    function (obj, overlyingObj, currentObjKey) {
      if (currentObjKey === 'id') delete obj.default;
    }
  );
}
