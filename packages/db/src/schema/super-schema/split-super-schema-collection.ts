import { ValidationLibAdapter } from './adapters/ValidationLibAdapter.js';
import { getValidationOfSpecialId } from './generate-validation-id.js';
import { acceptedCustomIdValues } from './process-super-schema.js';

export const CONTAINER_SYMBOL = Symbol('container');

export function splitSuperSchemaCollection(
  superSchema: Record<string, any> = {},
  validationAdapter: ValidationLibAdapter
) {
  if (!validationAdapter || !validationAdapter.jsonSchemaFrom)
    throw new Error('Please provide a valid ValidationLibAdapter');

  // TODO: should infer types from adapter mapping
  type ValidationTypes = {
    [K in keyof typeof validationAdapter.typeMapping]: (typeof validationAdapter.typeMapping)[K];
  };
  const validations: Record<string, ValidationTypes[keyof ValidationTypes]> =
    {};
  // const validations: Record<string, typeof validationAdapter.typeMapping> = {};
  const ids: Record<string, any> = {};
  const relations: Record<string, any> = {};
  const unknowns: Record<string, any> = {};
  const permissions: Record<string, any> = superSchema?.permissions ?? {};

  const schema = superSchema.schema ?? superSchema;

  for (const key in schema) {
    const value = schema[key];

    const isIdWithSpecialValue =
      key === 'id' && acceptedCustomIdValues.includes(value);
    if (isIdWithSpecialValue) {
      // ========================================================================
      // if special id value, e.g. nanoid
      // ========================================================================

      // 1. add to ids for triplit schema building
      ids[key] = value;

      // 2. but also directly transform and add to validations
      // because later on, the validations are already bundled in their container
      // and it would take an extra method per validation lib to extend an validation object
      // instead of doing it right now
      validations[key] = getValidationOfSpecialId(value, validationAdapter);
      continue;
    }

    if (isTriplitRelationField(value)) {
      const triplitRelationDataJson = getTriplitRelationData(value);
      relations[key] = triplitRelationDataJson;
      relations[key][CONTAINER_SYMBOL] = true;
      continue;
    }

    const isValidationLibType = validationAdapter.isOwnType(value);
    if (isValidationLibType) {
      validations[key] = value;
      continue;
    }

    const isContainer = isPojoWithoutMethods(value);
    if (isContainer) {
      // recursively unpack
      const { relationObj, unknownsObj, validationObj, idsObj } =
        splitSuperSchemaCollection(value, validationAdapter);

      if (Object.keys(validationObj)?.length > 0)
        validations[key] = validationObj;
      if (Object.keys(relationObj)?.length > 0) relations[key] = relationObj;
      if (Object.keys(unknownsObj)?.length > 0) {
        unknowns[key] = unknownsObj;
      }
      if (Object.keys(idsObj)?.length > 0) ids[key] = idsObj;

      continue;
      // addIfNotEmpty(validationObj, validations, key);
    }

    // Fallback
    // catches unknown values
    unknowns[key] = value;
  }

  return {
    validationObj: wrapLevelIfNotEmpty(
      validations,
      validationAdapter.wrapInContainer
    ),
    idsObj: ids,
    relationObj: relations,
    unknownsObj: unknowns,
    permissionsObj: permissions,
    // roles,
  };
}

function isTriplitRelationField(value: any) {
  return value?.validateTripleValue != null && value?.query != null;
}

function wrapLevelIfNotEmpty(validationObj: any, wrapFunction: Function) {
  if (Object.keys(validationObj)?.length > 0) {
    return wrapFunction(validationObj);
  }
  return validationObj;
}

// function addIfNotEmpty(obj: any, containingObj: any, key: string) {
//   if (Object.keys(obj)?.length < 1) return;
//   containingObj[key] = obj;
// }

function getTriplitRelationData(item: Record<string, any>) {
  // since triplit schema objects dont return a constructor name, we need to check like this
  const isTriplitField = item?.validateTripleValue;
  if (!isTriplitField) return false;

  const isTriplitRelationField = item?.cardinality != null;
  if (!isTriplitRelationField) return false;

  return item?.toJSON();
}

function isPojoWithoutMethods(obj: any): boolean {
  // Check if obj is an object and not null
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // Check if obj's prototype is Object.prototype
  if (Object.getPrototypeOf(obj) !== Object.prototype) {
    return false;
  }

  // Check if obj has any methods (properties that are functions)
  for (let key in obj) {
    if (typeof obj[key] === 'function') {
      return false;
    }
  }

  return true;
}
