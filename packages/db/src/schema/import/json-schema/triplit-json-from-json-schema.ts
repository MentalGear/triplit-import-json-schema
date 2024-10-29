import { JSONSchema7 } from 'json-schema';
import { invertTransformations } from './invert-transform-functions.js';
import { CollectionDefinition, SchemaDefinition } from '@triplit/db';

import { JSONToSchema } from '../../schema.js';

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
import { RolePermissions } from '../../types/models.js';

const ajv = new Ajv({
  // options
  strict: 'log',
});
addFormats(ajv);

/**
 * Generates Triplit JSON from JSON Schema
 * @param jsonSchema
 * @param useJsonSchemaDefault whether the jsonSchema's default value should be used to fill in default - jsonSchema's default is per spec only meant to be used for examples in doc generation, but might be used otherwise depending on generator
 * @param checkInputJsonSchema set to false if you need to convert json data that might not be fully/strictly JSON schema compliant
 * @param permissions?
 * @param version?
 **/
export function triplitJsonFromJsonSchema(
  jsonSchema: JSONSchema7,
  useJsonSchemaDefault = true,
  checkInputJsonSchema = true,
  permissions: {} | undefined = undefined,
  version = 0
): SchemaDefinition | undefined {
  // work on copy to keep original immutable
  const jsonSchemaCopy = structuredClone(jsonSchema);

  // TODO:
  // should deref all?
  //   - only local?
  //   - file? requires node-fs module
  //   - web? requires fetch module, or native node fetch, but exposes to WebAssembly.
  //   - CURRENT Approach: leave it to the dev to input json that is de-refed

  if (checkInputJsonSchema) {
    const schemaEvaluation = ajv.compile(jsonSchemaCopy);

    if (schemaEvaluation.errors != null)
      throw new Error('Input is not of valid JsonSchema format');
  }

  const collections: Record<string, CollectionDefinition> = {};

  for (const [collectionName, collectionSchema] of Object.entries(
    jsonSchemaCopy.properties || {}
  )) {
    const transformedData = invertTransformations(
      collectionSchema as JSONSchema7,
      useJsonSchemaDefault
    );

    collections[collectionName] = {
      schema: transformedData,
      permissions: permissions ? permissions : undefined,
      // ...(permissions ?? (false && { permissions })),
    };
  }

  // check if omittedConstraints, if so add a console.warn
  // console.warn('omittedConstraints:');
  // console.warn(
  //   `Constraints/Validation rules that are not natively supported on Triplit's db schema have been omited.
  //   As long as you use the jsonSchema to enforce the schema in your application code, this should not be an issue.
  //   You can check the omitted constraints in the 'omittedConstraints' return field.`
  // );

  const triplitJsonSchema = {
    collections,
    version,
    // roles
  };

  validateTriplitSchema(triplitJsonSchema);

  return triplitJsonSchema;
}

export function triplitJsonFromJsonSchemaSingleCollection(
  data: {
    jsonSchema: JSONSchema7;
    permissions?: RolePermissions<any, any>;
    useJsonSchemaDefault?: boolean;
    checkInputJsonSchema?: boolean;
  } = {
    jsonSchema: {},
    permissions: {},
    useJsonSchemaDefault: true,
    checkInputJsonSchema: true,
  }
): CollectionDefinition | undefined {
  // work on copy to keep original immutable
  const {
    jsonSchema,
    permissions,
    useJsonSchemaDefault,
    checkInputJsonSchema,
  } = data;

  const jsonSchemaCopy = structuredClone(jsonSchema);

  const singleSchema = {
    description: 'wrapping schema needed for triplitJsonFromJsonSchema',
    properties: {
      collectionSingle: {
        // permissions,
        ...jsonSchemaCopy,
      },
    },
    // $schema: 'http://json-schema.org/draft-07/schema#',
    // additionalProperties: false,
  };

  const triplitSchemaFromJson = triplitJsonFromJsonSchema(
    singleSchema,
    useJsonSchemaDefault,
    checkInputJsonSchema,
    permissions
  );

  return triplitSchemaFromJson?.collections?.collectionSingle;
}

function validateTriplitSchema(triplitJsonSchema: SchemaDefinition) {
  // as recommended by triplit team member
  // to validate, try converting into a triplit JS Object
  try {
    JSONToSchema(triplitJsonSchema);
  } catch (err) {
    const customError: Error & { details?: any } = new Error(
      'Triplit couldnt parse your transformed data. Catch this error and check the details object. Maybe there are objects that are empty or without type',
      { cause: err }
    );
    customError.details = { transformedData: triplitJsonSchema?.collections };
    throw customError;
  }
}
