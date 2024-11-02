import { deepmerge } from 'deepmerge-ts';
import { triplitJsonFromJsonSchemaSingleCollection } from '../import/json-schema/triplit-json-from-json-schema.js';
import { ValidationLibAdapter } from './adapters/ValidationLibAdapter.js';
import { transformObjectDeeply } from '../export/json-schema/transform-object-deeply.js';

import type { JSONSchema7 } from 'json-schema';
import { CONTAINER_SYMBOL } from './split-super-schema-collection.js';
import { Schema as S } from '../builder.js';

export function generateTriplitJsonCollection(
  validationObj: Record<string, any>,
  relationObj: Record<string, any>,
  permissionsObj: Record<string, any>,
  idObj: Record<string, any>,
  validationAdapter: ValidationLibAdapter
) {
  // ========================================================================
  // combine back into one
  let jsonSchema = validationAdapter.jsonSchemaFrom(validationObj);
  jsonSchema = mergeRelations(relationObj, jsonSchema);

  let triplitJsonOfCollection = triplitJsonFromJsonSchemaSingleCollection({
    jsonSchema: jsonSchema,
    permissions: permissionsObj,
    checkInputJsonSchema: false,
  });

  // overwrites ids if they have been definied as special ids
  triplitJsonOfCollection = mergeIds(idObj, triplitJsonOfCollection);

  return triplitJsonOfCollection;
}

// ========================================================================

function mergeRelations(
  relationObj: Record<string, any>,
  jsonSchema: JSONSchema7
) {
  // to properly merge objects with deepmerge, their hiearchy must be the same
  // align relationObj shape to jsonSchemaFromValidationObject shape
  //as JSON schema format uses "properties" container
  const relationObjJsonSchemaShape = wrapContainersInProperties(relationObj);

  const jsonSchemaMerged = deepmerge(jsonSchema, relationObjJsonSchemaShape);

  return jsonSchemaMerged;
}

function mergeIds(idObj: Record<string, any>, triplitJsonFormat: any) {
  // transform ids with special values to correct Triplit String objects
  const idsAsTriplitJsonObjs = getIdsInTriplitFormat(idObj);

  const idObjJsonSchemaShape = wrapContainersInProperties(idsAsTriplitJsonObjs);

  const triplitJsonFormatNew = structuredClone(triplitJsonFormat);

  triplitJsonFormatNew.schema.properties = deepmerge(
    triplitJsonFormat.schema.properties,
    idObjJsonSchemaShape.properties
  );

  return triplitJsonFormatNew;
}

function getIdsInTriplitFormat(idObj: Record<string, any>) {
  const idsAsTriplitJsonObjs: Record<string, any> = structuredClone(idObj);
  transformObjectDeeply(
    idsAsTriplitJsonObjs,
    function (obj, overlyingObj, currentObjKey) {
      if (obj?.id === 'nanoid') {
        // obj.id = S.String({
        //   nullable: false,
        //   default: S.Default.uuid(),
        // });
        obj.id = {
          type: 'string',
          options: {
            default: {
              // TODO: once triplit supports custom default functions, fill in
              // until then, it is considered that uuid which is actually nanoid is used.
              func: 'uuid',
              args: null,
            },
            nullable: false,
          },
        };
        if (typeof obj.id !== 'object')
          throw new Error('needs to be an object');

        // mark the item as a container for later re=combining again
        obj.id[CONTAINER_SYMBOL] = true;
      }
    }
  );

  return idsAsTriplitJsonObjs;
}

// ========================================================================

export function generateTriplitJson(
  allJsonTriplitSchemas: Record<string, any>
) {
  return {
    version: 0,
    collections: allJsonTriplitSchemas,
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

function wrapContainersInProperties(
  obj: Record<string, any>
): ObjectWithProperties {
  const result: ObjectWithProperties = { properties: {}, required: [] };

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      // if (value.type === 'query') {
      // if (actualItemsHaveSubKey in value) {
      if (CONTAINER_SYMBOL in value) {
        result.properties[key] = value as QueryType;
        result.required.push(key);
        // delete the container symbol again after usage
        delete value[CONTAINER_SYMBOL];
      } else {
        const wrappedValue = wrapContainersInProperties(value);
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
