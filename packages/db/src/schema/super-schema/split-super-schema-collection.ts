import { ValidationLibAdapter } from './adapters/ValidationLibAdapter';

function isTriplitRelationField(value: any) {
  // FIXME:
  // 1. make this a general is TriplitField function
  // 2. change relations to databaseSpecificTypes
  // 3. process-super-schema > checkIdField adjust to handleIdField
  //    - insert triplit String Field of 'nanoid' or 'uuid'
  //    - add validation rules:

  // NO OOO Wring , i can't do this like this, because id needs to be also
  // augmented with validations
  // so 'nanoid' -> S.String() has to be done
  // in the generateTriplitSchema
  // and in generateValidationSceham

  //  but where do id = 'nanoid' goes? Into unknowns ?
  //    do I need to add a new ids prop?
  // pro: most obvious
  // more code
  // use unknowns
  // not really unknown
  // might error out before handling it
  // new idsField it is

  //  NEW
  // 1. generateTriplitSchema
  console.log('value', value);
  return value?.validateTripleValue != null && value?.query != null;
}

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
  const relations: Record<string, any> = {};
  const unknowns: Record<string, any> = {};
  const permissions: Record<string, any> = superSchema?.permissions ?? {};
  // const roles: Record<string, any> = superSchema?.roles ?? {};

  const schema = superSchema.schema ?? superSchema;

  for (const key in schema) {
    const value = schema[key];

    if (isTriplitRelationField(value)) {
      const triplitRelationDataJson = getTriplitRelationData(value);
      relations[key] = triplitRelationDataJson;
      // Early return to avoid unnecessary checks
      continue;
    }

    const isValidationLibType = validationAdapter.isOwnType(value);
    if (isValidationLibType) {
      // is validation lib type
      validations[key] = value;
      continue;
    }

    const isContainer = isPojoWithoutMethods(value);
    if (isContainer) {
      // recursively unpack
      const { relationObj, unknownsObj, validationObj } =
        splitSuperSchemaCollection(value, validationAdapter);
      // FIXME:
      // other level_2 etc properties are not passed to validionation

      // validations[key] = validationObj;
      if (Object.keys(validationObj)?.length > 0)
        validations[key] = validationObj;
      if (Object.keys(relationObj)?.length > 0) relations[key] = relationObj;
      if (Object.keys(unknownsObj)?.length > 0) unknowns[key] = unknownsObj;

      continue;
      // addIfNotEmpty(validationObj, validations, key);
      // addIfNotEmpty(relationObj, relations, key);
      // addIfNotEmpty(unknownsObj, unknowns, key);
    }

    // Fallback to catch unknowns
    unknowns[key] = value;
  }

  return {
    validationObj: wrapLevelIfNotEmpty(
      validations,
      validationAdapter.wrapInContainer
    ),
    relationObj: relations,
    unknownsObj: unknowns,
    permissionsObj: permissions,
    // roles,
  };
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
