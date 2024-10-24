import { JSONSchema7 } from 'json-schema';
import { invertTransformations } from './invert-transform-functions.js';
import { SchemaDefinition } from 'packages/db/src/data-types/serialization.js';
import { JSONToSchema } from '../../schema.js';

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({
  // options
  strict: 'log',
});

addFormats(ajv);

export function triplitJsonFromJsonSchema(
  jsonSchema: JSONSchema7,
  defaultFillIn = true
): SchemaDefinition | undefined {
  // work on copy to keep original immutable
  const jsonSchemaCopy = structuredClone(jsonSchema);

  const schemaEvaluation = ajv.compile(jsonSchemaCopy);

  if (schemaEvaluation.errors != null)
    throw new Error('Input is not a valid JSON schema');

  const collections: Record<string, any> = {};

  for (const [collectionName, collectionSchema] of Object.entries(
    jsonSchemaCopy.properties || {}
  )) {
    const transformedData = invertTransformations(
      collectionSchema as JSONSchema7,
      defaultFillIn
    );

    collections[collectionName] = {
      //
      schema: transformedData,
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
    version: 0,
  };

  validateTriplitSchema(triplitJsonSchema);

  return triplitJsonSchema;
}

function validateTriplitSchema(triplitJsonSchema: {
  collections: Record<string, any>;
  version: number;
}) {
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