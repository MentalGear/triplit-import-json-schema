import { ValidationLibAdapter } from './adapters/ValidationLibAdapter.js';
import { splitSuperSchemaCollection } from './split-super-schema-collection.js';
import { SuperSchema, SuperSchemaCollection } from './SuperSchema.js';
import { ZodObject, ZodType } from 'zod';
import { JSONSchemaType } from 'ajv';
import { SchemaDefinition } from '../types/serialization.js';
import { Models, Roles, StoreSchema } from '../types/index.js';

import {
  generateTriplitJsonCollection,
  generateTriplitJson,
} from './generate-triplit-format.js';
import { JSONToSchema } from '../schema.js';

type CollectionData = {
  validations: Record<string, ZodType>;
  relations: Record<string, any>;
  ids: Record<string, any>;
  permissions: Record<string, any>;
};

type SuperSchemaResult = {
  triplitSchema: StoreSchema<Models>;
  jsonTriplitSchema: SchemaDefinition;
  validationSchema: any; // TODO: try to infer types from current ValidationAdapter
  roles: Roles;
};

export function processSuperSchema(
  superSchema: SuperSchema,
  validationAdapter: ValidationLibAdapter
): SuperSchemaResult {
  const roles = superSchema?.roles ?? {};
  const collections = superSchema.collections;

  const allValidationSchemas: Record<string, any> = {};
  const allJsonTriplitSchemas: Record<string, any> = {};

  for (const [collectionKey, collectionData] of Object.entries(collections)) {
    // id field handling
    checkTopLevelIdField(collectionData);
    // console.log('collection schema id', collectionData.schema?.id);
    const { validations, relations, ids, permissions } =
      unpackSuperSchemaCollection(collectionData, validationAdapter);

    // VALIDATION
    // no generation needed since original items
    allValidationSchemas[collectionKey] = validations;

    // TRIPLIT
    allJsonTriplitSchemas[collectionKey] = generateTriplitJsonCollection(
      validations,
      relations,
      permissions,
      ids,
      validationAdapter
    );
  }

  const validationSchema = allValidationSchemas;
  const jsonTriplitSchema = generateTriplitJson(allJsonTriplitSchemas);
  const triplitSchema = JSONToSchema(jsonTriplitSchema);
  if (!triplitSchema)
    throw new Error(
      'triplitSchema couldnt be generated from jsonTriplitSchema'
    );

  return {
    triplitSchema,
    validationSchema,
    roles,
    jsonTriplitSchema,
  };
}

function unpackSuperSchemaCollection(
  superSchemaCollection: SuperSchemaCollection,
  validationAdapter: ValidationLibAdapter
): CollectionData {
  const { validationObj, relationObj, permissionsObj, unknownsObj, idsObj } =
    splitSuperSchemaCollection(superSchemaCollection, validationAdapter);

  if (Object.keys(unknownsObj).length > 0) {
    throw new Error(`
      ${errorMsg}
      ${JSON.stringify(unknownsObj)}`);
  }

  return {
    validations: validationObj,
    relations: relationObj,
    ids: idsObj,
    permissions: permissionsObj,
  };
}

export const acceptedCustomIdValues = ['nanoid'];

function checkTopLevelIdField(collection: SuperSchemaCollection) {
  // Note
  // Triplit requires only an id field at the collection schema top level
  // so we only check the top level, not sub levels

  const collectionSchema = collection.schema;

  if ('id' in collectionSchema === false) {
    throw new Error(
      "Triplit requires an id for each top-level schema - please add an 'id' field of type 'nanoid' or uuidV4"
      // "Triplit requires an id for each schema - please add an 'id' field of type string to your schemas. \n Example: \n- id: z.string().uuid()  \nor \n- id:z.string().nonoid()"
    );
  }

  const idValue = collectionSchema?.id ?? '';
  if (acceptedCustomIdValues.includes(idValue) === false) {
    throw new Error(
      `Top-level id fields can only be set to ${acceptedCustomIdValues.join(
        ', '
      )} `
    );
  }

  // ========================================================================
  // OLD UNUSED
  // if (validationLibAdapter.isStringType(collectionSchema.id) === false) {
  //   throw new Error('ids must be of type string');
  // }

  // if (validationLibAdapter.isNullable(collectionSchema.id)) {
  //   throw new Error('ids must be set as not nullable');
  // }

  // if (validationLibAdapter.hasDefaultValue(collectionSchema.id)) {
  //   throw new Error(
  //     'ids must have a default function to generate a default id, e.g. uuid, nanoid, ... MUST be universally unique.'
  //   );
  // }

  // if (validationLibAdapter.isDefaultRandom(collectionSchema.id) === false) {
  //   throw new Error(
  //     'ids must use a random function to generate universally unique ids (uuid). You can also set id:"nanoid" or id:"uuid" directly'
  //   );
  // }
}

const errorMsg = `
      --------------------------
      Unsupported Type Error
      --------------------------
      Some of the schema's value you defined do not have matches with your validation library adapter or the database schema. Either correct or delete these fields.

      Unknown properties found:`;
