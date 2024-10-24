import { ValidationLibAdapter } from './adapters/ValidationLibAdapter';
import { splitSuperSchemaCollection } from './split-super-schema-collection';
import { triplitJsonFromJsonSchemaSingleCollection } from '../import/json-schema/triplit-json-from-json-schema';
import { SuperSchema, SuperSchemaCollection } from './SuperSchema';
import { ZodObject, ZodType } from 'zod';
import { JSONSchemaType } from 'ajv';
import { SchemaDefinition } from '../../data-types/serialization';
import { Models, Roles } from '../types';

import { deepmerge } from 'deepmerge-ts';

type CollectionData = {
  validations: Record<string, ZodType>;
  relations: Record<string, any>;
  permissions: Record<string, any>;
};

type SuperSchemaResult = {
  triplitSchema: SchemaDefinition;
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
  const allTriplitJsonSchemas: Record<string, any> = {};

  for (const [collectionKey, collectionData] of Object.entries(collections)) {
    // id field handling
    checkIdField(collectionData, validationAdapter);
    // console.log('collection schema id', collectionData.schema?.id);
    const { validations, relations, permissions } = unpackSuperSchemaCollection(
      collectionData,
      validationAdapter
    );

    allValidationSchemas[collectionKey] = validations;

    allTriplitJsonSchemas[collectionKey] = generateTriplitCollection(
      validations,
      relations,
      permissions,
      validationAdapter
    );
  }

  const validationSchema = allValidationSchemas;
  const triplitSchema = generateTriplitSchema(allTriplitJsonSchemas);

  return {
    triplitSchema,
    validationSchema,
    roles,
  };
}

function unpackSuperSchemaCollection(
  superSchemaCollection: SuperSchemaCollection,
  validationAdapter: ValidationLibAdapter
): CollectionData {
  const { validationObj, relationObj, permissionsObj, unknownsObj } =
    splitSuperSchemaCollection(superSchemaCollection, validationAdapter);

  if (Object.keys(unknownsObj).length > 0) {
    throw new Error(
      `
      --------------------------
      Unsupported Type Error
      --------------------------
      Some of the schema's value you defined do not have matches with your validation library adapter or the database schema. Either correct or delete these fields.

      Unknown properties found:

      ${JSON.stringify(unknownsObj)}`
    );
  }

  return {
    validations: validationObj,
    relations: relationObj,
    permissions: permissionsObj,
  };
}

function checkIdField(
  collection: SuperSchemaCollection,
  validationLibAdapter: ValidationLibAdapter
) {
  const collectionSchema = collection.schema;
  if ('id' in collectionSchema === false) {
    throw new Error(
      "Triplit requires an id for each top-level schema - please add an 'id' field of type 'nanoid' or uuidV4"
      // "Triplit requires an id for each schema - please add an 'id' field of type string to your schemas. \n Example: \n- id: z.string().uuid()  \nor \n- id:z.string().nonoid()"
    );
  }

  // FIXME: add these tests
  // const idValue = String(collectionSchema?.id);
  // const acceptedIdValues = new Set(['nanoid', 'uuid']);

  // if (acceptedIdValues.has(idValue) === false) {
  //   throw new Error(`id must be either 'nanoid' or 'uuidV4'`);
  // }

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

function generateTriplitCollection(
  validationObj: Record<string, any>,
  relationObj: Record<string, any>,
  permissionsObj: Record<string, any>,
  validationAdapter: ValidationLibAdapter
) {
  const jsonSchemaFromValidationObject =
    validationAdapter.jsonSchemaFrom(validationObj);

  // Add relations to the schema
  // FIXME: bug is here, with relations obj overwriting level_2 etc other props
  // for (const [key, relationItem] of Object.entries(relationObj)) {
  //   if (!jsonSchemaFromValidationObject.properties) {
  //     jsonSchemaFromValidationObject.properties = {};
  //   }
  //   jsonSchemaFromValidationObject.properties[key] = relationItem;

  //   if (!jsonSchemaFromValidationObject.required) {
  //     jsonSchemaFromValidationObject.required = [];
  //   }
  //   jsonSchemaFromValidationObject.required.push(key);
  // }

  // align relationObj shape to the jsonSchemaFromValidationObject shape
  // so it be properly merged

  // wrap each sublevel into a "properties" field
  const relationObjJsonSchemaShape = wrapInProperties(relationObj);
  // dowes not work for flat strutures
  const jsonSchemaMerged = deepmerge(
    jsonSchemaFromValidationObject,
    relationObjJsonSchemaShape
  );

  // Generate Triplit schema
  const singleCollectionTriplitJson = triplitJsonFromJsonSchemaSingleCollection(
    {
      jsonSchema: jsonSchemaMerged,
      permissions: permissionsObj,
      checkInputJsonSchema: false,
    }
  );

  return singleCollectionTriplitJson;

  // Generate Triplit schema
  // const fullTriplitJsonSchema = triplitJsonFromJsonSchema(
  //   jsonSchemaFromValidationObject,
  //   true,
  //   false,
  //   permissionsObj
  // );
}

// function generateValidationSchema(allValidationSchemas: Record<string, any>) {
//   // return JS object with all Zod.objects
//   // can be accessed/used via jsObj.zodObject
//   return allValidationSchemas;

//   // prev export to string version
//   // return Object.entries(allValidationSchemas)
//   //   .map(
//   //     ([key, schema]) =>
//   //       `export const ${key} = ${JSON.stringify(schema, null, 2)};\n`
//   //   )
//   //   .join('\n');
// }

function generateTriplitSchema(allTriplitJsonSchemas: Record<string, any>) {
  return {
    version: 0,
    collections: allTriplitJsonSchemas,
  };
}

type QueryType = {
  type: 'query';
  query: {
    collectionName: string;
    where: any[];
  };
  cardinality: string;
};

type ObjectWithProperties = {
  properties: Record<string, any>;
  required: string[];
};

function wrapInProperties(obj: Record<string, any>): ObjectWithProperties {
  const result: ObjectWithProperties = { properties: {}, required: [] };

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      if (value.type === 'query') {
        result.properties[key] = value as QueryType;
        result.required.push(key);
      } else {
        const wrappedValue = wrapInProperties(value);
        result.properties[key] = wrappedValue;
        if (wrappedValue.required.length > 0) {
          result.required.push(key);
        }
      }
    } else {
      result.properties[key] = value;
    }
  }

  return result;
}

// function generateValidationSchemaWithCorrections(
//   //
//   validationSchemaObj: Record<string, any>,
//   validationLibSchema: ValidationLibAdapter
// ) {
//   const validationLibCorrections = validationLibSchema?.corrections ?? [];

//   // validationLibCorrections.push({
//   //   purpose: 'transform POJO to correct lib wrapping objs',
//   //   validationSchema(obj) {
//   //     if (isPojoWithoutMethods(obj)) validationLibSchema.wrapInContainer(obj);
//   //   },
//   //   jsonSchema(obj) {},
//   // });

//   // for (const validationSchemaItem of Object.entries(validationSchemaObj)) {
//   //   // - apply validationLib schema type transformations
//   //   correctValidationTypes(validationSchemaItem, validationLibCorrections);
//   // }

//   // maybe not here, but in the split schema already ?
//   // or if iterating over all, we can do this already here
//   const validationSchema = validationLibSchema.wrapInContainer({
//     ...validationSchemaObj,
//   });
// }

// function correctValidationTypes(
//   validationSchemaItem: Record<string, any>,
//   validationLibCorrections: ValidationCorrection[]
// ) {
//   for (const validationCorrectionItem of validationLibCorrections) {
//     transformObjectDeeply(
//       validationSchemaItem,
//       validationCorrectionItem.validationSchema
//     );
//   }
// }

// type TriplitPrimitives = 'Id' | 'String' | 'Number' | 'Boolean' | 'Date';
